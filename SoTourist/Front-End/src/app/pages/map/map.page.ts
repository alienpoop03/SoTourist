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
  IonCardContent, IonList, IonItem,
  IonModal, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { GestureController } from '@ionic/angular';

import { ItineraryService } from '../../services/itinerary.service';
import { Place } from '../../models/trip.model';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { LuogoCardComponent } from '../../components/luogo-card/luogo-card.component';
import { API_BASE_URL } from '../../services/ip.config';

// Rappresenta la struttura delle tappe raggruppate per giorno
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
    IonContent, 
    IonImg, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle,
    IonCardContent, 
    IonList, 
    IonItem, 
    IonModal, 
    IonButton, 
    NavigationBarComponent, 
    IonIcon,
    LuogoCardComponent
  ]
})
export class MapPage implements AfterViewInit {

  @ViewChild('map', { static: false, read: ElementRef }) mapRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cardsContainer', { read: ElementRef }) cardsEl!: ElementRef<HTMLElement>;

  map!: google.maps.Map;
  markers: google.maps.Marker[] = [];

  drawerExpanded = false;
  dragging = false;

  trip: any = null;
  days: number[] = [];
  currentDay = 1;
  todayPlaces: Place[] = [];
  selectedIndex: number | null = null;

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

  ionViewWillEnter() {
    const itineraryId = this.route.snapshot.queryParamMap.get('itineraryId');
    this.currentDay = +this.route.snapshot.queryParamMap.get('day')! || 1;

    if (!itineraryId) return;

    this.itineraryService.getItineraryById(itineraryId).subscribe({
      next: res => {
        // Parsing giorni
        const grouped = this.isGrouped(res.itinerary)
          ? res.itinerary as DayGroup[]
          : this.groupFlatPlaces(res.itinerary as Place[]);

        this.trip = { ...res, itinerary: grouped };
        this.days = grouped.map((_, i) => i + 1);

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

  // Riconosce se l'array è già raggruppato per giorno
  private isGrouped(arr: any[]): arr is DayGroup[] {
    return Array.isArray(arr) && arr.length > 0 &&
      'morning' in arr[0] && 'afternoon' in arr[0] && 'evening' in arr[0];
  }

  // Converte un array piatto di Place in un array di giorni
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

  private initMap() {
    const first = this.todayPlaces[0];
    const center = (first?.latitude && first?.longitude)
      ? new google.maps.LatLng(first.latitude, first.longitude)
      : new google.maps.LatLng(41.9, 12.49); // Roma fallback

    const darkMode = JSON.parse(localStorage.getItem('darkMode') || 'false');

    const commonStyle: google.maps.MapTypeStyle[] = [
      { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit.station', elementType: 'all', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.business', elementType: 'all', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.school', elementType: 'all', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.medical', elementType: 'all', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.park', elementType: 'all', stylers: [{ visibility: 'off' }] }
    ];

    const lightStyle: google.maps.MapTypeStyle[] = [...commonStyle];
    const darkStyle: google.maps.MapTypeStyle[] = [
      { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
      { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
      ...commonStyle
    ];

    this.map = new google.maps.Map(this.mapRef.nativeElement, {
      center,
      zoom: 13,
      disableDefaultUI: true,
      styles: darkMode ? darkStyle : lightStyle
    });

    this.renderMarkers();
  }

  openInGoogleMaps() {
    const place = this.detail;
    if (!place?.latitude || !place?.longitude) return;

    const lat = place.latitude;
    const lng = place.longitude;
    const query = encodeURIComponent(`${place.name} @${lat},${lng}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

    window.open(url, '_blank');
  }

  private async renderMarkers() {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    for (let idx = 0; idx < this.todayPlaces.length; idx++) {
      const p = this.todayPlaces[idx];
      const lat = p.latitude;
      const lng = p.longitude;
      if (lat == null || lng == null) {
        console.warn('Posizione mancante per', p.name, p);
        continue;
      }

      const isDefault = !(p.photoFilename || p.photoUrl);

      const imageUrl = p.photoFilename
        ? `${API_BASE_URL}/uploads/${p.photoFilename}`
        : (p.photoUrl || 'assets/images/pin2.png');

      let iconUrl: string;
      if (isDefault) {
        iconUrl = 'assets/images/pin2.png';
      } else {
        iconUrl = await this.generateCircularIcon(imageUrl);
      }

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

    console.log('Marker creati:', this.markers.length);
  }

  private refreshPlaces() {
    const dayObj: any = this.trip?.itinerary?.[this.currentDay - 1];
    if (!dayObj) {
      this.todayPlaces = [];
      return;
    }

    // Usa "ordered" se presente
    if ('ordered' in dayObj && Array.isArray(dayObj.ordered)) {
      this.todayPlaces = dayObj.ordered;
    } else {
      this.todayPlaces = [
        ...dayObj.morning,
        ...dayObj.afternoon,
        ...dayObj.evening
      ];
    }

    // Calcolo distanza tra i luoghi
    for (let i = 0; i < this.todayPlaces.length - 1; i++) {
      const currentPlace = this.todayPlaces[i];
      const nextPlace = this.todayPlaces[i + 1];
      const distance = this.calculateDistance(currentPlace.latitude, currentPlace.longitude, nextPlace.latitude, nextPlace.longitude);
      currentPlace.distanceToNext = distance.toFixed(2) + ' km';
    }

    console.log('Distanze tra i luoghi:', this.todayPlaces.map(place => place.distanceToNext));
    this.cdr.detectChanges();
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
        this.zone.run(() => { });
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

  // Calcola la distanza tra due luoghi usando la formula Haversine
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
    const distance = R * c;
    return distance;
  }

  // Converte i gradi in radianti
  public degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async generateCircularIcon(url: string): Promise<string> {
    console.log('Icona: provo a caricare immagine da', url);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = '';

      img.onload = () => {
        console.log('Icona: caricata con successo', url);

        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Icona: nessun contesto canvas');
          return resolve('assets/images/PaletoBay.jpeg');
        }

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#7B1E1E';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 4, 0, 2 * Math.PI);
        ctx.clip();

        ctx.drawImage(img, 0, 0, size, size);

        const result = canvas.toDataURL('image/png');
        resolve(result);
      };

      img.onerror = (err) => {
        console.warn('Icona: errore nel caricamento', url, err);
        resolve('assets/images/PaletoBay.jpeg');
      };

      img.src = url;
    });
  }
}