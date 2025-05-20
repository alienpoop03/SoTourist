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
import { CommonModule } from '@angular/common'; // <-- AGGIUNGI QUESTO!

@Component({
  selector: 'app-google-autocomplete',
  standalone: true,
  template: `
    <div class="autocomplete-wrapper">
      <input
        #autoInput
        [type]="type"
        class="autocomplete-input"
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (input)="onInput()"
        (blur)="onBlur()"
        autocomplete="off"
      />
      <ul *ngIf="suggestions.length && showSuggestions" class="suggestions-list">
        <li *ngFor="let suggestion of suggestions" (mousedown)="selectSuggestion(suggestion)">
          {{ suggestion.description }}
        </li>
      </ul>
    </div>
  `,
  styleUrls: ['./google-autocomplete.component.scss'],
  imports: [
    FormsModule,
    CommonModule

  ]
})
export class GoogleAutocompleteComponent implements AfterViewInit {
  @Input() placeholder = '';
  @Input() value = '';
  @Input() type = 'text';
  @Input() types: string[] = [];
  @Input() bounds: google.maps.LatLngBounds | null = null;
  @Input() restrictToBounds: boolean = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() placeSelected = new EventEmitter<google.maps.places.PlaceResult>();

  @ViewChild('autoInput', { static: true }) inputRef!: ElementRef<HTMLInputElement>;

  suggestions: google.maps.places.AutocompletePrediction[] = [];
  showSuggestions = false;
  autocompleteService!: google.maps.places.AutocompleteService;
  placesService!: google.maps.places.PlacesService;
  

  ngAfterViewInit() {
    this.autocompleteService = new google.maps.places.AutocompleteService();
    this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
  }

  onInput() {
    const input = this.inputRef.nativeElement.value;
    this.value = input;
    this.valueChange.emit(this.value);

    if (!input || input.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    const request: google.maps.places.AutocompletionRequest = {
  input,
  types: this.types.length ? this.types : undefined,
  componentRestrictions: { country: 'it' },
  // locationRestriction accetta un oggetto LatLngBoundsLiteral o LatLngBounds
  locationRestriction: this.bounds ? this.bounds.toJSON() : undefined
};


    this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        if (!this.restrictToBounds || !this.bounds) {
          this.suggestions = predictions;
          this.showSuggestions = true;
        } else {
          const filtered: google.maps.places.AutocompletePrediction[] = [];
          let checked = 0;
          predictions.forEach(prediction => {
            this.placesService.getDetails({ placeId: prediction.place_id }, (place, status) => {
              checked++;
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                place?.geometry?.location &&
                this.bounds!.contains(place.geometry.location)
              ) {
                filtered.push(prediction);
              }
              if (checked === predictions.length) {
                this.suggestions = filtered;
                this.showSuggestions = true;
              }
            });
          });
        }
      } else {
        this.suggestions = [];
        this.showSuggestions = false;
      }
    });
  }

  selectSuggestion(suggestion: google.maps.places.AutocompletePrediction) {
    this.placesService.getDetails({ placeId: suggestion.place_id }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        this.value = place.formatted_address ?? place.name ?? '';
        this.valueChange.emit(this.value);
        this.placeSelected.emit(place);
        this.suggestions = [];
        this.showSuggestions = false;
      }
    });
  }

  onBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }
}
