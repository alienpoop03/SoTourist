import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  constructor(private ngZone: NgZone) {}

  loadHeroPhoto(city: string, itineraryId: string): Promise<string> {
    return new Promise((resolve) => {
      const cached = localStorage.getItem(`coverPhoto-${itineraryId}`);
      if (cached) return resolve(cached);

      const query = `${city} attrazione turistica`;
      const dummyDiv = document.createElement('div');
      const map = new (window as any).google.maps.Map(dummyDiv);
      const service = new (window as any).google.maps.places.PlacesService(map);

      service.findPlaceFromQuery(
        { query, fields: ['photos'] },
        (results: any[], status: any) => {
          if (status === 'OK' && results[0]?.photos?.length) {
            const url = results[0].photos[0].getUrl({ maxWidth: 800 });
            localStorage.setItem(`coverPhoto-${itineraryId}`, url);
            this.ngZone.run(() => resolve(url));
          } else {
            resolve('assets/images/PaletoBay.jpeg');
          }
        }
      );
    });
  }
}
