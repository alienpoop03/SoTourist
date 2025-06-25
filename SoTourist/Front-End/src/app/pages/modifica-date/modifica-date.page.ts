import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { RangeCalendarLiteComponent } from 'src/app/components/range-calendar-lite/range-calendar-lite.component'; // aggiorna il path se necessario
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { ItineraryService } from '../../services/itinerary.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from '../../services/toast.service';
import { getCityName} from '../../utils/trip-utils';

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
  maxDays?: number;
  userId!: string;
  azione: string = 'default'; 

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itineraryService: ItineraryService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.itineraryId = this.route.snapshot.queryParamMap.get('id') ?? '';
    this.userId = this.authService.getUserId() ?? '';
    const rangeParam = this.route.snapshot.queryParamMap.get('maxDays');
     if (rangeParam) {
      const parsed = parseInt(rangeParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.maxDays = parsed;
      }
    }

    const azioneParam = this.route.snapshot.queryParamMap.get('azione');
    if (azioneParam) {
      this.azione = azioneParam;
    }

    if(this.azione === 'default'){
      const trips = JSON.parse(localStorage.getItem('trips') || '[]');
      this.trip = trips.find((t: any) => t.itineraryId === this.itineraryId);
    }else{
      this.trip = this.itineraryService.getItineraryById(this.itineraryId).subscribe({
        next: (res) => {
          this.trip = res;
        },
        error: () => {
          this.router.navigate(['/tabs/viaggi']);
        }
      });
    }

    console.log("hasdbjhadhads",this.trip);
    if (!this.trip){
      this.router.navigate(['/tabs/viaggi']);
      return;
    }
    if(this.azione === 'default'){
      this.newStartDate = this.trip.start;
      this.newEndDate = this.trip.end;
    }
  }

  onDatesSelected(event: { from: string, to: string }) {
    this.newStartDate = event.from;
    this.newEndDate = event.to;
  }

  saveDates() {
    if (!this.newStartDate || !this.newEndDate) return;
    this.itineraryService.checkDateOverlap(
      this.userId,       
      this.newStartDate,
      this.newEndDate,
      this.itineraryId
    ).subscribe({
      next: (res) => {
        console.log("res: ", res);
        if (res.overlap) {
          this.toastService.showWarning('Attenzione: le date selezionate si sovrappongono a un altro itinerario. Modifica le date.');
          return;
        }else{
          if(this.azione === 'default'){
            const trips = JSON.parse(localStorage.getItem('trips') || '[]');
            const index = trips.findIndex((t: any) => t.itineraryId === this.itineraryId);

            if (index !== -1) {
              trips[index].start = this.newStartDate;
              trips[index].end = this.newEndDate;
              localStorage.setItem('trips', JSON.stringify(trips));
            }

            this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
              this.router.navigate(['/tabs/viaggi']);
            });
          }else{
            this.itineraryService.copyItinerary(
              this.itineraryId, 
              this.userId,
              this.newStartDate,
              this.newEndDate
            ).subscribe({
              next: (copyRes) => {
                console.log('Itinerario clonato con successo:', copyRes);

                this.toastService.showSuccess('Itinerario salvato con successo.');
                this.router.navigate(['/panoramica'], { queryParams: { id: copyRes.newItineraryId} });
              },
              error: (err) => {
                console.error('Errore durante la clonazione:', err);
                this.toastService.showError('Errore durante la clonazione dell\'itinerario. Riprova.');
              }
            });
          }
          
        }
        
      },
      error: (err) => {
        console.error('Errore durante il controllo sovrapposizione:', err);
        this.toastService.showError('Si è verificato un errore durante il controllo delle date. Riprova.');
      }
    });
  }

  getFormattedCity(): string {
    if(this.trip){
      return getCityName(this.trip.city);
    }else{
      return '';
    }
  }
}

