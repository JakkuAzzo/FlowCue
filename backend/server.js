const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.json());

let state = {
  currentSongId: null,
  currentSectionIndex: 0,
};

io.on('connection', (socket) => {
  socket.emit('state:update', state);
  socket.on('control:action', (action) => {
    if(action === 'next'){ state.currentSectionIndex++; }
    if(action === 'prev' && state.currentSectionIndex>0){ state.currentSectionIndex--; }
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
