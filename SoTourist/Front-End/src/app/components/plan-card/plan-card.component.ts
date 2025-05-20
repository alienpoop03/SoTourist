import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service'; // o il path corretto
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.scss'],
  imports: [CommonModule, HttpClientModule]
})
export class PlanCardComponent implements OnInit {
  @Input() plan: 'standard' | 'premium' | 'gold' = 'standard';
  @Input() active = false;

  userId: string | null = null;
  currentType: 'standard' | 'premium' | 'gold' = 'standard';

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.userId = this.auth.getUserId();
    if (this.userId) {
      this.auth.getUserType(this.userId).subscribe(res => {
        this.currentType = res.type as 'standard' | 'premium' | 'gold';
      });
    }
  }

  get imageSrc(): string {
    return `/assets/images/plans/${this.plan}.png`;
  }

  get title(): string {
    switch (this.plan) {
      case 'premium': return 'Premium';
      case 'gold': return 'Gold';
      default: return 'Standard';
    }
  }

  get price(): string {
    switch (this.plan) {
      case 'premium': return '4,99€ / mese';
      case 'gold': return '9,99€ / mese';
      default: return 'Gratis';
    }
  }

  get features(): string[] {
    switch (this.plan) {
      case 'premium':
        return ['Itinerari completi', 'Nessuna pubblicità', 'AI limitata'];
      case 'gold':
        return ['Tutto del Premium', 'AI illimitata', 'Assistenza prioritaria'];
      default:
        return ['Accesso base', 'Pubblicità', 'Poche personalizzazioni'];
    }
  }

  get isCurrentPlan(): boolean {
    return this.plan === this.currentType;
  }

  upgradePlan() {
    if (this.userId && this.plan !== 'standard' && !this.isCurrentPlan) {
      this.auth.upgradeAccount(this.userId, this.plan as 'premium' | 'gold').subscribe(() => {
        this.currentType = this.plan;
        alert(`✅ Sei passato a ${this.plan.toUpperCase()}`);
      });
    }
  }

  cancelPlan() {
    if (this.userId && this.isCurrentPlan && this.plan !== 'standard') {
      this.auth.cancelSubscription(this.userId).subscribe(() => {
        this.currentType = 'standard';
        alert('❎ Abbonamento annullato');
      });
    }
  }

  onCancel(event: Event) {
    event.stopPropagation();
    this.cancelPlan();
  }

  onSelect() {
    this.upgradePlan();
  }
}
