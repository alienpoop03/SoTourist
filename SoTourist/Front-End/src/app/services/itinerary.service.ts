import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private baseUrl = 'http://localhost:3000/api'; // metti il tuo IP reale

  constructor(private http: HttpClient) {}

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
      coverPhoto: rawData.photo || '',
      places: [] // inizialmente vuoto, verrà popolato dopo
    };

    return this.http.post(`${this.baseUrl}/users/${userId}/itineraries`, itinerary);
  }
}
