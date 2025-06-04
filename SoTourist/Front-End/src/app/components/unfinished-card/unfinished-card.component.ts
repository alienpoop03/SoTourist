/*import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  commentato per riserva vecchio codice funzionante*/

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonButton, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { ItineraryService } from '../../services/itinerary.service';
import { Router } from '@angular/router';

export interface TripWithId {
  itineraryId: string;
  city: string;
  accommodation: string;
  coverPhoto?: string;
  startDate?: string;
  endDate?: string;
  start?: string;
  end?: string;
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
export class UnfinishedCardComponent implements OnInit {
  @Input() trip!: TripWithId;
  @Input() intercept = false;
  @Output() open = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  hasConflict = false; // ✅ flag automatico
  isGuest = false;
  userId!: string;

  constructor(
    private authService: AuthService,
    private itineraryService: ItineraryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId() ?? '';

    const start = this.trip.startDate || this.trip.start;
    const end = this.trip.endDate || this.trip.end;

    this.isGuest = this.userId?.startsWith('guest_') || false;

    if (start && end && this.userId && !this.isGuest) {
      this.checkConflicts(this.userId, start, end, this.trip.itineraryId);
    }else{
       this.hasConflict = false;
    }
  }

  private checkConflicts(userId: string, start: string, end: string, currentTripId: string) {
    // ✅ Verifica lato server
    this.itineraryService.checkDateOverlap(userId, start, end, currentTripId)
      .subscribe({
        next: (res) => {
          this.hasConflict = res.overlap;
        },
        error: (err) => {
          console.error('[UnfinishedCard] Errore nel check overlap', err);
        }
      });
  }

  onDelete(event: Event) {
    this.remove.emit(this.trip.itineraryId);
    event.stopPropagation();
  }

  onClick() {
    if (!this.intercept) {
      if (this.hasConflict) {
        this.router.navigate(['/modifica-date'], {
          queryParams: { id: this.trip.itineraryId }
        });
      } else {
        this.router.navigate(['/tabs/itinerario'], {
          queryParams: { id: this.trip.itineraryId }
        });
      }
    } else {
      this.open.emit(this.trip.itineraryId);
    }
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

  editItinerario(event: Event){
    event.stopPropagation();
    this.router.navigate(['/modifica-date'], {
      queryParams: { id: this.trip.itineraryId }
    });
  }
}
