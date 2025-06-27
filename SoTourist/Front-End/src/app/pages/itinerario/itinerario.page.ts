import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { GenerationOverlayComponent } from '../../components/generation-overlay/generation-overlay.component';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { BoundsService } from '../../services/bounds.service';
import { GoogleAutocompleteComponent } from '../../components/google-autocomplete/google-autocomplete.component';
import { NavigationBarComponent } from 'src/app/components/navigation-bar/navigation-bar.component';

import {
  IonContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { GeneratedDay } from '../../models/generated-day.model';
import { Place } from '../../models/trip.model';

// Conversione dati giorni generati -> array places
function convertGeneratedToPlaces(generatedDays: GeneratedDay[]): Place[] {
  const slotOrder: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];
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

type EditorField = 'mustSee' | 'eat' | 'visited' | 'transport' | 'ai' | 'style';

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonLabel,
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

  // Slide/tab della pagina
  slideNames: string[] = ['Luoghi', 'Preferenze'];
  currentSlide = 0;

  @ViewChild('scrollContainer', { static: true }) scrollContainer!: ElementRef<HTMLElement>;

  trip: any = { itinerary: [] };
  itineraryId!: string;
  isLocalTrip = false;
  isLoading = false;

  // Stato preferenze utente/viaggio
  tripTransport: string = '';
  tripPrompt: string = '';
  tripMustSee: Place[] = [];
  tripEatPlaces: Place[] = [];
  tripAlreadyVisited: Place[] = [];
  tripBounds: google.maps.LatLngBounds | null = null;

  // Stato modale
  modalVisible = false;
  modalMode: EditorField | null = null;
  modalTempPlaces: Place[] = [];

  readonly modalTitles: Record<EditorField, string> = {
    mustSee: 'Luoghi imperdibili',
    eat: 'Posti dove mangiare',
    visited: 'Luoghi già visitati',
    transport: 'Mezzo preferito',
    style: 'Stile vacanza',
    ai: 'Domanda all’AI'
  };

  readonly modalPlaceholders: Record<'mustSee' | 'eat' | 'visited', string> = {
    mustSee: 'Aggiungi luogo…',
    eat: 'Aggiungi ristorante…',
    visited: 'Aggiungi luogo…'
  };

  readonly modalTypes: Record<'mustSee' | 'eat' | 'visited', string[]> = {
    mustSee: ['establishment'],
    eat: ['restaurant'],
    visited: ['establishment']
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private api: ApiService,
    private itineraryService: ItineraryService,
    private auth: AuthService,
    private boundsService: BoundsService
  ) {}

  // Lifecycle: caricamento Google Maps e primo slide
  async ngAfterViewInit() {
    await this.whenGoogleMapsReady();
    this.goToSlide(0);
  }

  // Controlla Google Maps API
  private whenGoogleMapsReady(): Promise<void> {
    return new Promise(resolve => {
      if ((window as any).google && (window as any).google.maps) {
        resolve();
      } else {
        (window as any).initMap = () => resolve();
      }
    });
  }

  // Apertura modale (e controllo tipo utente premium/gold)
  openModal(m: EditorField) {
    if (this.isPlaceMode(m)) {
      const userId = this.auth.getUserId();
      if (!userId) {
        this.router.navigate(['/login']);
      } else {
        this.auth.getUserType(userId).subscribe(
          (userData: { userId: string; type: string; subscriptionEndDate: string | null }) => {
            const userType = userData.type;

            if (userType !== 'premium' && userType !== 'gold') {
              this.router.navigate(['/upgrade']);
            } else {
              this.modalMode = m;
              this.modalVisible = true;
              // Snapshot della lista luoghi attuale
              this.modalTempPlaces = [...this.getListForMode(m)];
            }
          },
          (error) => {
            console.error('Errore nel recupero del tipo di utente:', error);
            this.router.navigate(['/login']);
          }
        );
      }
    } else {
      this.modalMode = m;
      this.modalVisible = true;
    }
  }

  // Chiusura modale, commit = salva o scarta
  closeModal(commit: boolean) {
    if (!commit && this.isPlaceMode(this.modalMode)) {
      this.modalTempPlaces = [];
    }
    this.modalVisible = false;
    this.modalMode = null;
  }

  // Salva modifiche della modale
  saveModal() {
    if (this.isPlaceMode(this.modalMode)) {
      const target = this.getListForMode(this.modalMode!);
      target.splice(0, target.length, ...this.modalTempPlaces);
      this.modalTempPlaces = [];
    }
    this.closeModal(true);
  }

  // Gestione luoghi temporanei in modale
  onPlaceSelectedInModal(result: google.maps.places.PlaceResult) {
    if (!result.place_id || !result.name || !result.geometry){
      console.warn('Luogo non valido:', result);
      return;
    } 
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
    if (!this.modalTempPlaces.some(p => p.placeId === newPlace.placeId)) {
      this.modalTempPlaces.push(newPlace);
    }
  }

  removeTempPlace(i: number) {
    this.modalTempPlaces.splice(i, 1);
  }

  // Placeholder, type, mode helpers
  getPlaceholder(m: EditorField | null) {
    return m && this.isPlaceMode(m) ? this.modalPlaceholders[m] : '';
  }
  getTypes(m: EditorField | null): string[] {
    return m && this.isPlaceMode(m) ? [...this.modalTypes[m]] : [];
  }
  isPlaceMode(m: EditorField | null) {
    return m === 'mustSee' || m === 'eat' || m === 'visited';
  }

  // Inizializza i dati della pagina all'ingresso
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
        itineraryId: localTrip.itineraryId ?? localTrip.id?.toString() ?? 'undefined',
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
            console.warn('[itinerario] Nessun bounds trovato per', this.trip.city);
          }
        });
      }

      console.log('[COVERPHOTO] Bozza: usata immagine di fallback.');

      return;
    }

    // Se non è bozza locale: ricarica dal backend
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

  // Cambio slide/tab
  onScroll(ev: Event): void {
    const c = this.scrollContainer.nativeElement;
    const idx = Math.round(c.scrollLeft / c.clientWidth);
    this.currentSlide = Math.min(Math.max(idx, 0), this.slideNames.length - 1);
  }
  goToSlide(i: number): void {
    const c = this.scrollContainer.nativeElement;
    c.scrollTo({ left: i * c.clientWidth, behavior: 'smooth' });
  }

  // Avvia generazione itinerario (API)
  generateItinerary() {
    const userId = this.auth.getUserId();

    if (userId?.startsWith('guest_')) {
      localStorage.setItem('redirectAfterLogin', '/tabs/itinerario?id=' + this.trip?.itineraryId);
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
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    this.isLoading = true;
    const payload = {
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
        console.log('[GENERAZIONE] Risposta da backend:', res);
        console.table(res.itinerary);

        trip.itinerary = res.itinerary;

        const allPlaces: Place[] = convertGeneratedToPlaces(res.itinerary);
        console.log('[CONVERSIONE] Risultato convertGeneratedToPlaces:', allPlaces);
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
              '[COVERPHOTO] Usata quella GENERATA dal backend:',
              res.coverPhoto
            );
          } else if (trip.coverPhoto) {
            console.log(
              '[COVERPHOTO] Usata quella SALVATA nella bozza:',
              trip.coverPhoto
            );
          } else {
            console.warn(
              '[COVERPHOTO] Nessuna foto di copertina disponibile!'
            );
          }

          this.itineraryService.createItinerary(userId, {
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

              const localTrips = JSON.parse(localStorage.getItem('trips') || '[]');
              const updated = localTrips.filter((t: any) => t.itineraryId !== oldId);
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

              console.log('[PAYLOAD] placesPayload:', placesPayload);

              this.itineraryService.addPlacesToItinerary(
                userId,
                createdTrip.itineraryId,
                placesPayload
              ).subscribe({
                next: () => {
                  console.log('Tappe salvate nel backend');
                  this.isLoading = false;
                  this.router.navigate(['/panoramica'], {
                    queryParams: { id: createdTrip.itineraryId }
                  });
                },
                error: err => {
                  console.error('Errore salvataggio tappe:', err);
                  this.isLoading = false;
                }
              });
            },
            error: err => {
              console.error('Errore salvataggio itinerario:', err);
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

  // Salva tappe nel backend
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
      photoReference: p.photoReference ?? '',
      rating: p.rating,
      priceLevel: p.priceLevel,
      website: p.website,
      openingHours: p.openingHours,
      type: p.type ?? '',
      note: p.note ?? ''
    }));
    this.itineraryService.addPlacesToItinerary(userId, itineraryId, payload).subscribe();
  }

  // Selezione valore (usata dalla modale transport, style, ecc)
  selectValue(value: string) {
    if (!this.modalMode) return;
    this.setValueForMode(this.modalMode, value);
    this.closeEditor();
  }

  // Setta i valori della preferenza selezionata
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

  // Chiudi editor modale
  closeEditor() {
    this.modalVisible = false;
    this.modalMode = null;
  }

  // Helpers per HTML (trackBy nelle chip)
  trackByPlace(index: number, place: Place) {
    return place.placeId || index;
  }

  // Restituisce la lista di luoghi relativa alla modalità della modale
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
}