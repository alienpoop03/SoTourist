import {
  Component,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';

import { AppHeaderComponent } from '../components/header/app-header.component';
import { TripCardComponent } from '../components/trip-card/trip-card.component';
import { UnfinishedCardComponent } from '../components/unfinished-card/unfinished-card.component';

import { TripWithId } from 'src/app/models/trip.model';
import { ItineraryService } from '../services/itinerary.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-viaggi',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonFab,
    IonFabButton,
    IonButton,
    IonHeader,
  IonToolbar,
  IonTitle,
    IonIcon,
    AppHeaderComponent,
    TripCardComponent,
    UnfinishedCardComponent,
  ],
  templateUrl: './viaggi.page.html',
  styleUrls: ['./viaggi.page.scss'],
})
export class ViaggiPage implements AfterViewInit {
  /* ──────────── stato viaggi ──────────── */
  inCorso: TripWithId | null = null;
  imminente: TripWithId | null = null;
  futuri: TripWithId[] = [];
  drafts: TripWithId[] = [];
  loaded  = false;
  isGuest = false;
  private apiCalls = 0;

  /* ──────────── hero dinamica ──────────── */
  heroMax = 0;            // 50 vh in px
  heroMin = 0;            // 20 % di heroMax
  heroHeightPx = '0px';   // binding [ngStyle]
  overlayOpacity = 1;     // 1 → 0

  @ViewChild('pageContent', { read: IonContent })
  content!: IonContent;

  constructor(
    private router: Router,
    private api: ItineraryService,
    private auth: AuthService
  ) {}

  /* ─────────── Lifecycle ─────────── */
  ngAfterViewInit(): void {
    this.heroMax = window.innerHeight * 0.5;   // 50 vh
    this.heroMin = this.heroMax * 0.2;         // 20 %
    this.heroHeightPx = `${this.heroMax}px`;
  }

  ionViewDidEnter(): void {
    this.isGuest = !!this.auth.getUserId()?.startsWith('guest_');
    this.isGuest ? this.loadDraftsOnly() : this.loadTrips();
  }

  /* ─────────── Scroll handler ─────────── */
  onScroll(ev: any): void {
    const scrollTop = ev.detail.scrollTop;

    /* 1 : 1 – l’hero si riduce finché scrollTop ≤ range */
    const range = this.heroMax - this.heroMin;

    if (scrollTop < range) {
      /* fase di riduzione / espansione */
      const newH = this.heroMax - scrollTop;
      this.heroHeightPx = `${newH}px`;
      this.overlayOpacity = (newH - this.heroMin) / range; // 1 → 0
    } else {
      /* hero rimane alla misura minima */
      this.heroHeightPx   = `${this.heroMin}px`;
      this.overlayOpacity = 0;
    }
  }

  onHeroClick(): void {
    this.content.scrollToTop(400);
  }

  /* ─────────── API trips ─────────── */
  private loadTrips(): void {
    const uid = this.auth.getUserId(); if (!uid) return;
    this.loaded = false; this.resetLists();

    this.api.getUserItineraries(uid, 'current')
      .subscribe({ next: r => this.inCorso   = r[0] || null, complete: () => this.done() });

    this.api.getUserItineraries(uid, 'upcoming')
      .subscribe({ next: r => this.imminente = r[0] || null, complete: () => this.done() });

    this.api.getUserItineraries(uid, 'future')
      .subscribe({ next: r => this.futuri    = r       || [],  complete: () => this.done() });

    this.loadDrafts();
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
    if (++this.apiCalls >= 3) { this.loaded = true; this.apiCalls = 0; }
  }

  /* ─────────── Azioni ─────────── */
  openItinerary(id: string): void {
    this.router.navigate(['/tabs/itinerario'], { queryParams: { id } });
  }

  deleteTrip(id: string): void {
    const uid = this.auth.getUserId(); if (!uid) return;
    this.api.deleteItinerary(uid, id).subscribe(() => this.loadTrips());
  }

  deleteDraft(id: string): void {
    this.drafts = this.drafts.filter(t => t.itineraryId !== id);
    localStorage.setItem('trips', JSON.stringify(this.drafts));
  }

  goToCreate(): void {
    this.router.navigate(['/crea']);
  }
}