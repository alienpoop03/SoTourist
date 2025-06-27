import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonText } from '@ionic/angular/standalone';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { TripWithId } from '../../models/trip.model';
import { Router } from '@angular/router';
import { TripCardComponent } from '../../components/trip-card/trip-card.component';

@Component({
  selector: 'app-storico-viaggi',
  templateUrl: './storico-viaggi.page.html',
  styleUrls: ['./storico-viaggi.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonText,
    CommonModule,
    FormsModule,
    NavigationBarComponent,
    TripCardComponent
  ]
})
export class StoricoViaggiPage implements OnInit {

  // Viaggi passati da mostrare
  pastTrips: TripWithId[] = [];

  constructor(
    private itineraryService: ItineraryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPastTrips();
  }

  // Carica i viaggi passati
  async loadPastTrips() {
    const userId = this.authService.getUserId();
    this.itineraryService.getUserItineraries(userId!, 'past').subscribe(res => {
      this.pastTrips = res;
    });
  }

  // Vai al dettaglio del viaggio selezionato
  goToTrip(itineraryId: string) {
    this.router.navigate(['/itinerario', itineraryId]);
  }

  // Elimina un viaggio dallo storico
  async deleteTrip(itineraryId: string) {
    const userId = this.authService.getUserId();
    if (!userId) return;
    await this.itineraryService.deleteItinerary(userId, itineraryId);
    this.pastTrips = this.pastTrips.filter(t => t.itineraryId !== itineraryId);
  }

}