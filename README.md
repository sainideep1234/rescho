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



## V1 proposal
- write now you can choose the restaurants which you want to like , 
- add a share button at the end that allows you to copy the room code and send to your partner. 

## V2 proposal 
- people while creatzaing room choose wheatreh they want to choose , cuisine (indian , italion) , food type(dinner , luch , breakfast )
- person also get recomanedation based on teh food , cuisine and based on that fetch suggestoin from api .