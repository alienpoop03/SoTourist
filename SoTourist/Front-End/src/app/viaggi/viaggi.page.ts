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
    const stored: Trip[] = JSON.parse(localStorage.getItem('trips') || '[]');
    // 1) ricostruisco l'array con l'id
    this.allTrips = stored.map((t, i) => ({ ...t, id: i }));

    const today = new Date().toISOString().split('T')[0];

    // 2) cerco un viaggio in corso
    const ongoingIdx = this.allTrips.findIndex(t => today >= t.start && today <= t.end);
    if (ongoingIdx >= 0) {
      this.currentTrip = { ...this.allTrips[ongoingIdx], status: 'in_corso' };
      this.futureTrips = this.allTrips.filter((_, i) => i !== ongoingIdx && this.allTrips[i].start > today);
    } else {
      // 3) viaggio imminente
      const upcoming = this.allTrips
        .filter(t => t.start > today)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      if (upcoming.length) {
        this.currentTrip = { ...upcoming[0], status: 'imminente' };
        this.futureTrips = upcoming.slice(1);
      } else {
        this.currentTrip = null;
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
    const updated = stored.filter((_, i) => i !== trip.id);
    localStorage.setItem('trips', JSON.stringify(updated));
    this.ionViewWillEnter();
  }

  goToCreate() {
    this.router.navigate(['/tabs/crea']);
  }
}
