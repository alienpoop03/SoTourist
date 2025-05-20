/*import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton],
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.scss']
})
export class PlanCardComponent {
  @Input() planType: 'standard' | 'premium' | 'gold' = 'standard';
  @Input() active: boolean = false;
  @Output() select = new EventEmitter<void>();

  getTitle(): string {
    return this.planType === 'premium' ? '🌟 Premium' :
           this.planType === 'gold' ? '👑 Gold' : '🧭 Standard';
  }

  getFeatures(): string[] {
    switch (this.planType) {
      case 'premium':
        return ['Itinerari completi', 'Personalizzazione avanzata', 'Nessuna pubblicità'];
      case 'gold':
        return ['Tutto del Premium', 'AI illimitata', 'Assistenza prioritaria'];
      default:
        return ['Funzionalità base', 'Accesso limitato'];
    }
  }
}*/

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-plan-card',
  standalone: true,
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.scss'],
  imports: [CommonModule]
})
export class PlanCardComponent {
  @Input() plan: 'standard' | 'premium' | 'gold' = 'standard';
  @Input() active = false;
  @Output() select = new EventEmitter<void>();

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

  get badge(): string | null {
    switch (this.plan) {
      case 'premium': return '⭐ Più scelto';
      case 'gold': return '💎 Esclusivo';
      default: return null;
    }
  }

  get imageSrc(): string {
    return `assets/images/plans/${this.plan}.png`;
  }
}
