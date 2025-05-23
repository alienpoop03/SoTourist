/// <reference types="@types/google.maps" />

import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonImg, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonList, IonItem, IonFab, IonFabButton,
  IonModal, IonButton
} from '@ionic/angular/standalone';
import { GestureController } from '@ionic/angular';

import { ItineraryService } from '../services/itinerary.service';
import { Place } from '../models/trip.model';

/**
 * Rappresenta la struttura delle tappe raggruppate per giorno
 */
interface DayGroup {
  morning: Place[];
  afternoon: Place[];
  evening: Place[];
}

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonImg, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonList, IonItem, IonFab, IonFabButton,
    IonModal, IonButton
  ]
})
export class MapPage implements AfterViewInit {

  /* ------------------------- References ------------------------- */
  @ViewChild('map', { static: false, read: ElementRef }) mapRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cardsContainer', { read: ElementRef }) cardsEl!: ElementRef<HTMLElement>;

  /* --------------------------- Google --------------------------- */
  map!: google.maps.Map;
  markers: google.maps.Marker[] = [];

  /* --------------------------- Drawer --------------------------- */
  drawerExpanded = false;
  dragging = false;

  /* ----------------------- Itinerary data ----------------------- */
  trip: any = null;
  days: number[] = [];
  currentDay = 1;
  todayPlaces: Place[] = [];
  selectedIndex: number | null = null;

  /* ----------------------------- UI ----------------------------- */
  dayListOpen = false;
  detailOpen = false;
  detail?: Place;

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private itineraryService: ItineraryService,
    private gestureCtrl: GestureController
  ) { }

  /* ======================= Lifecycle ======================= */
  ionViewWillEnter() {
    const itineraryId = this.route.snapshot.queryParamMap.get('itineraryId');
    this.currentDay = +this.route.snapshot.queryParamMap.get('day')! || 1;

    if (!itineraryId) return;

    this.itineraryService.getItineraryById(itineraryId).subscribe({
      next: res => {
        // --- 1. Normalizza l'array di giorni --------------------------------
        const grouped = this.isGrouped(res.itinerary)
          ? res.itinerary as DayGroup[]
          : this.groupFlatPlaces(res.itinerary as Place[]);

        // --- 2. Aggiorna stato ----------------------------------------------
        this.trip = { ...res, itinerary: grouped };
        this.days = grouped.map((_, i) => i + 1);

        // --- 3. Aggiorna UI --------------------------------------------------
        this.refreshPlaces();
        this.whenGoogleReady().then(() => this.initMap());
      },
      error: err => console.error('[MapPage] errore caricamento itinerary:', err)
    });
  }

  ngAfterViewInit() {
    this.whenGoogleReady().then(() => {
      this.initMap();
      this.setupDrawerGesture();
    });
  }

  /* ===================== Helpers ===================== */
  /**
   * Determina se l'array ricevuto è già raggruppato per giorno.
   */
  private isGrouped(arr: any[]): arr is DayGroup[] {
    return Array.isArray(arr) && arr.length > 0 &&
      'morning' in arr[0] && 'afternoon' in arr[0] && 'evening' in arr[0];
  }

  /**
   * Converte un array piatto di Place in un array di giorni.
   */
  private groupFlatPlaces(flat: Place[]): DayGroup[] {
    const maxDay = flat.reduce((m, p) => Math.max(m, p.day), 0);
    const grouped: DayGroup[] = Array.from({ length: maxDay }, () => ({
      morning: [], afternoon: [], evening: []
    }));

    flat.forEach(p => {
      const dIdx = p.day - 1;
      grouped[dIdx][p.timeSlot].push(p);
    });

    return grouped;
  }

  private whenGoogleReady(): Promise<void> {
    return new Promise(res => {
      if ((window as any).google?.maps) res();
      else (window as any).initMap = () => res();
    });
  }

  /* ======================= Map ======================= */
  private initMap() {
    const first = this.todayPlaces[0];
    const center = (first?.latitude && first?.longitude)
      ? new google.maps.LatLng(first.latitude, first.longitude)
      : new google.maps.LatLng(41.9, 12.49); // Roma fallback

    this.map = new google.maps.Map(this.mapRef.nativeElement, {
      center,
      zoom: 13,
      disableDefaultUI: true
    });

    this.renderMarkers();
  }

 private renderMarkers() {
  this.markers.forEach(m => m.setMap(null));
  this.markers = [];

  console.log('🧭 Render markers - todayPlaces:', this.todayPlaces);

  this.todayPlaces.forEach((p, idx) => {
    const lat = p.latitude;
    const lng = p.longitude;
    if (lat == null || lng == null) {
      console.warn(`⚠️ Nessuna posizione per ${p.name}`, p);
      return;
    }

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: p.name
    });

    marker.addListener('click', () => this.zone.run(() => this.openPlace(idx)));
    this.markers.push(marker);
  });

  console.log('📍 Marker creati:', this.markers.length);
}

  /* ==================== UI / Itinerary ==================== */
private refreshPlaces() {
  const dayObj: any = this.trip?.itinerary?.[this.currentDay - 1];
  console.log('🔍 Giorno attuale:', this.currentDay);
  console.log('📦 dayObj:', dayObj);

  if (!dayObj) {
    this.todayPlaces = [];
    return;
  }

  // Priorità a "ordered" se esiste
  if ('ordered' in dayObj && Array.isArray(dayObj.ordered)) {
    this.todayPlaces = dayObj.ordered;
    console.log('📍 todayPlaces (from ordered):', this.todayPlaces);
  } else {
    this.todayPlaces = [
      ...dayObj.morning,
      ...dayObj.afternoon,
      ...dayObj.evening
    ];
    console.log('📍 todayPlaces (from timeSlots):', this.todayPlaces);
  }

  this.cdr.detectChanges(); // Forza update
}



  toggleDayList() { this.dayListOpen = !this.dayListOpen; }

  selectDay(d: number) {
    this.currentDay = d;
    this.dayListOpen = false;
    this.refreshPlaces();
    this.renderMarkers();
  }

  openPlace(i: number) {
    this.selectedIndex = i;
    this.detail = this.todayPlaces[i];
    this.detailOpen = true;

    const target = this.todayPlaces[i];
    if (target?.latitude && target?.longitude) {
      this.map.panTo({ lat: target.latitude, lng: target.longitude });
    }
  }

  /* --------------------- Drawer gesture --------------------- */
  private setupDrawerGesture() {
    const drawer = document.querySelector('.drawer') as HTMLElement;
    const maxHeight = window.innerHeight * 0.7;
    const minHeight = 220;

    let currentHeight = this.drawerExpanded ? maxHeight : minHeight;

    const gesture = this.gestureCtrl.create({
      el: drawer,
      gestureName: 'swipe-drawer',
      threshold: 0,
      onStart: () => { this.dragging = true; },
      onMove: ev => {
        const newHeight = currentHeight - ev.deltaY;
        drawer.style.transition = 'none';
        drawer.style.height = Math.min(maxHeight, Math.max(minHeight, newHeight)) + 'px';
      },
      onEnd: ev => {
        drawer.style.transition = '';
        if (ev.deltaY < -50) {
          drawer.style.height = maxHeight + 'px';
          this.drawerExpanded = true;
        } else if (ev.deltaY > 50) {
          drawer.style.height = minHeight + 'px';
          this.drawerExpanded = false;
        } else {
          drawer.style.height = this.drawerExpanded ? maxHeight + 'px' : minHeight + 'px';
        }
        currentHeight = parseInt(drawer.style.height, 10);
        this.dragging = false;
        this.zone.run(() => {}); // forza change detection
      }
    });

    gesture.enable(true);
  }

  get isDrawerCompact() { return !this.drawerExpanded && !this.dragging; }

  scrollToTimeSlot(slot: 'morning' | 'afternoon' | 'evening') {
    const index = this.todayPlaces.findIndex(p => p.timeSlot === slot);
    if (index !== -1) { this.scrollToPlace(index); }
  }

  private scrollToPlace(i: number) {
    const target = this.todayPlaces[i];
    this.drawerExpanded = true;
    this.selectedIndex = i;

    if (target?.latitude && target?.longitude) {
      this.map.panTo({ lat: target.latitude, lng: target.longitude });
    }

    if (this.cardsEl) {
      const cont = this.cardsEl.nativeElement;
      const card = cont.children[i] as HTMLElement;
      if (this.isDrawerCompact) {
        cont.scrollTo({ left: card.offsetLeft - (cont.clientWidth - card.clientWidth) / 2, behavior: 'smooth' });
      } else {
        cont.scrollTo({ top: card.offsetTop - 16, behavior: 'smooth' });
      }
    }
  }
}
