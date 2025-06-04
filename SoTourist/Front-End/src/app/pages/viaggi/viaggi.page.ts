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
import { ItineraryService } from '../../../services/itinerary.service';
import { AuthService } from '../../../services/auth.service';

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

  //variabili per caricare i viaggi nella pagina
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

  readonly shrinkThreshold = 100; // Soglia tarata per passaggio a hero compatta (modificabile)

  // Header Title fix
  headerTitle: string = 'SoTourist';

  private scrollTimer: any; // variaile funzionale per lo snapping 

  // Le variabili per gestire lo snapping
  snapActive: string | null = 'attivo';  // se non null attivo altrimenti no
  millisecondSnap = 200;                 // millisecondi da attendere dall'ultimo imput di scrol prima modificare
  
  
  
  totalHeight: number = 0;
  visibleHeight: number = 0;
  altezzaOverScroll: number = 150;
  private overScrollTimer: any;

  ngAfterViewInit() {
    setTimeout(() => {
      
      this.content.getScrollElement().then((scrollEl) => {
        this.totalHeight = scrollEl.scrollHeight;
        //console.log('Altezza totale:', this.totalHeight);
        this.visibleHeight = scrollEl.clientHeight;
        //console.log('Altezza visibile (clientHeight):', this.visibleHeight);
        this.totalHeight = this.totalHeight - this.altezzaOverScroll - this.visibleHeight;
        if(this.totalHeight<0){
          this.totalHeight= 0;
        }
        //console.log('Altezza totale:', this.totalHeight);
      });
    }, 0);
  }

  ionViewDidEnter(): void {
    this.refreshTrips();
  }

  private refreshTrips(): void {
    this.isGuest = !!this.auth.getUserId()?.startsWith('guest_');
    this.isGuest ? this.loadDraftsOnly() : this.loadTrips();
    this.startMidnightWatcher();
  }

  startMidnightWatcher() { //calcola tra quanto tempo sarà mezzanotte e casomai fare refresh 
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const msToMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
      this.refreshTrips();  // Al passaggio di giorno, rifaccio tutto
    }, msToMidnight);
  }

  

  onScroll(event: any) {
    const scrollTop = event.detail.scrollTop;
    this.isShrunk = scrollTop > this.shrinkThreshold;
    //console.log(scrollTop);
    
    clearTimeout(this.overScrollTimer);
    this.overScrollTimer = setTimeout(() => {
      if(scrollTop > this.totalHeight){
        //console.log("over", (this.totalHeight + this.altezzaOverScroll));
        if(scrollTop > (this.totalHeight + this.altezzaOverScroll)){
          this.content.scrollToPoint(0, this.totalHeight, 300);
          this.router.navigate(['/tabs/storico-viaggi']);
        }else{
          this.content.scrollToPoint(0, this.totalHeight, 300);
        }
      } 
    }, this.millisecondSnap);
    








    if (this.inCorso == null || this.snapActive == null) { //in caso manchi il viaggio in corso (la hero) o se non lo vogliamo
      return;  // esci dal debounce se non serve lo snap
    }

    clearTimeout(this.scrollTimer);

    this.scrollTimer = setTimeout(() => {
      this.handleScrollEnd(event);
    }, this.millisecondSnap);
  }

  handleScrollEnd(event: any) {
    const scrollTop = event.detail.scrollTop;

    const snapZoneStart = 0.1;
    const snapZoneEnd = 204.9;

    if (scrollTop >= snapZoneStart && scrollTop <= snapZoneEnd) {
      if (scrollTop < 107) {
        this.content.scrollToPoint(0, 0, 300);
      } else {
        this.content.scrollToPoint(0, 205, 300);
      }
    }
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
