import {
  Component,
  signal,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addOutline, homeOutline, createOutline, settingsOutline } from 'ionicons/icons';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { ItineraryService } from '../../services/itinerary.service';
import { Place } from '../../models/trip.model';
import { LuogoCardComponent } from '../../components/luogo-card/luogo-card.component';
import { GoogleAutocompleteComponent } from '../../components/google-autocomplete/google-autocomplete.component';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { BoundsService } from '../../services/bounds.service';

// Una giornata ha 3 slot temporali
type DayData = { morning: Place[]; afternoon: Place[]; evening: Place[] };

@Component({
  selector: 'app-personalizzazione',
  standalone: true,
  templateUrl: './personalizzazione.page.html',
  styleUrls: ['./personalizzazione.page.scss'],
  imports: [
    CommonModule, NgFor, NgIf,
    IonContent, IonIcon,
    DragDropModule, LuogoCardComponent,
    IonButton, IonFab, IonFabButton,
    GoogleAutocompleteComponent,
    NavigationBarComponent
  ],
})
export class PersonalizzazionePage implements OnInit {
  city: string = '';

  private readonly route = inject(ActivatedRoute);
  private readonly itineraryService = inject(ItineraryService);
  private readonly boundsService = inject(BoundsService);

  tripBounds!: google.maps.LatLngBounds;

  days = signal<DayData[]>([]);
  activeDay = signal(0);

  slots = ['morning', 'afternoon', 'evening'] as const;
  slotName: Record<string, string> = {
    morning: 'Mattina',
    afternoon: 'Pomeriggio',
    evening: 'Sera'
  };

  autocompleteOpen = signal(false);
  autocompleteType = signal<'restaurant' | 'tourist_attraction' | null>(null);
  autocompleteSlot = signal<typeof this.slots[number] | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const itineraryId = params['id'];
      if (!itineraryId) return;

      if (params['north'] && params['south'] && params['east'] && params['west']) {
        this.tripBounds = new google.maps.LatLngBounds(
          { lat: parseFloat(params['south']), lng: parseFloat(params['west']) },
          { lat: parseFloat(params['north']), lng: parseFloat(params['east']) }
        );
      } else {
        this.tripBounds = new google.maps.LatLngBounds(
          { lat: 42.0, lng: 11.0 },
          { lat: 43.0, lng: 12.0 }
        );
      }

      this.itineraryService.getItineraryById(itineraryId).subscribe({
        next: async (res: any) => {
          // Raggruppa le tappe per giorno/slot se serve
          const grouped = this.isGrouped(res.itinerary)
            ? res.itinerary as DayData[]
            : this.groupFlatPlaces(res.itinerary as Place[]);

          this.city = this.extractCityName(res.city);

          this.boundsService.getCityBounds(this.city).then(bounds => {
            if (bounds) this.tripBounds = bounds;
          });

          this.days.set(grouped);
        },
        error: err => console.log('Errore caricamento:', err)
      });
    });
  }

  // True se la struttura è già raggruppata per giorno/slot
  private isGrouped(arr: any[]): arr is DayData[] {
    return Array.isArray(arr) && arr.length > 0 && 'morning' in arr[0];
  }

  // Raggruppa un array flat di tappe in DayData[]
  private groupFlatPlaces(flat: Place[]): DayData[] {
    const maxDay = flat.reduce((max, p) => Math.max(max, p.day), 0);
    const grouped: DayData[] = Array.from({ length: maxDay }, () => ({
      morning: [], afternoon: [], evening: []
    }));
    flat.forEach(p => {
      const d = p.day - 1;
      grouped[d][p.timeSlot].push(p);
    });
    return grouped;
  }

  // Cambia giorno attivo nella sidebar
  selectDay(i: number) {
    this.activeDay.set(i);
  }

  // Apre il popup per aggiungere luogo
  addPlace(slot: typeof this.slots[number]) {
    this.autocompleteSlot.set(slot);
    this.autocompleteOpen.set(true);
  }

  // Seleziona tipo di luogo per autocomplete
  startAutocomplete(type: 'restaurant' | 'tourist_attraction') {
    this.autocompleteType.set(type);
  }

  // True se mostrare il campo autocomplete
  showAutocompleteInput() {
    return this.autocompleteOpen() && !!this.autocompleteType();
  }

  // Gestisce la selezione di un luogo dal popup autocomplete
  async onPlaceSelected(place: any) {
    const slot = this.autocompleteSlot();
    const type = this.autocompleteType();
    if (!slot || !type) return;

    const query = place.name;
    const day = this.activeDay() + 1;
    const city = this.city || 'Roma';

    try {
      const center = this.tripBounds.getCenter();
      const result = await this.fetchSinglePlaceFromBackend(query, city, {
        lat: center.lat(),
        lng: center.lng()
      });
      console.log("RISPOSTA DAL BACKEND:", result);

      if (!result) return;

      // Oggetto Place per frontend
      const frontendPlace: Place = {
        placeId: result.placeId || ('place_' + Date.now()),
        name: result.name,
        day,
        timeSlot: slot,
        latitude: result.latitude ?? null,
        longitude: result.longitude ?? null,
        address: result.address ?? '',
        photoUrl: result.photo ?? '',
        photoFilename: result.photoFilename ?? '',
        photoReference: result.photoReference ?? '',
        type: result.type ?? '',
        note: '',
        rating: result.rating ?? null,
        priceLevel: result.priceLevel ?? null,
        website: result.website ?? null,
        openingHours: result.openingHours ?? null
      };

      // Aggiorna lo stato UI (aggiunge tappa)
      const d = structuredClone(this.days());
      d[this.activeDay()][slot].push(frontendPlace);
      this.days.set(d);

      // Salva su backend
      const backendPlace = this.convertToBackendPlace(frontendPlace);
      const userId = localStorage.getItem('userId')!;
      const itineraryId = this.route.snapshot.queryParamMap.get('id')!;
      this.itineraryService.addPlacesToItinerary(userId, itineraryId, [backendPlace]).subscribe({
        next: () => console.log('Tappa salvata dal backend'),
        error: err => console.log('Errore salvataggio:', err)
      });
    } catch (err) {
      console.log('Errore fetch dal backend:', err);
    }

    this.autocompleteOpen.set(false);
    this.autocompleteType.set(null);
    this.autocompleteSlot.set(null);
  }

  // Permette di rinominare una tappa
  editPlace(i: number, slot: typeof this.slots[number]) {
    const name = prompt('Nome luogo?');
    if (!name) return;
    const d = structuredClone(this.days());
    d[this.activeDay()][slot][i].name = name;
    this.days.set(d);
  }

  // Drag & drop di una tappa nello slot
  drop(event: CdkDragDrop<Place[]>, slot: typeof this.slots[number]) {
    const d = structuredClone(this.days());
    moveItemInArray(d[this.activeDay()][slot], event.previousIndex, event.currentIndex);
    this.days.set(d);
  }

  // Rimuove una tappa dallo slot
  removePlace(slot: typeof this.slots[number], index: number) {
    const d = structuredClone(this.days());
    d[this.activeDay()][slot].splice(index, 1);
    this.days.set(d);
  }

  // Salva tutte le tappe (invio array tappe aggiornate al backend)
  saveItinerary() {
    const itineraryId = this.route.snapshot.queryParamMap.get('id');
    const userId = localStorage.getItem('userId'); 
    if (!userId || !itineraryId) return;
    const frontendPlaces = this.flattenPlaces(this.days());
    const backendPlaces = frontendPlaces.map(p => ({
      placeId: p.placeId,
      name: p.name,
      day: p.day,
      timeSlot: p.timeSlot,
      lat: p.latitude ?? null,
      lng: p.longitude ?? null,
      address: p.address ?? '',
      photoUrl: p.photoUrl ?? '',
      photoFilename: p.photoFilename ?? '',
      type: p.type ?? '',
      note: p.note ?? '',
      rating: p.rating ?? null,
      priceLevel: p.priceLevel ?? null,
      website: p.website ?? null,
      openingHours: p.openingHours ?? null
    }));
    this.itineraryService.updateItineraryPlaces(userId, itineraryId, backendPlaces).subscribe({
      next: () => console.log('Tappe aggiornate con successo'),
      error: err => console.error('Errore durante salvataggio tappe:', err)
    });
  }

  // Converte array raggruppato in flat
  private flattenPlaces(days: DayData[]): Place[] {
    const flat: Place[] = [];
    days.forEach((dayData, dayIndex) => {
      this.slots.forEach(slot => {
        dayData[slot].forEach(place => {
          flat.push({ ...place, day: dayIndex + 1, timeSlot: slot });
        });
      });
    });
    return flat;
  }

  // Utility: crea un oggetto Place da Google
  createFrontendPlaceFromGoogle(place: any, slot: 'morning' | 'afternoon' | 'evening', day: number, type: string): Place {
    return {
      placeId: place.place_id || ('place_' + Date.now()),
      name: place.name,
      day: day,
      timeSlot: slot,
      latitude: place.geometry?.location?.lat() ?? null,
      longitude: place.geometry?.location?.lng() ?? null,
      address: place.formatted_address ?? '',
      photoUrl: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=YOUR_API_KEY`
        : '',
      type: type,
      note: ''
    };
  }

  // Adatta una tappa per il backend
  convertToBackendPlace(p: Place) {
    return {
      placeId: p.placeId,
      name: p.name,
      day: p.day,
      timeSlot: p.timeSlot,
      lat: p.latitude,
      lng: p.longitude,
      address: p.address,
      photoUrl: p.photoUrl,
      type: p.type,
      note: p.note
    };
  }

  // Chiede al backend i dettagli di un luogo
  fetchSinglePlaceFromBackend(query: string, city: string, anchor: { lat: number, lng: number }): Promise<any> {
    return this.itineraryService.getSinglePlace(query, city, anchor).toPromise();
  }

  // Estrae il nome della città dalla stringa backend
  extractCityName(full: string): string {
    const parts = full.split(',');
    const core = parts[0].trim();
    const tokens = core.split(' ');
    return tokens.find(word => isNaN(Number(word))) || 'Roma';
  }

  // Getter: slot del giorno attivo
  get currentDaySlots() {
    const day = this.days()?.[this.activeDay()];
    return day ? day : { morning: [], afternoon: [], evening: [] };
  }

  // True se la tappa è alloggio (esclude drag/cestino)
  isAccommodation(p: Place): boolean {
    return p.type === 'accommodation' ||
      (p.type === '' && p.name.toLowerCase().includes('alloggio')) ||
      (p.type === undefined && p.name.toLowerCase().includes('alloggio'));
  }

  // True se la tappa è la prima/ultima nello slot
  isEdge(index: number, slot: typeof this.slots[number]): boolean {
    const arr = this.days()[this.activeDay()][slot];
    return index === 0 || index === arr.length - 1;
  }

  icons = { addOutline, homeOutline, createOutline, settingsOutline };
}