import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
  IonSearchbar,
  IonButton,
} from '@ionic/angular/standalone';

import { AppHeaderComponent } from '../components/header/app-header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonSearchbar,
    IonIcon,
    IonButton,
    AppHeaderComponent,
  ],
})
export class HomePage {

  /** Città nel carosello “trend” */
  trending = ['Roma', 'Parigi', 'Tokyo', 'New York', 'Barcellona'];

  /** Prossimo viaggio pianificato dall'utente (mock) */
  nextTrip = {
    itineraryId: 'madrid_culture',
    city: 'Madrid',
    startDate: new Date('2025-08-14'),
    endDate: new Date('2025-08-18'),
    coverPhoto: 'assets/images/Madrid.jpeg',
  };

  /** Itinerari consigliati (mock) */
  featuredItineraries = [
    {
      itineraryId: 'rome_culture',
      city: 'Roma',
      days: 3,
      style: 'culturale',
      coverPhoto: 'assets/images/Roma.jpeg',
    },
    {
      itineraryId: 'paris_art',
      city: 'Parigi',
      days: 4,
      style: 'artistico',
      coverPhoto: 'assets/images/Parigi.jpeg',
    },
    {
      itineraryId: 'tokyo_modern',
      city: 'Tokyo',
      days: 5,
      style: 'urban',
      coverPhoto: 'assets/images/Tokyo.jpeg',
    },
  ];

  constructor(private router: Router) {}

  /** Apre la pagina Crea (con city opzionale) */
  openCreate(city?: string) {
    this.router.navigate(['/crea'], { queryParams: city ? { city } : {} });
  }

  /** Lista completa delle destinazioni trend */
  openAll() {
    this.router.navigate(['/destinazioni-trend']);
  }

  /** Apre la pagina itinerario specifico */
  openItinerary(itineraryId: string) {
    this.router.navigate(['/itinerario', itineraryId]);
  }

  /** Searchbar placeholder (ancora non visibile) */
  onSearch(ev: any) {
    const query = (ev.target as HTMLInputElement).value?.toLowerCase() ?? '';
    console.log('search', query);
  }
}