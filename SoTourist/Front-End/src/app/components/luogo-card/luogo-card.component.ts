import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg } from '@ionic/angular/standalone';
import { Place } from '../../models/trip.model';
import { API_BASE_URL } from '../../services/ip.config';

@Component({
  selector: 'app-luogo-card',
  standalone: true,
  templateUrl: './luogo-card.component.html',
  styleUrls: ['./luogo-card.component.scss'],
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonImg
  ],
})

export class LuogoCardComponent implements OnInit {
  @Input() place!: Place;
  @Input() selected: boolean = false;
  @Input() index?: number;
  @Input() extends: boolean = true;

  @Output() clicked = new EventEmitter<void>();

  ngOnInit(): void {

    // Solo se non è già presente la foto, prova ad impostarla da filename
    if (!this.place.photoUrl && this.place.photoFilename) {
      const url = `${API_BASE_URL}/uploads/${this.place.photoFilename}`;
      this.checkImageExists(url).then(exists => {
        if (exists) {
          this.place.photoUrl = url;
        }
      });
    }
  }

  private checkImageExists(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
  }
}