# UnderCoverIndia

## Overview
UnderCoverIndia is a real-time multiplayer word deduction game where players try to identify who among them is the undercover agent or Mr. White. It's a social deduction game built with React, Express, WebSockets, and TypeScript.

**Current State**: The application is fully functional and running in the Replit environment with in-memory storage.

## Project Architecture

### Technology Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express + Node.js + TypeScript
- **Real-time Communication**: WebSockets (ws library)
- **State Management**: React Context API
- **UI Components**: Radix UI + shadcn/ui components
- **Database Schema**: Drizzle ORM (configured for PostgreSQL)
- **Current Storage**: In-memory storage (MemStorage class)

### Project Structure
```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # React hooks (WebSocket, toast, mobile)
│   │   ├── lib/         # Utilities and game state
│   │   └── pages/       # Page components (home, lobby, game)
│   └── index.html
├── server/              # Backend Express server
│   ├── index.ts        # Main server entry point
│   ├── routes.ts       # WebSocket route handlers
│   ├── storage.ts      # Storage interface and MemStorage implementation
│   └── vite.ts         # Vite dev server configuration
├── shared/             # Shared TypeScript types and schemas
│   └── schema.ts       # Database schema and game types
└── migrations/         # Database migrations (not currently used)
```

## Recent Changes
**Date**: October 7, 2025

### Replit Environment Setup
1. Installed all Node.js dependencies via npm
2. Configured development workflow to run on port 5000
3. Verified Vite configuration has `allowedHosts: true` for Replit proxy support
4. Configured deployment settings for VM deployment (required for in-memory storage and WebSocket persistence)
5. Created initial project documentation

### Storage Architecture
- Currently using **in-memory storage** (MemStorage class) for game state
- Database schema is defined using Drizzle ORM but not actively used
- PostgreSQL database setup is prepared but not provisioned
- Game data persists only during server runtime

## Game Features
- Real-time multiplayer gameplay with WebSocket connections
- Role assignment: Civilians, Undercovers, and Mr. White
- Multiple game phases: Lobby, Descriptive, Voting, Mr. White Guess, Game Over
- Player reconnection support with localStorage
- Live player management (join, leave, host transfer)
- Score tracking system
- Word pair selection system

## Development

### Running Locally
The application runs automatically via the configured workflow:
- **Development**: `npm run dev` (already configured in workflow)
- **Build**: `npm run build`
- **Production**: `npm start`

### Configuration
- **Server Port**: Always uses port 5000 (only open port in Replit)
- **Host**: 0.0.0.0 for frontend accessibility
- **WebSocket Path**: `/ws`
- **Vite Dev Server**: Configured with `allowedHosts: true` for Replit proxy

### Key Files to Know
- `server/storage.ts`: Contains storage interface and in-memory implementation
- `server/routes.ts`: All WebSocket message handlers and game logic
- `client/src/hooks/use-websocket.ts`: WebSocket connection management
- `shared/schema.ts`: Database schema and game type definitions

## Deployment

### Current Configuration
- **Deployment Type**: VM (Reserved VM)
- **Reason**: Required for in-memory storage persistence and WebSocket connections
- **Build Command**: `npm run build`
- **Run Command**: `npm start`

### Important Notes
- VM deployment is necessary because the game uses in-memory storage
- Autoscale deployment would create multiple instances that don't share game state
- To use Autoscale in the future, implement persistent storage (PostgreSQL) and ensure WebSocket connections can handle load balancing

## Future Improvements
1. **Database Integration**: Implement PostgreSQL storage using the existing Drizzle schema
2. **Persistent Storage**: Replace MemStorage with database-backed storage
3. **Session Management**: Add proper session handling with express-session
4. **Authentication**: Implement user authentication using passport
5. **Scaling**: Once database is integrated, can switch to Autoscale deployment
6. **Word Pairs**: Expand the word pair collection for more variety

## Database Schema
The project includes a complete database schema in `shared/schema.ts`:
- **users**: User accounts (prepared for authentication)
- **rooms**: Game rooms with settings and phase tracking
- **players**: Player information, roles, and scores
- **gameDescriptions**: Player descriptions per round
- **gameVotes**: Voting records per round

To activate PostgreSQL storage:
1. Provision a PostgreSQL database in Replit
2. Implement database storage class following IStorage interface
3. Replace `new MemStorage()` with database implementation in `server/storage.ts`
4. Run migrations: `npm run db:push`

## User Preferences
No specific user preferences documented yet.

## Notes
- The application is fully functional with WebSocket real-time gameplay
- Browser console shows Vite HMR WebSocket errors (can be ignored - game WebSocket works fine)
- LocalStorage is used for player reconnection
- All UI components use Radix UI primitives with Tailwind styling
