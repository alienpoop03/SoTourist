import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  OnInit,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../services/api.service';
import { GenerationOverlayComponent } from '../components/generation-overlay/generation-overlay.component';


// ✅ Componenti Ionic usati nel template
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';

// Helper per attendere il caricamento di Google Maps/Places
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
    CommonModule,
    HttpClientModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    GenerationOverlayComponent
  ],
  templateUrl: './itinerario.page.html',
  styleUrls: ['./itinerario.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ItinerarioPage implements AfterViewInit {
  @ViewChild(IonContent, { static: true }) content!: IonContent;
  @ViewChild('hero', { static: true }) heroEl!: ElementRef;

  heroHeight = 240; // altezza iniziale in pixel
  titleFontSize = 1.8; // in rem
  subtitleFontSize = 1.1; // in rem
  overlayOpacity = 1;

  trip: any = null;
  daysCount = 0;
  tripId!: number;
  heroPhotoUrl = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private api: ApiService
  ) { }

  async ngAfterViewInit() {


    // se già l’hai, mantieni anche:
    await whenGoogleMapsReady();
  }
  onScroll(ev: CustomEvent) {
    const scrollTop = ev.detail.scrollTop;

    const minHeight = 80;
    const maxHeight = 240;
    const minFont = 1.2;
    const maxFont = 1.8;

    this.heroHeight = Math.max(minHeight, maxHeight - scrollTop);
    this.titleFontSize = Math.max(minFont, maxFont - scrollTop / 100);
    this.subtitleFontSize = Math.max(0.9, 1.1 - scrollTop / 150);
    this.overlayOpacity = Math.max(0, 1 - scrollTop / 150);
  }

  ionViewWillEnter() {
    const idParam = this.route.snapshot.queryParamMap.get('id')!;
    this.tripId = +idParam;

    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    this.trip = trips.find((t: any) => t.id === this.tripId);
    this.daysCount = this.trip?.days || 0;

    this.loadHeroPhoto();

    // ✅ Se l’itinerario è già presente, NON fare richiesta al backend
    if (this.trip?.itinerary) {
      localStorage.setItem('dailyItinerary', JSON.stringify(this.trip.itinerary));
      localStorage.setItem('tripAccommodation', this.trip.accommodation || '');
    }
  }


  private loadHeroPhoto() {
    if (!this.trip?.city) return;

    const query = `${this.trip.city} attrazione turistica`; // 🔁 fallback intelligente

    const dummyDiv = document.createElement('div');
    const map = new (window as any).google.maps.Map(dummyDiv);
    const service = new (window as any).google.maps.places.PlacesService(map);

    service.findPlaceFromQuery(
      {
        query,
        fields: ['photos']
      },
      (results: any[], status: any) => {
        if (status === 'OK' && results[0]?.photos?.length) {
          const url = results[0].photos[0].getUrl({ maxWidth: 800 });
          this.ngZone.run(() => {
            this.heroPhotoUrl = url;
            localStorage.setItem(`coverPhoto-${this.tripId}`, url);
          });
        } else {
          this.heroPhotoUrl = 'assets/images/PaletoBay.jpeg'
        }
      }
    );
  }


  openDay(index: number) {
    if (!this.trip?.itinerary || this.trip.itinerary.length === 0) {
      console.warn('⛔ Itinerario non disponibile. Generalo prima di procedere.');
      // eventualmente mostra feedback visivo
      alert('Devi prima generare l’itinerario per poter accedere ai dettagli!');
      return;
    }

    // Se è tutto pronto, naviga
    this.router.navigate(['/tabs/map'], {
      queryParams: { tripId: this.tripId, day: index + 1 }
    });
  }


  customizationVisible = false;
  selectedDayIndex: number | null = null;
  isTripCustomization = false;

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



  toggleCustomizationSheet() {
    this.customizationVisible = !this.customizationVisible;
  }

  openDayCustomization(index: number) {
    if (!this.trip.itinerary) {
      this.trip.itinerary = [];
    }

    // Crea l’oggetto per il giorno se non esiste
    if (!this.trip.itinerary[index]) {
      this.trip.itinerary[index] = {
        style: '',
        atmosphere: '',
        mustSee: ''
      };
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




  isLoading = false;

  // ... dentro a ItinerarioPage

  generateItinerary() {
    if (!this.trip?.city || !this.trip?.days) return;

    this.isLoading = true;

    this.api.getItinerary(this.trip.city, this.trip.days, this.trip.accommodation)
      .subscribe({
        next: (res) => {
          // <<<— qui logghiamo tutta la risposta
          console.log('🛰️ Itinerary API full response:', res);
          console.log('🗺️ Solo l’array di tappe:', res.itinerary);

          this.trip.itinerary = res.itinerary;

          const trips = JSON.parse(localStorage.getItem('trips') || '[]');
          trips[this.tripId] = this.trip;
          localStorage.setItem('trips', JSON.stringify(trips));

          localStorage.setItem('dailyItinerary', JSON.stringify(res.itinerary));
          localStorage.setItem('tripAccommodation', this.trip.accommodation || '');

          if (res.coverPhoto) {
            localStorage.setItem('coverPhoto', res.coverPhoto);
          }

          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Errore nella generazione:', err);
          this.isLoading = false;
        }
      });
  }


}
