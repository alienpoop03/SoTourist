import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonFab, IonFabButton, IonIcon, IonButton } from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../components/header/app-header.component';
import { TripCardComponent } from '../components/trip-card/trip-card.component';
import { TripWithId } from 'src/app/models/trip.model';
import { ItineraryService } from '../services/itinerary.service';
import { AuthService } from '../services/auth.service';
import { UnfinishedCardComponent } from '../components/unfinished-card/unfinished-card.component';

@Component({
  selector: 'app-viaggi',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonFab,
    IonFabButton,
    IonButton,
    IonIcon,
    AppHeaderComponent,
    TripCardComponent,
    UnfinishedCardComponent
  ],
  templateUrl: './viaggi.page.html',
  styleUrls: ['./viaggi.page.scss']
})
export class ViaggiPage {
  allTrips: TripWithId[] = [];
  inCorso: any = null;
  imminente: any = null;
  futuri: any[] = [];
  loaded = false;
  private callsCompleted = 0;
  drafts: TripWithId[] = [];
  isGuest = false;


  constructor(private router: Router, private itineraryService: ItineraryService, private auth: AuthService) { }

  /*ionViewWillEnter() {
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
  }*/

  ionViewDidEnter() {
    const userId = this.auth.getUserId();
    this.isGuest = userId?.startsWith('guest_') || false;
    //console.log('✅ ID ricevuto:', userId);

    if (userId?.startsWith('guest_')) {
      this.loadOfflineTrips(); // solo bozze
    } else {
      this.loadTrips(); // backend + bozze
    }
  }

  loadTrips() {
    //console.log('🔄 Ricarico i viaggi...');
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.loaded = false;
    this.inCorso = null;
    this.imminente = null;
    this.futuri = [];

    // Carica viaggi reali da backend
    this.itineraryService.getUserItineraries(userId, 'current').subscribe({
      next: (res) => this.inCorso = res[0] || null,
      error: () => this.inCorso = null,
      complete: () => this.checkAllLoaded()
    });

    this.itineraryService.getUserItineraries(userId, 'upcoming').subscribe({
      next: (res) => this.imminente = res[0] || null,
      error: () => this.imminente = null,
      complete: () => this.checkAllLoaded()
    });

    this.itineraryService.getUserItineraries(userId, 'future').subscribe({
      next: (res) => this.futuri = res || [],
      error: () => this.futuri = [],
      complete: () => this.checkAllLoaded()
    });

    //Carica le bozze dal localStorage
    const raw = localStorage.getItem('trips');
    this.drafts = raw ? JSON.parse(raw) : [];
  }

  //load per i guest
  loadOfflineTrips() {
    //console.log(' Modalità ospite: caricamento solo bozze');
    this.inCorso = null;
    this.imminente = null;
    this.futuri = [];
    this.loaded = true;

    const raw = localStorage.getItem('trips');
    this.drafts = raw ? JSON.parse(raw) : [];
}



  /** riceve SOLO l’id e naviga */
  openItinerary(id: string) {
    this.router.navigate(['/tabs/itinerario'], { queryParams: { id } });
  }

  /** riceve SOLO l’id, filtra via id e ricarica */
  deleteTrip(id: string) {
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.itineraryService.deleteItinerary(userId, id).subscribe({
      next: () => this.loadTrips(), // Ricarica la lista
      error: () => alert('Errore durante la cancellazione')
    });
  }

  private checkAllLoaded() {
    this.callsCompleted++;
    if (this.callsCompleted >= 3) {
      this.loaded = true;
      this.callsCompleted = 0;
    }
  }
  deleteDraft(id: string) {
    this.drafts = this.drafts.filter(t => t.itineraryId !== id);
    localStorage.setItem('trips', JSON.stringify(this.drafts));
  }

  goToCreate() {
    this.router.navigate(['/crea']);
  }
}
