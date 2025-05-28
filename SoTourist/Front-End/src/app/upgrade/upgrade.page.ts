import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanCardComponent } from '../components/plan-card/plan-card.component';
import { NavigationBarComponent } from '../components/navigation-bar/navigation-bar.component';
import {
  IonContent,
  IonButton
} from '@ionic/angular/standalone';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AuthService } from '../services/auth.service';

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

  constructor(private auth: AuthService) {}

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
    if (screenWidth >= 1200){
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
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1200) {return '3.4';} 
    if (screenWidth >= 1158) {return '1.65';} 
    if (screenWidth >= 926) {return '1.58';}
    if (screenWidth >= 768) {return '1.5';}  
    if (screenWidth >= 759) {return '1.5';} 
    if (screenWidth >= 529) {return '1.4';} 

    return '1.25';
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    const width = window.innerWidth;
    const newScrollable = width < 1200;

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
      alert(`✅ Upgrade a ${plan} effettuato.`);
      this.currentType = plan;
    });
  }

  cancel() {
    this.auth.cancelSubscription(this.userId).subscribe(() => {
      alert('Sei passato a Standard');
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
