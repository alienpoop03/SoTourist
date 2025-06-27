import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonFab,
  IonIcon,
} from '@ionic/angular/standalone';

import { AppHeaderComponent } from '../../components/header/app-header.component';
import { TripCardComponent } from '../../components/trip-card/trip-card.component';
import { UnfinishedCardComponent } from '../../components/unfinished-card/unfinished-card.component';
import { TripWithId } from 'src/app/models/trip.model';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { UserHeroComponent } from '../../components/user-hero/user-hero.component';

@Component({
  selector: 'app-viaggi',
  standalone: true,
  templateUrl: './viaggi.page.html',
  styleUrls: ['./viaggi.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonFab,
    IonIcon,
    AppHeaderComponent,
    TripCardComponent,
    UnfinishedCardComponent,
    UserHeroComponent,
  ],
})
export class ViaggiPage implements AfterViewInit {
  constructor(
    private router: Router,
    private api: ItineraryService,
    private auth: AuthService
  ) { }

  // Stato viaggi
  userId: string = '';
  username = '';
  upcomingCount: number = 0;
  pastCount: number = 0;
  visitedPlacesCount: number = 0;
  isGuest = false;
  inCorso: TripWithId | null = null;
  imminente: TripWithId | null = null;
  futuri: TripWithId[] = [];
  drafts: TripWithId[] = [];
  loaded = false;
  private apiCalls = 0;

  // Hero dinamico
  isShrunk = false;
  shrinkThreshold = 0;
  heroMax = 0;
  heroMin = 0;
  headerTitle = 'SoTourist';

  @ViewChild(IonContent) content!: IonContent;

  // Lifecycle
  ngAfterViewInit(): void {
    this.heroMax = window.innerHeight * 0.3;
    this.heroMin = this.heroMax * 0.2;
    this.shrinkThreshold = this.heroMax - this.heroMin;
    this.refreshTrips();
  }

  ionViewDidEnter(): void {
    this.refreshTrips();
  }

  // gestione shrink hero
  onScroll(event: any) {
    const y = event.detail.scrollTop;
    this.isShrunk = y > this.shrinkThreshold;
  }

  onScrollEnd(event: any) {
    const y = event.detail.scrollTop;
    if (y > this.shrinkThreshold) {
      this.isShrunk = true;
    } else if (y < this.shrinkThreshold / 2) {
      this.isShrunk = false;
    }
  }

  // Aggiornamento dati viaggi
  private refreshTrips(): void {
    this.isGuest = !!this.auth.getUserId()?.startsWith('guest_');
    this.isGuest ? this.loadDraftsOnly() : this.loadTrips();
    this.startMidnightWatcher();

    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      this.userId = localStorage.getItem('userId') || '';
      this.username = parsed.username || '';
    }
  }

  private startMidnightWatcher() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    setTimeout(() => {
      this.refreshTrips();
      this.startMidnightWatcher();
    }, midnight.getTime() - now.getTime());
  }

  // Caricamento viaggi utente
  private loadTrips(): void {
    const uid = this.auth.getUserId();
    if (!uid) return;

    this.loaded = false;
    this.resetLists();

    this.api.getUserItineraries(uid, 'current').subscribe({
      next: (r) => {
        this.inCorso = r[0] || null;
        this.headerTitle = this.inCorso?.city || 'SoTourist';
      },
      complete: () => this.done(),
    });

    // Viaggi imminenti + futuri
    this.api.getUserItineraries(uid, 'upcoming').subscribe({
      next: (r) => {
        this.imminente = r[0] || null;

        this.api.getUserItineraries(uid, 'future').subscribe({
          next: (futureTrips) => {
            this.futuri = futureTrips || [];
            this.upcomingCount = (r?.length || 0) + (futureTrips?.length || 0);
          },
          complete: () => this.done(),
        });
      },
      complete: () => this.done(),
    });

    // Viaggi completati
    this.api.getUserItineraries(uid, 'past').subscribe({
      next: (pastTrips) => {
        this.pastCount = pastTrips.length;
        if (!pastTrips.length) {
          this.visitedPlacesCount = 0;
          this.done();
          return;
        }
        const allPlaces: any[] = [];
        let completed = 0;

        pastTrips.forEach(trip => {
          this.api.getItineraryById(trip.itineraryId).subscribe({
            next: (detailedTrip) => {
              if (detailedTrip.itinerary && Array.isArray(detailedTrip.itinerary)) {
                allPlaces.push(...detailedTrip.itinerary);
              }
            },
            complete: () => {
              completed++;
              if (completed === pastTrips.length) {
                this.processVisitedPlaces(allPlaces);
                this.done();
              }
            }
          });
        });
      },
    });

    this.loadDrafts();
  }

  // Conta luoghi visitati totali
  private processVisitedPlaces(places: any[]): void {
    const flattened = places.flatMap(dayGroup => dayGroup.ordered || []);
    const uniqueKeys = new Set(flattened.map(p => p.placeId));
    this.visitedPlacesCount = uniqueKeys.size;
  }

  private loadDraftsOnly(): void {
    this.resetLists();
    this.loaded = true;
    this.loadDrafts();
  }

  private loadDrafts(): void {
    this.drafts = JSON.parse(localStorage.getItem('trips') || '[]');
  }

  private resetLists(): void {
    this.inCorso = this.imminente = null;
    this.futuri = [];
    this.apiCalls = 0;
  }

  private done(): void {
    if (++this.apiCalls >= 3) {
      this.loaded = true;
      this.apiCalls = 0;
    }
  }

  // Azioni viaggi
  deleteTrip(id: string) {
    const uid = this.auth.getUserId();
    if (!uid) return;
    this.api.deleteItinerary(uid, id).subscribe(() => this.loadTrips());
  }

  deleteDraft(id: string) {
    this.drafts = this.drafts.filter((t) => t.itineraryId !== id);
    localStorage.setItem('trips', JSON.stringify(this.drafts));
  }

  openItinerary(id: string) {
    this.router.navigate(['/tabs/panoramica'], { queryParams: { id } });
  }

  goToCreate() {
    this.router.navigate(['/crea']);
  }

  openStorico() {
    this.router.navigate(['/tabs/storico-viaggi']);
  }

}