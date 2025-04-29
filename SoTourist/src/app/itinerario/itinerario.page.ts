import {
  Component,
  OnInit,
  AfterViewInit,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

// Helper per attendere che l’SDK Google Maps sia pronto
function whenGoogleMapsReady(): Promise<void> {
  return new Promise(resolve => {
    if (window.google?.maps) {
      resolve();
    } else {
      window.initMap = () => resolve();
    }
  });
}

@Component({
  selector: 'app-itinerario',
  standalone: true,
  imports: [ CommonModule, IonicModule ],
  templateUrl: './itinerario.page.html',
  styleUrls: ['./itinerario.page.scss']
})
export class ItinerarioPage implements OnInit, AfterViewInit {
  trip: any = null;
  daysCount = 0;
  daysList: any[] = [];
  tripId!: number;
  heroPhotoUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Rilegge l'id e i dati ad ogni navigazione
    const idParam = this.route.snapshot.queryParamMap.get('id')!;
    this.tripId = +idParam;
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    this.trip = trips[this.tripId];
    this.daysCount = this.trip?.days || 0;
    this.daysList = Array(this.daysCount).fill(0);
  }

  async ngAfterViewInit() {
    // Aspetta lo SDK prima di caricare la foto
    await whenGoogleMapsReady();
    this.loadHeroPhoto();
  }

  private loadHeroPhoto() {
    if (!this.trip?.city) { return; }

    // Dummy map per inizializzare PlacesService
    const dummyDiv = document.createElement('div');
    const map = new window.google.maps.Map(dummyDiv);
    const service = new window.google.maps.places.PlacesService(map);

    service.findPlaceFromQuery({
      query: this.trip.city,
      fields: ['photos']
    }, (results: any[], status: any) => {
      if (status === 'OK' && results[0]?.photos?.length) {
        const url = results[0].photos[0].getUrl({ maxWidth: 800 });
        this.ngZone.run(() => {
          this.heroPhotoUrl = url;
        });
      }
    });
  }

  openDay(index: number) {
    this.router.navigate(['/tabs/day-details'], {
      queryParams: { tripId: this.tripId, day: index + 1 }
    });
  }
}
