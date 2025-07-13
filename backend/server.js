const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('better-sqlite3');
require('dotenv').config();

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
  db.prepare('INSERT INTO state (id, currentSongId, currentSectionIndex) VALUES (1,NULL,0)').run();
  row = { currentSongId: null, currentSectionIndex: 0 };
}
let state = { currentSongId: row.currentSongId, currentSectionIndex: row.currentSectionIndex };
function saveState(){
  db.prepare('UPDATE state SET currentSongId=?, currentSectionIndex=? WHERE id=1').run(state.currentSongId, state.currentSectionIndex);
}

io.on('connection', (socket) => {
  socket.emit('state:update', state);
  socket.on('control:action', (action) => {
    if (action === 'next') {
      state.currentSectionIndex++;
    }
    if (action === 'prev' && state.currentSectionIndex > 0) {
      state.currentSectionIndex--;
    }
    saveState();
    io.emit('state:update', state);
  });
});

app.get('/api/state', (req, res) => {
  res.json(state);
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
