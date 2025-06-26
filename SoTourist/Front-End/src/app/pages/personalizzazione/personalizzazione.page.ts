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

// Struttura dati: una giornata di itinerario è composta da slot temporali
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
  // Nome città di riferimento
  city: string = '';

  // Router e servizi necessari, ottenuti con inject
  private readonly route = inject(ActivatedRoute);
  private readonly itineraryService = inject(ItineraryService);
  private readonly boundsService = inject(BoundsService);

  // Bounding box geografico per limitare i risultati (viene inizializzato a inizio)
  tripBounds!: google.maps.LatLngBounds;

  // Stato reattivo: giorni dell'itinerario (ogni giorno ha slot) e giorno attivo
  days = signal<DayData[]>([]);
  activeDay = signal(0);

  // Slot temporali possibili e label visuali per ogni slot
  slots = ['morning', 'afternoon', 'evening'] as const;
  slotName: Record<string, string> = {
    morning: 'Mattina',
    afternoon: 'Pomeriggio',
    evening: 'Sera'
  };

  // Stato per popup aggiunta luogo: se è aperto, tipo di luogo e slot attivo
  autocompleteOpen = signal(false);
  autocompleteType = signal<'restaurant' | 'tourist_attraction' | null>(null);
  autocompleteSlot = signal<typeof this.slots[number] | null>(null);

  // Caricamento dati all’avvio (prende bounds, città e tappe)
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const itineraryId = params['id'];
      if (!itineraryId) return;

      // Caricamento bounding box da parametri query, se presenti
      if (params['north'] && params['south'] && params['east'] && params['west']) {
        this.tripBounds = new google.maps.LatLngBounds(
          { lat: parseFloat(params['south']), lng: parseFloat(params['west']) },
          { lat: parseFloat(params['north']), lng: parseFloat(params['east']) }
        );
      } else {
        // Fallback bounds generico
        this.tripBounds = new google.maps.LatLngBounds(
          { lat: 42.0, lng: 11.0 },
          { lat: 43.0, lng: 12.0 }
        );
      }

      // Richiede itinerario dal backend
      this.itineraryService.getItineraryById(itineraryId).subscribe({
        next: async (res: any) => {
          // Organizza le tappe: se sono già raggruppate, usa quelle, altrimenti raggruppa
          const grouped = this.isGrouped(res.itinerary)
            ? res.itinerary as DayData[]
            : this.groupFlatPlaces(res.itinerary as Place[]);

          // Ricava la città dal campo city (solo la parte utile)
          this.city = this.extractCityName(res.city);

          // Aggiorna i bounds in base alla città se possibile (API BoundsService)
          this.boundsService.getCityBounds(this.city).then(bounds => {
            if (bounds) {
              this.tripBounds = bounds;
            }
          });

          // Stato reattivo: setta i giorni per la UI
          this.days.set(grouped);
        },
        error: err => console.log('Errore caricamento:', err)
      });
    });
  }

  // Determina se un array è già raggruppato per slot oppure flat (caso legacy/backend)
  private isGrouped(arr: any[]): arr is DayData[] {
    return Array.isArray(arr) && arr.length > 0 && 'morning' in arr[0];
  }

  // Trasforma un array flat di tappe in un array raggruppato per giorno e slot
  private groupFlatPlaces(flat: Place[]): DayData[] {
    // Trova il numero massimo di giorni presenti
    const maxDay = flat.reduce((max, p) => Math.max(max, p.day), 0);

    // Crea la struttura vuota per ogni giorno
    const grouped: DayData[] = Array.from({ length: maxDay }, () => ({
      morning: [], afternoon: [], evening: []
    }));

    // Inserisce ogni tappa nello slot giusto del giorno giusto
    flat.forEach(p => {
      const d = p.day - 1;
      grouped[d][p.timeSlot].push(p);
    });
    return grouped;
  }

  // Aggiorna il giorno attivo sulla sidebar
  selectDay(i: number) {
    this.activeDay.set(i);
  }

  // Avvia la procedura di aggiunta luogo, aprendo il popup
  addPlace(slot: typeof this.slots[number]) {
    this.autocompleteSlot.set(slot);
    this.autocompleteOpen.set(true);
  }

  // Sceglie il tipo di luogo da cercare nell'autocomplete (ristorante/attrazione)
  startAutocomplete(type: 'restaurant' | 'tourist_attraction') {
    this.autocompleteType.set(type);
  }

  // True se bisogna visualizzare il campo autocomplete Google (usato in template)
  showAutocompleteInput() {
    return this.autocompleteOpen() && !!this.autocompleteType();
  }

  // Gestisce la selezione di un luogo tramite autocomplete Google
  async onPlaceSelected(place: any) {
    const slot = this.autocompleteSlot();
    const type = this.autocompleteType();
    if (!slot || !type) return;

    // Costruisce la query per il backend
    const query = place.name;
    const day = this.activeDay() + 1;
    const city = this.city || 'Roma';

    try {
      // Posizione centrale del bounding box (usata per ancorare la ricerca)
      const center = this.tripBounds.getCenter();

      // Chiamata backend: trova il luogo giusto
      const result = await this.fetchSinglePlaceFromBackend(query, city, {
        lat: center.lat(),
        lng: center.lng()
      });
      if (!result) return;

      // Costruisce oggetto Place per frontend
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

      // Aggiorna stato UI (aggiunge la nuova tappa)
      const d = structuredClone(this.days());
      d[this.activeDay()][slot].push(frontendPlace);
      this.days.set(d);

      // Prepara e salva la tappa sul backend
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

    // Chiude popup e resetta tipo/slot
    this.autocompleteOpen.set(false);
    this.autocompleteType.set(null);
    this.autocompleteSlot.set(null);
  }

  // Permette di rinominare una tappa (da dialog prompt)
  editPlace(i: number, slot: typeof this.slots[number]) {
    const name = prompt('Nome luogo?');
    if (!name) return;
    const d = structuredClone(this.days());
    d[this.activeDay()][slot][i].name = name;
    this.days.set(d);
  }

  // Drag & drop: sposta una tappa in un altro punto dello slot
  drop(event: CdkDragDrop<Place[]>, slot: typeof this.slots[number]) {
    const d = structuredClone(this.days());
    moveItemInArray(d[this.activeDay()][slot], event.previousIndex, event.currentIndex);
    this.days.set(d);
  }

  // Rimuove una tappa dallo slot (es. click su cestino)
  removePlace(slot: typeof this.slots[number], index: number) {
    const d = structuredClone(this.days());
    d[this.activeDay()][slot].splice(index, 1);
    this.days.set(d);
  }

  // Salva tutte le modifiche fatte (invio nuovo array tappe al backend)
  saveItinerary() {
    const itineraryId = this.route.snapshot.queryParamMap.get('id');
    const userId = localStorage.getItem('userId');
    if (!userId || !itineraryId) return;

    // Appiattisce i dati (ogni tappa con giorno/slot corretti)
    const places = this.days().flatMap((day, index) => {
      return this.slots.flatMap(slot => {
        return day[slot].map((p, idx) => ({
          ...p,
          day: index + 1,
          timeSlot: slot
        }));
      });
    });

    // Salva tramite API
    this.itineraryService.updateItineraryPlaces(userId, itineraryId, places).subscribe({
      next: () => {
        console.log('Tappe aggiornate con successo');
      },
      error: err => {
        console.log('Errore durante salvataggio tappe:', err);
      }
    });
  }

  // (Quasi mai usato) converte da struttura raggruppata a flat
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

  // Utility: crea un oggetto Place partendo dalla risposta Google
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

  // Conversione per backend (adatta i nomi campi)
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

  // Chiama il backend per ottenere dettagli di un singolo luogo (nome, città, anchor geografico)
  fetchSinglePlaceFromBackend(query: string, city: string, anchor: { lat: number, lng: number }): Promise<any> {
    return this.itineraryService.getSinglePlace(query, city, anchor).toPromise();
  }

  // Estrae solo il nome città da una stringa tipo "05100 Terni TR, Italia"
  extractCityName(full: string): string {
    const parts = full.split(',');
    const core = parts[0].trim();
    const tokens = core.split(' ');
    return tokens.find(word => isNaN(Number(word))) || 'Roma';
  }

  // Getter di supporto: restituisce gli slot del giorno attivo, oppure oggetto vuoto
  get currentDaySlots() {
    const day = this.days()?.[this.activeDay()];
    return day ? day : { morning: [], afternoon: [], evening: [] };
  }

  // True se la tappa è alloggio (esclude dal drag, non mostra cestino)
  isAccommodation(p: Place): boolean {
    return p.type === 'accommodation' ||
      (p.type === '' && p.name.toLowerCase().includes('alloggio')) ||
      (p.type === undefined && p.name.toLowerCase().includes('alloggio'));
  }

  // True se la tappa è la prima/ultima nello slot (per disabilitare drag & drop su alloggio)
  isEdge(index: number, slot: typeof this.slots[number]): boolean {
    const arr = this.days()[this.activeDay()][slot];
    return index === 0 || index === arr.length - 1;
  }

  // Icone usate nel template
  icons = { addOutline, homeOutline, createOutline, settingsOutline };
}