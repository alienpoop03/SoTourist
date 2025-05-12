import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonDatetime,
  IonInput,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList
} from '@ionic/angular/standalone';
import { trigger, transition, style, animate } from '@angular/animations';
import { ItineraryService } from '../services/itinerary.service';
import { AuthService } from '../services/auth.service';
import { UnfinishedCardComponent } from '../components/unfinished-card/unfinished-card.component';
import { TripWithId } from 'src/app/models/trip.model';
import { RangeCalendarLiteComponent } from '../components/range-calendar-lite/range-calendar-lite.component';

declare var google: any;

@Component({
  selector: 'app-crea',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonDatetime,
    IonInput,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    UnfinishedCardComponent,
    RangeCalendarLiteComponent  // 👈 AGGIUNGI QUI

  ],
  templateUrl: './crea.page.html',
  styleUrls: ['./crea.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]

})
export class CreaPage implements AfterViewInit {
  animateEntry = false;
  heroPhotoUrl: string | null = null;

  unfinishedCards: TripWithId[] = [];
  currentDraft: TripWithId | null = null;

  step = 1;
  stepmax = this.step;
  //stepscelta = 3;

  //mode: 'vacation' | 'planned' | null = null;

  today = new Date().toISOString().split('T')[0];
  endDate: string | null = null;
  startDate: string | null = null;
  calendarDays: Date[] = [];
  datesReady: boolean = false;


  city = '';
  accommodation = '';

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private itineraryService: ItineraryService,
    private auth: AuthService
  ) {
    const today = new Date();
    this.startDate = today.toISOString().split('T')[0];
    this.endDate = this.startDate;
  }

  ngAfterViewInit() { }

  goToStep(s: number) {
    if (s >= 2 && s <= 4 && s <= this.stepmax) {
      this.step = s;
      if (s === 2) setTimeout(() => this.initAutocomplete(), 300);
    }
  }

  ionViewWillEnter() {
    this.step = 2;
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

  canProceedDates(): boolean {
    return !!this.endDate;
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
      coverPhoto: this.heroPhotoUrl ?? ''
    };
  }

  onStartDateChange(ev: any) {
    this.startDate = ev.detail.value;
    if (this.endDate && this.startDate && this.endDate < this.startDate) {
      this.endDate = this.startDate;
    }
    this.step = 3.5;
  }

  onEndDateChange(ev: any) {
    this.endDate = ev.detail.value;
  }

  initAutocomplete() {
    const cityInput = document.getElementById('cityInput') as HTMLInputElement;
    const accommodationInput = document.getElementById('accommodationInput') as HTMLInputElement;

    let acAcc!: google.maps.places.Autocomplete;

    if (accommodationInput) {
      acAcc = new google.maps.places.Autocomplete(accommodationInput, { types: ['lodging'] });
      acAcc.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const p = acAcc.getPlace();
          this.accommodation = p.formatted_address ?? p.name ?? '';
        });
      });
    }

    if (cityInput) {
      const acCity = new google.maps.places.Autocomplete(cityInput, { types: ['(cities)'] });
      acCity.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const p = acCity.getPlace();
          this.city = p.formatted_address ?? p.name ?? '';
          const bounds = p.geometry?.viewport;
          if (bounds) {
            acAcc.setBounds(bounds);
            acAcc.setOptions({ strictBounds: true });
          }
        });
      });
    }

    setTimeout(() =>
      document.querySelectorAll('.pac-container').forEach((el: any) => el.setAttribute('data-tap-disabled', 'true')), 500);
  }

  canProceedCity(): boolean {
    return !!this.city;
  }

  confirmCity() {
    this.step = 3;
    if (this.step > this.stepmax) this.stepmax = this.step;
  }

  confirmSurvey() {
    if (!this.currentDraft) {
      this.currentDraft = {
        itineraryId: `draft_${Date.now()}`,
        city: this.city,
        accommodation: this.accommodation,
        startDate: this.startDate!,
        endDate: this.endDate!,
        coverPhoto: this.heroPhotoUrl ?? ''
      };
    }

    // salva nel localStorage
    this.unfinishedCards.push(this.currentDraft);
    localStorage.setItem('trips', JSON.stringify(this.unfinishedCards));

    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      if (this.currentDraft) {
        this.router.navigate(['/tabs/viaggi'], {
          queryParams: { id: this.currentDraft.itineraryId },
          replaceUrl: true
        });
      }
    });


  }

  areDatesValid(): boolean {
    if (!this.startDate || !this.endDate) return false;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    return start instanceof Date && end instanceof Date && !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
  }

  onRangeSelected(range: { from: string, to: string }) {
    console.log('Range ricevuto:', range); // 👈 deve apparire in console

    this.startDate = range.from;
    this.endDate = range.to;

    // Forza il check del pulsante
    this.step = this.step;
  }

  canProceedCurrentStep(): boolean {
    if (this.step === 2) {
      return !!this.city && !!this.accommodation;
    } else if (this.step === 3) {
      return !!this.startDate && !!this.endDate;
    } else if (this.step === 4) {
      return true; // step finale, già validato
    }
    return false;
  }

  handleStepAction() {
    if (!this.canProceedCurrentStep()) return;

    if (this.step === 2) {
      this.confirmCity();
    } else if (this.step === 3) {
      this.confirmDates();
    } else if (this.step === 4) {
      this.confirmSurvey();
    }
  }


}
