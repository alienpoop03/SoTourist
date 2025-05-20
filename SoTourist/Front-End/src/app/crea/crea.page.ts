import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone'; // Importa se serve standalone
import { CommonModule } from '@angular/common'; // <--- IMPORTA QUESTO
import { FormsModule } from '@angular/forms';
import { RangeCalendarLiteComponent } from '../components/range-calendar-lite/range-calendar-lite.component';
import { GoogleAutocompleteComponent } from '../components/google-autocomplete/google-autocomplete.component';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
@Component({
  selector: 'app-crea',
  standalone: true,
  imports: [IonContent,
    IonIcon,
    CommonModule,
    FormsModule,
    RangeCalendarLiteComponent,
    GoogleAutocompleteComponent
  ],
  templateUrl: './crea.page.html',
  styleUrls: ['./crea.page.scss']
})
export class CreaPage {

  router = inject(Router); // se non usi il costruttore, usa Angular 16+ inject
  cityBounds: google.maps.LatLngBounds | null = null;
  readonly today: string = new Date().toISOString().split('T')[0];
  
  // STEP tracking
  step = 1;

  // Input temporanei
  cityInput: string = '';
  accommodationInput: string = '';
  datesInput: { start: string, end: string } = { start: '', end: '' };

  // Valori confermati per riepilogo
  city: string = '';
  accommodation: string = '';
  dates: { start: string, end: string } = { start: '', end: '' };

  // Confermato finale
  isConfirmed: boolean = false;
  isCityValid: boolean = false;
isAccommodationValid: boolean = false;


  // --- STEP 1: conferma città ---
setCity(value: string) {
  if (value && value.trim()) {
    this.city = value.trim();
    this.step = 2;
    this.accommodationInput = '';
    // Non toccare altre variabili qui

    const autocomplete = new google.maps.places.AutocompleteService();
    autocomplete.getPlacePredictions({ input: this.city }, (predictions, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        predictions != null &&
        predictions.length > 0
      ) {
        const placeId = predictions[0].place_id;
        if (!placeId) return;

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails({ placeId }, (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place != null &&
            place.geometry?.viewport
          ) {
            this.cityBounds = place.geometry.viewport;
          }
        });
      }
    });
  }
}


  // --- STEP 2: conferma alloggio ---
  setAccommodation(value: string) {
    if (value && value.trim()) {
      this.accommodation = value.trim();
      this.step = 3; //
      // Reset input date per UX
      this.datesInput = { start: '', end: '' };
    }
  }

  // --- STEP 3: conferma date ---
  setDates(start: string, end: string) {
    if (start && end) {
      this.dates = { start, end };
      this.step = 4;
    }
  }

  // --- Conferma finale ---
  confirm() {
    // 1. Prepara la bozza
    const newDraft = {
      itineraryId: 'draft_' + Date.now(),
      city: this.city,
      accommodation: this.accommodation,
      start: this.dates.start,
      end: this.dates.end,
      status: 'bozza'
    };

    // 2. Salva in localStorage
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    trips.push(newDraft);
    localStorage.setItem('trips', JSON.stringify(trips));
    console.log('Salvo bozza:', newDraft);

    // 3. Naviga alla pagina viaggi
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['tabs/viaggi']);
    });

  }

  // --- Step indietro ---
  prevStep() {
    if (this.step > 1) {
      this.step--;
      // Se torni indietro, puoi svuotare i valori confermati dello step attuale:
      switch (this.step) {
        case 1:
          this.city = '';
          break;
        case 2:
          this.accommodation = '';
          break;
        case 3:
          this.dates = { start: '', end: '' };
          break;
      }
    }
  }

  onDatesSelected(event: { from: string, to: string }) {
    this.datesInput = {
      start: event.from,
      end: event.to
    };
    // Se vuoi andare avanti automaticamente:
    // this.setDates(event.from, event.to);
  }

  showFinalRecap = false;

  // Quando premi "Avanti" dopo le date
  showRecapOverlay() {
    if (this.datesInput.start && this.datesInput.end) {
      this.dates = { start: this.datesInput.start, end: this.datesInput.end };
      this.showFinalRecap = true;
      // NON step = 4
    }
  }

  
handleCityPlace(place: google.maps.places.PlaceResult) {
  // ⚡️ Solo se place valido!
  if (place && (place.place_id || place.geometry)) {
    this.cityInput = place.formatted_address ?? place.name ?? '';
    this.city = this.cityInput;
    this.isCityValid = true;         // <--- FLAG!
    this.step = 2;

    if (place.geometry?.viewport) {
      this.cityBounds = place.geometry.viewport;
    }

    // Reset step successivo
    this.accommodationInput = '';
    this.isAccommodationValid = false;  // Reset flag!
  } else {
    this.isCityValid = false;
  }
}

handleAccommodationPlace(place: google.maps.places.PlaceResult) {
  if (place && (place.place_id || place.geometry)) {
    this.accommodationInput = place.formatted_address ?? place.name ?? '';
    this.accommodation = this.accommodationInput;
    // 🔥 Filtro città
    if (!this.isPlaceInBounds(place)) {
      alert('Seleziona un alloggio nella città scelta!');
      this.accommodationInput = '';
      this.accommodation = '';
      this.isAccommodationValid = false; // flag KO
      return;
    }
    this.isAccommodationValid = true; // flag OK
    this.step = 3;
  } else {
    this.isAccommodationValid = false;
  }
}

  isPlaceInBounds(place: google.maps.places.PlaceResult): boolean {
  if (!place.geometry || !place.geometry.location || !this.cityBounds) {
    return false;
  }
  return this.cityBounds.contains(place.geometry.location);
}



}
