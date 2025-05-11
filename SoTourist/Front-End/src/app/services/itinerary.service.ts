import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TripWithId } from 'src/app/models/trip.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private baseUrl = 'http://localhost:3000/api'; // metti il tuo IP reale

  constructor(private http: HttpClient) { }

  createItinerary(userId: string, rawData: {
    city: string;
    accommodation: string;
    startDate: string;
    endDate: string;
    photo?: string;
    style?: string;
  }) {
    const itinerary = {
      city: rawData.city,
      accommodation: rawData.accommodation,
      startDate: rawData.startDate,
      endDate: rawData.endDate,
      style: rawData.style || 'generico',
      photo: rawData.photo || '', // ✅ usa 'photo' al posto di 'coverPhoto'
      places: []
    };


    return this.http.post(`${this.baseUrl}/users/${userId}/itineraries`, itinerary);
  }

  // 🔁 Recupera un itinerario specifico
  getItineraryById(itineraryId: string): Observable<TripWithId> {
    return this.http.get<TripWithId>(`${this.baseUrl}/itineraries/${itineraryId}`);
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
}
