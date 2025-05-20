import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanCardComponent } from '../components/plan-card/plan-card.component';

import {
  IonContent,
  IonButton
} from '@ionic/angular/standalone';

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
    PlanCardComponent 
  ]
})
export class UpgradePage implements OnInit {
  userId: string = '';
  currentType: string = '';
  subscriptionEndDate: string | null = null;
  selected: 'standard' | 'premium' | 'gold' | null = null;
  constructor(private auth: AuthService) {}

  ngOnInit() {
    const id = this.auth.getUserId();
    if (!id) return;
    this.userId = id;

    this.auth.getUserType(this.userId).subscribe(res => {
      this.currentType = res.type;
      this.subscriptionEndDate = res.subscriptionEndDate;
    });
  }

  upgrade(plan: 'premium' | 'gold') {
    this.auth.upgradeAccount(this.userId, plan).subscribe(() => {
      alert(`✅ Upgrade a ${plan} effettuato.`);
      this.currentType = plan;
    });
  }

  cancel() {
    this.auth.cancelSubscription(this.userId).subscribe(() => {
      alert('❎ Abbonamento annullato.');
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
}
