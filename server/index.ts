import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketServer, Socket } from 'socket.io';
import { 
  getRoomById, 
  addUserToRoom, 
  removeUserFromRoom, 
  recordSwipe,
  setRoomRestaurants
} from '../src/lib/room/manager';
import { searchRestaurants } from '../src/lib/api/foursquare';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Track user connections
const userSockets = new Map<string, string>(); // socketId -> userId
const userRooms = new Map<string, string>(); // userId -> roomId

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
    },
    path: '/api/socketio',
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle room joining
    socket.on('join-room', async (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      
      const room = getRoomById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Add user to room
      const success = addUserToRoom(roomId, userId);
      if (!success) {
        socket.emit('error', { message: 'Failed to join room' });
        return;
      }

      // Track connection
      userSockets.set(socket.id, userId);
      userRooms.set(userId, roomId);

      // Join socket room
      socket.join(roomId);

      // Notify other users in room
      socket.to(roomId).emit('partner-joined', { partnerId: userId });

      // Fetch restaurants if not already done
      const updatedRoom = getRoomById(roomId);
      if (updatedRoom && updatedRoom.restaurants.length === 0) {
        try {
          const restaurants = await searchRestaurants(
            updatedRoom.location.lat,
            updatedRoom.location.lng,
            50
          );
          setRoomRestaurants(roomId, restaurants);
          
          // Notify all users in room that data is ready
          io.to(roomId).emit('room-ready', { 
            restaurants: restaurants.length,
            restaurantData: restaurants
          });
        } catch (error) {
          console.error('Failed to fetch restaurants:', error);
          socket.emit('error', { message: 'Failed to load restaurants' });
        }
      } else if (updatedRoom && updatedRoom.restaurants.length > 0) {
        // Send existing restaurant data to new user
        socket.emit('room-ready', { 
          restaurants: updatedRoom.restaurants.length,
          restaurantData: updatedRoom.restaurants
        });
      }

      console.log(`User ${userId} joined room ${roomId}`);
    });

    // Handle swipe events
    socket.on('swipe', (data: { roomId: string; userId: string; restaurantId: string; direction: 'left' | 'right' }) => {
      const { roomId, userId, restaurantId, direction } = data;

      const result = recordSwipe(roomId, userId, restaurantId, direction);
      
      if (!result.success) {
        socket.emit('error', { message: 'Failed to record swipe' });
        return;
      }

      // Notify partner of swipe
      socket.to(roomId).emit('partner-swiped', { restaurantId, direction });

      if (result.isMatch) {
        // Get restaurant details
        const room = getRoomById(roomId);
        const restaurant = room?.restaurants.find(r => r.id === restaurantId);
        
        // Notify both users of match
        io.to(roomId).emit('match-found', { 
          restaurantId,
          restaurantName: restaurant?.name || 'Restaurant',
          restaurant
        });
      }
    });

    // Handle leaving room
    socket.on('leave-room', (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      handleUserLeave(socket, userId, roomId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = userSockets.get(socket.id);
      const roomId = userId ? userRooms.get(userId) : null;

      if (userId && roomId) {
        handleUserLeave(socket, userId, roomId);
      }

      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  function handleUserLeave(socket: Socket, userId: string, roomId: string) {
    removeUserFromRoom(roomId, userId);
    socket.leave(roomId);
    
    // Notify partner
    socket.to(roomId).emit('partner-disconnected', { partnerId: userId });

    // Clean up tracking
    userSockets.delete(socket.id);
    userRooms.delete(userId);
  }

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
