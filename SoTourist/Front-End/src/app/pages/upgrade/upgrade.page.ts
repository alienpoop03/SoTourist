import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanCardComponent } from '../../components/plan-card/plan-card.component';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import {
  IonContent,
  IonButton
} from '@ionic/angular/standalone';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.page.html',
  styleUrls: ['./upgrade.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    PlanCardComponent,
    NavigationBarComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UpgradePage implements OnInit {
  @ViewChild('swiperEl', { static: false }) swiperEl?: ElementRef;
  userId: string = '';
  currentType: string = '';
  subscriptionEndDate: string | null = null;
  selected: 'standard' | 'premium' | 'gold' | null = null;
  isScrollable = true;

  constructor(private auth: AuthService,
  private toastService: ToastService) {}

  ngOnInit() {
    const id = this.auth.getUserId();
    if (!id) return;
    this.userId = id;

    this.auth.getUserType(this.userId).subscribe(res => {
      this.currentType = res.type;
      this.subscriptionEndDate = res.subscriptionEndDate;

      const index = this.getSlideIndexForType(this.currentType);
      this.isScrollable = window.innerWidth < 1200;

      
      setTimeout(() => {
        const swiper = this.swiperEl?.nativeElement?.swiper;
        if (swiper) {
          swiper.slideTo(index);
          swiper.allowTouchMove = this.isScrollable;
        }
      }, 50);
    });
  }

  getSlideIndexForType(type: string): number {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1180){
      return 1;
    }else{
      switch (type) {
        case 'standard': return 0;
        case 'premium': return 1;
        case 'gold': return 2;
        default: return 0;
      }
    }
    
  }

  getSlidesPerView(): string {
    const width = window.innerWidth;

    /*const breakpoints = [
      {width: 412, slides: 1.25 },
      { width: 529, slides: 1.4 },
      { width: 759, slides: 1.5 },
      { width: 926, slides: 1.58 },
      { width: 1158, slides: 1.65 }
    ];*/

    const breakpoints = [
      {width: 412, slides: 1.25 },
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
        return interpolated.toFixed(2); // es: "1.46"
      }
    }

    return '1.25'; // fallback
  }

  getSpaceBetween(): number {
    const minWidth = 412;      // Cambia qui la soglia minima
    const maxWidth = 1200;     // Cambia qui la soglia massima
    const minGap = 10;         // Cambia qui il valore minimo di gap
    const maxGap = 30;         // Cambia qui il valore massimo di gap

    const screenWidth = window.innerWidth;

    if (screenWidth <= minWidth) return minGap;
    if (screenWidth >= maxWidth) return maxGap;

    // Calcolo proporzionale tra minGap e maxGap
    const ratio = (screenWidth - minWidth) / (maxWidth - minWidth);
    const interpolated = minGap + (maxGap - minGap) * ratio;

    return Math.round(interpolated);
  }

    
  @HostListener('window:resize', [])
  onWindowResize() {
    const width = window.innerWidth;
    const newScrollable = width < 1180;

    if (this.isScrollable !== newScrollable) {
      this.isScrollable = newScrollable;

      const swiper = this.swiperEl?.nativeElement?.swiper;
      if (swiper) {
        swiper.allowTouchMove = this.isScrollable;

        // opzionale: reimposta il focus sulla card corretta
        if(!this.isScrollable){
          const index = this.getSlideIndexForType(this.currentType);
          swiper.slideTo(index);
        }
        
      }
    }
  }

  upgrade(plan: 'premium' | 'gold') {
    this.auth.upgradeAccount(this.userId, plan).subscribe(() => {
      this.toastService.showSuccess(`✅ Upgrade a ${plan} effettuato.`);
      this.currentType = plan;
    });
  }

  cancel() {
    this.auth.cancelSubscription(this.userId).subscribe(() => {
      this.toastService.showSuccess('Sei passato a Standard');
      this.currentType = 'standard';
      this.subscriptionEndDate = null;
    });
  }

  onConfirm() {
    if (
      (this.selected === 'premium' || this.selected === 'gold') &&
      this.selected !== this.currentType
    ) {
      this.upgrade(this.selected);
    }
  }

  onStandard(){
    if(this.currentType != 'standard'){
      this.cancel();
    }
    
  }

  onPremium(){
    if(this.currentType != 'premium'){
      this.upgrade('premium');
    }
  }

  onGold(){
    if(this.currentType != 'gold'){
      this.upgrade('gold');
    }
  }

}
