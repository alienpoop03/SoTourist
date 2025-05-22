export interface Place {
  placeId:   string;
  name:      string;
  day:       number;
  timeSlot:  'morning'|'afternoon'|'evening';
  latitude:  number;
  longitude: number;
  address?:  string;
  photo?:    string;
}



export interface TripWithId {
  itineraryId: string;
  city: string;
  startDate: string;
  endDate: string;
  accommodation: string;
  coverPhoto?: string;
  style?: string;
  places: Place[];
}


