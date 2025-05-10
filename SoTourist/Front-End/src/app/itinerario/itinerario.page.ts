// itinerario.page.ts
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../services/api.service';
import { GenerationOverlayComponent } from '../components/generation-overlay/generation-overlay.component';

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
  trip: any = null;
  daysCount = 0;
  tripId!: number;
  heroPhotoUrl = '';

  /* Flag UI */
  customizationVisible = false;
  selectedDayIndex: number | null = null;
  isTripCustomization = false;
  isLoading = false;

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
    private api: ApiService
  ) { }

  /* ───── Lifecycle ───── */
  async ngAfterViewInit() {
    await whenGoogleMapsReady();
  }

  ionViewWillEnter() {
    this.tripId = +this.route.snapshot.queryParamMap.get('id')!;
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    this.trip = trips.find((t: any) => t.id === this.tripId);
    this.daysCount = this.trip?.days || 0;

    this.loadHeroPhoto();

    /* Se l’itinerario è già presente, salvo in LS per la mappa */
    if (this.trip?.itinerary) {
      localStorage.setItem('dailyItinerary', JSON.stringify(this.trip.itinerary));
      localStorage.setItem('tripAccommodation', this.trip.accommodation || '');
    }
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
            localStorage.setItem(`coverPhoto-${this.tripId}`, url);
          });
        } else {
          this.heroPhotoUrl = 'assets/images/PaletoBay.jpeg';
        }
      }
    );
  }

  /* ───── Navigazione giorno / mappa ───── */
  openDay(index: number) {
    if (!this.trip?.itinerary?.length) {
      alert('Devi prima generare l’itinerario per poter accedere ai dettagli!');
      return;
    }
    this.router.navigate(['/tabs/map'], {
      queryParams: { tripId: this.tripId, day: index + 1 }
    });
  }

  /* ───── Bottom-sheet personalizzazione ───── */
  toggleCustomizationSheet() { this.customizationVisible = !this.customizationVisible; }

  openDayCustomization(index: number) {
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
    trips[this.tripId] = this.trip;
    localStorage.setItem('trips', JSON.stringify(trips));
  }

  /* ───── Genera itinerario via backend dummy ───── */
  generateItinerary() {
    if (!this.trip?.city || !this.trip?.days) return;
    this.isLoading = true;

    this.api.getItinerary(this.trip.city, this.trip.days, this.trip.accommodation)
      .subscribe({
        next: res => {
          this.trip.itinerary = res.itinerary;
          const trips = JSON.parse(localStorage.getItem('trips') || '[]');
          trips[this.tripId] = this.trip;
          localStorage.setItem('trips', JSON.stringify(trips));

          localStorage.setItem('dailyItinerary', JSON.stringify(res.itinerary));
          localStorage.setItem('tripAccommodation', this.trip.accommodation || '');
          if (res.coverPhoto) localStorage.setItem('coverPhoto', res.coverPhoto);

          this.isLoading = false;
        },
        error: err => {
          console.error('Errore nella generazione:', err);
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
}
