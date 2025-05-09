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
  @Output() open   = new EventEmitter<number>();

  onDelete(event: Event) {
    event.stopPropagation();
    this.remove.emit(this.trip.id);
  }

  onClick() {
    this.open.emit(this.trip.id);
  }
}
