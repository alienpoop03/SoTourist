// trip-card.component.ts
//import { TripWithId } from 'src/app/models/trip.model';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { TripWithId } from 'src/app/models/trip.model';
import { Router } from '@angular/router';

import { getCityName, getAccommodationName } from '../../utils/trip-utils';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonButton,
    IonIcon
  ],
  templateUrl: './trip-card.component.html',
  styleUrls: ['./trip-card.component.scss'],
})

export class TripCardComponent {
  @Input() trip!: TripWithId;
  @Output() open = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();


  onDelete(event: Event) {
    this.remove.emit(this.trip.itineraryId);
    event.stopPropagation();
  }

  constructor(
    private router: Router
  ) { }

  onClick() {

    this.router.navigate(['/tabs/panoramica'], {
      queryParams: { id: this.trip.itineraryId }
    });

  }

  getFormattedCity(): string {
    return getCityName(this.trip.city);
  }

  getFormattedAccommodation(): string {
    return getAccommodationName(this.trip.accommodation);
  }

  calculateTripLength(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }


}
