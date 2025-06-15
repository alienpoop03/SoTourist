import {
  Component,
  signal,
  OnInit,            // <─ implementiamo OnInit
  inject
} from '@angular/core';
import {
  CommonModule, NgFor, NgIf
} from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonGrid, IonRow, IonCol, IonList, IonItem,
  IonIcon, IonLabel, IonButton, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addOutline, homeOutline, createOutline, settingsOutline } from 'ionicons/icons';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { ItineraryService } from '../../services/itinerary.service';
import { Place } from '../../models/trip.model';
import { LuogoCardComponent } from '../../components/luogo-card/luogo-card.component';
import { GoogleAutocompleteComponent } from '../../components/google-autocomplete/google-autocomplete.component';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';

type DayData = { morning: Place[]; afternoon: Place[]; evening: Place[] };

@Component({
  selector: 'app-personalizzazione',
  standalone: true,
  templateUrl: './personalizzazione.page.html',
  styleUrls: ['./personalizzazione.page.scss'],
  imports: [
    CommonModule, NgFor, NgIf,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonGrid, IonRow, IonCol, IonList, IonItem,
    IonIcon, IonLabel,
    DragDropModule, LuogoCardComponent,
    IonButton, IonFab, IonFabButton,
    GoogleAutocompleteComponent, // 👈 aggiungi questo!
    NavigationBarComponent

  ],
})
export class PersonalizzazionePage implements OnInit {
  city: string = '';

  /* ---------- DI ---------- */
  private readonly route = inject(ActivatedRoute);
  private readonly itineraryService = inject(ItineraryService);
  tripBounds!: google.maps.LatLngBounds;

  /* ---------- State ---------- */
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


  /* ---------- Lifecycle ---------- */
  ngOnInit(): void {
    const itineraryId = this.route.snapshot.queryParamMap.get('id');
    if (!itineraryId) return;

    this.itineraryService.getItineraryById(itineraryId).subscribe({
      next: async (res: any) => {
        const grouped = this.isGrouped(res.itinerary)
          ? res.itinerary as DayData[]
          : this.groupFlatPlaces(res.itinerary as Place[]);


        this.city = this.extractCityName(res.city);
        const q = this.route.snapshot.queryParamMap;

        const north = q.get('north');
        const east = q.get('east');
        const south = q.get('south');
        const west = q.get('west');

        if (north && east && south && west) {
          const sw = new google.maps.LatLng(+south, +west);
          const ne = new google.maps.LatLng(+north, +east);
          this.tripBounds = new google.maps.LatLngBounds(sw, ne);
          console.log('📦 [Personalizzazione] Bounds ricevuti da queryParams:', this.tripBounds.toJSON());
        } else {
          console.warn('⚠️ Bounds non presenti nei queryParams. Autocomplete disabilitato o mal funzionante.');
        }




        this.days.set(grouped);
      },

      error: err => console.error('[Personalizzazione] errore caricamento:', err)
    });
  }


  /* ---------- Utils ---------- */
  private isGrouped(arr: any[]): arr is DayData[] {
    return Array.isArray(arr) && arr.length > 0 && 'morning' in arr[0];
  }

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

  /* ---------- UI handlers ---------- */
  selectDay(i: number) { this.activeDay.set(i); }

  addPlace(slot: typeof this.slots[number]) {
    this.autocompleteSlot.set(slot);
    this.autocompleteOpen.set(true);
  }
  startAutocomplete(type: 'restaurant' | 'tourist_attraction') {
    this.autocompleteType.set(type);
  }
  showAutocompleteInput() {
    return this.autocompleteOpen() && !!this.autocompleteType();
  }

  async onPlaceSelected(place: any) {
    const slot = this.autocompleteSlot();
    const type = this.autocompleteType();
    if (!slot || !type) return;

    const query = place.name;
    const day = this.activeDay() + 1;
    const city = this.city || 'Roma';

    try {
      const result = await this.fetchSinglePlaceFromBackend(query, city);
      if (!result) return;

      const frontendPlace: Place = {
        placeId: result.placeId || ('place_' + Date.now()),
        name: result.name,
        day,
        timeSlot: slot,
        latitude: result.latitude ?? null,
        longitude: result.longitude ?? null,
        address: result.address ?? '',
        photoUrl: result.photo ?? '',
        type: type,
        note: ''
      };

      // Aggiungi alla UI
      const d = structuredClone(this.days());
      d[this.activeDay()][slot].push(frontendPlace);
      this.days.set(d);

      // Salva nel backend
      const backendPlace = this.convertToBackendPlace(frontendPlace);
      const userId = localStorage.getItem('userId')!;
      const itineraryId = this.route.snapshot.queryParamMap.get('id')!;
      this.itineraryService.addPlacesToItinerary(userId, itineraryId, [backendPlace]).subscribe({
        next: () => console.log('✅ Tappa salvata dal backend'),
        error: err => console.error('❌ Errore salvataggio:', err)
      });

    } catch (err) {
      console.error('❌ Errore fetch dal backend:', err);
    }

    this.autocompleteOpen.set(false);
    this.autocompleteType.set(null);
    this.autocompleteSlot.set(null);
  }




  editPlace(i: number, slot: typeof this.slots[number]) {
    const name = prompt('Nome luogo?');
    if (!name) return;
    const d = structuredClone(this.days());
    d[this.activeDay()][slot][i].name = name;
    this.days.set(d);
  }

  drop(event: CdkDragDrop<Place[]>, slot: typeof this.slots[number]) {
    /* const arr = this.days()[this.activeDay()][slot];
 
     // Blocca se si prova a mettere qualcosa sopra/sotto l’alloggio
     if (event.currentIndex === 0 || event.currentIndex === arr.length - 1) {
       console.warn('⛔️ Non puoi spostare in cima o in fondo (riservato all’alloggio)');
       return;
     }
 
     // Blocca se si cerca di spostare una card non intermedia
     if (event.previousIndex === 0 || event.previousIndex === arr.length - 1) {
       console.warn('⛔️ Non puoi spostare l’alloggio');
       return;
     }*/

    const d = structuredClone(this.days());
    moveItemInArray(d[this.activeDay()][slot], event.previousIndex, event.currentIndex);
    this.days.set(d);
  }

  removePlace(slot: typeof this.slots[number], index: number) {
    const d = structuredClone(this.days());
    d[this.activeDay()][slot].splice(index, 1);
    this.days.set(d);
  }
  saveItinerary() {
    const itineraryId = this.route.snapshot.queryParamMap.get('id');
    const userId = localStorage.getItem('userId'); // o come lo gestisci tu

    if (!userId || !itineraryId) return;

    // 1. Appiattisci tutte le tappe in un array unico
    const places = this.days().flatMap((day, index) => {
      return this.slots.flatMap(slot => {
        return day[slot].map((p, idx) => ({
          ...p,
          day: index + 1,
          timeSlot: slot
        }));
      });
    });

    // 2. Chiamata API
    this.itineraryService.updateItineraryPlaces(userId, itineraryId, places).subscribe({
      next: () => {
        console.log('✅ Tappe aggiornate con successo');
      },
      error: err => {
        console.error('❌ Errore durante salvataggio tappe:', err);
      }
    });
  }


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

  fetchSinglePlaceFromBackend(query: string, city: string): Promise<any> {
    return this.itineraryService.getSinglePlace(query, city).toPromise();
  }
  extractCityName(full: string): string {
    // Prende solo il primo token con la prima parola valida
    const parts = full.split(',');
    const core = parts[0].trim();         // "05100 Terni TR"
    const tokens = core.split(' ');       // ["05100", "Terni", "TR"]
    return tokens.find(word => isNaN(Number(word))) || 'Roma';  // es: "Terni"
  }
  get currentDaySlots() {
    const day = this.days()?.[this.activeDay()];
    return day ? day : { morning: [], afternoon: [], evening: [] };
  }

  isAccommodation(p: Place): boolean {
    return p.type === 'accommodation' ||
      (p.type === '' && p.name.toLowerCase().includes('alloggio')) ||
      (p.type === undefined && p.name.toLowerCase().includes('alloggio'));
  }

  isEdge(index: number, slot: typeof this.slots[number]): boolean {
    const arr = this.days()[this.activeDay()][slot];
    return index === 0 || index === arr.length - 1;
  }

  /* ---------- Icons ---------- */
  icons = { addOutline, homeOutline, createOutline, settingsOutline };
}

