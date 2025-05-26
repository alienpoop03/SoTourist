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
  /* --- dati statici UI --- */
  trending = ['Roma', 'Parigi', 'Tokyo', 'New York', 'Barcellona'];

  /* --- prossimo viaggio (se esiste) --- */
  nextTrip: TripWithId | null = null;

  /* --- itinerari consigliati (mock) --- */
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
    private authService: AuthService
  ) {}

  /* ---------- lifecycle ---------- */
  ngOnInit(): void {
    this.loadNextTrip();            // 1ª volta (al mount)
  }

  /* viene richiamato OGNI volta che torni alla tab Home */
  ionViewWillEnter(): void {
    this.loadNextTrip();            // aggiorna dati senza ricaricare l’app
  }

  /* ---------- fetch ---------- */
  private loadNextTrip(): void {
    const userId = this.authService.getUserId();
    if (!userId) { this.nextTrip = null; return; }

    this.itineraryService
      .getUserItineraries(userId, 'upcoming')        // Observable<TripWithId[]>
      .subscribe(list => {
        this.nextTrip = list?.length ? list[0] : null;
      });
  }

  /* ---------- helper ---------- */
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