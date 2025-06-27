import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
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
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonButton,
    AppHeaderComponent,
  ],
})
export class HomePage implements OnInit {
  trending = ['Roma', 'Parigi', 'Tokyo', 'New York', 'Barcellona'];

  // Viaggi utente
  currentTrip: TripWithId | null = null;
  nextTrip: TripWithId | null = null;
  currentTripCoverUrl: string = '';
  nextTripCoverUrl: string = '';

  // Itinerari consigliati
  featuredItineraries: TripWithId[] = [];
  readonly OFFICIAL_USER_ID = 'user_17501521583088137';

  // Stato UI
  box_shadow = false;
  isShrunk = false;
  readonly compactHeroHeight = 104.55;
  shrinkThreshold = 0;

  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('expandedHero', { static: false }) expandedHeroRef!: ElementRef;
  @ViewChild('compactHero', { static: false }) compactHeroRef!: ElementRef;

  constructor(
    private router: Router,
    private itineraryService: ItineraryService,
    private authService: AuthService,
    private navCtrl: NavController
  ) { }

  // Calcolo soglia per mostrare Hero compatta
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.recalculateShrinkThreshold();
  }

  recalculateShrinkThreshold() {
    setTimeout(() => {
      if (!this.expandedHeroRef) return;
      const heroHeight = this.expandedHeroRef.nativeElement.offsetHeight || 0;
      this.shrinkThreshold = heroHeight - this.compactHeroHeight;
    });
  }

  ngOnInit(): void {
    this.refreshTrips();
    this.itineraryService.getUserItineraries(this.OFFICIAL_USER_ID, 'all')
      .subscribe(itinerari => {
        this.featuredItineraries = itinerari;
      });
  }

  ngAfterViewInit() {
    this.refreshTrips();
  }

  ionViewWillEnter(): void {
    this.refreshTrips();
  }

  ionViewDidEnter(): void {
    this.refreshTrips();
  }

  // Scroll: Hero compatta, shadow, ecc
  onScroll(event: CustomEvent) {
    const scrollTop = event.detail.scrollTop || 0;
    this.isShrunk = scrollTop > this.shrinkThreshold;
    if (this.currentTrip || this.nextTrip) {
      this.box_shadow = scrollTop < 1;
    } else {
      this.box_shadow = false;
    }
  }

  onScrollEnd(event: any) {
    const y = event.detail.scrollTop;
    if (y > this.shrinkThreshold) {
      this.isShrunk = true;
    } else if (y < this.shrinkThreshold / 2) {
      this.isShrunk = false;
    }
  }

  private updateBoxShadow() {
    this.box_shadow = !!(this.currentTrip || this.nextTrip);
  }

  // Carica viaggi utente (current/upcoming) e aggiorna cover
  private refreshTrips(): void {
    setTimeout(() => {
      this.recalculateShrinkThreshold();
    });
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

  // Utility su viaggi
  getTripDays(trip: TripWithId): number {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;
  }

  getTripLength(t: TripWithId): number {
    const s = new Date(t.startDate);
    const e = new Date(t.endDate);
    return Math.ceil((e.getTime() - s.getTime()) / 86_400_000) + 1;
  }

  getPhotoUrl(photoPath?: string | null): string {
    return getPhotoUrl(photoPath);
  }

  getFormattedCity(trip: TripWithId | null): string {
    return trip ? getCityName(trip.city) : '';
  }

  // Navigazione e apertura pagine
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

  // Vai all'itinerario
  openItinerary(itineraryId: string) {
    
  // Cerca nei consigliati
  const featured = this.featuredItineraries.find(i => i.itineraryId === itineraryId);

  if (featured) {
    const tripDays = this.getTripDays(featured);
    this.router.navigate(['/modifica-date'], {
      queryParams: {
        id: itineraryId,
        azione: 'clona',
        maxDays: tripDays
      }
    });
    return;
  }

  // Altrimenti naviga verso la panoramica del proprio viaggio
  this.router.navigate(['/tabs/panoramica'], {
    queryParams: { id: itineraryId }
  });
}

  // Scroll verso Hero principale
  onHeroClick() {
    if (!this.content) return;
    this.content.scrollToPoint(0, 0, 500);
    this.isShrunk = false;
  }
}