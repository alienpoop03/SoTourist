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
  IonIcon, IonLabel, IonButton,IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addOutline, homeOutline, createOutline, settingsOutline } from 'ionicons/icons';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { ItineraryService } from '../services/itinerary.service';
import { Place } from '../models/trip.model';
import { LuogoCardComponent } from '../components/luogo-card/luogo-card.component';
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
    DragDropModule,LuogoCardComponent,
    IonButton,IonFab, IonFabButton

  ],
})
export class PersonalizzazionePage implements OnInit {

  /* ---------- DI ---------- */
  private readonly route = inject(ActivatedRoute);
  private readonly itineraryService = inject(ItineraryService);

  /* ---------- State ---------- */
  days = signal<DayData[]>([]);
  activeDay = signal(0);

  slots = ['morning', 'afternoon', 'evening'] as const;
  slotName: Record<string, string> = {
    morning: 'Mattina',
    afternoon: 'Pomeriggio',
    evening: 'Sera'
  };

  /* ---------- Lifecycle ---------- */
  ngOnInit(): void {
    const itineraryId = this.route.snapshot.queryParamMap.get('id');
    if (!itineraryId) return;

    this.itineraryService.getItineraryById(itineraryId).subscribe({
      next: (res: any) => {
        const grouped = this.isGrouped(res.itinerary)
          ? res.itinerary as DayData[]
          : this.groupFlatPlaces(res.itinerary as Place[]);

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
    const d = structuredClone(this.days());
    d[this.activeDay()][slot].push({} as Place);   // placeholder vuoto
    this.days.set(d);
  }

  editPlace(i: number, slot: typeof this.slots[number]) {
    const name = prompt('Nome luogo?');
    if (!name) return;
    const d = structuredClone(this.days());
    d[this.activeDay()][slot][i].name = name;
    this.days.set(d);
  }

  drop(event: CdkDragDrop<Place[]>, slot: typeof this.slots[number]) {
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

  /* ---------- Icons ---------- */
  icons = { addOutline, homeOutline, createOutline, settingsOutline };
}
