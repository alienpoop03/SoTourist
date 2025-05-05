import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonAvatar,
  IonItem,
  IonLabel,
  IonTextarea,
  IonToggle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AppHeaderComponent } from '../components/header/app-header.component';
import { AppMenuComponent } from '../components/menu/app-menu.component';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonAvatar,
    IonItem,
    IonLabel,
    IonTextarea,
    IonToggle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    AppHeaderComponent,
    AppMenuComponent
  ],
  templateUrl: './profilo.page.html',
  styleUrls: ['./profilo.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfiloPage {
  name = 'Gabriele';
  email = 'gabriele@email.com';
  bio = '';
  darkMode = false;
  notificationsEnabled = true;
  trips: any[] = [];

  constructor(private router: Router) {}

  ionViewWillEnter() {
    const saved = localStorage.getItem('trips');
    this.trips = saved ? JSON.parse(saved) : [];
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    document.body.classList.toggle('dark', this.darkMode);
  }

  logout() {
    this.router.navigate(['/login']);
  }

  goToTrips() {
    this.router.navigate(['/tabs/profilo']);
  }

  deleteTrip(index: number) {
    this.trips.splice(index, 1);
    localStorage.setItem('trips', JSON.stringify(this.trips));
  }
}
