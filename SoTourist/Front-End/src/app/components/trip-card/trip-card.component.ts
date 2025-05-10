// trip-card.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

export interface TripWithId {
  id: number;
  city: string;
  start: string;
  end: string;
  accommodation: string;
  days: number;
  itinerary?: any[];
  status?: 'in_corso' | 'imminente';
  photo?: string; // ✅ aggiungi questa riga

}

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon
  ],
  templateUrl: './trip-card.component.html',
  styleUrls: ['./trip-card.component.scss'],
})
export class TripCardComponent {
  @Input() trip!: TripWithId;
  @Output() remove = new EventEmitter<number>();
  @Output() open = new EventEmitter<number>();

  onDelete(event: Event) {
    event.stopPropagation();
    this.remove.emit(this.trip.id);
  }

  onClick() {
    this.open.emit(this.trip.id);
  }
  getCityName(): string {
  if (!this.trip.city) return '';
  const raw = this.trip.city.split(',')[0].trim();

  // Rimuove eventuali CAP (numeri di 5 cifre) e sigle come "TR", "RM"
  const cleaned = raw.replace(/\b\d{5}\b/g, '')         // rimuove il CAP
                     .replace(/\b[A-Z]{2}\b/g, '')       // rimuove sigle tipo RM, TR
                     .replace(/\s{2,}/g, ' ')            // rimuove spazi doppi
                     .trim();

  // Capitalizza correttamente
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}


  getAccommodationName(): string {
    if (!this.trip.accommodation) return '';
    return this.trip.accommodation.split(',')[0]; // prende solo "Hotel Roma" da "Hotel Roma, Via Nazionale, Roma"
  }

}
