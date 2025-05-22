import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TripWithId, Place } from 'src/app/models/trip.model';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './ip.config';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private baseUrl = API_BASE_URL + '/api'; // metti il tuo IP reale

  constructor(private http: HttpClient) { }

  createItinerary(userId: string, rawData: {
    city: string;
    accommodation: string;
    startDate: string;
    endDate: string;
    coverPhoto?: string;
    style?: string;
    places?: Place[];           // usa il tipo Place dal modello
  }) {
    const payload = {
      city: rawData.city,
      accommodation: rawData.accommodation,
      startDate: rawData.startDate,
      endDate: rawData.endDate,
      style: rawData.style || 'generico',
      coverPhoto: rawData.coverPhoto || '',
      places: rawData.places || []  // includi subito le tappe se le hai
    };

    console.log('[🟡 Dati inviati a POST]', payload);
    return this.http.post(`${this.baseUrl}/users/${userId}/itineraries`, payload);
  }



  // 🔁 Recupera un itinerario specifico
  // 🔁 Recupera un itinerario specifico (raw JSON con campo `itinerary`)
getItineraryById(itineraryId: string): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/itineraries/${itineraryId}`)
    .pipe(
      tap(raw => {
        console.log('[📦 RAW-API itinerary]', raw.itinerary);
      })
    );
}


  // 📄 Recupera tutti gli itinerari dell’utente filtrati
  getUserItineraries(userId: string, filter: 'all' | 'current' | 'upcoming' | 'future' | 'past'): Observable<TripWithId[]> {
    return this.http.get<TripWithId[]>(`${this.baseUrl}/users/${userId}/itineraries?filter=${filter}`);
  }

  // ❌ Elimina itinerario
  deleteItinerary(userId: string, itineraryId: string) {
    return this.http.delete(`${this.baseUrl}/users/${userId}/itineraries/${itineraryId}`);
  }

  // ✏️ Aggiorna itinerario
  updateItinerary(userId: string, itineraryId: string, updatedData: Partial<TripWithId>) {
    return this.http.put(`${this.baseUrl}/users/${userId}/itineraries/${itineraryId}`, updatedData);
  }

  addPlacesToItinerary(userId: string, itineraryId: string, places: any[]) {
    return this.http.post(`${this.baseUrl}/users/${userId}/itineraries/${itineraryId}/places`, places);
  }

  //ceck date
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
}
