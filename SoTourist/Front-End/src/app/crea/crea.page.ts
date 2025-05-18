import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { trigger, transition, style, animate } from '@angular/animations';
import { ItineraryService } from '../services/itinerary.service';
import { AuthService } from '../services/auth.service';
import { TripWithId } from 'src/app/models/trip.model';
import { RangeCalendarLiteComponent } from '../components/range-calendar-lite/range-calendar-lite.component';
import { GenerationOverlayComponent } from '../components/generation-overlay/generation-overlay.component';

declare var google: any;

@Component({
  selector: 'app-crea',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonCard,
    IonCardContent,
    RangeCalendarLiteComponent,  // 👈 AGGIUNGI QUI
    GenerationOverlayComponent


  ],
  templateUrl: './crea.page.html',
  styleUrls: ['./crea.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  

})
export class CreaPage implements AfterViewInit {

  animateEntry = false;
  heroPhotoUrl: string | null = null;
  isLoading: boolean = false;
  message: string = 'Generazione in corso...';
  unfinishedCards: TripWithId[] = [];
  currentDraft: TripWithId | null = null;
  activeTab: 'departure' | 'return' = 'departure';
  step = 1;
  stepmax = this.step;
  today = new Date().toISOString().split('T')[0];
  endDate: string | null = null;
  startDate: string | null = null;
  calendarDays: Date[] = [];
  city = '';
  accommodation = '';
  cityJustConfirmed = false;
accommodationJustConfirmed = false;
confirmedCity = '';
confirmedAccommodation = '';



  constructor(
    private router: Router,
    private ngZone: NgZone,
    private apiService: ApiService,
    private itineraryService: ItineraryService,
    private auth: AuthService
  ) {
    const today = new Date();
    this.startDate = today.toISOString().split('T')[0];
    this.endDate = this.startDate;
  }

  ngAfterViewInit() { }

  setTab(tab: 'departure' | 'return') {
    this.activeTab = tab;
  }

  ionViewWillEnter() {
    this.step = 1;
    this.stepmax = this.step;

    this.endDate = null;
    this.startDate = null;
    this.calendarDays = [];
    this.city = '';
    this.accommodation = '';

    const saved = localStorage.getItem('trips');
    this.unfinishedCards = saved ? JSON.parse(saved) : [];

    this.animateEntry = false;
    setTimeout(() => (this.animateEntry = true), 50);

    // 👇 AGGIUNGI QUESTO:
    setTimeout(() => this.initAutocomplete(), 300);
  }

  

  private initAutocomplete() {
    const cityInput = document.getElementById('cityInput') as HTMLInputElement;
    const accommodationInput = document.getElementById('accommodationInput') as HTMLInputElement;

    // dichiariamo l’istanza di autocomplete per l’alloggio
    let acAcc!: google.maps.places.Autocomplete;

    // 1) inizializziamo subito autocomplete sull’alloggio (anche se città non scelta)
    if (accommodationInput) {
      acAcc = new google.maps.places.Autocomplete(accommodationInput, { types: ['lodging'] });
      acAcc.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const p = acAcc.getPlace();
          this.accommodation = p.formatted_address ?? p.name ?? '';
        });
      });
    }

    // 2) inizializziamo autocomplete sulla città
    if (cityInput) {
      const acCity = new google.maps.places.Autocomplete(cityInput, { types: ['(cities)'] });
      acCity.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const p = acCity.getPlace();
          this.city = p.formatted_address ?? p.name ?? '';

          // appena la città è stata scelta, ristrettiamo l’autocomplete dell’alloggio
          const bounds = p.geometry?.viewport;
          if (bounds && acAcc) {
            acAcc.setBounds(bounds);
            acAcc.setOptions({ strictBounds: true });
          }
        });
      });
    }

    // 🔧 iOS tap‐fix
    setTimeout(() => {
      document.querySelectorAll('.pac-container')
        .forEach((el: any) => el.setAttribute('data-tap-disabled', 'true'));
    }, 500);
  }

  canProceedCity(): boolean {
    return !!this.city;
  }

  confirmDates() {
    const s = new Date(this.startDate!), e = new Date(this.endDate!);
    this.calendarDays = [];
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      this.calendarDays.push(new Date(d));
    }
    this.step = 4;

    this.currentDraft = {
      itineraryId: `draft_${Date.now()}`,
      city: this.city,
      accommodation: this.accommodation,
      startDate: this.startDate!,
      endDate: this.endDate!,
    };
  }
 confirmFirstStep() {
  this.step = 2;

  this.confirmedCity = this.city;
  this.cityJustConfirmed = true;
  setTimeout(() => this.cityJustConfirmed = false, 600);
}


  confirmCity() {
  this.step = 3;

  this.confirmedAccommodation = this.accommodation;
  this.accommodationJustConfirmed = true;
  setTimeout(() => this.accommodationJustConfirmed = false, 600);
}


  confirmSurvey() {
    if (!this.currentDraft) {
      this.currentDraft = {
        itineraryId: `draft_${Date.now()}`,
        city: this.city,
        accommodation: this.accommodation,
        startDate: this.startDate!,
        endDate: this.endDate!,
        coverPhoto: '' // sarà impostata qui sotto
      };
    }

    this.isLoading = true;
    this.message = 'Generazione dell’itinerario in corso...';

    this.apiService.getItinerary(this.city, this.calendarDays.length, this.accommodation)
      .subscribe({
        next: (res) => {
          //console.log('✅ API response:', res);
          //console.log('🎯 res.coverPhoto ricevuta:', res.coverPhoto);

          // 🔥 QUI VIENE RISOLTO: assegna coverPhoto
          this.currentDraft!.coverPhoto = res.coverPhoto || '../assets/images/PaletoBay.jpeg';

          this.unfinishedCards.push(this.currentDraft!);
          localStorage.setItem('trips', JSON.stringify(this.unfinishedCards));

          this.isLoading = false;

          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/tabs/viaggi'], {
              queryParams: { id: this.currentDraft!.itineraryId },
              replaceUrl: true
            });
          });
        },
        error: (err) => {
          console.error('Errore nella generazione dell’itinerario:', err);
          alert('Errore durante il salvataggio del viaggio. Riprova più tardi.');
        }
      });
  }

  onRangeSelected(range: { from: string, to: string }) {
  console.log('Range ricevuto:', range);

  this.startDate = range.from;
  this.endDate = range.to;

  // Se non è stata selezionata nessuna data → departure
  if (!this.startDate && !this.endDate) {
    this.activeTab = 'departure';
  }
  // Se è stata selezionata solo una → evidenzia return
  else if (this.startDate && !this.endDate) {
    this.activeTab = 'return';
  }
  // Se entrambe → resta su return (o puoi impostare null)
  else if (this.startDate && this.endDate) {
    this.activeTab = 'return'; // oppure lascia invariato
  }

  this.step = this.step; // forza il refresh visuale
}


  canProceedCurrentStep(): boolean {
    if (this.step === 1) {
      return !!this.city; // città obbligatoria
    } else if (this.step === 2) {
      return true; // alloggio facoltativo
    } else if (this.step === 3) {
      return !!this.startDate && !!this.endDate;
    } else if (this.step === 4) {
      return true;
    }
    return false;
  }

  handleStepAction() {
    if (!this.canProceedCurrentStep()) return;

    if (this.step === 1) {
      this.confirmFirstStep();
    } else if (this.step === 2) {
      this.confirmCity();
    } else if (this.step === 3) {
      this.confirmDates();
    } else if (this.step === 4) {
      this.confirmSurvey();
    }
  }

}
