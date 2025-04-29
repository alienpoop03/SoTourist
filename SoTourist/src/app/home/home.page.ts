import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonIcon, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons,
    IonIcon, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent,
    IonButton
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  trips: any[] = [];

  constructor(private router: Router) {}

  ionViewWillEnter() {
    const saved = localStorage.getItem('trips');
    this.trips = saved ? JSON.parse(saved) : [];
  }

  /** Al click sulla card: naviga a /tabs/itinerario?id=i */
  openItinerary(index: number) {
    this.router.navigate(
      ['/tabs/itinerario'],
      { queryParams: { id: index } }
    );
  }

  deleteTrip(index: number) {
    this.trips.splice(index, 1);
    localStorage.setItem('trips', JSON.stringify(this.trips));
  }
}
