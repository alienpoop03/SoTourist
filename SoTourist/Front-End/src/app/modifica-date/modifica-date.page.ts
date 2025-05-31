import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { RangeCalendarLiteComponent } from 'src/app/components/range-calendar-lite/range-calendar-lite.component'; // aggiorna il path se necessario
import { NavigationBarComponent } from '../components/navigation-bar/navigation-bar.component';
@Component({
  selector: 'app-modifica-date',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    RangeCalendarLiteComponent,
    NavigationBarComponent 
  ],
  templateUrl: './modifica-date.page.html',
  styleUrls: ['./modifica-date.page.scss'],
})
export class ModificaDatePage implements OnInit {
  itineraryId: string = '';
  trip: any;
  newStartDate: string = '';
  newEndDate: string = '';
  get today(): string {
    return new Date().toISOString().split('T')[0];
  }
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.itineraryId = this.route.snapshot.queryParamMap.get('id') ?? '';

    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    this.trip = trips.find((t: any) => t.itineraryId === this.itineraryId);

    if (!this.trip) {
      this.router.navigate(['/tabs/viaggi']);
      return;
    }

    this.newStartDate = this.trip.start;
    this.newEndDate = this.trip.end;
  }

  onDatesSelected(event: { from: string, to: string }) {
    this.newStartDate = event.from;
    this.newEndDate = event.to;
  }

  saveDates() {
    if (!this.newStartDate || !this.newEndDate) return;

    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const index = trips.findIndex((t: any) => t.itineraryId === this.itineraryId);

    if (index !== -1) {
      trips[index].start = this.newStartDate;
      trips[index].end = this.newEndDate;
      localStorage.setItem('trips', JSON.stringify(trips));
    }

    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/tabs/viaggi'], {
        queryParams: { id: this.itineraryId }
      });
    });
    
  }
}

