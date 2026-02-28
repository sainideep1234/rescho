# RESCHO - Restaurant Matching App

## Overview
A real-time, mobile-first web app where two people connect in a room and swipe through restaurant suggestions. When both swipe right on the same restaurant, it's a match. Dark theme, gamified UI.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS (dark theme)
- **Animations**: Framer Motion + react-use-gesture
- **Restaurant API**: Foursquare Places API (100k free calls/month)

## Project Structure
```
rescho/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with dark theme
│   │   ├── page.tsx                # Landing page
│   │   ├── location/page.tsx       # Location selection
│   │   ├── room/
│   │   │   ├── create/page.tsx     # Create room & get code
│   │   │   ├── join/page.tsx       # Join with code
│   │   │   └── [roomId]/page.tsx   # Swipe interface
│   │   └── api/
│   │       ├── rooms/              # Room CRUD endpoints
│   │       └── restaurants/        # Foursquare integration
│   ├── components/
│   │   ├── landing/                # Hero, Features, CTAs
│   │   ├── swipe/                  # SwipeCard, SwipeStack, MatchModal
│   │   ├── room/                   # RoomCode, WaitingRoom
│   │   └── ui/                     # Button, Card, Modal, Toast
│   ├── lib/
│   │   ├── socket/                 # Socket.io client/server
│   │   ├── api/foursquare.ts       # API client
│   │   └── room/manager.ts         # Room state logic
│   ├── contexts/                   # Socket, Room, Swipe contexts
│   ├── hooks/                      # useSocket, useSwipe, useRoom
│   └── types/                      # TypeScript definitions
├── server/
│   └── socket-server.ts            # Custom server with Socket.io
└── public/
    └── sounds/                     # Swipe, match sound effects
```

## Implementation Tasks

### Phase 1: Project Setup
1. Initialize Next.js 14+ with TypeScript and App Router
2. Install dependencies: socket.io, socket.io-client, framer-motion, @use-gesture/react, axios
3. Configure Tailwind CSS with dark theme (black #0a0a0a, neon green #00ff88, neon purple #b833ff)
4. Set up project folder structure
5. Create .env.local with FOURSQUARE_API_KEY placeholder

### Phase 2: Landing Page
6. Create root layout with dark theme, fonts, and metadata
7. Build landing page with:
   - Hero section: Animated logo, tagline "Find Your Perfect Dinner Spot Together"
   - Features showcase (real-time matching, local restaurants, gamified)
   - Two CTAs: "Create Room" and "Join Room"
8. Add basic UI components (Button, Card)

### Phase 3: Location Selection
9. Build location selection page with:
   - Browser geolocation detection
   - Manual location input with search
   - Continue button to proceed

### Phase 4: Room System
10. Implement room management:
    - Generate unique 6-char room codes
    - In-memory room storage (Map)
    - API routes: POST /api/rooms/create, POST /api/rooms/join
11. Build room creation page:
    - Display shareable room code with copy button
    - Waiting animation for partner
12. Build room join page:
    - Input for room code
    - Validation and error handling

### Phase 5: Socket.io Integration
13. Create custom server (server/socket-server.ts) with Socket.io
14. Implement Socket events:
    - join-room: Add user, broadcast partner-joined
    - swipe: Record swipe, check for match
    - disconnect: Notify partner
15. Create Socket client and context
16. Wire up room pages to Socket for real-time updates

### Phase 6: Restaurant Data
17. Implement Foursquare API client:
    - Fetch restaurants by lat/lng
    - Transform response to internal Restaurant type
    - Handle errors and rate limits
18. Create /api/restaurants endpoint
19. Pre-fetch restaurants when room is created

### Phase 7: Swipe Interface
20. Build SwipeCard component:
    - Restaurant image as background
    - Name, cuisine, description overlay
    - Neon border/glow effects
21. Implement swipe gestures with react-use-gesture:
    - Drag to rotate/translate
    - Swipe right = like, left = discard
    - Spring animations for snap-back
22. Build SwipeStack to manage card deck
23. Create swipe page (/room/[roomId]):
    - Header with room code and connection status
    - Swipe stack in center
    - Fallback like/discard buttons

### Phase 8: Match Detection
24. Server-side match logic:
    - Track swipes per user
    - Detect when both swipe right on same restaurant
    - Emit match-found event
25. Build MatchModal:
    - Full-screen overlay
    - "It's a Match!" headline
    - Restaurant details
    - Confetti animation
    - "Continue Swiping" / "View Matches" buttons

### Phase 9: Gamification & Polish
26. Add sound effects (swipe, match, join)
27. Add progress indicators (swipe count, match count)
28. Implement page transitions and loading states
29. Mobile optimizations (touch targets, prevent pull-to-refresh)

### Phase 10: Testing & Verification
30. Test complete flow with two browser windows
31. Test edge cases (disconnect, no matches, API errors)
32. Verify responsive design on mobile

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Room Storage | In-memory Map | Simple for MVP; migrate to Redis later |
| Real-time | Socket.io | Low latency, industry standard |
| Restaurant API | Foursquare | 100k free calls/month, global coverage |
| Deployment | Custom server | Socket.io needs persistent connections |

## Color Scheme
```css
--bg-primary: #0a0a0a;       /* Pure black */
--bg-secondary: #1a1a1a;     /* Dark gray */
--accent-primary: #00ff88;   /* Neon green - likes, CTAs */
--accent-secondary: #b833ff; /* Neon purple - highlights */
--accent-error: #ff3366;     /* Neon pink - discard */
--text-primary: #ffffff;     /* White */
--text-secondary: #a0a0a0;   /* Light gray */
```

## Critical Files
1. `server/socket-server.ts` - Socket.io server setup
2. `src/app/room/[roomId]/page.tsx` - Main swipe interface
3. `src/components/swipe/SwipeCard.tsx` - Restaurant card with gestures
4. `src/lib/api/foursquare.ts` - Restaurant data fetching
5. `src/contexts/RoomContext.tsx` - Room state management

## Verification Steps
1. Run `npm run dev` (or custom server script)
2. Open two browser windows
3. Create room in window 1, copy code
4. Join room in window 2 with code
5. Verify both see restaurants and can swipe
6. Swipe right on same restaurant in both windows
7. Verify match modal appears in both
8. Test on mobile viewport for touch gestures
