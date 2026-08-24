# Dodge & Shoot — MERN Setup

## Structure
```
dodge-shoot-game/
├── client/          # React + Vite frontend (the actual game runs here, in Canvas)
│   └── src/game/     # Game entities (Player, Obstacle) + GameCanvas.jsx
└── server/          # Express + MongoDB backend (for future high-score/progress API)
    ├── index.js
    └── .env          # PORT + MONGO_URI (copy from .env.example, fill in your Mongo URI)
```

## Run it (PowerShell)

**Terminal 1 — client:**
```powershell
cd client
npm install
npm run dev
```
Opens at http://localhost:5173 — the game is live here already (movement, jump, dodge fire, 3 health, game over + restart on R).

**Terminal 2 — server** (only needed once we start wiring high-score API calls; not required to play right now):
```powershell
cd server
npm install
npm run dev
```
Runs on http://localhost:5000. Requires a MongoDB URI in `.env` — either a local MongoDB instance or a free MongoDB Atlas cluster connection string.

## Current status
- Client: Level 1 mechanics working — move, jump, dodge fire obstacles, health/game-over/restart
- Server: Express boots, MongoDB connection wired, no routes yet (health-check endpoint at `/api/health` only)
- Not yet built: shoot key + enemy gunman, level progression (2-10), sprite rendering (currently placeholder rectangles)

## Next steps
1. Playtest current movement/jump feel — tune `GRAVITY`, `JUMP_VELOCITY`, `MOVE_SPEED` in `client/src/game/entities/Player.js` if needed
2. Add shoot key + Enemy entity
3. Add Level config system (per SRS §4.5, §5.3)
4. Swap placeholder rectangles for real sprite sheets
5. Build server route + Mongoose model for saving high scores (only real MERN-backend need for this project)
