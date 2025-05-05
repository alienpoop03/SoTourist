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
    IonList
  ],
  templateUrl: './crea.page.html',
  styleUrls: ['./crea.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(1rem)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class CreaPage implements AfterViewInit {
  step = 1;

  // STEP 1
  mode: 'vacation' | 'planned' | null = null;

  // STEP 2
  today = new Date().toISOString().split('T')[0];
  endDate: string | null = null;
  startDate: string | null = null;
  calendarDays: Date[] = [];

  // STEP 3
  city = '';
  accommodation: string = '';


  constructor(private router: Router, private ngZone: NgZone) {}

  ngAfterViewInit() {
    // non inizializziamo subito, aspettiamo STEP 3
  }

  ionViewWillEnter() {
    // Resetto tutto lo stato
    this.step = 1;
    this.mode = null;
    this.endDate = null;
    this.startDate = null;
    this.calendarDays = [];
    this.city = '';
    this.accommodation = '';
  }
  

  // STEP 1
  selectMode(m: 'vacation' | 'planned') {
    this.mode = m;
    setTimeout(() => this.step = 2, 200);
  }

  // STEP 2
  canProceedDates(): boolean {
    return !!this.endDate;
  }
  confirmDates() {
    if (!this.endDate) return;
    this.startDate = this.today;
    const s = new Date(this.startDate), e = new Date(this.endDate);
    this.calendarDays = [];
    for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
      this.calendarDays.push(new Date(d));
    }
    this.step = 3;
    setTimeout(() => this.initAutocomplete(), 300);
  }

  // STEP 3
  initAutocomplete() {
    const cityInput = document.getElementById('cityInput') as HTMLInputElement;
    const accommodationInput = document.getElementById('accommodationInput') as HTMLInputElement;
  
    if (cityInput) {
      const acCity = new google.maps.places.Autocomplete(cityInput, { types: ['(cities)'] });
      acCity.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const p = acCity.getPlace();
          this.city = p.formatted_address || p.name;
        });
      });
    }
  
    if (accommodationInput) {
      const acAcc = new google.maps.places.Autocomplete(accommodationInput);
      acAcc.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const p = acAcc.getPlace();
          this.accommodation = p.formatted_address || p.name;
        });
      });
    }
  
    setTimeout(() => {
      document.querySelectorAll('.pac-container')
        .forEach((el: any) => el.setAttribute('data-tap-disabled','true'));
    }, 500);
  }
  
  canProceedCity(): boolean {
    return !!this.city;
  }
  confirmCity() {
    this.step = 4;
  }

  // STEP 4
  confirmSurvey() {
    const trips: any[] = JSON.parse(localStorage.getItem('trips') || '[]');
    trips.unshift({
      city: this.city,
      days: this.calendarDays.length,
      start: this.startDate,
      end: this.endDate,
      accommodation: this.accommodation
    });
    
    localStorage.setItem('trips', JSON.stringify(trips));
    this.router.navigate(['/tabs/home']);
  }
}
