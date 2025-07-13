# FlowCue Live

FlowCue Live is a simple proof-of-concept implementation based on the provided functional specification. It consists of a React front-end and an Express/WebSocket back-end. Devices connect via Socket.IO and can send `next` or `prev` actions that update shared state.

## Project Structure

```
FlowCue/
  backend/   # Express API + Socket.IO
  frontend/  # React app (Vite)
```

## Development

1. Install dependencies
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Start back-end and front-end
   ```bash
   # backend
   cd backend
   npm start
   # in another terminal
   cd ../frontend
   npm run dev
   ```
3. Open http://localhost:5173/controller to see the controller interface.

This is only a minimal skeleton implementing real-time sync and simple controls. Additional features such as gesture or voice support would be added on top of this foundation.
