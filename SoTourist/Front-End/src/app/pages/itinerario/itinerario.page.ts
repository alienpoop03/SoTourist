import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
  OnInit
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
import { NavigationBarComponent } from 'src/app/components/navigation-bar/navigation-bar.component';

/* ───── Ionic standalone components usati nel template ───── */
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

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
          placeId: p.placeId,
          name: p.name,
          day,
          timeSlot: slot,
          latitude,
          longitude,
          address: p.address ?? '',
          photoUrl: p.photo ?? '',
          photoReference: p.photoReference ?? '',
          rating: p.rating ?? null,
          priceLevel: p.priceLevel ?? null,
          website: p.website ?? null,
          openingHours: p.openingHours ?? null,
          type: p.type ?? '',
          note: p.note ?? ''
        });
      });
    });
  });

  return places;
}

function generatePlaceId(name: string, day: number, slot: string): string {
  const clean = name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '');
  return `place_${clean}_${day}_${slot}`;
}

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

type EditorField =
  | 'mustSee'
  | 'eat'
  | 'visited'
  | 'transport'
  | 'ai'
  | 'style';

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    IonIcon,
    NavigationBarComponent,
    GenerationOverlayComponent,
    GoogleAutocompleteComponent
  ],
  templateUrl: './itinerario.page.html',
  styleUrls: ['./itinerario.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ItinerarioPage implements AfterViewInit {
  @ViewChild(IonContent, { static: true }) content!: IonContent;

  slideNames: string[] = ['Luoghi', 'Preferenze'];
  currentSlide = 0;

  @ViewChild('scrollContainer', { static: true })
  scrollContainer!: ElementRef<HTMLElement>;

  trip: any = { itinerary: [] };
  itineraryId!: string;
  isLocalTrip = false;

  isLoading = false;

  tripTransport: string = '';
  tripPrompt: string = '';

  tripMustSee: Place[] = [];
  tripEatPlaces: Place[] = [];
  tripAlreadyVisited: Place[] = [];

  tripBounds: google.maps.LatLngBounds | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private api: ApiService,
    private itineraryService: ItineraryService,
    private auth: AuthService,
    private boundsService: BoundsService
  ) {}

  async ngAfterViewInit() {
    await whenGoogleMapsReady();
    this.goToSlide(0);
  }

  /* -------- modal -------- */
  modalVisible = false;
  modalMode: EditorField | null = null;

  readonly modalTitles: Record<EditorField, string> = {
    mustSee: 'Luoghi imperdibili',
    eat: 'Posti dove mangiare',
    visited: 'Luoghi già visitati',
    transport: 'Mezzo preferito',
    style: 'Stile vacanza',
    ai: 'Domanda all’AI'
  };

  readonly modalPlaceholders: Record<
    'mustSee' | 'eat' | 'visited',
    string
  > = {
    mustSee: 'Aggiungi luogo…',
    eat: 'Aggiungi ristorante…',
    visited: 'Aggiungi luogo…'
  };

  readonly modalTypes: Record<'mustSee' | 'eat' | 'visited', string[]> = {
    mustSee: ['establishment'],
    eat: ['restaurant'],
    visited: ['establishment']
  };

  /* ----- nuova variabile per la copia temporanea ----- */
  modalTempPlaces: Place[] = [];

  /* --------- apertura modale --------- */
  openModal(m: EditorField) {
    if (this.isPlaceMode(m)) {
      const userId = this.auth.getUserId();
      if (!userId) {
        this.router.navigate(['/login']);
      } else {
        this.auth.getUserType(userId).subscribe((userData: { userId: string; type: string; subscriptionEndDate: string | null }) => {
          const userType = userData.type;
          
          if (userType !== 'premium' && userType !== 'gold') {
            this.router.navigate(['/upgrade']); 
          }else{
            this.modalMode = m;
            this.modalVisible = true;

            
              // copia “snapshot” dei luoghi correnti
              this.modalTempPlaces = [...this.getListForMode(m)];
            
          }
        }, (error) => {
          console.error('Errore nel recupero del tipo di utente:', error);
          this.router.navigate(['/login']);
        });
      }
    }else{
      this.modalMode = m;
      this.modalVisible = true;
    }
  }

   

  /* ------------- chiusura modale ------------- */
  closeModal(commit: boolean) {
    if (!commit && this.isPlaceMode(this.modalMode)) {
      // se annulli, scarta le modifiche
      this.modalTempPlaces = [];
    }
    this.modalVisible = false;
    this.modalMode = null;
  }

  /* ------------- salva (commit) ------------- */
  saveModal() {
    if (this.isPlaceMode(this.modalMode)) {
      const target = this.getListForMode(this.modalMode!);
      target.splice(0, target.length, ...this.modalTempPlaces);
      this.modalTempPlaces = [];
    }
    this.closeModal(true);
  }

  /* -------- gestione luoghi dentro la modale -------- */
  onPlaceSelectedInModal(result: google.maps.places.PlaceResult) {
    if (!result.place_id || !result.name || !result.geometry) return;
    const newPlace: Place = {
      placeId: result.place_id,
      name: result.name,
      day: -1,
      timeSlot: 'morning',
      latitude: result.geometry.location?.lat() ?? 0,
      longitude: result.geometry.location?.lng() ?? 0,
      address: result.formatted_address ?? '',
      photoUrl: result.photos?.[0]?.getUrl({ maxWidth: 400 }) ?? '',
      rating: result.rating ?? undefined,
      priceLevel: undefined,
      website: undefined,
      openingHours: undefined,
      type: '',
      note: ''
    };
    // niente duplicati
    if (!this.modalTempPlaces.some(p => p.placeId === newPlace.placeId)) {
      this.modalTempPlaces.push(newPlace);
    }
  }

  removeTempPlace(i: number) {
    this.modalTempPlaces.splice(i, 1);
  }

  getPlaceholder(m: EditorField | null) {
    return m && this.isPlaceMode(m) ? this.modalPlaceholders[m] : '';
  }
  getTypes(m: EditorField | null): string[] {
    return m && this.isPlaceMode(m) ? [...this.modalTypes[m]] : [];
  }
  isPlaceMode(m: EditorField | null) {
    return m === 'mustSee' || m === 'eat' || m === 'visited';
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
        (t?.itineraryId && t.itineraryId === this.itineraryId) ||
        (t?.id != null && t.id.toString?.() === this.itineraryId)
      );
    });

    if (localTrip) {
      this.trip = {
        itineraryId:
          localTrip.itineraryId ??
          localTrip.id?.toString() ??
          'undefined',
        city: localTrip.city,
        startDate: localTrip.startDate ?? localTrip.start,
        endDate: localTrip.endDate ?? localTrip.end,
        accommodation: localTrip.accommodation,
        style: 'Standard',
        itinerary: localTrip.itinerary || []
      };

      this.isLocalTrip = true;

      if (this.trip.city) {
        this.boundsService.getCityBounds(this.trip.city).then(bounds => {
          if (bounds) {
            this.tripBounds = bounds;
            const { north, east, south, west } = bounds.toJSON();
            this.trip.bounds = { north, east, south, west };
            console.log('[itinerario] Bounds caricati:', this.trip.bounds);
          } else {
            console.warn(
              '[itinerario] Nessun bounds trovato per',
              this.trip.city
            );
          }
        });
      }

      console.log(
        '[📷 COVERPHOTO] 🛑 Bozza: usata immagine di fallback.'
      );
      return;
    }

    this.itineraryService.getItineraryById(this.itineraryId).subscribe({
      next: res => {
        this.trip = res;
        this.isLocalTrip = false;
        

        this.router.navigate(['/tabs/panoramica'], {
          queryParams: { id: this.itineraryId }
        });
      },
      error: err => {
        console.error('Errore caricamento itinerario:', err);
        this.router.navigate(['/tabs/viaggi']);
      }
    });
  }

 



  onScroll(ev: Event): void {
    const c = this.scrollContainer.nativeElement;
    const idx = Math.round(c.scrollLeft / c.clientWidth);
    this.currentSlide = Math.min(
      Math.max(idx, 0),
      this.slideNames.length - 1
    );
  }

  goToSlide(i: number): void {
    const c = this.scrollContainer.nativeElement;
    c.scrollTo({
      left: i * c.clientWidth,
      behavior: 'smooth'
    });
  }

  generateItinerary() {
    const userId = this.auth.getUserId();

    if (userId?.startsWith('guest_')) {
      localStorage.setItem(
        'redirectAfterLogin',
        '/tabs/itinerario?id=' + this.trip?.itineraryId
      );
      this.router.navigate(['/login']);
      return;
    }

    if (!this.isLocalTrip) return;

    const trip = this.trip;
    if (!trip) {
      this.isLoading = false;
      return;
    }

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days =
      Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    this.isLoading = true;
    const payload: GenerateItineraryRequest = {
      city: trip.city,
      totalDays: days,
      accommodation: trip.accommodation,
      transport: this.tripTransport || 'walk',
      style: this.trip?.style || 'Standard',
      mustSee: this.tripMustSee.map(p => p.placeId),
      mustEat: this.tripEatPlaces.map(p => p.placeId),
      avoid: this.tripAlreadyVisited.map(p => p.placeId)
    };

    this.api.getItinerary(payload).subscribe({
      next: res => {
        console.log('✅ [GENERAZIONE] Risposta da backend:', res);
        console.table(res.itinerary);

        trip.itinerary = res.itinerary;

        const allPlaces: Place[] =
          convertGeneratedToPlaces(res.itinerary);
        console.log(
          '🔥 [CONVERSIONE] Risultato convertGeneratedToPlaces:',
          allPlaces
        );
        console.table(allPlaces);

        const userId = this.auth.getUserId();
        if (!userId) {
          console.error('User ID mancante');
          this.isLoading = false;
          return;
        }

        if (this.isLocalTrip) {
          if (res.coverPhoto) {
            console.log(
              '[📷 COVERPHOTO] ✅ Usata quella GENERATA dal backend:',
              res.coverPhoto
            );
          } else if (trip.coverPhoto) {
            console.log(
              '[📷 COVERPHOTO] 🔁 Usata quella SALVATA nella bozza:',
              trip.coverPhoto
            );
          } else {
            console.warn(
              '[📷 COVERPHOTO] ⚠️ Nessuna foto di copertina disponibile!'
            );
          }

          this.itineraryService
            .createItinerary(userId, {
              city: trip.city,
              accommodation: trip.accommodation,
              startDate: trip.startDate,
              endDate: trip.endDate,
              coverPhoto: res.coverPhoto ?? '',
              style: trip.style
            })
            .subscribe({
              next: (createdTrip: any) => {
                const oldId = trip.itineraryId;
                trip.itineraryId = createdTrip.itineraryId;
                this.itineraryId = createdTrip.itineraryId;
                this.isLocalTrip = false;

                const localTrips = JSON.parse(
                  localStorage.getItem('trips') || '[]'
                );
                const updated = localTrips.filter(
                  (t: any) => t.itineraryId !== oldId
                );
                localStorage.setItem('trips', JSON.stringify(updated));

                const placesPayload = allPlaces.map(p => ({
                  placeId: p.placeId,
                  name: p.name,
                  day: p.day,
                  timeSlot: p.timeSlot,
                  lat: p.latitude,
                  lng: p.longitude,
                  address: p.address ?? '',
                  photoUrl: p.photoUrl ?? '',
                  photoReference: p.photoReference ?? '',
                  rating: p.rating,
                  priceLevel: p.priceLevel,
                  website: p.website,
                  openingHours: p.openingHours,
                  type: p.type ?? '',
                  note: p.note ?? ''
                }));

                console.log(
                  '🛠️ [PAYLOAD] placesPayload:',
                  placesPayload
                );

                this.itineraryService
                  .addPlacesToItinerary(
                    userId,
                    createdTrip.itineraryId,
                    placesPayload
                  )
                  .subscribe({
                    next: () => {
                      console.log('✅ Tappe salvate nel backend');
                      this.isLoading = false;

                      this.router.navigate(['/panoramica'], {
                        queryParams: {
                          id: createdTrip.itineraryId
                        }
                      });
                    },
                    error: err => {
                      console.error(
                        '❌ Errore salvataggio tappe:',
                        err
                      );
                      this.isLoading = false;
                    }
                  });
              },
              error: err => {
                console.error(
                  '❌ Errore salvataggio itinerario:',
                  err
                );
                this.isLoading = false;
              }
            });
        } else {
          this.savePlaces(userId, this.itineraryId, allPlaces);
        }
      },
      error: err => {
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
          localStorage.setItem(
            'redirectAfterLogin',
            '/tabs/itinerario?id=' + this.trip?.itineraryId
          );
          this.router.navigate(['/login']);
        }
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  private savePlaces(
    userId: string,
    itineraryId: string,
    places: Place[]
  ) {
    const payload = places.map(p => ({
      placeId: p.placeId,
      name: p.name,
      day: p.day,
      timeSlot: p.timeSlot,
      lat: p.latitude,
      lng: p.longitude,
      address: p.address ?? '',
      photoUrl: p.photoUrl ?? '',
      photoReference: p.photoReference ?? '',
      rating: p.rating,
      priceLevel: p.priceLevel,
      website: p.website,
      openingHours: p.openingHours,
      type: p.type ?? '',
      note: p.note ?? ''
    }));

    this.itineraryService.addPlacesToItinerary(
      userId,
      itineraryId,
      payload
    ).subscribe();
  }

  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return diff + 1;
  }

  editorValue = '';
  selectedDays: number[] = [];

  openEditorInline(mode: EditorField) {
    this.modalMode = mode;
    this.modalVisible = true;

    if (!['mustSee', 'eat', 'visited'].includes(mode)) {
      this.editorValue = this.getValueForMode(mode);
    } else {
      this.editorValue = '';
    }

    this.selectedDays = this.getSelectedDaysForMode(mode);
  }

  saveEditorValue() {
    if (!this.modalMode) return;

    if (!['mustSee', 'eat', 'visited'].includes(this.modalMode)) {
      this.setValueForMode(this.modalMode, this.editorValue);
    }

    this.closeEditor();
  }

  closeEditor() {
    this.modalVisible = false;
    this.modalMode = null;
    this.editorValue = '';
    this.selectedDays = [];
  }

  getValueForMode(mode: EditorField): string {
    switch (mode) {
      case 'transport':
        return this.tripTransport;
      case 'ai':
        return this.tripPrompt;
      case 'style':
        return this.trip?.style || '';
      default:
        return '';
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
          .map(
            (day: any, i: number) =>
              (day.mustSee?.length > 0 ? i : null) as number | null
          )
          .filter((i: number | null) => i !== null) as number[];
      default:
        return [];
    }
  }

  selectValue(value: string) {
    if (!this.modalMode) return;
    this.setValueForMode(this.modalMode, value);
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
  addMustSeePlace = (p: Place) =>
    this.addPlace(this.tripMustSee, p);
  addEatPlace = (p: Place) =>
    this.addPlace(this.tripEatPlaces, p);
  addVisitedPlace = (p: Place) =>
    this.addPlace(this.tripAlreadyVisited, p);

  removeMustSeePlace = (i: number) =>
    this.removePlace(this.tripMustSee, i);
  removeEatPlace = (i: number) =>
    this.removePlace(this.tripEatPlaces, i);
  removeVisitedPlace = (i: number) =>
    this.removePlace(this.tripAlreadyVisited, i);

  onPlaceSelected(
    mode: EditorField,
    result: google.maps.places.PlaceResult
  ) {
    if (
      !result.place_id ||
      !result.name ||
      !result.geometry
    ) {
      console.warn('Luogo non valido:', result);
      return;
    }

    const place: Place = {
      placeId: result.place_id,
      name: result.name,
      day: -1,
      timeSlot: 'morning',
      latitude: result.geometry.location?.lat() ?? 0,
      longitude: result.geometry.location?.lng() ?? 0,
      address: result.formatted_address ?? '',
      photoUrl:
        result.photos?.[0]?.getUrl({ maxWidth: 400 }) ?? '',
      rating: result.rating ?? 0,
      type: '',
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
      case 'mustSee':
        return this.tripMustSee;
      case 'eat':
        return this.tripEatPlaces;
      case 'visited':
        return this.tripAlreadyVisited;
      default:
        return [];
    }
  }

  vaiAllaPanoramica() {
    const bounds = this.trip?.bounds;
    this.router.navigate(['/panoramica'], {
      queryParams: {
        id: this.trip.itineraryId,
        north: bounds?.north,
        south: bounds?.south,
        east: bounds?.east,
        west: bounds?.west
      }
    });
  }

  /* ---------- trackBy per le chip ---------- */
  trackByPlace(index: number, place: Place) {
    return place.placeId || index;
  }
}
