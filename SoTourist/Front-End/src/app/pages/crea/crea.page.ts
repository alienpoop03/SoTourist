import { Component } from '@angular/core';
import { IonContent, IonIcon, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RangeCalendarLiteComponent } from '../../components/range-calendar-lite/range-calendar-lite.component';
import { GoogleAutocompleteComponent } from '../../components/google-autocomplete/google-autocomplete.component';
import { Router, ActivatedRoute } from '@angular/router';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';

@Component({
  selector: 'app-crea',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    CommonModule,
    FormsModule,
    RangeCalendarLiteComponent,
    GoogleAutocompleteComponent,
    NavigationBarComponent,
    IonSegment, IonSegmentButton, IonLabel,
  ],
  templateUrl: './crea.page.html',
  styleUrls: ['./crea.page.scss']
})
export class CreaPage {
  constructor(private route: ActivatedRoute, private router: Router) {}

  cityBounds: google.maps.LatLngBounds | null = null;

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Stato step e input
  step = 1;
  cityInput: string = '';
  accommodationInput: string = '';
  datesInput: { start: string, end: string } = { start: '', end: '' };
  accommodationMode: 'hotel' | 'address' = 'hotel';

  // Valori confermati
  city: string = '';
  accommodation: string = '';
  dates: { start: string, end: string } = { start: '', end: '' };

  // Validità e stato conferma
  isConfirmed: boolean = false;
  isCityValid: boolean = false;
  isAccommodationValid: boolean = false;

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const cityName = params.get('city');
      if (cityName) {
        this.cityInput = cityName;
        this.searchPlaceAndSet(cityName);
      }
    });
  }

  // Ricerca e imposta dati città con Google Places
  searchPlaceAndSet(cityName: string) {
    const autocompleteService = new google.maps.places.AutocompleteService();
    const placesService = new google.maps.places.PlacesService(document.createElement('div'));

    autocompleteService.getPlacePredictions({ input: cityName, types: ['(cities)'] }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
        const prediction = predictions[0];
        const placeId = prediction.place_id;
        if (!placeId) return;

        placesService.getDetails({ placeId, fields: ['place_id', 'name', 'geometry', 'formatted_address'] }, (place, detailsStatus) => {
          if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
            
            // Se manca il viewport, creane uno finto centrato sulla location
            if (!place.geometry.viewport && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const span = 0.05;
              const bounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(lat - span, lng - span),
                new google.maps.LatLng(lat + span, lng + span)
              );
              place.geometry.viewport = bounds;
            }

            this.handleCityPlace({
              name: place.name,
              place_id: place.place_id,
              formatted_address: place.formatted_address,
              geometry: place.geometry
            } as google.maps.places.PlaceResult);
          }
        });
      }
    });
  }

  // STEP 1: conferma città
  setCity(value: string) {
    if (value && value.trim()) {
      this.city = value.trim();
      this.step = 2;
      this.accommodationInput = '';

      const autocomplete = new google.maps.places.AutocompleteService();

      autocomplete.getPlacePredictions({ input: this.city }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions != null && predictions.length > 0) {
          const placeId = predictions[0].place_id;
          if (!placeId) return;

          const service = new google.maps.places.PlacesService(document.createElement('div'));
          service.getDetails({ placeId }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place != null && place.geometry?.viewport) {
              this.cityBounds = place.geometry.viewport;
            }
          });
        }
      });
    }
  }

  // STEP 2: conferma alloggio
  setAccommodation(value: string) {
    if (value && value.trim()) {
      this.accommodation = value.trim();
      this.step = 3;
      this.datesInput = { start: '', end: '' };
    }
  }

  // STEP 3: conferma date
  setDates(start: string, end: string) {
    if (start && end) {
      this.dates = { start, end };
      this.step = 4;
    }
  }

  // Conferma finale e salvataggio
  confirm() {
    const newDraft = {
      itineraryId: 'draft_' + Date.now(),
      city: this.city,
      accommodation: this.accommodation,
      start: this.dates.start,
      end: this.dates.end,
      status: 'bozza'
    };

    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    trips.push(newDraft);
    localStorage.setItem('trips', JSON.stringify(trips));

    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['tabs/viaggi']);
    });
  }

  // Torna indietro di uno step
  prevStep() {
    if (this.step > 1) {
      this.step--;

      switch (this.step) {
        case 1:
          this.cityInput = this.city;
          this.isCityValid = !!this.city;
          break;

        case 2:
          this.accommodationInput = this.accommodation;
          this.isAccommodationValid = !!this.accommodation;
          break;

        case 3:
          this.datesInput = { ...this.dates };
          break;
      }
    }
  }

  // Callback selezione date
  onDatesSelected(event: { from: string, to: string }) {
    this.datesInput = {
      start: event.from,
      end: event.to
    };
  }

  // Gestione selezione città da Google
  handleCityPlace(place: google.maps.places.PlaceResult) {
    if (place && (place.place_id || place.geometry)) {
      this.cityInput = place.formatted_address ?? place.name ?? '';
      this.city = this.cityInput;
      this.isCityValid = true;
      this.step = 2;

      if (place.geometry?.viewport) {
        this.cityBounds = place.geometry.viewport;
      }

      this.accommodationInput = '';
      this.isAccommodationValid = false;
    } else {
      this.isCityValid = false;
    }
  }

  // Gestione selezione alloggio da Google
  handleAccommodationPlace(place: google.maps.places.PlaceResult) {
    if (place && (place.place_id || place.geometry)) {
      this.accommodationInput = place.formatted_address ?? place.name ?? '';
      this.accommodation = this.accommodationInput;

      if (!this.isPlaceInBounds(place)) {
        alert('Seleziona un alloggio nella città scelta!');
        this.accommodationInput = '';
        this.accommodation = '';
        this.isAccommodationValid = false;
        return;
      }

      this.isAccommodationValid = true;
      this.step = 3;
    } else {
      this.isAccommodationValid = false;
    }
  }

  // Verifica se l'alloggio è nei bounds della città
  isPlaceInBounds(place: google.maps.places.PlaceResult): boolean {
    if (!place.geometry || !place.geometry.location || !this.cityBounds) {
      return false;
    }

    return this.cityBounds.contains(place.geometry.location);
  }
}