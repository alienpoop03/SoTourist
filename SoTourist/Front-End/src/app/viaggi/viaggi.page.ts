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
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../components/header/app-header.component';

interface Trip {
  id: number;
  city: string;
  start: string;  // ISO date
  end: string;    // ISO date
  accommodation: string;
  days: number;
  itinerary?: any[];
}

interface TripWithId extends Trip {
  id: number;
  status?: 'in_corso' | 'imminente';
}

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
    AppHeaderComponent,
    IonFab,
    IonFabButton,
  ],
  templateUrl: './viaggi.page.html',
  styleUrls: ['./viaggi.page.scss']
})
export class ViaggiPage {
  allTrips: TripWithId[] = [];
  currentTrip: TripWithId | null = null;
  futureTrips: TripWithId[] = [];

  constructor(private router: Router) {}

  ionViewWillEnter() {
    const data = JSON.parse(localStorage.getItem('trips') || '[]');
    const today = new Date();

    const allTrips = [...data];
    this.currentTrip = null;

    // Viaggio in corso (oggi tra start e end)
    const ongoing = allTrips.find(trip =>
      new Date(trip.start) <= today && new Date(trip.end) >= today
    );

    if (ongoing) {
      this.currentTrip = { ...ongoing, status: 'in_corso' };
      this.futureTrips = allTrips.filter(t =>
        t !== ongoing && new Date(t.start) > today
      );
    } else {
      // Nessun viaggio in corso → cerca il più vicino nel futuro
      const futureSorted = allTrips
        .filter(t => new Date(t.start) > today)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      if (futureSorted.length > 0) {
        this.currentTrip = { ...futureSorted[0], status: 'imminente' };
        this.futureTrips = futureSorted.slice(1);
      } else {
        this.futureTrips = [];
      }
    }
  }

  openItinerary(id: number) {
    // passo l’indice corretto
    this.router.navigate(['/tabs/itinerario'], { queryParams: { id } });
  }

  deleteTrip(trip: TripWithId) {
    const stored: Trip[] = JSON.parse(localStorage.getItem('trips') || '[]');
const updated = stored.filter(t => t.id !== trip.id);
    localStorage.setItem('trips', JSON.stringify(updated));
    this.ionViewWillEnter();
  }

  goToCreate() {
    this.router.navigate(['/tabs/crea']);
  }
}
