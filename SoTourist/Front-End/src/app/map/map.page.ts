/// <reference types="@types/google.maps" />

import {
  Component, ViewChild, ElementRef, AfterViewInit,
  NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonImg, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonList, IonItem, IonFab, IonFabButton, IonModal,
  IonButton
} from '@ionic/angular/standalone';
import { ItineraryService } from '../services/itinerary.service';

interface Place {
  name: string;
  address: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  distanceToNext?: string;
  rating?: number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  imports: [
    CommonModule,
    /* Ionic standalone */
    IonContent, IonImg, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonList, IonItem, IonFab, IonFabButton,
    IonModal, IonButton
  ]
})
export class MapPage implements AfterViewInit {

  /* --------------- Google Map ---------------- */
  @ViewChild('map', { static: false, read: ElementRef }) mapRef!: ElementRef<HTMLDivElement>;
  map!: google.maps.Map;
  markers: google.maps.Marker[] = [];

  /* --------------- Drawer & Cards ------------ */
  @ViewChild('cardsContainer', { read: ElementRef }) cardsEl!: ElementRef<HTMLElement>;
  drawerExpanded = false;
  dragging = false;
  startY = 0;

  /* --------------- Itinerary ----------------- */
  trip: any = null;
  days: number[] = [];
  currentDay = 1;
  todayPlaces: Place[] = [];
  selectedIndex: number | null = null;

  /* --------------- UI flags ------------------ */
  dayListOpen = false;
  detailOpen = false;
  detail?: Place;

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private itineraryService: ItineraryService    // ← qui

  ) { }

  /* ---------- 1. Lifecycle (fetch & map) ----- */
  ionViewWillEnter() {
  const id  = this.route.snapshot.queryParamMap.get('itineraryId');
  const day = +this.route.snapshot.queryParamMap.get('day')! || 1;

  if (!id) return;

  console.log('[MapPage] 📡 calling getItineraryById(', id, ')');

  this.itineraryService.getItineraryById(id).subscribe({
    next: res => {
      console.log('[MapPage] ← backend response:', res);
        console.log('[MapPage] 📦 res.itinerary:', res.itinerary); // <--- aggiungi questo


      if (!res.itinerary) {
        console.warn('[MapPage] ⚠️ backend ha restituito senza itinerary');
        return;
      }

      // ✅ Prendi tutto l’oggetto così com’è
      this.trip = res;

      this.days = res.itinerary.map((_, i) => i + 1);
      this.currentDay = day;
      this.refreshPlaces();

      this.whenGoogleReady().then(() => this.initMap());
    },
    error: err => {
      console.error('[MapPage] errore caricamento itinerary:', err);
    }
  });
}






  async ngAfterViewInit() {
    await this.whenGoogleReady();
  }

  private whenGoogleReady(): Promise<void> {
    return new Promise(res => {
      if ((window as any).google?.maps) res();
      else (window as any).initMap = () => res();
    });
  }

  /* ---------- 2.  Map helpers ---------------- */
  private initMap() {
    console.log('[MapPage:initMap] inizio');
    console.log('  • this.mapRef:', this.mapRef);
    console.log('  • nativeElement:', this.mapRef.nativeElement);
    console.log('  • oggi ci sono', this.todayPlaces.length, 'places:', this.todayPlaces);

    const first = this.todayPlaces[0];
    const center = (first?.latitude && first?.longitude)
      ? new google.maps.LatLng(first.latitude, first.longitude)
      : new google.maps.LatLng(41.9, 12.49); // Roma fallback

    console.log('  • centro mappa:', center.toString());
    this.map = new google.maps.Map(this.mapRef.nativeElement, {
      center,
      zoom: 13,
      disableDefaultUI: true
    });

    this.renderMarkers();
  }

  private renderMarkers() {
    console.log('[MapPage] → renderMarkers, pulisco markers precedenti:', this.markers.length);
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    this.todayPlaces.forEach((p, idx) => {
      console.log(`  • marker[${idx}] →`, p.name, p.latitude, p.longitude);
      if (!p.latitude || !p.longitude) {
        console.warn(`    - skip ${p.name} perché mancano coordinate`);
        return;
      }

      const marker = new google.maps.Marker({
        position: { lat: p.latitude, lng: p.longitude },
        map: this.map,
        title: p.name
      });
      marker.addListener('click', () => this.zone.run(() => this.openPlace(idx)));
      this.markers.push(marker);
    });

    console.log('  • markers finali:', this.markers.length);
  }

  /* ---------- 3.  Itinerary / UI ------------- */
  toggleDayList() { this.dayListOpen = !this.dayListOpen; }

  selectDay(d: number) {
    this.currentDay = d;
    this.dayListOpen = false;
    this.refreshPlaces();
    this.renderMarkers();
  }

 private refreshPlaces() {
  console.log(`[MapPage] → refreshPlaces (day ${this.currentDay})`);

  if (!this.trip?.itinerary || !Array.isArray(this.trip.itinerary)) {
    console.warn('  ⚠️ itinerary non è un array valido:', this.trip?.itinerary);
    this.todayPlaces = [];
    return;
  }

  const dayObj = this.trip.itinerary[this.currentDay - 1];

  if (!dayObj) {
    console.warn(`  ⚠️ Nessun oggetto per il giorno ${this.currentDay}`);
    this.todayPlaces = [];
    return;
  }

  console.log('  🔍 dayObj:', dayObj);
  this.todayPlaces = dayObj.ordered || [];
  console.log(`  • trovati ${this.todayPlaces.length} luoghi:`, this.todayPlaces);
}



  openPlace(i: number) {
    this.selectedIndex = i;
    this.detail = this.todayPlaces[i];
    this.detailOpen = true;

    const target = this.todayPlaces[i];
    if (target?.latitude && target?.longitude) {
      this.map.panTo({ lat: target.latitude, lng: target.longitude });
    }

    // scroll card in orizzontale se drawer non espanso
    if (!this.drawerExpanded && this.cardsEl) {
      const cont = this.cardsEl.nativeElement;
      const card = cont.children[i] as HTMLElement;
      cont.scrollTo({ left: card.offsetLeft - (cont.clientWidth - card.clientWidth) / 2, behavior: 'smooth' });
    }
  }

  /* ---------- 4. Drawer drag ----------------- */
  startDrag(ev: PointerEvent) {
    this.dragging = true;
    this.startY = ev.clientY;
  }
  drag(ev: PointerEvent) {
    if (!this.dragging) return;
    const delta = ev.clientY - this.startY;
    if (!this.drawerExpanded && delta < -60) this.drawerExpanded = true;
    if (this.drawerExpanded && delta > 60) this.drawerExpanded = false;
  }
  endDrag() { this.dragging = false; }

}
