export interface Place {
  placeId: string;
  name: string;
  day: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  latitude: number;
  longitude: number;
  address?: string;
  photoUrl?: string;        // URL completo dell'immagine
  photoFilename?: string;   // Nome file salvato nel backend
  rating?: number;
  type?: string;
  note?: string;
  photoReference?: string;  // usato per il download iniziale
  distanceToNext?: string;  // calcolato dinamicamente
}

export interface TripWithId {
  itineraryId:   string;
  city:          string;
  startDate:     string;
  endDate:       string;
  accommodation: string;
  coverPhoto?:   string;
  style?:        string;
  places:        Place[];     // ← corrisponde al campo che ti manda il backend
}
