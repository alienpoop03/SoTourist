import { Component, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { PhotoService } from '../../services/photo.service';
import { FormsModule } from '@angular/forms';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { VisitService, VisitedMap } from '../../services/visit.service';
import { Phase } from '../../models/itinerary.model';
import { Subscription } from 'rxjs';

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
export class PanoramicaPage implements OnDestroy {
  @ViewChild(IonContent, { static: true }) content!: IonContent;
  @ViewChild('hero', { static: true }) heroEl!: ElementRef;

  heroHeight = 200;
  titleFontSize = 1.8;
  overlayOpacity = 1;

  trip: any = { itinerary: [] };
  itineraryId!: string;
  daysCount = 0;
  heroPhotoUrl = '';
  visitedMap: VisitedMap = {};
  private visitSub: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itineraryService: ItineraryService,
    private auth: AuthService,
    private photoService: PhotoService,
    private visitService: VisitService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (!id) return;

      this.itineraryId = id;
      this.loadItinerary(); // 🔁 ricarica ogni volta che l'id cambia
    });
    this.visitSub = this.visitService.visited$.subscribe(map => this.visitedMap = map);
  }


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

  getDayDate(index: number): Date {
    const start = new Date(this.trip.startDate);
    start.setDate(start.getDate() + index);
    return start;
  }

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

  isStepCompleted(dayIndex: number, step: 'morning' | 'afternoon' | 'evening'): boolean {
    const today = new Date();
    const dayDate = this.getDayDate(dayIndex);  // metodo già aggiunto
    const hour = today.getHours();
    console.log(`Day ${dayIndex}, step ${step}, ora attuale ${hour}`);

    // giorno passato → tutto completo
    if (dayDate < this.clearTime(today)) return true;
    // giorno futuro → niente completo
    if (dayDate > this.clearTime(today)) return false;

    // siamo sul giorno corrente

    const thresholds = { morning: 12, afternoon: 18, evening: 23 };
    return hour >= thresholds[step];
  }

  /** Azzeri ore/minuti/secondi per comparazioni “solo data” */
  private clearTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  }

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

  getFormattedCity(): string {
    return getCityName(this.trip?.city || '');
  }

  getFormattedAccommodation(): string {
    return getAccommodationName(this.trip?.accommodation || '');
  }

  /** Restituisce la % di completamento del segmento */
  getStepProgress(dayIndex: number, step: 'morning' | 'afternoon' | 'evening'): number {
    const day = this.trip.itinerary[dayIndex] || { morning: [], afternoon: [], evening: [] };
    const total = day[step]?.length || 0;
    if (total === 0) return 0;
    const done = this.visitedMap[dayIndex]?.[step]?.size || 0;
    return Math.round(done / total * 100);
  }

  ngOnDestroy(): void {
    this.visitSub?.unsubscribe();
  }



}
