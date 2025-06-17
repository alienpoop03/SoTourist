/* src/app/pages/viaggi/viaggi.page.ts */

import { Component, AfterViewInit, ViewChild } from '@angular/core';
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

import { AppHeaderComponent } from '../../components/header/app-header.component';
import { TripCardComponent } from '../../components/trip-card/trip-card.component';
import { UnfinishedCardComponent } from '../../components/unfinished-card/unfinished-card.component';

import { TripWithId } from 'src/app/models/trip.model';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-viaggi',
  standalone: true,
  templateUrl: './viaggi.page.html',
  styleUrls: ['./viaggi.page.scss'],
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
})
export class ViaggiPage implements AfterViewInit {
  constructor(
    private router: Router,
    private api: ItineraryService,
    private auth: AuthService
  ) {}

  /* ========== STATO VIAGGI ========== */
  isGuest = false;
  inCorso: TripWithId | null = null;
  imminente: TripWithId | null = null;
  futuri: TripWithId[] = [];
  drafts: TripWithId[] = [];
  loaded = false;
  private apiCalls = 0;

  /* ========== HERO SHRINK =========== */
  isShrunk = false;
  shrinkThreshold = 0;          // calcolato da heroMax – heroMin
  heroMax = 0;                  // 50 vh in px
  heroMin = 0;                  // 20 % di heroMax
  headerTitle = 'SoTourist';

  /* snapping */
  private scrollTimer: any;
  snapActive: string | null = 'attivo';
  millisecondSnap = 200;

  /* over-scroll verso storico viaggi */
  totalHeight = 0;
  visibleHeight = 0;
  altezzaOverScroll = 150;
  private overScrollTimer: any;

  @ViewChild(IonContent) content!: IonContent;

  /* ========== LIFECYCLE ============ */
  ngAfterViewInit(): void {
    /* dimensioni hero */
    this.heroMax = window.innerHeight * 0.5;          // 50 vh
    this.heroMin = this.heroMax * 0.2;                // 20 %
    this.shrinkThreshold = this.heroMax - this.heroMin; // ← soglia dinamica

    /* misura altezza contenuto per over-scroll */
    setTimeout(() => {
      this.content.getScrollElement().then((el) => {
        this.totalHeight = el.scrollHeight;
        this.visibleHeight = el.clientHeight;
        this.totalHeight =
          this.totalHeight - this.altezzaOverScroll - this.visibleHeight;
        if (this.totalHeight < 0) this.totalHeight = 0;
      });
    });

    this.refreshTrips();
  }

  ionViewDidEnter(): void {
    /* già fatto in ngAfterViewInit, ma se torni alla page ricarico */
    if (!this.loaded) this.refreshTrips();
  }

  /* ========== SCROLL ================ */
  onScroll(event: any) {
    const y = event.detail.scrollTop;
    this.isShrunk = y > this.shrinkThreshold;

    if (!this.inCorso || !this.snapActive) return;

    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(
      () => this.handleScrollEnd(event),
      this.millisecondSnap
    );
  }

  handleScrollEnd(event: any) {
    const y = event.detail.scrollTop;
    const snapZoneStart = 0.1;
    const snapZoneEnd = this.shrinkThreshold - 0.1;

    if (y >= snapZoneStart && y <= snapZoneEnd) {
      if (y < this.shrinkThreshold / 2) {
        this.content.scrollToPoint(0, 0, 300);
      } else {
        this.content.scrollToPoint(0, this.shrinkThreshold, 300);
      }
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

  onHeroClick() {
    this.content.scrollToTop(400);
  }

  /* ========== DATI VIAGGI =========== */
  private refreshTrips(): void {
    this.isGuest = !!this.auth.getUserId()?.startsWith('guest_');
    this.isGuest ? this.loadDraftsOnly() : this.loadTrips();
    this.startMidnightWatcher();
  }

  private startMidnightWatcher() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    setTimeout(() => this.refreshTrips(), midnight.getTime() - now.getTime());
  }

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

    this.api
      .getUserItineraries(uid, 'upcoming')
      .subscribe({ next: (r) => (this.imminente = r[0] || null), complete: () => this.done() });

    this.api
      .getUserItineraries(uid, 'future')
      .subscribe({ next: (r) => (this.futuri = r || []), complete: () => this.done() });

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
    if (++this.apiCalls >= 3) {
      this.loaded = true;
      this.apiCalls = 0;
    }
  }

  /* ========== AZIONI ================ */
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