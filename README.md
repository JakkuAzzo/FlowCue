# FlowCue Live

FlowCue Live is a web-based performance controller that lets worship leaders, musicians, presenters and speakers seamlessly navigate lyrics, slides, and songs using **custom gestures**, **voice commands**, or manual controls. It supports multi-device sync, extended displays, dynamic backgrounds, and on-the-fly song detection.

## Features

- **Gesture Control**: Next/Previous slides, switch songs, trigger live song detection.
- **Voice & Audio Recognition**: "Next slide", "Previous", live lyrics lookup via Whisper or ACRCloud.
- **Real-Time Sync**: All connected devices stay in perfect sync via Socket.IO or Firebase.
- **Extended Display**: Audience and performer screens with custom layouts.
- **Dynamic Backgrounds**: Video or image backgrounds with automatic contrast adjustment.
- **Role-Based Modes**: Admin, Presenter, Viewer—with Performance and Presentation modes.
- **PWA Support**: Installable on mobile/tablets, offline-capable.

## Functional Overview

FlowCue Live revolves around three primary UIs—controller, performer, and audience—all kept in sync in real time. Gestures and voice commands are processed in the browser using MediaPipe and TensorFlow.js. The back-end exposes a small API for setlists and state, while WebSockets broadcast updates so every connected device follows the same song and slide. Background media is analyzed on each slide change to ensure text remains legible.

### Key Functional Requirements
- Gesture-driven next/previous slide and song switching
- Voice commands for basic navigation
- Upload markdown, pptx or pdf lyrics
- Extended audience and performer displays
- Dynamic background media with automatic text contrast
- Real-time state sync across connected clients


## Tech Stack

- **Front-End**: React, Vite, TailwindCSS, MediaPipe.js, TensorFlow.js
- **Back-End**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL (or Supabase)
- **Real-Time**: Firebase Realtime DB (optional fallback)
- **Audio Recognition**: ACRCloud API or OpenAI Whisper
- **Hosting**: Vercel (front-end), Heroku/DigitalOcean (API)

## Quick Start

1. **Clone repository**
   ```bash
   git clone https://github.com/your-org/flowcue-live.git
   cd flowcue-live
   ```
2. **Configure environment**
   - Copy `.env.example` → `.env`
   - Fill in `API_URL`, `DB_URL`, `ACRCLOUD_KEY`, etc.
3. **Install dependencies**
   ```bash
   # Front-end
   cd frontend
   npm install

   # Back-end
   cd ../backend
   npm install
   ```
4. **Run locally**
   ```bash
   # Start database (e.g. via Docker)
   docker-compose up -d

   # API server
   cd backend
   npm run dev

   # Frontend
   cd ../frontend
   npm run dev
   ```
5. **Access**
   - Controller UI: http://localhost:3000/controller
   - Performer UI: http://localhost:3000/performer
   - Audience UI: http://localhost:3000/audience

## Project Structure

```
flowcue-live/
├── frontend/          # React/Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── vite.config.js
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── routes/
│   └── server.js
├── docker-compose.yml # DB + optional services
└── README.md
```

## Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to your branch: `git push origin feat/your-feature`
5. Open a Pull Request.

Please follow the Contributor Covenant code of conduct.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
