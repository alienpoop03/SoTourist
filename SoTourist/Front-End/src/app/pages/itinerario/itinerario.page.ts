// itinerario.page.ts
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';

import { TripWithId } from '../../models/trip.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { GenerationOverlayComponent } from '../../components/generation-overlay/generation-overlay.component';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { PhotoService } from '../../services/photo.service';
import { GoogleAutocompleteComponent } from '../../components/google-autocomplete/google-autocomplete.component';
import { GenerateItineraryRequest } from '../../services/api.service';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { BoundsService } from '../../services/bounds.service';

/* ───── Ionic standalone components usati nel template ───── */
import {
  IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption,
  IonTextarea,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';


// IMPORT DEI NUOVI MODELLI, VEDIAMO CHE SUCCEDE
import { GeneratedDay } from '../../models/generated-day.model';
import { Place } from '../../models/trip.model';

function convertGeneratedToPlaces(generatedDays: GeneratedDay[]): Place[] {
  const slotOrder: ('morning' | 'afternoon' | 'evening')[] = [
    'morning',
    'afternoon',
    'evening'
  ];
  const places: Place[] = [];

  generatedDays.forEach((dayObj, dayIdx) => {
    const day = dayIdx + 1;

    slotOrder.forEach(slot => {
      const list = (dayObj as any)[slot] || [];
      list.forEach((p: any) => {
        const latitude = p.lat ?? p.latitude;
        const longitude = p.lng ?? p.longitude;

        places.push({
          /* fondamentali -------------------------------------------------- */
          placeId: p.placeId,
          name: p.name,
          day,
          timeSlot: slot,
          latitude,
          longitude,
          address: p.address ?? '',
          photoUrl: p.photo ?? '',
          photoReference: p.photoReference ?? '',

          /* nuovi campi --------------------------------------------------- */
          rating: p.rating ?? null,
          priceLevel: p.priceLevel ?? null,
          website: p.website ?? null,
          openingHours: p.openingHours ?? null,

          /* segnaposto per eventuali tag utente --------------------------- */
          type: p.type ?? '',
          note: p.note ?? ''
        });
      });
    });
  });

  return places;
}





function generatePlaceId(name: string, day: number, slot: string): string {
  const clean = name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  return `place_${clean}_${day}_${slot}`;
}

///////////////////////////////////////////////////////////////////////////

/* Helper per attendere Google Maps/Places */
function whenGoogleMapsReady(): Promise<void> {
  return new Promise(resolve => {
    if ((window as any).google && (window as any).google.maps) {
      resolve();
    } else {
      (window as any).initMap = () => resolve();
    }
  });
}
type EditorField = 'mustSee' | 'eat' | 'visited' | 'transport' | 'ai' | 'style';

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [
    /* Angular */
    CommonModule,
    FormsModule,
    /* Ionic */
    IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption,
    IonTextarea,
    IonButton,
    IonIcon,

    /* Componenti custom */
    GenerationOverlayComponent,
    GoogleAutocompleteComponent
  ],
  templateUrl: './itinerario.page.html',
  styleUrls: ['./itinerario.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ItinerarioPage implements AfterViewInit {
  /* Riferimenti al DOM Ionic */
  @ViewChild(IonContent, { static: true }) content!: IonContent;
  // ─── Pager: nomi delle slide e indice corrente ───
  slideNames: string[] = ['Luoghi', 'Preferenze'];
  currentSlide = 0;

  // Reference al container orizzontale
  @ViewChild('scrollContainer', { static: true })
  scrollContainer!: ElementRef<HTMLElement>;
  // ────────────────────────────────────────────────

  /* Dati del viaggio */
  trip: any = { itinerary: [] };
  itineraryId!: string;
  isLocalTrip = false;

  /* Flag UI */
  isLoading = false;


  //altre cose
  tripTransport: string = '';
  tripPrompt: string = '';

  // slide 0
  tripMustSee: Place[] = [];
  tripEatPlaces: Place[] = [];
  tripAlreadyVisited: Place[] = [];



  tripBounds: google.maps.LatLngBounds | null = null;

  /* Opzioni predefinite */

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private api: ApiService,
    private itineraryService: ItineraryService,
    private auth: AuthService,
    private boundsService: BoundsService,   // ✅ aggiunto qui!

  ) { }

  /* ───── Lifecycle ───── */
  async ngAfterViewInit() {
    await whenGoogleMapsReady();
    this.goToSlide(0); // 👈 forza scroll a "Luoghi"

  }

  ionViewWillEnter() {

    this.tripMustSee = [];
    this.tripEatPlaces = [];
    this.tripAlreadyVisited = [];
    this.tripTransport = '';
    this.tripPrompt = '';
    this.itineraryId = this.route.snapshot.queryParamMap.get('id')!;

    const localTrips = JSON.parse(localStorage.getItem('trips') || '[]');

    const localTrip = localTrips.find((t: any) => {
      return (
        t?.itineraryId === this.itineraryId ||
        (t?.id != null && t.id.toString?.() === this.itineraryId)
      );
    });

    if (localTrip) {
      this.trip = {
        itineraryId: localTrip.itineraryId ?? localTrip.id?.toString() ?? 'undefined',
        city: localTrip.city,
        startDate: localTrip.startDate ?? localTrip.start,
        endDate: localTrip.endDate ?? localTrip.end,
        accommodation: localTrip.accommodation,
        style: 'generico',
        itinerary: localTrip.itinerary || []
      };

      this.isLocalTrip = true;

      if (this.trip.city) {
        this.boundsService.getCityBounds(this.trip.city).then(bounds => {
          if (bounds) {
            this.tripBounds = bounds;
            const { north, east, south, west } = bounds.toJSON();
            this.trip.bounds = { north, east, south, west }; // 🔒 salvo nel trip
            console.log('[itinerario] Bounds caricati:', this.trip.bounds);
          } else {
            console.warn('[itinerario] Nessun bounds trovato per', this.trip.city);
          }
        });
      }

      console.log('[📷 COVERPHOTO] 🛑 Bozza: usata immagine di fallback.');
      return;
    }

    // Altrimenti carica dal backend: se già generato → reindirizza subito a panoramica
    this.itineraryService.getItineraryById(this.itineraryId).subscribe({
      next: (res) => {
        this.trip = res;
        this.isLocalTrip = false;

        // 🔥 Reindirizza direttamente a panoramica
        this.router.navigate(['/tabs/panoramica'], {
          queryParams: { id: this.itineraryId }
        });
      },
      error: (err) => {
        console.error('Errore caricamento itinerario:', err);
        this.router.navigate(['/tabs/viaggi']);
      }
    });
  }

  /* ───── Scroll hero dinamico ───── */
  onScroll(ev: Event): void {
    const c = this.scrollContainer.nativeElement;
    const idx = Math.round(c.scrollLeft / c.clientWidth);
    this.currentSlide = Math.min(Math.max(idx, 0), this.slideNames.length - 1);
  }
  /**
   * Scrolla dolcemente alla slide i-esima
   */
  goToSlide(i: number): void {
    const c = this.scrollContainer.nativeElement;
    c.scrollTo({
      left: i * c.clientWidth,
      behavior: 'smooth'
    });
  }


  generateItinerary() {
    const userId = this.auth.getUserId();

    // ⚠️ Blocco per ospiti
    if (userId?.startsWith('guest_')) {
      //this.showLoginAlert();
      localStorage.setItem('redirectAfterLogin', '/tabs/itinerario?id=' + this.trip?.itineraryId);
      this.router.navigate(['/login']);
      return;
    }

    if (!this.isLocalTrip) return; // Non generare se non è una bozza

    const trip = this.trip;
    if (!trip) {
      this.isLoading = false;
      return;
    }

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    this.isLoading = true;
    const payload: GenerateItineraryRequest = {
      city: trip.city,
      totalDays: days,
      accommodation: trip.accommodation,
      transport: this.tripTransport || 'walk',  // <-- AGGIUNTA QUESTA RIGA
      style: this.trip?.style || 'Standard',  // 👈 AGGIUNTA QUI

      mustSee: this.tripMustSee.map(p => p.placeId),
      mustEat: this.tripEatPlaces.map(p => p.placeId),
      avoid: this.tripAlreadyVisited.map(p => p.placeId),
    };

    this.api.getItinerary(payload).subscribe({
      next: (res) => {
        console.log('✅ [GENERAZIONE] Risposta da backend:', res);
        console.table(res.itinerary);

        //console.log('📥 Risposta completa da /api/itinerary:', res);
        // console.table(res.itinerary);
        /*console.log('👉 Tutti i luoghi flattenati:',
          ([] as any[]).concat(...res.itinerary.map((day: any) => day.ordered || []))
        );*/
        trip.itinerary = res.itinerary;

        const allPlaces: Place[] = convertGeneratedToPlaces(res.itinerary);
        console.log('🔥 [CONVERSIONE] Risultato convertGeneratedToPlaces:', allPlaces);
        console.table(allPlaces);

        const userId = this.auth.getUserId();
        if (!userId) {
          console.error('User ID mancante');
          this.isLoading = false;
          return;
        }

        // ✅ Se è una bozza → salvala nel backend prima
        if (this.isLocalTrip) {

          // 🧠 DEBUG: origine della coverPhoto
          if (res.coverPhoto) {
            console.log('[📷 COVERPHOTO] ✅ Usata quella GENERATA dal backend:', res.coverPhoto);
          } else if (trip.coverPhoto) {
            console.log('[📷 COVERPHOTO] 🔁 Usata quella SALVATA nella bozza:', trip.coverPhoto);
          } else {
            console.warn('[📷 COVERPHOTO] ⚠️ Nessuna foto di copertina disponibile!');
          }
          /*console.log('🟡 Dati inviati al backend:', {
            city: trip.city,
            accommodation: trip.accommodation,
            startDate: trip.startDate,
            endDate: trip.endDate,
            coverPhoto: res.coverPhoto ?? '', // 👈 NOME GIUSTO!
            style: trip.style
          }); */

          this.itineraryService.createItinerary(userId, {
            city: trip.city,
            accommodation: trip.accommodation,
            startDate: trip.startDate,
            endDate: trip.endDate,
            coverPhoto: res.coverPhoto ?? '',
            style: trip.style
          }).subscribe({
            next: (createdTrip: any) => {
              // 1) Aggiorna gli ID
              const oldId = trip.itineraryId;
              trip.itineraryId = createdTrip.itineraryId;
              this.itineraryId = createdTrip.itineraryId;
              this.isLocalTrip = false;

              // 2) Pulisci la bozza salvata in localStorage
              const localTrips = JSON.parse(localStorage.getItem('trips') || '[]');
              const updated = localTrips.filter((t: any) => t.itineraryId !== oldId);
              localStorage.setItem('trips', JSON.stringify(updated));

              // 3) Prepara il payload corretto per le tappe
              const placesPayload = allPlaces.map(p => ({
                placeId: p.placeId,
                name: p.name,
                day: p.day,
                timeSlot: p.timeSlot,
                lat: p.latitude,
                lng: p.longitude,
                address: p.address ?? '',
                photoUrl: p.photoUrl ?? '',
                photoReference: p.photoReference ?? '',   // già presente ✅

                /*  ➡️  NUOVI  */
                rating: p.rating,
                priceLevel: p.priceLevel,
                website: p.website,
                openingHours: p.openingHours,

                type: p.type ?? '',
                note: p.note ?? ''
              }));



              console.log('🛠️ [PAYLOAD] placesPayload:', placesPayload);

              // 4) Salva le tappe sul backend
              this.itineraryService
                .addPlacesToItinerary(userId, createdTrip.itineraryId, placesPayload)
                .subscribe({
                  next: () => {
                    console.log('✅ Tappe salvate nel backend');
                    this.isLoading = false;

                    // → Redirect automatico alla panoramica
                    this.router.navigate(['/panoramica'], {
                      queryParams: { id: createdTrip.itineraryId }
                    });
                  },
                  error: (err) => {
                    console.error('❌ Errore salvataggio tappe:', err);
                    this.isLoading = false;
                  }
                });

            },
            error: (err) => {
              console.error('❌ Errore salvataggio itinerario:', err);
              this.isLoading = false;
            }
          });


        } else {
          // 🟢 Già esiste → salva direttamente le tappe
          // dopo
          this.savePlaces(userId, this.itineraryId, allPlaces);
        }
      },
      error: (err) => {
        console.error('Errore nella generazione:', err);
        this.isLoading = false;
      }
    });
  }

  async showLoginAlert() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Accesso richiesto';
    alert.message = 'Per salvare l’itinerario devi effettuare il login.';
    alert.buttons = [
      { text: 'Annulla', role: 'cancel' },
      {
        text: 'Accedi',
        handler: () => {
          localStorage.setItem('redirectAfterLogin', '/tabs/itinerario?id=' + this.trip?.itineraryId);
          this.router.navigate(['/login']);
        }
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  // ➕ Funzione separata per salvare le tappe NEL BACK EDN SQLITE
  private savePlaces(userId: string, itineraryId: string, places: Place[]) {
    const payload = places.map(p => ({
      placeId: p.placeId,
      name: p.name,
      day: p.day,
      timeSlot: p.timeSlot,
      lat: p.latitude,
      lng: p.longitude,
      address: p.address ?? '',
      photoUrl: p.photoUrl ?? '',
      photoReference: p.photoReference ?? '',  // ➕ (mancava)

      /*  ➡️  NUOVI  */
      rating: p.rating,
      priceLevel: p.priceLevel,
      website: p.website,
      openingHours: p.openingHours,

      type: p.type ?? '',
      note: p.note ?? ''
    }));

    this.itineraryService
      .addPlacesToItinerary(userId, itineraryId, payload)
      .subscribe(/* … */);
  }


  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  }


  // tutta la parte delle modali, evvai siamo a 500 righe di codice
  editorVisible = false;
  editorMode: EditorField | null = null;
  editorValue = '';
  selectedDays: number[] = [];

  openEditorInline(mode: EditorField) {
    this.editorMode = mode;
    this.editorVisible = true;

    // Solo per i campi testuali
    if (!['mustSee', 'eat', 'visited'].includes(mode)) {
      this.editorValue = this.getValueForMode(mode);
    } else {
      this.editorValue = '';
    }

    this.selectedDays = this.getSelectedDaysForMode(mode);
  }

  saveEditorValue() {
    if (!this.editorMode) return;

    if (!['mustSee', 'eat', 'visited'].includes(this.editorMode)) {
      this.setValueForMode(this.editorMode, this.editorValue);
    }

    this.closeEditor();
  }


  closeEditor() {
    this.editorVisible = false;
    this.editorMode = null;
    this.editorValue = '';
    this.selectedDays = [];
  }

  getValueForMode(mode: EditorField): string {
    switch (mode) {
      case 'transport': return this.tripTransport;
      case 'ai': return this.tripPrompt;
      case 'style': return this.trip?.style || '';
      default: return '';
    }
  }

  setValueForMode(mode: EditorField, value: string): void {
    switch (mode) {
      case 'transport':
        this.tripTransport = value;
        break;

      case 'ai':
        this.tripPrompt = value;
        break;

      case 'style':
        if (this.trip) this.trip.style = value;
        break;
    }
  }

  getSelectedDaysForMode(mode: string): number[] {
    if (!this.trip?.itinerary) return [];

    switch (mode) {
      case 'mustSee':
      case 'eat':
      case 'visited':
        return this.trip.itinerary
          .map((day: any, i: number) => day.mustSee?.length > 0 ? i : null)
          .filter((i: number | null) => i !== null) as number[];
      default:
        return [];
    }
  }

  selectValue(value: string) {
    if (!this.editorMode) return;
    this.setValueForMode(this.editorMode, value);
    this.closeEditor();
  }

  addPlace(list: Place[], place: Place) {
    const exists = list.some(p => p.placeId === place.placeId);
    if (!exists) list.push(place);
  }

  removePlace(list: Place[], idx: number) {
    list.splice(idx, 1);
  }

  /* ---------- wrapper specifici ---------- */
  addMustSeePlace = (p: Place) => this.addPlace(this.tripMustSee, p);
  addEatPlace = (p: Place) => this.addPlace(this.tripEatPlaces, p);
  addVisitedPlace = (p: Place) => this.addPlace(this.tripAlreadyVisited, p);

  removeMustSeePlace = (i: number) => this.removePlace(this.tripMustSee, i);
  removeEatPlace = (i: number) => this.removePlace(this.tripEatPlaces, i);
  removeVisitedPlace = (i: number) => this.removePlace(this.tripAlreadyVisited, i);
  onPlaceSelected(mode: EditorField, result: google.maps.places.PlaceResult) {
    if (!result.place_id || !result.name || !result.geometry) {
      console.warn('Luogo non valido:', result);
      return;
    }

    const place: Place = {
      placeId: result.place_id,
      name: result.name,
      day: -1, // ❗️Non assegnato ancora a un giorno
      timeSlot: 'morning', // default temporaneo
      latitude: result.geometry.location?.lat() ?? 0,
      longitude: result.geometry.location?.lng() ?? 0,
      address: result.formatted_address ?? '',
      photoUrl: result.photos?.[0]?.getUrl({ maxWidth: 400 }) ?? '',
      rating: result.rating ?? 0,
      type: '', // da assegnare se vuoi filtrare
      note: ''
    };

    switch (mode) {
      case 'mustSee':
        this.tripMustSee.push(place);
        break;
      case 'eat':
        this.tripEatPlaces.push(place);
        break;
      case 'visited':
        this.tripAlreadyVisited.push(place);
        break;
    }
  }


  removePlaceFromMode(mode: EditorField, index: number): void {
    const list = this.getListForMode(mode);
    list.splice(index, 1);
  }

  getListForMode(mode: EditorField): Place[] {
    switch (mode) {
      case 'mustSee': return this.tripMustSee;
      case 'eat': return this.tripEatPlaces;
      case 'visited': return this.tripAlreadyVisited;
      default: return [];
    }
  }

  vaiAPersonalizzazione() {
  const bounds = this.trip.bounds;
  this.router.navigate(['/personalizzazione'], {
    queryParams: {
      id: this.trip.itineraryId,
      north: bounds?.north,
      east: bounds?.east,
      south: bounds?.south,
      west: bounds?.west
    }
  });
}

  // metodo per la navigazione
  vaiAllaPanoramica() {
    this.router.navigate(['/panoramica'], {
      queryParams: { id: this.trip.itineraryId }
    });
  }

}