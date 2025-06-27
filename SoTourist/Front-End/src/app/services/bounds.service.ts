import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BoundsService {
  private service = new google.maps.places.PlacesService(document.createElement('div'));
  private autocomplete = new google.maps.places.AutocompleteService();

  // Restituisce i bounds geografici di una città, usando cache locale se presente
  async getCityBounds(cityName: string): Promise<google.maps.LatLngBounds | null> {
    const cacheKey = `bounds_${cityName}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const boundsData = JSON.parse(cached);
        const sw = new google.maps.LatLng(boundsData.south, boundsData.west);
        const ne = new google.maps.LatLng(boundsData.north, boundsData.east);
        
        console.log(`[BoundsService] Cache trovata per "${cityName}"`, boundsData);
        return new google.maps.LatLngBounds(sw, ne);
      } catch (e) {
        console.warn(`[BoundsService] Cache corrotta per "${cityName}", la rimuovo`);
        localStorage.removeItem(cacheKey);
      }
    }

    console.log(`🔄 [BoundsService] Nessuna cache per "${cityName}", faccio richiesta a Google`);

    return new Promise((resolve) => {
      this.autocomplete.getPlacePredictions(
        { input: cityName, types: ['(cities)'] },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
            const placeId = predictions[0].place_id;

            // Chiede dettagli alla Places API per ottenere i bounds geografici
            this.service.getDetails({ placeId }, (place, status) => {
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                place?.geometry?.viewport
              ) {
                const bounds = place.geometry.viewport;
                const boundsJson = {
                  north: bounds.getNorthEast().lat(),
                  east: bounds.getNorthEast().lng(),
                  south: bounds.getSouthWest().lat(),
                  west: bounds.getSouthWest().lng()
                };
                localStorage.setItem(cacheKey, JSON.stringify(boundsJson));
                console.log(`[BoundsService] Bounds salvati in cache per "${cityName}"`, boundsJson);
                resolve(bounds);
              } else {
                console.warn(`[BoundsService] Errore nei dettagli di "${cityName}"`, status);
                resolve(null);
              }
            });
          } else {
            console.warn(`[BoundsService] Nessuna predizione per "${cityName}"`, status);
            resolve(null);
          }
        }
      );
    });
  }
}