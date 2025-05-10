import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // ✅ corretto per standalone
})
export class ApiService {
  //private readonly BASE_URL = 'http://192.168.17.185:3000/api'; // oppure '/api' se usi proxy
    private readonly BASE_URL = 'http://localhost:3000/api'; // oppure '/api' se usi proxy


  constructor(private http: HttpClient) {}

  getItinerary(
    city: string,
    totalDays: number,
    accommodation?: string,
    extra?: { mustSee?: string[], transport?: string, aiQuestion?: string }
  ): Observable<{ itinerary: any[], coverPhoto: string }> {
    let params = new HttpParams()
      .set('city', city)
      .set('totalDays', totalDays.toString())
      .set('accommodation', accommodation || '');
  
    if (extra?.mustSee?.length) {
      params = params.set('mustSee', extra.mustSee.join(','));
    }
    if (extra?.transport) {
      params = params.set('transport', extra.transport);
    }
    if (extra?.aiQuestion) {
      params = params.set('aiQuestion', extra.aiQuestion);
    }
  
    return this.http.get<{ itinerary: any[], coverPhoto: string }>(
      `${this.BASE_URL}/itinerary`, { params }
    );
  }
  
}
