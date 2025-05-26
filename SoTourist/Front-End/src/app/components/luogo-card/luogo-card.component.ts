import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg } from '@ionic/angular/standalone';
import { Place } from '../../models/trip.model';

@Component({
  selector: 'app-luogo-card',
  standalone: true,
  templateUrl: './luogo-card.component.html',
  styleUrls: ['./luogo-card.component.scss'],
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg],
})
export class LuogoCardComponent {
  @Input() place!: Place;
  @Input() selected: boolean = false;
  @Input() index?: number;

  @Output() clicked = new EventEmitter<void>();
}
