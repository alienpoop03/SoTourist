import { Component, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

// Funzione per attendere il caricamento di Google Maps
function whenGoogleMapsReady(): Promise<void> {
  return new Promise(resolve => {
    if (window.google && window.google.maps) {
      resolve();
    } else {
      window.initMap = () => resolve();
    }
  });
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ],
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss']
})
export class MapPage implements AfterViewInit {
  selectedDay = 1;
  days = [1, 2, 3, 4, 5];

  places = Array.from({ length: 5 }).map((_, i) => ({
    name: `Luogo ${i + 1}`,
    description: `Descrizione del luogo ${i + 1}`,
    image: `https://source.unsplash.com/400x200/?place,${i}`
  }));

  constructor(private ngZone: NgZone) {}

  async ngAfterViewInit() {
    await whenGoogleMapsReady();

    const mapEl = document.getElementById('map');
    if (mapEl && window.google) {
      new window.google.maps.Map(mapEl, {
        center: { lat: 41.9028, lng: 12.4964 },
        zoom: 12
      });
    }
  }
}
