export interface TripWithId {
  itineraryId: string;
  city: string;
  startDate: string;
  endDate:   string;
  accommodation: string;
  coverPhoto?: string;
  style?: string;
  itinerary?: any[]; // ← o specifica il tipo preciso se hai definito un'interfaccia `Place[]`
}

export interface Place {
  placeId: string;
  name: string;
  day: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
}
