// Socket event types
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  SWIPE: 'swipe',
  PARTNER_JOINED: 'partner-joined',
  PARTNER_DISCONNECTED: 'partner-disconnected',
  PARTNER_SWIPED: 'partner-swiped',
  MATCH_FOUND: 'match-found',
  ROOM_READY: 'room-ready',
  ERROR: 'error',
} as const;

export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
