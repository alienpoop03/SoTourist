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
  currentTrip: any = null;
  futureTrips: any[] = [];
  suggestedCities = ['Roma', 'Parigi', 'Tokyo', 'New York', 'Londra', 'Barcellona'];

  constructor(private router: Router) {}

  ionViewWillEnter() {
    const data = JSON.parse(localStorage.getItem('trips') || '[]');
    const today = new Date().toISOString().split('T')[0];
  
    const todayDate = new Date(today);
    const allTrips = [...data];
  
    // Trova il viaggio in corso
    const ongoing = allTrips.find(trip => today >= trip.start && today <= trip.end);
    this.currentTrip = null; // Inizializza currentTrip a null
    if (ongoing) {
      this.currentTrip = { ...ongoing, status: 'in_corso' };
      this.futureTrips = allTrips.filter(t => t !== ongoing && t.start > today);
    } else {
      // Se non c'è viaggio in corso, mostra il più vicino nel futuro
      const futureSorted = allTrips
        .filter(t => t.start > today)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  
      if (futureSorted.length > 0) {
        this.currentTrip = { ...futureSorted[0], status: 'imminente' };
        this.futureTrips = futureSorted.slice(1); // escludi il primo
      }
    }
  }

  openItinerary(index: number) {
    this.router.navigate(['/tabs/itinerario'], { queryParams: { id: index } });
  }

  deleteTrip(tripToDelete: any) {
   const stored = JSON.parse(localStorage.getItem('trips') || '[]');
  const updated = stored.filter((t: any) => t.id !== tripToDelete.id);
  localStorage.setItem('trips', JSON.stringify(updated));
  this.ionViewWillEnter(); // ricarica i dati aggiornati
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
