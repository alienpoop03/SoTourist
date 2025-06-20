import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DayItinerary, Phase, Poi } from '../models/itinerary.model';

export interface VisitedMap {
  [dayIndex: number]: {
    morning: Set<string>;
    afternoon: Set<string>;
    evening: Set<string>;
  };
}

@Injectable({ providedIn: 'root' })
export class VisitService {
  private visitedState = new BehaviorSubject<VisitedMap>({});
  visited$: Observable<VisitedMap> = this.visitedState.asObservable();

  init(itinerary: DayItinerary[]) {
    const map: VisitedMap = {};
    itinerary.forEach((_, idx) => {
      map[idx] = { morning: new Set(), afternoon: new Set(), evening: new Set() };
    });
    this.visitedState.next(map);
  }

  checkAndMark(coords: { latitude: number; longitude: number }, itinerary: DayItinerary[]) {
    const newMap: VisitedMap = { ...this.visitedState.value };

    itinerary.forEach((day, dayIdx) => {
      (['morning', 'afternoon', 'evening'] as Phase[]).forEach(phase => {
        day[phase].forEach((poi: Poi) => {
          if (!newMap[dayIdx][phase].has(poi.id) &&
              this.distanceKm(coords.latitude, coords.longitude, poi.lat, poi.lng) < 0.02) {
            newMap[dayIdx][phase].add(poi.id);
          }
        });
      });
    });

    this.visitedState.next(newMap);
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
