const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('better-sqlite3');
require('dotenv').config();
const setlists = JSON.parse(fs.readFileSync(path.join(__dirname, 'setlists.json'), 'utf8'));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:4173' }
});

app.use(cors({ origin: 'http://localhost:4173' }));
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'flowcue.db'));
db.prepare(`CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY, currentSongId INTEGER, currentSectionIndex INTEGER)`).run();
let row = db.prepare('SELECT * FROM state WHERE id=1').get();
if (!row) {
  db.prepare('INSERT INTO state (id, currentSongId, currentSectionIndex) VALUES (1,1,0)').run();
  row = { currentSongId: 1, currentSectionIndex: 0 };
}
let state = { currentSongId: row.currentSongId, currentSectionIndex: row.currentSectionIndex };
function saveState(){
  db.prepare('UPDATE state SET currentSongId=?, currentSectionIndex=? WHERE id=1').run(state.currentSongId, state.currentSectionIndex);
}

function buildState() {
  const song = setlists.find(s => s.id === state.currentSongId) || setlists[0];
  const section = song.sections[state.currentSectionIndex] || {};
  const nextSection = song.sections[state.currentSectionIndex + 1] || {};
  return {
    ...state,
    lyric: section.lyric || '',
    nextLyric: nextSection.lyric || '',
    background: section.background,
    song
  };
}

io.on('connection', (socket) => {
  socket.emit('state:update', buildState());
  socket.on('control:action', ({ action }) => {
    const currentSong = setlists.find(s => s.id === state.currentSongId) || setlists[0];
    if (action === 'NEXT_SLIDE') {
      if (state.currentSectionIndex < currentSong.sections.length - 1) {
        state.currentSectionIndex++;
      }
    }
    if (action === 'PREV_SLIDE' && state.currentSectionIndex > 0) {
      state.currentSectionIndex--;
    }
    if (action === 'NEXT_SONG') {
      const idx = setlists.findIndex(s => s.id === state.currentSongId);
      const nextSong = setlists[(idx + 1) % setlists.length];
      state.currentSongId = nextSong.id;
      state.currentSectionIndex = 0;
    }
    saveState();
    io.emit('state:update', buildState());
  });
});

app.get('/api/state', (req, res) => {
  res.json(buildState());
});

app.get('/api/setlists', (req, res) => {
  res.json(setlists);
});

app.post('/api/control', (req, res) => {
  const { action } = req.body;
  io.emit('control:action', action);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
