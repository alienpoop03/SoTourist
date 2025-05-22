//Rappresenta i dati completi di un posto (nome, posizione, foto, rating, ecc.)

export interface GeneratedPlace {
  name: string;
  address: string;
  rating: number;
  photo: string | null;
  latitude: number;
  longitude: number;
  distanceToNext?: string; // solo nei luoghi in 'ordered'
}
