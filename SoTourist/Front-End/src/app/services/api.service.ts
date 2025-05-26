// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './ip.config';

export interface GenerateItineraryRequest {
  city: string;
  totalDays: number;
  accommodation?: string;
  mustSee?: string[];
  mustEat?: string[];
  avoid?: string[];
  transport?: string;
  aiQuestion?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = `${API_BASE_URL}/api`;

  constructor(private http: HttpClient) {}

  /** Genera un itinerario (POST) - mantiene il vecchio nome per compatibilità */
  getItinerary(body: GenerateItineraryRequest):
    Observable<{ itinerary: any[]; coverPhoto: string }> {

    return this.http.post<{ itinerary: any[]; coverPhoto: string }>(
      `${this.BASE_URL}/itinerary`,
      body
    );
  }
}
