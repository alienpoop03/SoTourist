/* src/app/home/home.page.ts */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';

import { AppHeaderComponent } from '../components/header/app-header.component';
import { ItineraryService } from '../services/itinerary.service';
import { AuthService } from '../services/auth.service';
import { TripWithId } from '../models/trip.model';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonIcon,
    IonButton,
    AppHeaderComponent,
  ],
})
export class HomePage implements OnInit {
  /* ---------- dati statici UI ---------- */
  trending = ['Roma', 'Parigi', 'Tokyo', 'New York', 'Barcellona'];

  /* ---------- viaggi ---------- */
  currentTrip: TripWithId | null = null;  // viaggio in corso
  nextTrip: TripWithId | null = null;     // viaggio imminente (solo se non in corso)

  /* ---------- itinerari consigliati (mock) ---------- */
  featuredItineraries = [
    {
      itineraryId: 'rome_culture',
      city: 'Roma',
      startDate: '2025-05-10',
      endDate: '2025-05-12',
      days: 4,
      style: 'culturale',
      coverPhoto: 'assets/images/Roma.jpeg',
      accommodation: '',
      places: [],
    },
    {
      itineraryId: 'paris_art',
      city: 'Parigi',
      startDate: '2025-06-01',
      endDate: '2025-06-04',
      days: 2,
      style: 'artistico',
      coverPhoto: 'assets/images/Parigi.jpeg',
      accommodation: '',
      places: [],
    },
    {
      itineraryId: 'tokyo_modern',
      city: 'Tokyo',
      startDate: '2025-09-15',
      endDate: '2025-09-19',
      days: 3,
      style: 'urban',
      coverPhoto: 'assets/images/Tokyo.jpeg',
      accommodation: '',
      places: [],
    },
  ];

  constructor(
    private router: Router,
    private itineraryService: ItineraryService,
    private auth: AuthService
  ) {}

  /* ---------- lifecycle ---------- */
  ngOnInit(): void {
    this.refreshTrips();
  }

  ionViewWillEnter(): void {
    this.refreshTrips();   // aggiorna quando torni alla Home
  }

  /* ---------- fetch viaggi ---------- */
  private refreshTrips(): void {
    const userId = this.auth.getUserId();
    if (!userId) { this.currentTrip = this.nextTrip = null; return; }

    this.currentTrip = null;
    this.nextTrip = null;

    this.itineraryService.getUserItineraries(userId, 'current')
      .subscribe(res => this.currentTrip = res?.[0] ?? null);

    this.itineraryService.getUserItineraries(userId, 'upcoming')
      .subscribe(res => {
        if (!this.currentTrip) {
          this.nextTrip = res?.[0] ?? null;
        }
      });
  }

  /* ---------- util ---------- */
  getTripLength(t: TripWithId): number {
    const s = new Date(t.startDate);
    const e = new Date(t.endDate);
    return Math.ceil((e.getTime() - s.getTime()) / 86_400_000) + 1;
  }

  /* ---------- navigazione ---------- */
  openCreate(city?: string) {
    this.router.navigate(['/crea'], { queryParams: city ? { city } : {} });
  }

  openAll() {
    this.router.navigate(['/destinazioni-trend']);
  }

  openItinerary(itineraryId: string) {
    this.router.navigate(['/itinerario'], { queryParams: { id: itineraryId } });
  }
}