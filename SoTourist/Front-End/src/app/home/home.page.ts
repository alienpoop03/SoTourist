import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonFab,
  IonFabButton,
  IonList,
  IonListHeader,
  IonItem,
  IonToggle,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';

import { AppHeaderComponent } from "../components/header/app-header.component";
import { TripCardComponent, TripWithId } from '../components/trip-card/trip-card.component';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonFab,
    IonFabButton,
    IonList,
    IonListHeader,
    IonItem,
    IonToggle,
    IonSelect,
    IonSelectOption,
    AppHeaderComponent,
    TripCardComponent,
  ],

  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  trips: any[] = [];
  lastTrip: any = null;
  allTrips: TripWithId[] = [];


  // destinazioni da mostrare
  suggestedCities = [
    { name: 'Roma', photo: '../assets/images/Roma.jpeg' },
    { name: 'Parigi', photo: '../assets/images/Parigi.jpeg' },
    { name: 'Tokyo', photo: '../assets/images/Tokyo.jpeg' },
    { name: 'New York', photo: '../assets/images/new-york.jpeg' },
    { name: 'Barcellona', photo: '../assets/images/barcellona.jpeg' },
    { name: 'Paleto Bay', photo: '../assets/images/PaletoBay.jpeg' },

  ];

  trending = [
    { city: 'Londra', photo: '../assets/images/londra.jpeg', count: 124 },
    { city: 'Amsterdam', photo: '../assets/images/amsterdam.jpeg', count: 97 },
    { city: 'Berlino', photo: '../assets/images/berlino.jpeg', count: 81 },
    { city: 'Madrid', photo: '../assets/images/madrid.jpeg', count: 76 },
  ];

  constructor(private router: Router) { }

  ionViewWillEnter() {
    const saved = localStorage.getItem('trips');
    const allTrips = saved ? JSON.parse(saved) : [];

    const today = new Date();

    // Viaggi conclusi (end < oggi)
    this.trips = allTrips.filter((t: any) => new Date(t.end) < today);

    // Ultimo viaggio (primo salvato = più recente)
    this.lastTrip = allTrips.length ? allTrips[0] : null;

    if (this.lastTrip) {
      const id = this.lastTrip.id || 0;
      const cover = localStorage.getItem(`coverPhoto-${id}`);
      this.lastTrip.photo = cover || '../assets/images/PaletoBay.jpeg';
    }
  }

  openItinerary(index: number) {
    this.router.navigate(['/tabs/itinerario'], { queryParams: { id: index } });
  }


  deleteTrip(id: string) {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]') as TripWithId[];
    const updated =trips.filter(t => t.itineraryId !== id); // ✅ CORRETTO
    localStorage.setItem('trips', JSON.stringify(updated));
    // ricarica la lista
    this.ionViewWillEnter();
  }


  openCreate(city: string) {
    this.router.navigate(['/tabs/crea'], { queryParams: { city } });
  }

  openLastTrip() {
    this.openItinerary(0);
  }



  goToCreate() {
    this.router.navigate(['/crea']);
  }
}
