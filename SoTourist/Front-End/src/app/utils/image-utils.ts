export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string); // contiene anche data:image/png;base64,...
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

// Aggiungiamo la nuova funzione qui sotto:

import { Place } from '../models/trip.model';
import { API_BASE_URL } from '../services/ip.config';

export function getPlacePhotoUrl(place: Place): string {
  if (!place.photo) {
    return 'assets/images/placeholder.jpg';
  }
  return `${API_BASE_URL}/uploads/${place.photo}`;
}
