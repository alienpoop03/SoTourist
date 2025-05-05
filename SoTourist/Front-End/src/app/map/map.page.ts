/// <reference types="@types/google.maps" />

import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonImg,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';

interface PlaceItem {
  name: string;
  address: string;
  photo?: string;
  rating?: number;
  price_level?: number;
  latitude?: number;
  longitude?: number;
  distanceToNext?: string;
  description?: string;
  reviews?: {
    author: string;
    rating: number;
    text: string;
  }[];
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonImg,
    IonModal,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel
  ],
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss']
})
export class MapPage implements AfterViewInit {
  @ViewChild('mapEl', { static: false }) mapElementRef!: ElementRef;
  mapInstance!: google.maps.Map;

  currentDay = 1;
  showDayDropdown = false;
  sidebarOpen = false;
  showDetail = false;

  days: number[] = [];
  activeFilters = new Set<string>();

  sidebarItems: PlaceItem[] = [];
  puntoAlloggio: { address: string } | null = null;
  modalPlace: PlaceItem | null = null;

  dailyItinerary: { day: number; ordered: PlaceItem[] }[] = [];
  tripId!: number;
  trip: any = null;

  sidebarDistances: string[] = [];

  constructor(private route: ActivatedRoute) {}

  ionViewWillEnter() {
    const idParam = this.route.snapshot.queryParamMap.get('tripId');
    const dayParam = this.route.snapshot.queryParamMap.get('day');
  
    if (!idParam) return;
  
    this.tripId = +idParam;
    this.currentDay = dayParam ? +dayParam : 1;
  
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    this.trip = trips[this.tripId];
  
    if (this.trip?.itinerary) {
      this.dailyItinerary = this.trip.itinerary;
      this.days = this.dailyItinerary.map((_, i) => i + 1);
      this.updateSidebarItems();
  
      // ✅ Ora che dailyItinerary è pronto, inizializza la mappa
      setTimeout(() => this.initMap(), 0);
    }
  
    if (this.trip?.accommodation) {
      this.puntoAlloggio = { address: this.trip.accommodation };
    }
  }
  
  initMap() {
    const today = this.dailyItinerary[this.currentDay - 1];
    const first = today?.ordered?.[0];
  
    const center = first?.latitude && first?.longitude
      ? new google.maps.LatLng(first.latitude, first.longitude)
      : new google.maps.LatLng(41.9028, 12.4964); // fallback Roma
  
    this.mapInstance = new google.maps.Map(this.mapElementRef.nativeElement, {
      center,
      zoom: 13,
      disableDefaultUI: true,
    });
  
    this.renderMarkers();
  }
  

  async ngAfterViewInit() {
    await this.whenGoogleMapsReady();

    const today = this.dailyItinerary[this.currentDay - 1];
    const first = today?.ordered?.[0];

    const center = first?.latitude && first?.longitude
      ? new google.maps.LatLng(first.latitude, first.longitude)
      : new google.maps.LatLng(41.9028, 12.4964); // Roma fallback

    this.mapInstance = new google.maps.Map(this.mapElementRef.nativeElement, {
      center,
      zoom: 13,
      disableDefaultUI: true
    });

    this.renderMarkers();
  }

  whenGoogleMapsReady(): Promise<void> {
    return new Promise(resolve => {
      if ((window as any).google && (window as any).google.maps) {
        resolve();
      } else {
        (window as any).initMap = () => resolve();
      }
    });
  }

  renderMarkers() {
    const today = this.dailyItinerary[this.currentDay - 1];
    if (!today) return;

    today.ordered.forEach(place => {
      if (place.latitude && place.longitude) {
        new google.maps.Marker({
          position: { lat: place.latitude, lng: place.longitude },
          map: this.mapInstance,
          title: place.name
        });
      }
    });
  }

  toggleDayDropdown() {
    this.showDayDropdown = !this.showDayDropdown;
  }

  selectDay(day: number) {
    this.currentDay = day;
    this.showDayDropdown = false;
    this.updateSidebarItems();
    this.renderMarkers();
  }

  toggleMarkers(timeOfDay: string) {
    if (this.activeFilters.has(timeOfDay)) {
      this.activeFilters.delete(timeOfDay);
    } else {
      this.activeFilters.add(timeOfDay);
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  openDetailModal(item: PlaceItem) {
    this.modalPlace = item;
    this.showDetail = true;
  }

  closeDetail() {
    this.showDetail = false;
    this.modalPlace = null;
  }

  refreshSidebarItem(index: number) {
    alert(`Funzione di refresh da implementare per luogo ${index + 1}`);
  }

  updateSidebarItems() {
    const today = this.dailyItinerary[this.currentDay - 1];
    if (!today || !today.ordered) return;

    this.sidebarItems = today.ordered;
    this.sidebarDistances = today.ordered
      .slice(0, -1)
      .map(p => p.distanceToNext || '');
  }

  priceLevelMap: Record<number, string> = {
    0: 'Gratuito',
    1: 'Economico',
    2: 'Moderato',
    3: 'Costoso',
    4: 'Molto costoso'
  };

  onBack() {
    history.back();
  }
}
