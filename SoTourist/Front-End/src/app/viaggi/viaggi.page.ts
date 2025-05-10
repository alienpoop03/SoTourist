import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../components/header/app-header.component';
import { TripCardComponent, TripWithId } from '../components/trip-card/trip-card.component';

@Component({
  selector: 'app-viaggi',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    AppHeaderComponent,
    TripCardComponent,
  ],
  templateUrl: './viaggi.page.html',
  styleUrls: ['./viaggi.page.scss']
})
export class ViaggiPage {
  allTrips: TripWithId[] = [];

  constructor(private router: Router) {}

  ionViewWillEnter() {
    const data = JSON.parse(localStorage.getItem('trips') || '[]') as TripWithId[];
    const today = new Date();

    // calcola correntTrip/futures e popola allTrips
    const ongoing = data.find(t =>
      new Date(t.start) <= today && new Date(t.end) >= today
    );

    const future = data
      .filter(t => !ongoing || t.id !== ongoing.id)
      .filter(t => new Date(t.start) > today)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    this.allTrips = [];
    if (ongoing) {
      this.allTrips.push({ ...ongoing, status: 'in_corso' });
    }
    this.allTrips.push(...future);
  }

  /** riceve SOLO l’id e naviga */
  openItinerary(id: number) {
    this.router.navigate(['/tabs/itinerario'], { queryParams: { id } });
  }

  /** riceve SOLO l’id, filtra via id e ricarica */
  deleteTrip(id: number) {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]') as TripWithId[];
    const updated = trips.filter(t => t.id !== id);
    localStorage.setItem('trips', JSON.stringify(updated));
    // ricarica la lista
    this.ionViewWillEnter();
  }

  goToCreate() {
    this.router.navigate(['/crea']);
  }
}
