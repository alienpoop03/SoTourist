// Dati di un luogo/tappa del viaggio
export interface Place {
  placeId: string;
  name: string;
  address?: string;
  day: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  latitude: number;
  longitude: number;

  // Info foto (potrebbero servire per diversi flussi)
  photoUrl?: string;
  photoFilename?: string;
  photoReference?: string;

  // Dati da mostrare nella card
  rating?: number;
  priceLevel?: number;       // 0 = gratis, 4 = molto costoso
  website?: string;
  openingHours?: string[];
  distanceToNext?: string;   // generato lato FE

  type?: string;
  note?: string;
}

// Dati di un viaggio completo, con tappe
export interface TripWithId {
  itineraryId: string;
  city: string;
  startDate: string;
  endDate: string;
  accommodation: string;
  coverPhoto?: string;
  style?: string;
  places: Place[];    // tappe (dal backend)
}