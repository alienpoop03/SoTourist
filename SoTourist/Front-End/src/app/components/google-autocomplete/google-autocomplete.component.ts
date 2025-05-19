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

@Component({
  selector: 'app-google-autocomplete',
  standalone: true,
  template: `
    <input
      #autoInput
      [type]="type"
      class="autocomplete-input"
      [placeholder]="placeholder"
      [(ngModel)]="value"
      (blur)="onBlur()"
      autocomplete="off"
    />
  `,
  styleUrls: ['./google-autocomplete.component.scss'],
  imports: [FormsModule]
})
export class GoogleAutocompleteComponent implements AfterViewInit {
  @Input() placeholder = '';
  @Input() value = '';
  @Input() type = 'text';
  @Input() types: string[] = []; // es. ['(cities)'] o ['address']
  @Input() bounds: google.maps.LatLngBounds | null = null;

  @Output() valueChange = new EventEmitter<string>();
  @Output() placeSelected = new EventEmitter<google.maps.places.PlaceResult>();

  @ViewChild('autoInput', { static: true }) inputRef!: ElementRef<HTMLInputElement>;

  autocomplete!: google.maps.places.Autocomplete;

  ngAfterViewInit() {
    this.autocomplete = new google.maps.places.Autocomplete(this.inputRef.nativeElement, {
      types: this.types.length ? this.types : undefined,
      componentRestrictions: { country: 'it' },
      bounds: this.bounds || undefined,
      strictBounds: !!this.bounds
    });

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      if (!place) return;

      this.value = place.formatted_address ?? place.name ?? '';
      this.valueChange.emit(this.value);
      this.placeSelected.emit(place); // 🔥 emetti l’intero place
    });
  }

  onBlur() {
    this.valueChange.emit(this.value);
  }
}
