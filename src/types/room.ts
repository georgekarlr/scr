export interface Room {
  id: string;
  name: string;
  building: string | null;
  max_capacity: number;
}

export interface RoomFilters {
  search_term?: string;
}
