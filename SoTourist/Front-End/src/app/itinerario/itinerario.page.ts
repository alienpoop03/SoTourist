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
    IonCardContent
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
  ) {}

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
    this.trip = trips[this.tripId];
    this.daysCount = this.trip?.days || 0;
  
    this.loadHeroPhoto();
  
    // ✅ Se l’itinerario è già presente, NON fare richiesta al backend
    if (this.trip?.itinerary) {
      localStorage.setItem('dailyItinerary', JSON.stringify(this.trip.itinerary));
      localStorage.setItem('tripAccommodation', this.trip.accommodation || '');
    } else if (this.trip?.city && this.trip?.days) {
      this.api.getItinerary(this.trip.city, this.trip.days, this.trip.accommodation)
        .subscribe({
          next: (res) => {
            console.log('📦 Itinerario generato dal backend:', res);
            this.trip.itinerary = res.itinerary;
  
            // ✅ Salva l’itinerario nel viaggio
            trips[this.tripId] = this.trip;
            localStorage.setItem('trips', JSON.stringify(trips));
  
            // ✅ Salva anche nel localStorage per la pagina map
            localStorage.setItem('dailyItinerary', JSON.stringify(res.itinerary));
            localStorage.setItem('tripAccommodation', this.trip.accommodation || '');
  
            if (res.coverPhoto) {
              localStorage.setItem('coverPhoto', res.coverPhoto);
            }
          },
          error: (err) => {
            console.error('❌ Errore dal backend:', err);
          }
        });
    }
  }
  

  private loadHeroPhoto() {
    if (!this.trip?.city) return;

    const dummyDiv = document.createElement('div');
    const map = new (window as any).google.maps.Map(dummyDiv);
    const service = new (window as any).google.maps.places.PlacesService(map);

    service.findPlaceFromQuery({
      query: this.trip.city,
      fields: ['photos']
    }, (results: any[], status: any) => {
      if (status === 'OK' && results[0]?.photos?.length) {
        const url = results[0].photos[0].getUrl({ maxWidth: 800 });
        this.ngZone.run(() => {
          this.heroPhotoUrl = url;
        });
      }
    });
  }

  openDay(index: number) {
    // Se non è ancora pronto l'itinerario, aspetta e riprova
    if (!this.trip?.itinerary || this.trip.itinerary.length === 0) {
      console.warn('⏳ Itinerario non ancora pronto, attendo 500ms...');
  
      setTimeout(() => {
        this.openDay(index);  // richiama se stesso
      }, 500);
      return;
    }
  
    // Altrimenti naviga
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
  

editDayStyle(event: Event, index: number) {
  event.stopPropagation(); // previene il trigger del click sulla card

  const styles = [
    'Standard',
    'Giornata al mare',
    'Giornata nei musei',
    'Relax',
    'Shopping',
    'Avventura',
    'Food tour',
    'Escursione'
  ];

  const scelta = prompt(`Scegli lo stile per il Giorno ${index + 1}:\n` + styles.map((s, i) => `${i + 1}. ${s}`).join('\n'));

  const sceltaIndex = parseInt(scelta || '', 10) - 1;
  if (!isNaN(sceltaIndex) && styles[sceltaIndex]) {
    this.trip.itinerary[index].style = styles[sceltaIndex];
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    trips[this.tripId] = this.trip;
    localStorage.setItem('trips', JSON.stringify(trips));
  }
}


}
