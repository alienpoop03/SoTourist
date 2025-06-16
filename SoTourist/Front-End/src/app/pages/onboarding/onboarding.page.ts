import {
  Component,
  ViewChild,
  ElementRef,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
    // non importiamo IonicModule né IonSlides/ IonSlide
  ],
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OnboardingPage {
  @ViewChild('slides', { read: ElementRef }) slidesEl!: ElementRef;
  currentIndex = 0;

  slideOpts = {
    initialSlide: 0,
    speed: 400
  };

  slidesData = [
    { icon: '🗺️', title: 'Esplora il mondo',       desc: 'Scopri i migliori luoghi attorno a te grazie alle Mappe di Google.' },
    { icon: '📅', title: 'Organizza facilmente',    desc: 'Genera itinerari automatici e personalizzati per ogni momento della giornata.' },
    { icon: '📍', title: 'Tracciamento smart',     desc: 'L’app segue i tuoi spostamenti e si aggiorna in tempo reale grazie al GPS.' },
    { icon: '💡', title: 'Consigli aggiornati',     desc: 'Ricevi suggerimenti sempre nuovi in base alla tua posizione e preferenze.' },
    { icon: '✨', title: 'Tutto in un tap',         desc: 'Rinfresca le proposte e scegli l’esperienza perfetta per te, con un semplice tocco.' }
  ];

  constructor(private router: Router) {}



  async slideChanged() {
    // usa nativeElement per chiamare l'API di ion-slides
    const idx = await this.slidesEl.nativeElement.getActiveIndex();
    this.currentIndex = idx;
  }

  startApp() {
    this.router.navigate(['/tabs/profilo']);
  }
}
