// src/app/services/bounds.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BoundsService {
  private service = new google.maps.places.PlacesService(document.createElement('div'));
  private autocomplete = new google.maps.places.AutocompleteService();

  async getCityBounds(cityName: string): Promise<google.maps.LatLngBounds | null> {
    const cacheKey = `bounds_${cityName}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const boundsData = JSON.parse(cached);
        const sw = new google.maps.LatLng(boundsData.south, boundsData.west);
        const ne = new google.maps.LatLng(boundsData.north, boundsData.east);
        return new google.maps.LatLngBounds(sw, ne);
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    return new Promise((resolve) => {
      this.autocomplete.getPlacePredictions(
        { input: cityName, types: ['(cities)'] },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
            const placeId = predictions[0].place_id;
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
                resolve(bounds);
              } else {
                resolve(null);
              }
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }
}
