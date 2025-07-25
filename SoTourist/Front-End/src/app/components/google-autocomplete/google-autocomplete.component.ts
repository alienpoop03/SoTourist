import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-google-autocomplete',
  standalone: true,
  templateUrl: './google-autocomplete.component.html',
  styleUrls: ['./google-autocomplete.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class GoogleAutocompleteComponent implements AfterViewInit {
  @Input() placeholder = '';
  @Input() value = '';
  @Input() type = 'text';
  @Input() types: string[] = [];
  @Input() bounds: google.maps.LatLngBounds | null = null;
  @Input() restrictToBounds = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() placeSelected = new EventEmitter<google.maps.places.PlaceResult>();

  @ViewChild('autoInput', { static: true })
  inputRef!: ElementRef<HTMLInputElement>;

  suggestions: google.maps.places.AutocompletePrediction[] = [];
  showSuggestions = false;

  private autocompleteService!: google.maps.places.AutocompleteService;
  private placesService!: google.maps.places.PlacesService;
  private sessionToken!: google.maps.places.AutocompleteSessionToken;
  private detailsCache = new Map<string, google.maps.places.PlaceResult>();
  private timer: any;
  private readonly DEBOUNCE_MS = 150;

  ngAfterViewInit() {
    this.autocompleteService = new google.maps.places.AutocompleteService();
    this.placesService = new google.maps.places.PlacesService(
      document.createElement('div')
    );
    this.resetSession();
  }

  onKeyup() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fetchPredictions(), this.DEBOUNCE_MS);
  }

  private fetchPredictions() {
    const input = this.inputRef.nativeElement.value;
    this.value = input;
    this.valueChange.emit(this.value);

    if (!input || input.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    const req = {
      input,
      sessionToken: this.sessionToken,
      types: this.types.length ? this.types : undefined,
      bounds: this.bounds ?? undefined,
      ...(this.restrictToBounds ? { strictBounds: true } : {})
    } as google.maps.places.AutocompletionRequest & { strictBounds?: boolean };

    this.autocompleteService.getPlacePredictions(req, (pred, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && pred) {
        this.suggestions = pred;
        this.showSuggestions = true;

        // Prefetch dettagli delle prime 5 voci
        this.suggestions.slice(0, 5).forEach(p => this.prefetchDetails(p));
      } else {
        this.suggestions = [];
        this.showSuggestions = false;
      }
    });
  }

  private prefetchDetails(pred: google.maps.places.AutocompletePrediction) {
    if (this.detailsCache.has(pred.place_id)) return;

    const fields: (keyof google.maps.places.PlaceResult)[] = [
      'place_id',
      'geometry',
      'name',
      'formatted_address'
    ];

    this.placesService.getDetails(
      {
        placeId: pred.place_id,
        sessionToken: this.sessionToken,
        fields
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place
        ) {
          this.detailsCache.set(pred.place_id, place);
        }
      }
    );
  }

  selectSuggestion(pred: google.maps.places.AutocompletePrediction) {
    this.showSuggestions = false;
    this.suggestions = [];

    this.value = '';
    this.inputRef.nativeElement.value = '';
    this.valueChange.emit('');

    const cached = this.detailsCache.get(pred.place_id);
    if (cached) {
      this.placeSelected.emit(cached);
      this.resetSession();
      return;
    }

    const fullFields: (keyof google.maps.places.PlaceResult)[] = [
      'place_id',
      'geometry',
      'name',
      'formatted_address',
      'photos',
      'rating',
      'price_level',
      'website',
      'opening_hours'
    ];

    this.placesService.getDetails(
      {
        placeId: pred.place_id,
        sessionToken: this.sessionToken,
        fields: fullFields
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place
        ) {
          this.placeSelected.emit(place);
          this.detailsCache.set(pred.place_id, place);
          this.resetSession();
        }
      }
    );
  }

  preventBlur(ev: MouseEvent) {
    ev.preventDefault();
  }

  onBlur() {
    setTimeout(() => (this.showSuggestions = false), 200);
  }

  private resetSession() {
    this.sessionToken = new google.maps.places.AutocompleteSessionToken();
    this.detailsCache.clear();
  }
}