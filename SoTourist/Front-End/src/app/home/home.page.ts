import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonFab,
  IonFabButton,
  IonIcon,
    IonButton, // ✅ AGGIUNGI QUESTO

} from '@ionic/angular/standalone';

import { AppHeaderComponent } from '../components/header/app-header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonFab,
    IonFabButton,
    IonIcon,
    AppHeaderComponent,
      IonButton, // ✅ AGGIUNGI QUESTO

  ],
})
export class HomePage {
  /** Sezione “Scopri oggi” */
  discoverToday = ['Roma', 'Parigi', 'Tokyo', 'New York', 'Barcellona'];

  /** Sezione “Posti da visitare nel 2025” */
  places2025 = ['Dubai', 'Bangkok', 'Melbourne', 'Lisbona', 'San Francisco'];

  /** Blocco “Perché visitare Miami” */
  miami = 'Miami'; // se in futuro vuoi usare più dati è già pronto

  /** Sezione “Top viaggi” */
  topTrips = ['Londra', 'Amsterdam', 'Madrid', 'Praga', 'Vienna'];


  top10Today = [
  'Roma', 'Londra', 'Tokyo', 'New York', 'Parigi',
    'Barcellona', 'Dubai', 'Praga', 'Bangkok', 'Toronto'
];

  constructor(private router: Router) {}

  /** Apre la pagina Crea pre-compilando la città */
  openCreate(city: string) {
    this.router.navigate(['/crea'], { queryParams: { city } });
  }

  /** FAB “+” per creare un viaggio da zero */
  goToCreate() {
    this.router.navigate(['/crea']);
  }
}
