// Raccoglie i luoghi di un giorno, divisi in fasce orarie e in ordine sequenziale

import { GeneratedPlace } from './generated-place.model';

export interface GeneratedDay {
  day: number;
  morning: GeneratedPlace[];
  afternoon: GeneratedPlace[];
  evening: GeneratedPlace[];
  ordered: GeneratedPlace[];
}