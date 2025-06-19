export type Phase = 'morning' | 'afternoon' | 'evening';

export interface Poi {
  id: string;
  lat: number;
  lng: number;
  name?: string;
}

export interface DayItinerary {
  morning: Poi[];
  afternoon: Poi[];
  evening: Poi[];
}

export interface Itinerary {
  itineraryId: string;
  city: string;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  itinerary: DayItinerary[];
}
