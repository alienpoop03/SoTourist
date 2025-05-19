import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- AGGIUNGI QUESTO!

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
  imports: [FormsModule,

  ]

})
export class GoogleAutocompleteComponent implements AfterViewInit {
  @Input() placeholder = '';
  @Input() value = '';
  @Input() type = 'text';
  @Input() types: string[] = []; // es. ['(cities)'] o ['address']
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('autoInput', { static: true }) inputRef!: ElementRef<HTMLInputElement>;

  autocomplete!: google.maps.places.Autocomplete;

  ngAfterViewInit() {
    // Inizializza autocomplete su questo input
    this.autocomplete = new google.maps.places.Autocomplete(this.inputRef.nativeElement, {
      types: this.types.length ? this.types : undefined,
      componentRestrictions: { country: 'it' } // limita a Italia se vuoi
    });
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      if (place && place.formatted_address) {
        this.value = place.formatted_address;
      } else if (place && place.name) {
        this.value = place.name;
      }
      this.valueChange.emit(this.value);
    });
  }

  onBlur() {
    this.valueChange.emit(this.value);
  }
}
