// itinerario.page.ts
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';

import { TripWithId } from '../models/trip.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { GenerationOverlayComponent } from '../components/generation-overlay/generation-overlay.component';
import { ItineraryService } from '../services/itinerary.service';
import { AuthService } from '../services/auth.service';

/* ───── Ionic standalone components usati nel template ───── */
import {
  IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption,
  IonTextarea,
  IonButton,
  IonFab, IonFabButton,
  IonIcon
} from '@ionic/angular/standalone';

/* Helper per attendere Google Maps/Places */
function whenGoogleMapsReady(): Promise<void> {
  return new Promise(resolve => {
    if ((window as any).google && (window as any).google.maps) {
      resolve();
    } else {
      (window as any).initMap = () => resolve();
    }
  });
}

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [
    /* Angular */
    CommonModule,
    FormsModule,
    HttpClientModule,

    /* Ionic */
    IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption,
    IonTextarea,
    IonButton,
    IonFab, IonFabButton,
    IonIcon,

    /* Componenti custom */
    GenerationOverlayComponent
  ],
  templateUrl: './itinerario.page.html',
  styleUrls: ['./itinerario.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ItinerarioPage implements AfterViewInit {
  /* Riferimenti al DOM Ionic */
  @ViewChild(IonContent, { static: true }) content!: IonContent;
  @ViewChild('hero', { static: true }) heroEl!: ElementRef;

  /* Stato UI dinamico */
  heroHeight = 240;
  titleFontSize = 1.8;
  subtitleFontSize = 1.1;
  overlayOpacity = 1;

  /* Dati del viaggio */
  trip: TripWithId | null = null;
  itineraryId!: string;
  daysCount = 0;
  heroPhotoUrl = '';
  isLocalTrip = false;

  /* Flag UI */
  customizationVisible = false;
  selectedDayIndex: number | null = null;
  isTripCustomization = false;
  isLoading = false;


  //alte cose
  currentDay: number | null = null;

  /* Opzioni predefinite */
  dayStyles = [
    'Standard',
    'Giornata al mare',
    'Giornata nei musei',
    'Relax',
    'Shopping',
    'Avventura',
    'Food tour',
    'Escursione'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private api: ApiService,
    private itineraryService: ItineraryService,
    private auth: AuthService
  ) { }

  /* ───── Lifecycle ───── */
  async ngAfterViewInit() {
    await whenGoogleMapsReady();
  }

  ionViewWillEnter() {
    this.itineraryId = this.route.snapshot.queryParamMap.get('id')!;

    // 1. Prova a caricare dal localStorage (bozza)
    const localTrips = JSON.parse(localStorage.getItem('trips') || '[]');

    const localTrip = localTrips.find((t: any) => {
      return (
        t?.itineraryId === this.itineraryId ||
        (t?.id != null && t.id.toString?.() === this.itineraryId)
      );
    });

    if (localTrip) {
      // Normalizza come TripWithId
      this.trip = {
        itineraryId: localTrip.itineraryId ?? localTrip.id?.toString() ?? 'undefined',
        city: localTrip.city,
        startDate: localTrip.startDate ?? localTrip.start,
        endDate: localTrip.endDate ?? localTrip.end,
        accommodation: localTrip.accommodation,
        style: 'generico',
        itinerary: localTrip.itinerary || []
      };

      this.isLocalTrip = true;
      this.daysCount = this.calculateDays(this.trip.startDate, this.trip.endDate);
      this.loadHeroPhoto();
      return;
    }

    // 2. Altrimenti carica dal backend
    this.itineraryService.getItineraryById(this.itineraryId).subscribe({
      next: (res) => {
        this.trip = res;
        this.isLocalTrip = false;
        this.daysCount = this.calculateDays(res.startDate, res.endDate);
        this.loadHeroPhoto();
      },
      error: (err) => {
        console.error('Errore caricamento itinerario:', err);
        this.router.navigate(['/tabs/viaggi']);
      }
    });
  }




  /* ───── Scroll hero dinamico ───── */
  onScroll(ev: CustomEvent) {
    const scrollTop = ev.detail.scrollTop;
    const minHeight = 80, maxHeight = 240;
    const minFont = 1.2, maxFont = 1.8;

    this.heroHeight = Math.max(minHeight, maxHeight - scrollTop);
    this.titleFontSize = Math.max(minFont, maxFont - scrollTop / 100);
    this.subtitleFontSize = Math.max(0.9, 1.1 - scrollTop / 150);
    this.overlayOpacity = Math.max(0, 1 - scrollTop / 150);
  }

  /* ───── Caricamento foto hero via Places API ───── */
  private loadHeroPhoto() {
    if (!this.trip?.city) return;

    const query = `${this.trip.city} attrazione turistica`;
    const dummyDiv = document.createElement('div');
    const map = new (window as any).google.maps.Map(dummyDiv);
    const service = new (window as any).google.maps.places.PlacesService(map);

    service.findPlaceFromQuery(
      { query, fields: ['photos'] },
      (results: any[], status: any) => {
        if (status === 'OK' && results[0]?.photos?.length) {
          const url = results[0].photos[0].getUrl({ maxWidth: 800 });
          this.ngZone.run(() => {
            this.heroPhotoUrl = url;
            localStorage.setItem(`coverPhoto-${this.itineraryId}`, url);
          });
        } else {
          this.heroPhotoUrl = 'assets/images/PaletoBay.jpeg';
        }
      }
    );
  }

  /* ───── Navigazione giorno / mappa ───── */
  openDay(index: number) {
    if (!this.trip?.itinerary?.length && this.isLocalTrip) {
      alert('Devi prima generare l’itinerario per poter accedere ai dettagli!');
      return;
    }
    this.router.navigate(['/tabs/map'], {
      queryParams: { itineraryId: this.itineraryId, day: index + 1 }
    });
  }

  /* ───── Bottom-sheet personalizzazione ───── */
  toggleCustomizationSheet() { this.customizationVisible = !this.customizationVisible; }

  openDayCustomization(index: number) {
    if (!this.trip) return;  // 👈 blocca subito se è null

    if (!this.trip.itinerary) this.trip.itinerary = [];
    if (!this.trip.itinerary[index]) {
      this.trip.itinerary[index] = { style: '', atmosphere: '', mustSee: '' };
    }

    this.selectedDayIndex = index;
    this.isTripCustomization = false;
    this.customizationVisible = true;
  }

  openTripCustomization() {
    this.selectedDayIndex = null;
    this.isTripCustomization = true;
    this.customizationVisible = true;
  }

  saveDayStyle() {
    if (this.selectedDayIndex === null) return;
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    trips[this.itineraryId] = this.trip;
    localStorage.setItem('trips', JSON.stringify(trips));
  }


  /*this.itineraryService.createItinerary(userId, {
      city: this.city,
      accommodation: this.accommodation,
      startDate: this.startDate,
      endDate: this.endDate,
      photo: this.heroPhotoUrl ?? '',
      style: 'generico'  // puoi anche omettere se vuoi usare il default nel service
    }).subscribe({
      next: () => {
        this.router.navigate(['/tabs/viaggi'], { replaceUrl: true });
      },
      error: () => {
        alert('Errore nel salvataggio dell’itinerario');
      }
    });*/
  /* ───── Genera itinerario via backend dummy ───── */
  generateItinerary() {
    if (!this.isLocalTrip) return; // Non generare se non è una bozza

    const trip = this.trip;
    if (!trip) {
      this.isLoading = false;
      return;
    }

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    this.isLoading = true;

    this.api.getItinerary(trip.city, days, trip.accommodation).subscribe({
      next: (res) => {
        trip.itinerary = res.itinerary;

        const allPlaces = [].concat(...res.itinerary.map((dayObj: any) => dayObj.ordered || []));
        const userId = this.auth.getUserId();
        if (!userId) {
          console.error('User ID mancante');
          this.isLoading = false;
          return;
        }

        // ✅ Se è una bozza → salvala nel backend prima
        if (this.isLocalTrip) {
          console.log('🟡 Dati inviati al backend:', {
            city: trip.city,
            accommodation: trip.accommodation,
            startDate: trip.startDate,
            endDate: trip.endDate,
            photo: res.coverPhoto ?? '',
            style: trip.style
          });

          this.itineraryService.createItinerary(userId, {
            city: trip.city,
            accommodation: trip.accommodation,
            startDate: trip.startDate,
            endDate: trip.endDate,
            //photo: res.coverPhoto ?? '',
            style: trip.style
          }).subscribe({
            next: (createdTrip: any) => {
              const oldId = trip.itineraryId;
              trip.itineraryId = createdTrip.itineraryId;
              this.itineraryId = createdTrip.itineraryId;
              this.isLocalTrip = false;

              const localTrips = JSON.parse(localStorage.getItem('trips') || '[]');
              const updated = localTrips.filter((t: any) => t.itineraryId !== oldId);
              localStorage.setItem('trips', JSON.stringify(updated));

              // 🔁 Ritarda la chiamata per dare tempo al backend di scrivere il file
              setTimeout(() => {
                this.itineraryService.addPlacesToItinerary(userId, createdTrip.itineraryId, allPlaces).subscribe({
                  next: () => {
                    console.log('Tappe salvate nel backend');

                    const keysToRemove = [
                      'dailyItinerary',
                      'tripAccommodation',
                      `coverPhoto-${oldId}`,
                      `trip-${oldId}` 
                    ];
                    keysToRemove.forEach(k => localStorage.removeItem(k));  
                    this.isLocalTrip = false;
                    this.isLoading = false;
                  },
                  error: (err) => {
                    console.error('Errore salvataggio tappe:', err);
                    this.isLoading = false;
                  }
                });
              }, 200);
            },
            error: (err) => {
              console.error('Errore salvataggio itinerario:', err);
              this.isLoading = false;
            }
          });

        } else {
          // 🟢 Già esiste → salva direttamente le tappe
          this.savePlaces(userId, this.itineraryId, allPlaces);
        }
      },
      error: (err) => {
        console.error('Errore nella generazione:', err);
        this.isLoading = false;
      }
    });
  }



  // ➕ Funzione separata per salvare le tappe
  private savePlaces(userId: string, itineraryId: string, places: any[]) {
    this.itineraryService.addPlacesToItinerary(userId, itineraryId, places).subscribe({
      next: () => {
        console.log('Tappe salvate nel backend');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Errore salvataggio tappe:', err);
        this.isLoading = false;
      }
    });
  }





  /* ───── Dati da mostrare nella card giorno ───── */
  getDayItems(index: number): string[] {
    const day = this.trip?.itinerary?.[index];
    if (!day) return [];

    /* split dei "mustSee" su virgola */
    const splitMustSee = day.mustSee
      ? day.mustSee.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    return [
      day.style,
      day.atmosphere,
      ...splitMustSee
    ].filter(Boolean);    // scarta undefined / ''
  }

  //calcolo giorni
  private calculateDayCount(start: string, end: string): number {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  }

  get selectedDay() {
    return this.selectedDayIndex !== null ? this.trip?.itinerary?.[this.selectedDayIndex] : null;
  }

}
