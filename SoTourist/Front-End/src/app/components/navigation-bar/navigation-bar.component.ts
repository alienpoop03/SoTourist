import { Component, Input } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon } from '@ionic/angular/standalone';
import { NavigationService } from '../../services/navigation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon],
  template: `
    <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button (click)="goBack()">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </ion-button>
      </ion-buttons>
      <ion-title>{{ title }}</ion-title>
      <ion-buttons slot="end">
        <!-- bottone invisibile per simmetria -->
        <ion-button style="opacity:0; pointer-events: none;">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  `,
  styles: [`
    ion-title { text-align: center; font-weight: bold; color: white; }
    ion-toolbar { --background: var(--color-primary); }
  `]
})
export class NavigationBarComponent {
  /** Titolo visualizzato */
  @Input() title = '';

  /** Dove andare al click sulla freccia (fallback) */
  @Input() backUrl: string = '';

  constructor(private router: Router, private navigation: NavigationService) {}

  goBack() {
    console.log("this.backUrl= ",this.backUrl );
    if (this.backUrl != '') {
      this.router.navigate([this.backUrl]);
    } else {
      this.navigation.back('/');
    }
  }
}