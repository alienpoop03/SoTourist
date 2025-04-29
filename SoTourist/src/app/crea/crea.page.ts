import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

@Component({
  selector: 'app-crea',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  templateUrl: './crea.page.html',
  styleUrls: ['./crea.page.scss']
})
export class CreaPage implements AfterViewInit {
  step = 1;
  tripType: 'inizio' | 'pianificazione' | null = null;
  city = '';
  startDate: string = new Date().toISOString();
  endDate: string | null = null;

  constructor(private router: Router) {}

  ngAfterViewInit() {
    // Google chiamerà initMap() quando lo script è caricato
    window.initMap = () => {
      const input = document.getElementById('cityInput') as HTMLInputElement;
      if (!input || !window.google?.maps?.places) return;

      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['(cities)'],
        fields: ['name', 'geometry']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        // Se place.name non esiste, rimani col valore manuale
        this.city = place.name ?? input.value;
      });
    };
  }

  nextStep() {
    if (this.step < 4) {
      this.step++;
    }
  }

  createTrip() {
    if (!this.endDate) {
      alert('Seleziona una data di fine vacanza.');
      return;
    }
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const start = new Date(this.startDate);
    const end   = new Date(this.endDate);
    trips.push({
      city: this.city,
      accommodation: '',
      start,
      end,
      days: this.getDurationDays()
    });
    localStorage.setItem('trips', JSON.stringify(trips));
    this.router.navigate(['/tabs/home']);
  }

  getDurationDays(): number {
    if (!this.endDate) return 0;
    const start = new Date(this.startDate);
    const end   = new Date(this.endDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }
}
