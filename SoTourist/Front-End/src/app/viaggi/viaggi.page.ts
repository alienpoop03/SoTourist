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
  IonFabButton
} from '@ionic/angular/standalone';
import { AppHeaderComponent } from "../components/header/app-header.component";



@Component({
  selector: 'app-viaggi',
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
    IonToolbar, // ✅ necessario per <ion-toolbar>
    IonTitle, // ✅ necessario per <ion-title>
    IonButtons, // ✅ necessario per <ion-buttons>
    AppHeaderComponent,
    IonFab,
    IonFabButton,
],
  templateUrl: './viaggi.page.html',
  styleUrls: ['./viaggi.page.scss']
})
export class ViaggiPage {
  trips: any[] = [];
  suggestedCities = ['Roma', 'Parigi', 'Tokyo', 'New York', 'Londra', 'Barcellona'];

  constructor(private router: Router) {}

  ionViewWillEnter() {
    const saved = localStorage.getItem('trips');
    this.trips = saved ? JSON.parse(saved) : [];
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
