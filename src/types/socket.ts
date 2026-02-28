export interface SocketUser {
  id: string;
  roomId: string | null;
}

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
}

export interface SwipePayload {
  roomId: string;
  userId: string;
  restaurantId: string;
  direction: 'left' | 'right';
}

export interface MatchFoundPayload {
  restaurantId: string;
  restaurantName: string;
}

export interface PartnerJoinedPayload {
  partnerId: string;
}

export interface PartnerDisconnectedPayload {
  partnerId: string;
}

export type SocketEventMap = {
  'join-room': JoinRoomPayload;
  'leave-room': { roomId: string; userId: string };
  'swipe': SwipePayload;
  'partner-joined': PartnerJoinedPayload;
  'partner-disconnected': PartnerDisconnectedPayload;
  'match-found': MatchFoundPayload;
  'room-ready': { restaurants: number };
  'error': { message: string };
};
