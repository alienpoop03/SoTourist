import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // ✅ corretto per standalone
})
export class ApiService {
  private readonly BASE_URL = 'http://localhost:3000/api'; // oppure '/api' se usi proxy

  constructor(private http: HttpClient) {}

  getItinerary(city: string, totalDays: number, accommodation?: string): Observable<{ itinerary: any[], coverPhoto: string }> {
    const params = new HttpParams()
      .set('city', city)
      .set('totalDays', totalDays.toString())
      .set('accommodation', accommodation || '');

    return this.http.get<{ itinerary: any[], coverPhoto: string }>(
      `${this.BASE_URL}/itinerary`, { params }
    );
  }
}
