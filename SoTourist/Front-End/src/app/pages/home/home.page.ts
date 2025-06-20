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
import { NavController } from '@ionic/angular';
import { AppHeaderComponent } from '../../components/header/app-header.component';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { TripWithId } from '../../models/trip.model';

import { getCityName } from '../../utils/trip-utils';
import { getPhotoUrl } from 'src/app/utils/photo-utils';

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

  currentTripCoverUrl: string = '';
  nextTripCoverUrl: string = '';


  /* ---------- itinerari consigliati (mock) ---------- */
  featuredItineraries: TripWithId[] = [];
  readonly OFFICIAL_USER_ID = 'user_17501521583088137'; // <- usa l'ID corretto


  constructor(
    private router: Router,
    private itineraryService: ItineraryService,
    private authService: AuthService,
    private navCtrl: NavController
  ) { }

  box_shadow = false;

  onScroll(event: CustomEvent) {
    const scrollTop = event.detail.scrollTop || 0;
    if(this.currentTrip || this.nextTrip){
      this.box_shadow = scrollTop < 1;
    }else{
      this.box_shadow = false;
    }
    
  }

  /* ---------- lifecycle ---------- */
  ngOnInit(): void {
    this.refreshTrips();
    this.itineraryService.getUserItineraries(this.OFFICIAL_USER_ID, 'all')
      .subscribe(itinerari => {
        this.featuredItineraries = itinerari;
      });
  }

  private updateBoxShadow() {
    this.box_shadow = !!(this.currentTrip || this.nextTrip);
  }

  ionViewWillEnter(): void {
    this.refreshTrips();   // aggiorna quando torni alla Home
  }

  ionViewDidEnter(): void {
    this.refreshTrips();
  }

  getTripDays(trip: TripWithId): number {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
  }


  /* ---------- fetch viaggi ---------- */
  private refreshTrips(): void {
  const userId = this.authService.getUserId();
  if (!userId) {
    this.currentTrip = this.nextTrip = null;
    this.currentTripCoverUrl = this.nextTripCoverUrl = '';
    return;
  }

  this.currentTrip = null;
  this.nextTrip = null;

  this.itineraryService.getUserItineraries(userId, 'current')
    .subscribe(res => {
      this.currentTrip = res?.[0] ?? null;
      this.currentTripCoverUrl = getPhotoUrl(this.currentTrip?.coverPhoto);
      this.updateBoxShadow();
    });

  this.itineraryService.getUserItineraries(userId, 'upcoming')
    .subscribe(res => {
      if (!this.currentTrip) {
        this.nextTrip = res?.[0] ?? null;
        this.nextTripCoverUrl = getPhotoUrl(this.nextTrip?.coverPhoto);
        this.updateBoxShadow();
      }
    });
}

  getPhotoUrl(photoPath?: string | null): string {
    return getPhotoUrl(photoPath);
  }

  /* ---------- util ---------- */
  getTripLength(t: TripWithId): number {
    const s = new Date(t.startDate);
    const e = new Date(t.endDate);
    return Math.ceil((e.getTime() - s.getTime()) / 86_400_000) + 1;
  }

  /* ---------- navigazione ---------- */
  /*openCreate(city?: string) {
    this.router.navigate(['/crea'], { queryParams: city ? { city } : {} });
  }*/

  openCreate(city?: string) {
    if (city) {
      this.navCtrl.navigateForward(`/crea?city=${encodeURIComponent(city)}`);
    } else {
      this.router.navigate(['/crea']);
    }

  }

  openAll() {
    this.router.navigate(['/destinazioni-trend']);
  }

  openItinerary(itineraryId: string) {
    this.router.navigate(['/panoramica'], { queryParams: { id: itineraryId } });
  }

  getFormattedCity(trip: TripWithId | null): string {
    return trip ? getCityName(trip.city) : '';
  }

}