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
  imports: [CommonModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg],
})
export class LuogoCardComponent implements OnInit {
  @Input() place!: Place;
  @Input() selected: boolean = false;
  @Input() index?: number;
  @Input() extends: boolean = true;

  @Output() clicked = new EventEmitter<void>();

  ngOnInit(): void {
  //console.log('[LUOGO-CARD] DEBUG place:', this.place);

  if (!this.place.photoUrl && this.place.photoFilename) {
    const url = `${API_BASE_URL}/uploads/${this.place.photoFilename}`;
    //console.log('[LUOGO-CARD] Provo foto da:', url);

    this.checkImageExists(url).then(exists => {
      //console.log(`[LUOGO-CARD] Foto ${exists ? 'trovata' : 'NON trovata'} → ${url}`);
      if (exists) {
        this.place.photoUrl = url;
      }
    });
  } else {
    //console.log('[LUOGO-CARD] Salto caricamento: photoUrl già presente o manca photoFilename');
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
