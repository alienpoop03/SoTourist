import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonButton, IonIcon } from '@ionic/angular/standalone';

// Migliora la tipizzazione per accettare sia startDate che start
export interface TripWithId {
  itineraryId: string;
  city: string;
  accommodation: string;
  coverPhoto?: string;
  // entrambi i formati:
  startDate?: string; // da backend
  endDate?: string;
  start?: string; // da draft
  end?: string;
  // altri campi se servono...
}

@Component({
  selector: 'app-unfinished-card',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
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
    event.stopPropagation();
  }

  onClick() {
    this.open.emit(this.trip.itineraryId);
  }

  getCityName(): string {
    if (!this.trip.city) return '';
    const raw = this.trip.city.split(',')[0].trim();
    const cleaned = raw.replace(/\b\d{5}\b/g, '')
      .replace(/\b[A-Z]{2}\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return cleaned
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  getAccommodationName(): string {
    if (!this.trip.accommodation) return '';
    return this.trip.accommodation.split(',')[0];
  }

  // Accetta entrambi i formati
  calculateTripLength(start: string | undefined, end: string | undefined): number {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  getCoverPhotoUrl(): string {
    const url = this.trip?.coverPhoto;
    if (url && /^https?:\/\//.test(url)) {
      return url;
    }
    return '../assets/images/PaletoBay.jpeg';
  }
}
