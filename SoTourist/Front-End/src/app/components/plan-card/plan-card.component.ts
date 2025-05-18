import { Component, Input, Output, EventEmitter } from '@angular/core';
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
}
