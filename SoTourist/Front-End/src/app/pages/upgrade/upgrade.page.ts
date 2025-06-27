import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.page.html',
  styleUrls: ['./upgrade.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    NavigationBarComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UpgradePage implements OnInit {

  // Riferimento swiper per controllo slide
  @ViewChild('swiperEl', { static: false }) swiperEl?: ElementRef;

  userId: string = '';
  currentType: string = '';
  subscriptionEndDate: string | null = null;
  selected: 'standard' | 'premium' | 'gold' | null = null;
  isScrollable = true;

  constructor(
    private auth: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {

    // Carica userId e tipo account
    const id = this.auth.getUserId();
    if (!id) return;
    this.userId = id;

    this.auth.getUserType(this.userId).subscribe(res => {
      this.currentType = res.type;
      this.subscriptionEndDate = res.subscriptionEndDate;

      const index = this.getSlideIndexForType(this.currentType);
      this.isScrollable = window.innerWidth < 1200;

      // Va al piano selezionato dopo il caricamento
      setTimeout(() => {
        const swiper = this.swiperEl?.nativeElement?.swiper;
        if (swiper) {
          swiper.slideTo(index);
          swiper.allowTouchMove = this.isScrollable;
        }
      }, 50);
    });
  }

  // Determina slide attiva in base al piano
  getSlideIndexForType(type: string): number {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1180) {
      return 1; // Centralizza premium su desktop largo
    } else {
      switch (type) {
        case 'standard': return 0;
        case 'premium': return 1;
        case 'gold': return 2;
        default: return 0;
      }
    }
  }

  // Calcola slides visibili in base a larghezza viewport
  getSlidesPerView(): string {
    const width = window.innerWidth;
    const breakpoints = [
      { width: 412, slides: 1.25 },
      { width: 1200, slides: 3 }
    ];

    if (width <= breakpoints[0].width) return '1.25';
    const last = breakpoints[breakpoints.length - 1];
    const secondLast = breakpoints[breakpoints.length - 2];

    if (width >= last.width) {

      // Continua la proporzione oltre i 1200
      const ratio = (width - last.width) / (last.width - secondLast.width);
      const slideDiff = last.slides - secondLast.slides;
      const extrapolated = last.slides + slideDiff * ratio;
      return extrapolated.toFixed(2);
    }

    for (let i = 0; i < breakpoints.length - 1; i++) {
      const bp1 = breakpoints[i];
      const bp2 = breakpoints[i + 1];

      if (width >= bp1.width && width < bp2.width) {
        const ratio = (width - bp1.width) / (bp2.width - bp1.width);
        const interpolated = bp1.slides + (bp2.slides - bp1.slides) * ratio;
        return interpolated.toFixed(2);
      }
    }
    return '1.25'; // fallback mobile
  }

  // Gap dinamico tra le card
  getSpaceBetween(): number {
    const minWidth = 412;
    const maxWidth = 1200;
    const minGap = 10;
    const maxGap = 30;

    const screenWidth = window.innerWidth;

    if (screenWidth <= minWidth) return minGap;
    if (screenWidth >= maxWidth) return maxGap;

    const ratio = (screenWidth - minWidth) / (maxWidth - minWidth);
    const interpolated = minGap + (maxGap - minGap) * ratio;
    return Math.round(interpolated);
  }

  // Aggiorna swiper in caso di resize
  @HostListener('window:resize', [])
  onWindowResize() {
    const width = window.innerWidth;
    const newScrollable = width < 1180;

    if (this.isScrollable !== newScrollable) {
      this.isScrollable = newScrollable;

      const swiper = this.swiperEl?.nativeElement?.swiper;
      if (swiper) {
        swiper.allowTouchMove = this.isScrollable;
        // Reimposta focus slide corretta se passo a desktop
        if (!this.isScrollable) {
          const index = this.getSlideIndexForType(this.currentType);
          swiper.slideTo(index);
        }
      }
    }
  }

  // Esegui upgrade a premium/gold
  upgrade(plan: 'premium' | 'gold') {
    this.auth.upgradeAccount(this.userId, plan).subscribe(() => {
      this.toastService.showSuccess(`Upgrade a ${plan} effettuato.`);
      this.currentType = plan;
    });
  }

  // Annulla abbonamento (torna a standard)
  cancel() {
    this.auth.cancelSubscription(this.userId).subscribe(() => {
      this.toastService.showSuccess('Sei passato a Standard');
      this.currentType = 'standard';
      this.subscriptionEndDate = null;
    });
  }

  // Gestione conferma (upgrade)
  onConfirm() {
    if (
      (this.selected === 'premium' || this.selected === 'gold') &&
      this.selected !== this.currentType
    ) {
      this.upgrade(this.selected);
    }
  }

  // Gestione click con i vari abbonamenti
  onStandard() {
    if (this.currentType != 'standard') {
      this.cancel();
    }
  }

  onPremium() {
    if (this.currentType != 'premium') {
      this.upgrade('premium');
    }
  }

  onGold() {
    if (this.currentType != 'gold') {
      this.upgrade('gold');
    }
  }
}