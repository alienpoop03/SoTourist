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
    IonList,
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
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
  
})
export class CreaPage implements AfterViewInit {
  animateEntry = false;
  heroPhotoUrl: string | null = null;

  step = 1;
  stepmax = this.step; // numero totale di step
  stepscelta = 3;

  // STEP 1
  mode: 'vacation' | 'planned' | null = null;

  // STEP 2
  today = new Date().toISOString().split('T')[0];
  endDate: string | null = null;
  startDate: string | null = null;
  calendarDays: Date[] = [];

  //dateRange: { from: string; to: string } | null = null;


  
  // STEP 3
  city = '';
  accommodation: string = '';


  constructor(private router: Router, private ngZone: NgZone) {
    const today = new Date();

    this.startDate = today.toISOString().split('T')[0];   // formato YYYY-MM-DD
    this.endDate = this.startDate; // inizialmente uguale a startDate
  }

  ngAfterViewInit() {
    // non inizializziamo subito, aspettiamo STEP 3
  }

  goToStep(s: number) {
    if (s >= 1 && s <= 4 && s <= this.stepmax) {
      this.step = s;
  
      // Eventuale inizializzazione autocomplete se serve
      if (s === 2) {
        setTimeout(() => this.initAutocomplete(), 300);
      }else if(s === 3) {
        this.step = this.stepscelta;
      }
    }
  }

  
  
  ionViewWillEnter() {
    // Reset stato viaggio
    this.step = 1;
    this.stepmax = this.step;
    this.mode = null;
    this.endDate = null;
    this.startDate = null;
    this.calendarDays = [];
    this.city = '';
    this.accommodation = '';
  
    // Forza animazione slide-in ogni volta che entri
    this.animateEntry = false;
    setTimeout(() => {
      this.animateEntry = true;
    }, 50); // tempo minimo per far partire l'animazione
  }
  
  

  // STEP 1
  selectMode(m: 'vacation' | 'planned') {
    this.mode = m;
    this.stepmax = 1;
    if(!this.startDate){
      this.startDate = this.today;
    }
    if(!this.endDate){
      this.endDate = this.startDate; // inizialmente uguale a startDate
    }


    if (m === 'vacation') {
     this.stepscelta = 3.5; // 3 step
    }else{
      this.stepscelta = 3; // 3 step
    }
    setTimeout(() => this.step = 2, 200);
    if(this.step > this.stepmax) {
      this.stepmax = this.step;
    }
     
    setTimeout(() => this.initAutocomplete(), 300);
  }

  // STEP 3


  
  canProceedDates(): boolean {
    return !!this.endDate;
  }
  confirmDates() {
    if (!this.endDate || !this.startDate) return;
    //this.startDate = this.today;
    const s = new Date(this.startDate), e = new Date(this.endDate);
    this.calendarDays = [];
    for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
      this.calendarDays.push(new Date(d));
    }
    this.step = 4;
    if(this.step > this.stepmax) {
      this.stepmax = this.step;
    }
  }
//*
  onStartDateChange(event: any) {
    this.startDate = event.detail.value;
    if (this.endDate && this.startDate && this.endDate < this.startDate) {
      this.endDate = this.startDate; // Se la data di fine è prima della data di inizio, la imposto come data inizio
    }
    this.step = 3.5;
  }

  onEndDateChange(event: any) {
    this.endDate = event.detail.value;
  }
//*/
 // STEP 2
 initAutocomplete() {
  const cityInput = document.getElementById('cityInput') as HTMLInputElement;
  const accommodationInput = document.getElementById('accommodationInput') as HTMLInputElement;

  // Dichiaro la variabile con il "definite assignment assertion"
  let acAcc!: google.maps.places.Autocomplete;

  if (accommodationInput) {
    acAcc = new google.maps.places.Autocomplete(accommodationInput, {
      types: ['lodging']
    });

    acAcc.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const p = acAcc.getPlace();
        this.accommodation = p.formatted_address ?? p.name ?? '';
      });
    });
  }

  if (cityInput) {
    const acCity = new google.maps.places.Autocomplete(cityInput, {
      types: ['(cities)']
    });

    acCity.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const p = acCity.getPlace();
        this.city = p.formatted_address ?? p.name ?? '';

        const bounds = p.geometry?.viewport;
        if (bounds) {
          // Qui TypeScript ora è sicuro che acAcc è stato inizializzato
          acAcc.setBounds(bounds);
          acAcc.setOptions({ strictBounds: true });
        }
      });
    });
  }
  

  // Fix per scroll su mobile
  setTimeout(() => {
    document.querySelectorAll('.pac-container')
      .forEach((el: any) => el.setAttribute('data-tap-disabled', 'true'));
  }, 500);
}



  
  canProceedCity(): boolean {
    return !!this.city;
  }
  confirmCity() {
    this.step = this.stepscelta;
    if(this.step > this.stepmax) {
      this.stepmax = this.step;
    } 
  }

  // STEP 4
  confirmSurvey() {
    const trips: any[] = JSON.parse(localStorage.getItem('trips') || '[]');
    trips.unshift({
      id: Date.now(),
      city: this.city,
      days: this.calendarDays.length,
      start: this.startDate,
      end: this.endDate,
      accommodation: this.accommodation
    });
    
    localStorage.setItem('trips', JSON.stringify(trips));
    this.router.navigate(['/tabs/viaggi'], { replaceUrl: true });
  }
  
  private loadHeroPhoto() {
  if (!this.city) return;

  const query = `${this.city} attrazione turistica`;

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
        });
      }
    }
  );
}

}

