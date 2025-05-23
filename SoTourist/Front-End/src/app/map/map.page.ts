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
import { GestureController } from '@ionic/angular';

interface Place {
  name: string;
  address: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  distanceToNext?: string;
  rating?: number;
  timeSlot?: 'morning' | 'afternoon' | 'evening'; // 👈 aggiunto questo

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


  dragging: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private itineraryService: ItineraryService,    // ← qui
    private gestureCtrl: GestureController


  ) { }

  /* ---------- 1. Lifecycle (fetch & map) ----- */
  ionViewWillEnter() {
    const id = this.route.snapshot.queryParamMap.get('itineraryId');
    const day = +this.route.snapshot.queryParamMap.get('day')! || 1;


    if (!id) return;

    console.log('[MapPage] 📡 calling getItineraryById(', id, ')');

    this.itineraryService.getItineraryById(id).subscribe({
      next: res => {
        console.log('[🧪 DEBUG] Risposta completa del backend:', JSON.stringify(res, null, 2));

        console.log('[MapPage] ← backend response:', res);
        console.log('[MapPage] 📦 res.itinerary:', res.itinerary); // <--- aggiungi questo
        console.log('[🧪 typeof itinerary]', typeof res.itinerary);
        console.log('[🧪 itinerary keys]', Object.keys(res.itinerary));


        if (!res.itinerary) {
          console.warn('[MapPage] ⚠️ backend ha restituito senza itinerary');
          return;
        }

        const itineraryArray = Array.isArray(res.itinerary)
          ? res.itinerary
          : Object.values(res.itinerary);

        // ✅ Prendi tutto l’oggetto così com’è
        this.trip = { ...res, itinerary: itineraryArray };

        console.log('[DEBUG][FULL TRIP]', this.trip);

this.days = itineraryArray.map((_: any, i: number) => i + 1);
        console.log('[DEBUG] Giorni generati da res.itinerary:', this.days);

        res.itinerary.forEach((day: any, idx: number) => {
          if (!day) {
            console.warn(`[⚠️ ITINERARY] Giorno ${idx + 1} è undefined/null`);
            return;
          }
          console.log(`🧭 [Giorno ${idx + 1}]`, {
            morning: Array.isArray(day.morning) ? day.morning.length : 'non array',
            afternoon: Array.isArray(day.afternoon) ? day.afternoon.length : 'non array',
            evening: Array.isArray(day.evening) ? day.evening.length : 'non array',
          });
        });

        this.currentDay = day;
        this.refreshPlaces();
        console.log('[🧪 DEBUG] after refreshPlaces →', this.todayPlaces);


        this.whenGoogleReady().then(() => this.initMap());
      },
      error: err => {
        console.error('[MapPage] errore caricamento itinerary:', err);
      }
    });
  }






  ngAfterViewInit() {
    this.whenGoogleReady().then(() => {
      this.initMap();
      this.setupDrawerGesture();
    });
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
      // prendi prima lat/lng, poi fallback su latitude/longitude (se un giorno verranno popolate)
      const lat = (p as any).lat ?? (p as any).latitude ?? null;
      const lng = (p as any).lng ?? (p as any).longitude ?? null;

      console.log(`  • marker[${idx}] →`, p.name,
        `| lat=${lat}`, `| lng=${lng}`);

      if (lat == null || lng == null) {
        console.warn(`    - skip ${p.name} perché mancano coordinate (${lat}, ${lng})`);
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

    console.log('  • markers finali:', this.markers.length);
    if (this.todayPlaces.length === 0) {
      console.warn('[⚠️ renderMarkers] Nessuna tappa trovata per questo giorno!');
    }

  }



  /* ---------- 3.  Itinerary / UI ------------- */
  toggleDayList() { this.dayListOpen = !this.dayListOpen; }

  selectDay(d: number) {

    this.currentDay = d;
    this.dayListOpen = false;
    console.log(`👉 Selezionato Giorno ${d}`);
    console.log('→ dayListOpen:', this.dayListOpen);

    this.refreshPlaces();
    this.renderMarkers();
  }

  private refreshPlaces() {
    const dayObj = this.trip?.itinerary?.[this.currentDay - 1];
    console.log(`[🧪 refreshPlaces] currentDay=${this.currentDay}`, '| dayObj:', dayObj);

    if (!dayObj) {
      console.warn(`⚠️ Nessun giorno trovato per ${this.currentDay}`);
      this.todayPlaces = [];
      return;
    }

    const morning = Array.isArray(dayObj.morning) ? dayObj.morning : [];
    const afternoon = Array.isArray(dayObj.afternoon) ? dayObj.afternoon : [];
    const evening = Array.isArray(dayObj.evening) ? dayObj.evening : [];

    console.log(`[🕓 TAPPE per giorno ${this.currentDay}]`);
    console.log('  • morning:', morning);
    console.log('  • afternoon:', afternoon);
    console.log('  • evening:', evening);

    this.todayPlaces = [...morning, ...afternoon, ...evening].map(p => ({
      ...p,
      photoUrl: p.photo || p.photoUrl || '',
    }));

    console.log(`[📍 todayPlaces] (${this.todayPlaces.length} tappe):`, this.todayPlaces);
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



  setupDrawerGesture() {
    const drawer = document.querySelector('.drawer') as HTMLElement;
    const maxHeight = window.innerHeight * 0.7;
    const minHeight = 220;

    let currentHeight = this.drawerExpanded ? maxHeight : minHeight;

    const gesture = this.gestureCtrl.create({
      el: drawer,
      gestureName: 'swipe-drawer',
      threshold: 0,
      onStart: () => {
        this.dragging = true;
      },
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
        currentHeight = parseInt(drawer.style.height);
        this.dragging = false;

        // Forza Angular a ricalcolare isDrawerCompact
        this.zone.run(() => { });
      }
    });

    gesture.enable(true);
  }


  get isDrawerCompact(): boolean {
    return !this.drawerExpanded && !this.dragging;
  }
  scrollToTimeSlot(slot: 'morning' | 'afternoon' | 'evening') {
    const index = this.todayPlaces.findIndex(p => p.timeSlot === slot);
    if (index !== -1) {
      this.scrollToPlace(index);
    } else {
      console.warn(`❌ Nessuna tappa trovata per il timeSlot: ${slot}`);
    }
  }

  scrollToPlace(i: number) {
    const target = this.todayPlaces[i];
    this.drawerExpanded = true;
    this.selectedIndex = i;

    // Pan sulla mappa
    if (target?.latitude && target?.longitude) {
      this.map.panTo({ lat: target.latitude, lng: target.longitude });
    }

    // Scroll alla card anche se la drawer è espansa
    if (this.cardsEl) {
      const cont = this.cardsEl.nativeElement;
      const card = cont.children[i] as HTMLElement;

      // Differenzia: orizzontale se compatta, verticale se espansa
      if (this.isDrawerCompact) {
        cont.scrollTo({
          left: card.offsetLeft - (cont.clientWidth - card.clientWidth) / 2,
          behavior: 'smooth'
        });
      } else {
        cont.scrollTo({
          top: card.offsetTop - 16, // padding-top approssimativo
          behavior: 'smooth'
        });
      }
    }
  }


}
