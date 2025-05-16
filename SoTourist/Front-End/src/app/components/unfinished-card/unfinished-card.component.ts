// trip-card.component.ts
//import { TripWithId } from 'src/app/models/trip.model';
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
import { TripWithId } from 'src/app/models/trip.model';


@Component({
  selector: 'app-unfinished-card',
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
  templateUrl: './unfinished-card.component.html',
  styleUrls: ['./unfinished-card.component.scss'],
})

export class UnfinishedCardComponent {
  @Input() trip!: TripWithId;
  @Output() open = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();


  onDelete(event: Event) {
    this.remove.emit(this.trip.itineraryId);
  }

  onClick() {
    this.open.emit(this.trip.itineraryId);
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

  calculateTripLength(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  getCoverPhotoUrl(): string {
    const url = this.trip?.coverPhoto;
    // Verifica se è una URL HTTP valida
    if (url && /^https?:\/\//.test(url)) {
      return url;
    }
    return '../assets/images/PaletoBay.jpeg';
  }

  ngOnInit() {
    console.log('📸 coverPhoto:', this.trip?.coverPhoto);
  }
}
