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
  IonModal, IonButton, IonIcon,
} from '@ionic/angular/standalone';
import { GestureController } from '@ionic/angular';

import { ItineraryService } from '../../services/itinerary.service';
import { Place } from '../../models/trip.model';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
/**
 * Rappresenta la struttura delle tappe raggruppate per giorno
 */
import { LuogoCardComponent } from '../../components/luogo-card/luogo-card.component';
import { API_BASE_URL } from '../../services/ip.config';

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
    IonModal, IonButton, NavigationBarComponent, IonIcon,
        LuogoCardComponent // <--- AGGIUNGI QUI

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
        console.log('Distanze tra i luoghi:', this.todayPlaces.map(place => place.distanceToNext));
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
    disableDefaultUI: true,
    styles: [
  // Rimuove etichette di amministrazioni
  {
    featureType: 'administrative',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  // Mantiene POI turistici visibili
  {
    featureType: 'poi.attraction',
    elementType: 'all',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'poi.place_of_worship',
    elementType: 'all',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'poi.museum',
    elementType: 'all',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'poi.school',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  // Nasconde etichette strade minori
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  // Mantiene visibili le strade principali
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }]
  },
  // Disattiva etichette di transito
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  // Aspetto più desaturato e pulito
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [
      { saturation: -20 },
      { lightness: 10 }
    ]
  }
]


  });

this.renderMarkers().then(); // va benissimo
}


private async renderMarkers() {
  this.markers.forEach(m => m.setMap(null));
  this.markers = [];

  for (let idx = 0; idx < this.todayPlaces.length; idx++) {
    const p = this.todayPlaces[idx];
    const lat = p.latitude;
    const lng = p.longitude;
    if (lat == null || lng == null) {
      console.warn(`⚠️ Nessuna posizione per ${p.name}`, p);
      continue;
    }

const imageUrl = p.photoFilename
  ? `${API_BASE_URL}/uploads/${p.photoFilename}`
  : (p.photoUrl || 'assets/images/PaletoBay.jpeg');
    console.log('[MARKER] place:', p.name);
console.log('[MARKER] photoFilename:', p.photoFilename);
console.log('[MARKER] imageUrl:', imageUrl);

  const iconUrl = await this.generateCircularIcon(imageUrl);

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: p.name,
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(48, 48),
        anchor: new google.maps.Point(24, 24),
      }
    });

    marker.addListener('click', () => this.zone.run(() => this.openPlace(idx)));
    this.markers.push(marker);
  }

  console.log('📍 Marker creati:', this.markers.length);
}



  /* ==================== UI / Itinerary ==================== */
  private refreshPlaces() {
    const dayObj: any = this.trip?.itinerary?.[this.currentDay - 1];
    if (!dayObj) {
      this.todayPlaces = [];
      return;
    }

    // Priorità a "ordered" se esiste
    if ('ordered' in dayObj && Array.isArray(dayObj.ordered)) {
      this.todayPlaces = dayObj.ordered;
    } else {
      this.todayPlaces = [
        ...dayObj.morning,
        ...dayObj.afternoon,
        ...dayObj.evening
      ];
    }

    // Calcolare la distanza tra i luoghi
    for (let i = 0; i < this.todayPlaces.length - 1; i++) {
      const currentPlace = this.todayPlaces[i];
      const nextPlace = this.todayPlaces[i + 1];

      // Calcola la distanza tra il luogo corrente e il successivo
      const distance = this.calculateDistance(currentPlace.latitude, currentPlace.longitude, nextPlace.latitude, nextPlace.longitude);

      // Aggiungi la distanza come proprietà al luogo corrente
      currentPlace.distanceToNext = distance.toFixed(2) + ' km'; // Converti in stringa
    }

    // Visualizza per debug
    console.log('Distanze tra i luoghi:', this.todayPlaces.map(place => place.distanceToNext));

    this.cdr.detectChanges(); // Forza l'aggiornamento dell'interfaccia
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

  getCurrentDayDate(): string {
  if (!this.trip || !this.trip.startDate) return '';
  const start = new Date(this.trip.startDate);
  start.setDate(start.getDate() + this.currentDay - 1);
  return start.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
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
        this.zone.run(() => { }); // forza change detection
      }
    });

    gesture.enable(true);
  }

  get isDrawerCompact() { return !this.drawerExpanded && !this.dragging; }

  scrollToTimeSlot(slot: 'morning' | 'afternoon' | 'evening') {
    const index = this.todayPlaces.findIndex(p => p.timeSlot === slot);
    if (index !== -1) { this.scrollToPlace(index); }
  }

  selectedTimeSlot: 'morning' | 'afternoon' | 'evening' = 'morning';
  timeListOpen = false;

  get timeSlotLabel(): string {
    switch (this.selectedTimeSlot) {
      case 'morning': return 'Mattina';
      case 'afternoon': return 'Pomeriggio';
      case 'evening': return 'Sera';
      default: return '';
    }
  }

  toggleTimeList() { this.timeListOpen = !this.timeListOpen; }

  selectTimeSlot(slot: 'morning' | 'afternoon' | 'evening') {
    this.selectedTimeSlot = slot;
    this.timeListOpen = false;
    this.scrollToTimeSlot(slot);
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

  // Funzione per calcolare la distanza tra due luoghi usando la formula Haversine
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raggio della Terra in km
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const lat1Rad = this.degToRad(lat1);
    const lat2Rad = this.degToRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distanza in km
    return distance;
  }

  // Funzione di supporto per convertire i gradi in radianti
  public degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

private async generateCircularIcon(url: string): Promise<string> {
  console.log('[ICON] Provo a caricare immagine da:', url);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = ''; // oppure prova anche rimuovendo completamente questa riga

    img.onload = () => {
      console.log('[ICON] Caricata con successo:', url);

      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn('[ICON] Nessun contesto canvas');
        return resolve('assets/images/PaletoBay.jpeg');
      }

      // Cerchio esterno
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#7B1E1E';
      ctx.fill();

      // Clip rotonda
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, 2 * Math.PI);
      ctx.clip();

      ctx.drawImage(img, 0, 0, size, size);

      const result = canvas.toDataURL('image/png');
      resolve(result);
    };

    img.onerror = (err) => {
      console.warn('[ICON] Errore nel caricamento:', url, err);
      resolve('assets/images/PaletoBay.jpeg');
    };

    img.src = url;
  });
}


}
