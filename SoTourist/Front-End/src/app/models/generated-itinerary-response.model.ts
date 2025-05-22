// Contiene l’intero itinerario generato + copertina

import { GeneratedDay } from './generated-day.model';

export interface GeneratedItineraryResponse {
  itinerary: GeneratedDay[];
  coverPhoto: string | null;
}
