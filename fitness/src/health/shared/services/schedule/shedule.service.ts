import { Injectable } from '@angular/core';

import { Store } from 'store';

import { AngularFireDatabase, SnapshotAction } from '@angular/fire/database';

import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, switchMap } from 'rxjs/operators';

import { Meal } from '../meals/meals.service';
import { Workout } from '../workout/workout.service';
import { AuthService } from '../../../../auth/shared/services/auth/auth.service';


export interface ScheduleItem {
  meals: Meal[],
  workouts: Workout[],
  section: string,
  timestamp: number,
  $key?: string
}

export interface ScheduleList {
  morning?: ScheduleItem,
  lunch?: ScheduleItem,
  evening?: ScheduleItem,
  snacks?: ScheduleItem,
  [key: string]: any
}

@Injectable()
export class ScheduleService {

  private date$ = new BehaviorSubject(new Date());

  schedule$: Observable<ScheduleItem[]> = this.date$
  .pipe(
    tap((next: any) => this.store.set('date', next)),
    map((day: any) => {

        const startAt = (
          new Date(day.getFullYear(), day.getMonth(), day.getDate())
        ).getTime();

        const endAt = (
          new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
        ).getTime() -1;

        return { startAt, endAt };

    }),
    switchMap(({ startAt, endAt }: any) => this.getSchedule(startAt, endAt)),
    // map((data: any) => {
    //   console.log(data)
    //   const mapped: ScheduleList = {};

    //   for (const prop of data) {
    //     if (!mapped[prop.section]) {
    //       mapped[prop.section] = prop;
    //     }
    //   }

    //   return mapped;

    // }),
    tap((next: any) => this.store.set('schedule', next))
  )


  constructor(
    private store: Store,
    private authService: AuthService,
    private db: AngularFireDatabase,
  ) {}

  updateDate(date: Date) {
    this.date$.next(date);
  }

  private async getSchedule(startAt: number, endAt: number) {
    const user = await this.authService.user;
    return this.db.list(`schedule/${user.uid}`, 
    ref => ref.orderByChild('timestamp').startAt(startAt).endAt(endAt)).snapshotChanges()
  }
}