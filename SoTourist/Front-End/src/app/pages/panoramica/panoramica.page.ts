import { Component, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { PhotoService } from '../../services/photo.service';
import { FormsModule } from '@angular/forms';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';

import { getCityName, getAccommodationName } from '../../utils/trip-utils';
import { getPhotoUrl } from 'src/app/utils/photo-utils';

@Component({
  selector: 'app-panoramica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon,
    NavigationBarComponent
  ],
  templateUrl: './panoramica.page.html',
  styleUrls: ['./panoramica.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class PanoramicaPage {
  @ViewChild(IonContent, { static: true }) content!: IonContent;
  @ViewChild('hero', { static: true }) heroEl!: ElementRef;

  heroHeight = 200;
  titleFontSize = 1.8;
  overlayOpacity = 1;

  trip: any = { itinerary: [] };
  itineraryId!: string;
  daysCount = 0;
  heroPhotoUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itineraryService: ItineraryService,
    private auth: AuthService,
    private photoService: PhotoService
  ) { }

  // Inizializza pagina e carica dati itinerario
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (!id) return;

      this.itineraryId = id;
      this.loadItinerary();
    });
  }

  // Carica l’itinerario dal backend
  loadItinerary() {
    this.itineraryService.getItineraryById(this.itineraryId).subscribe({
      next: (res) => {
        this.trip = res;
        this.daysCount = this.calculateDays(res.startDate, res.endDate);
        this.heroPhotoUrl = getPhotoUrl(res.coverPhoto);
      },
      error: (err) => {
        console.error('Errore caricamento itinerario:', err);
        this.router.navigate(['/tabs/viaggi']);
      }
    });
  }

  // Vai alla pagina della mappa per il giorno selezionato
  openDay(index: number) {
    this.router.navigate(['/map'], {
      queryParams: {
        itineraryId: this.itineraryId,
        day: index + 1,
        startDate: this.trip?.startDate,
        endDate: this.trip?.endDate
      }
    });
  }

  // Calcola la data del giorno index-esimo
  getDayDate(index: number): Date {
    const start = new Date(this.trip.startDate);
    start.setDate(start.getDate() + index);
    return start;
  }

  // Restituisce le attività del giorno
  getDayItems(index: number): string[] {
    const day = this.trip?.itinerary?.[index];
    if (!day) return [];

    const splitMustSee = day.mustSee
      ? day.mustSee.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    return [
      day.style,
      day.atmosphere,
      ...splitMustSee
    ].filter(Boolean);
  }

  // Controlla se la fascia oraria è “completata”
  isStepCompleted(dayIndex: number, step: 'morning' | 'afternoon' | 'evening'): boolean {
    const today = new Date();
    const dayDate = this.getDayDate(dayIndex);
    const hour = today.getHours();

    if (dayDate < this.clearTime(today)) return true;
    if (dayDate > this.clearTime(today)) return false;

    const thresholds = { morning: 12, afternoon: 18, evening: 23 };
    return hour >= thresholds[step];
  }

  // azzera ore/minuti/secondi per confrontare solo la data
  clearTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Calcola quanti giorni ha l’itinerario
  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  }

  // Vai alla pagina di personalizzazione giorno
  vaiAPersonalizzazione() {
    this.router.navigate(['/personalizzazione'], {
      queryParams: {
        id: this.trip.itineraryId,
        north: this.route.snapshot.queryParamMap.get('north'),
        south: this.route.snapshot.queryParamMap.get('south'),
        east: this.route.snapshot.queryParamMap.get('east'),
        west: this.route.snapshot.queryParamMap.get('west')
      }
    });
  }

  // Formattazione stringa città
  getFormattedCity(): string {
    return getCityName(this.trip?.city || '');
  }

  // Formattazione stringa alloggio
  getFormattedAccommodation(): string {
    return getAccommodationName(this.trip?.accommodation || '');
  }

  // restituisce la % di completamento del segmento (barra di progresso)
  getStepProgress(dayIndex: number, step: 'morning' | 'afternoon' | 'evening'): number {
    const now = new Date();
    const dayDate = this.clearTime(this.getDayDate(dayIndex));
    const today = this.clearTime(now).getTime();

    if (dayDate.getTime() < today) return 100;
    if (dayDate.getTime() > today) return 0;

    const current = now.getTime();

    // definisci in ms inizio/fine di ogni segmento
    const startMorning = new Date(dayDate).setHours(0, 0, 0, 0);
    const endMorning = new Date(dayDate).setHours(12, 0, 0, 0);
    const startAfter = endMorning;
    const endAfter = new Date(dayDate).setHours(18, 0, 0, 0);
    const startEvening = endAfter;
    const endEvening = new Date(dayDate).setHours(23, 59, 59, 999);

    let segStart: number, segEnd: number;
    if (step === 'morning') {
      segStart = startMorning; segEnd = endMorning;
    } else if (step === 'afternoon') {
      segStart = startAfter; segEnd = endAfter;
    } else {
      segStart = startEvening; segEnd = endEvening;
    }

    if (current <= segStart) return 0;
    if (current >= segEnd) return 100;

    return Math.round((current - segStart) / (segEnd - segStart) * 100);
  }
}