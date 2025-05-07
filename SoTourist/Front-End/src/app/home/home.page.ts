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
    AppHeaderComponent
  ],
  
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  trips: any[] = [];
  lastTrip: any = null;

   // destinazioni da mostrare
   suggestedCities = [
    { name: 'Roma',        photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg' },
    { name: 'Parigi',      photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg' },
    { name: 'Tokyo',       photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg' },
    { name: 'New York',    photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg' },
    { name: 'Barcellona',  photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg' },
  ];

  trending = [
    { city: 'Londra', photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg',     count: 124 },
    { city: 'Amsterdam', photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg', count: 97 },
    { city: 'Berlino', photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg',   count: 81 },
    { city: 'Madrid',  photo: '../assets/images/photo-1496442226666-8d4d0e62e6e9.jpeg',    count: 76 },
  ];

  constructor(private router: Router) {}

  ionViewWillEnter() {
    const saved = localStorage.getItem('trips');
    this.trips = saved ? JSON.parse(saved) : [];
    this.lastTrip = this.trips.length ? this.trips[0] : null; // più recente in cima
  }

  openItinerary(index: number) {
    this.router.navigate(['/tabs/itinerario'], { queryParams: { id: index } });
  }

  deleteTrip(index: number) {
    this.trips.splice(index, 1);
    localStorage.setItem('trips', JSON.stringify(this.trips));
  }

  openCreate(city: string) {
    this.router.navigate(['/tabs/crea'], { queryParams: { city } });
  }

  openLastTrip() {
    this.openItinerary(0);
  }

  

  goToCreate() {
    this.router.navigate(['/tabs/crea']);
  }
}
