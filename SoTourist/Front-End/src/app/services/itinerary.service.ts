import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TripWithId, Place } from 'src/app/models/trip.model';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './ip.config';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private baseUrl = API_BASE_URL + '/api'; // metti il tuo IP reale
  city: string = '';

  constructor(private http: HttpClient) { }

  // Crea nuovo itinerario
  createItinerary(userId: string, rawData: {
    city: string;
    accommodation: string;
    startDate: string;
    endDate: string;
    coverPhoto?: string;
    style?: string;
    places?: Place[];
  }) {
    const payload = {
      city: rawData.city,
      accommodation: rawData.accommodation,
      startDate: rawData.startDate,
      endDate: rawData.endDate,
      style: rawData.style || 'generico',
      coverPhoto: rawData.coverPhoto || '',
      places: rawData.places || []
    };

    console.log('[Dati inviati a POST]', payload);
    return this.http.post(`${this.baseUrl}/users/${userId}/itineraries`, payload);
  }

  // Ottiene itinerario per id e adatta photoUrl
  getItineraryById(itineraryId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/itineraries/${itineraryId}`)
      .pipe(
        tap(raw => {
          console.log('[RAW-API itinerary]', raw.itinerary);
        }),
        map(raw => {
          for (const day of raw.itinerary) {
            for (const slot of ['morning', 'afternoon', 'evening']) {
              for (const place of day[slot]) {
                place.photoUrl = place.photoFilename
                  ? `${API_BASE_URL}/uploads/${place.photoFilename}`
                  : '';
              }
            }
          }
          return raw;
        })
      );
  }

  // Tutti gli itinerari dell'utente filtrati
  getUserItineraries(userId: string, filter: 'all' | 'current' | 'upcoming' | 'future' | 'past'): Observable<TripWithId[]> {
    return this.http.get<TripWithId[]>(`${this.baseUrl}/users/${userId}/itineraries?filter=${filter}`);
  }

  // Elimina itinerario
  deleteItinerary(userId: string, itineraryId: string) {
    return this.http.delete(`${this.baseUrl}/users/${userId}/itineraries/${itineraryId}`);
  }

  // Aggiorna dati itinerario
  updateItinerary(userId: string, itineraryId: string, updatedData: Partial<TripWithId>) {
    return this.http.put(`${this.baseUrl}/users/${userId}/itineraries/${itineraryId}`, updatedData);
  }

  // Sovrascrive tutte le tappe di un itinerario
  updateItineraryPlaces(userId: string, itineraryId: string, places: any[]) {
    return this.http.put(`${this.baseUrl}/users/${userId}/itineraries/${itineraryId}/places`, { places });
  }

  // Aggiunge tappe (place) a un itinerario
  addPlacesToItinerary(userId: string, itineraryId: string, places: any[]) {
    return this.http.post(`${this.baseUrl}/users/${userId}/itineraries/${itineraryId}/places`, places);
  }

  // Ricerca un singolo place su Google
  getSinglePlace(query: string, city: string, anchor?: { lat: number, lng: number }) {
    let params = new HttpParams()
      .set('query', query)
      .set('city', city);

    if (anchor) {
      params = params.set('lat', anchor.lat).set('lng', anchor.lng);
    }

    return this.http.get(`${this.baseUrl}/itinerary/single-place`, { params });
  }

  // Controlla se le date vanno in overlap
  checkDateOverlap(userId: string, startDate: string, endDate: string, excludeId?: string): Observable<{ overlap: boolean }> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }

    return this.http.get<{ overlap: boolean }>(
      `${this.baseUrl}/users/${userId}/itineraries/check-overlap`,
      { params }
    );
  }

  // Clona/copia itinerario su altro utente
  copyItinerary(originalItineraryId: string, targetUserId: string, startDate: string, endDate: string): Observable<{ newItineraryId: string }> {
    return this.http.post<{ newItineraryId: string }>(
      `${this.baseUrl}/itineraries/${originalItineraryId}/copy/${targetUserId}`,
      { startDate, endDate }
    );
  }
}