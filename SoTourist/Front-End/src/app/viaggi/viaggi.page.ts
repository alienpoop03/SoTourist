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
  constructor(
    private router: Router,
    private api: ItineraryService,
    private auth: AuthService
  ) { }

  isGuest = false;
  inCorso: TripWithId | null = null;
  imminente: TripWithId | null = null;
  futuri: TripWithId[] = [];
  drafts: TripWithId[] = [];
  loaded = false;
  private apiCalls = 0;

  @ViewChild(IonContent) content!: IonContent;

  // Stato shrink animazione
  isShrunk: boolean = false;

  // Soglia tarata per passaggio a hero compatta
  readonly shrinkThreshold = 100;  // puoi regolarla leggermente a piacere

  // Header Title fix
  headerTitle: string = 'SoTourist';

  ngAfterViewInit() { }

  ionViewDidEnter(): void {
    this.isGuest = !!this.auth.getUserId()?.startsWith('guest_');
    this.isGuest ? this.loadDraftsOnly() : this.loadTrips();
  }

  onScroll(event: any) {
    const scrollTop = event.detail.scrollTop;
    this.isShrunk = scrollTop > this.shrinkThreshold;
  }


  private loadTrips(): void {
    const uid = this.auth.getUserId();
    if (!uid) return;

    this.loaded = false;
    this.resetLists();

    this.api.getUserItineraries(uid, 'current')
      .subscribe({
        next: r => {
          this.inCorso = r[0] || null;
          this.headerTitle = this.inCorso?.city || 'SoTourist';
        },
        complete: () => this.done()
      });

    this.api.getUserItineraries(uid, 'upcoming')
      .subscribe({ next: r => this.imminente = r[0] || null, complete: () => this.done() });

    this.api.getUserItineraries(uid, 'future')
      .subscribe({ next: r => this.futuri = r || [], complete: () => this.done() });

    this.loadDrafts();
  }

  private loadDraftsOnly(): void {
    this.resetLists();
    this.loaded = true;
    this.loadDrafts();
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

  private loadDrafts(): void {
    this.drafts = JSON.parse(localStorage.getItem('trips') || '[]');
  }

  deleteDraft(id: string): void {
    this.drafts = this.drafts.filter(t => t.itineraryId !== id);
    localStorage.setItem('trips', JSON.stringify(this.drafts));
  }

  deleteTrip(id: string): void {
    const uid = this.auth.getUserId();
    if (!uid) return;
    this.api.deleteItinerary(uid, id).subscribe(() => this.loadTrips());
  }

  openItinerary(id: string): void {
    this.router.navigate(['/tabs/itinerario'], { queryParams: { id } });
  }

  goToCreate(): void {
    this.router.navigate(['/crea']);
  }

  onScrollEnd(event: any) {
    const scrollTop = event.detail.scrollTop;
    const snapThreshold = this.shrinkThreshold / 2;

    // Snap forzato, senza esitazioni
    if (scrollTop > this.shrinkThreshold) {
      this.isShrunk = true;
    } else if (scrollTop < snapThreshold) {
      this.isShrunk = false;
    }
  }


}
