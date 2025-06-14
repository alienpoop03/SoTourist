export interface Place {

  // per cercarlo correttamente sulla mappa
  placeId: string;
  name: string;
  address?: string;
  day: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  latitude: number;
  longitude: number;

  // da capire perchè abbiamo tutte ste cose per la photo
  photoUrl?: string;        // URL completo dell'immagine
  photoFilename?: string;   // Nome file salvato nel backend
  photoReference?: string;  // usato per il download iniziale

  // cose utili da far vedere nella card
  rating?: number;
  priceLevel?: number;        // da 0 (gratis) a 4 (molto costoso)
  website?: string;
  openingHours?: string[];
  distanceToNext?: string;  // calcolato dinamicamente ( non passato da google)

  type?: string;
  note?: string;
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
