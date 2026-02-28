import { Restaurant } from './restaurant';

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface RoomUser {
  id: string;
  joinedAt: number;
}

export interface SwipeRecord {
  restaurantId: string;
  direction: 'left' | 'right';
  timestamp: number;
}

export interface Room {
  id: string;
  code: string;
  location: Location;
  users: RoomUser[];
  restaurants: Restaurant[];
  swipes: Record<string, SwipeRecord[]>;
  matches: string[];
  status: 'waiting' | 'active' | 'completed';
  createdAt: number;
}

export interface CreateRoomRequest {
  location: Location;
}

export interface CreateRoomResponse {
  roomId: string;
  code: string;
}

export interface JoinRoomRequest {
  code: string;
  userId: string;
}

export interface JoinRoomResponse {
  roomId: string;
  location: Location;
}
