import { Component, AfterViewInit,ViewChild, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';

import { AppHeaderComponent } from '../components/header/app-header.component';
import { TripCardComponent } from '../components/trip-card/trip-card.component';
import { UnfinishedCardComponent } from '../components/unfinished-card/unfinished-card.component';

import { TripWithId } from 'src/app/models/trip.model';
import { ItineraryService } from '../services/itinerary.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-viaggi',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonFab,
    IonFabButton,
    IonButton,
    IonHeader,
  IonToolbar,
  IonTitle,
    IonIcon,
    AppHeaderComponent,
    TripCardComponent,
    UnfinishedCardComponent,
  ],
  templateUrl: './viaggi.page.html',
  styleUrls: ['./viaggi.page.scss'],
})


export class ViaggiPage implements AfterViewInit {
  constructor(
    private router: Router,
    private api: ItineraryService,
    private auth: AuthService
  ) { }

  isGuest = false;
  imminente: TripWithId | null = null;
  futuri: TripWithId[] = [];
  loaded  = false;
  drafts: TripWithId[] = [];
  private apiCalls = 0;

  ionViewDidEnter(): void {
    this.isGuest = !!this.auth.getUserId()?.startsWith('guest_');
    this.isGuest ? this.loadDraftsOnly() : this.loadTrips();
  }

  private resetLists(): void {
    this.inCorso = this.imminente = null;
    this.futuri = [];
    this.apiCalls = 0;
  }

  private done(): void {
    if (++this.apiCalls >= 3) { this.loaded = true; this.apiCalls = 0; }
  }

  private loadDraftsOnly(): void {
    this.resetLists();
    this.loaded = true;
    this.loadDrafts();
  }

    private loadDrafts(): void {
    this.drafts = JSON.parse(localStorage.getItem('trips') || '[]');
  }

  deleteDraft(id: string): void {
    this.drafts = this.drafts.filter(t => t.itineraryId !== id);
    localStorage.setItem('trips', JSON.stringify(this.drafts));
  }

  private loadTrips(): void {
    const uid = this.auth.getUserId(); if (!uid) return;
    this.loaded = false; this.resetLists();

    this.api.getUserItineraries(uid, 'current')
      .subscribe({ next: r => this.inCorso   = r[0] || null, complete: () => this.done() });

    this.api.getUserItineraries(uid, 'upcoming')
      .subscribe({ next: r => this.imminente = r[0] || null, complete: () => this.done() });

    this.api.getUserItineraries(uid, 'future')
      .subscribe({ next: r => this.futuri    = r       || [],  complete: () => this.done() });

    this.loadDrafts();
  }






  ngAfterViewInit(): void {
    // codice se necessario
  }


  goToCreate(): void {
    this.router.navigate(['/crea']);
  }

  ngOnInit() {}



  //HERO tutto il funzionamento
  
  heroMaxHeight = 400;
  heroMinHeight= 100;
  heroHeight= this.heroMaxHeight;
  heroHeightPx: string = '${this.heroMaxHeight}px'; // Altezza iniziale della hero
  overlayOpacity: number = 1;
  inCorso: TripWithId | null = null;
  //scrollThreshold: number = 200; // Soglia per la dimensione minima della hero
  isFixed: boolean = false; // Flag per controllare quando la hero è "fissa"
  isScrolledPastThreshold: boolean = false; // Flag per sapere se la hero è oltre la soglia

  // Gestiamo l'evento di scroll dentro ion-content
  onScroll(event: any) {
     // Otteniamo la posizione di scroll dentro ion-content
      const scrollPosition = event.detail.scrollTop;
    // Se siamo oltre la soglia, blocca la hero alla dimensione minima e fissala in alto
    /*if (scrollPosition >= this.scrollThreshold) {
      if (!this.isScrolledPastThreshold) {
        this.isScrolledPastThreshold = true; // Segna che abbiamo superato la soglia
      }
      this.heroHeightPx = '150px'; // Altezza fissa minima della hero
      this.overlayOpacity = 0.5; // Opacità ridotta
    } else {
      if (this.isScrolledPastThreshold) {
        this.isScrolledPastThreshold = false; // Reset quando risali sopra la soglia
      }
      this.heroHeightPx = `${400 - scrollPosition}px`; // Altezza dinamica
      this.overlayOpacity = 1 - scrollPosition / this.scrollThreshold; // Opacità dinamica
    }*/

    /*this.heroHeight = this.heroMaxHeight - scrollPosition;
    if(this.heroHeight<=this.heroMinHeight){
      this.heroHeight=this.heroMinHeight

      if (!this.isScrolledPastThreshold) {
        this.isScrolledPastThreshold = true; // Segna che abbiamo superato la soglia
      }
    }else if(scrollPosition < this.heroMaxHeight - this.heroMinHeight-130 ){
       this.isScrolledPastThreshold = false;
    }



    this.heroHeightPx = `${this.heroHeight}px`; // Altezza dinamica*/
    
    console.log(scrollPosition);

    var typeScole = scrollPosition >= (this.heroHeight - this.heroMinHeight);

    if(this.isScrolledPastThreshold){
      typeScole = scrollPosition >= this.heroMinHeight;
    }

    if(typeScole){
      this.isScrolledPastThreshold = true;
      this.heroHeight=this.heroMinHeight;
    }else{
      this.isScrolledPastThreshold = false;
      this.heroHeight = this.heroMaxHeight - scrollPosition;
    }
    this.heroHeightPx = `${this.heroHeight}px`;
  }

  // Funzione di esempio per aprire l'itinerario
  openItinerary(itineraryId: string) {
    console.log('Navigating to itinerary: ', itineraryId);
  }

  // Funzione di esempio per eliminare il viaggio
  deleteTrip(itineraryId: string) {
    console.log('Deleting trip: ', itineraryId);
  }

  // Funzione di click sull'area hero
  onHeroClick() {
    console.log('Hero clicked!');
  }

}