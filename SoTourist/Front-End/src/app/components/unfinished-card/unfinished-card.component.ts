import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ItineraryService } from 'src/app/services/itinerary.service';
import { AuthService } from 'src/app/services/auth.service';
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-unfinished-card',
  templateUrl: './unfinished-card.component.html',
  styleUrls: ['./unfinished-card.component.scss'],
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonButton
  ]
})
export class UnfinishedCardComponent implements OnInit {
  @Input() trip!: any;
  @Output() open = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  hasConflict = false;
  userId!: string;

  constructor(
    private itineraryService: ItineraryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId() ?? ''; // fix errore TS2322

    if (this.trip?.startDate && this.trip?.endDate) {
      this.itineraryService
        .checkDateOverlap(this.userId, this.trip.startDate, this.trip.endDate, this.trip.itineraryId)
        .subscribe(res => {
          this.hasConflict = res.overlap;
        });
    }
  }

  openTrip() {
    if (this.hasConflict) {
      this.router.navigate(['/modifica-date'], { queryParams: { id: this.trip.itineraryId } });
    } else {
      this.router.navigate(['/tabs/itinerario'], { queryParams: { id: this.trip.itineraryId } });
    }
  }

  getCityName(): string {
    return this.trip?.city || 'Città sconosciuta';
  }

  getAccommodationName(): string {
    return this.trip?.accommodation || 'Alloggio non specificato';
  }

  calculateTripLength(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.remove.emit(this.trip.itineraryId);
  }
}
