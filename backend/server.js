const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('better-sqlite3');
require('dotenv').config();

// Import lyrics service
const lyricsService = require('./services/lyrics');

const setlists = JSON.parse(fs.readFileSync(path.join(__dirname, 'setlists.json'), 'utf8'));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:4173'] }
});

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'flowcue.db'));

// Enhanced database schema
db.prepare(`CREATE TABLE IF NOT EXISTS state (
  id INTEGER PRIMARY KEY, 
  currentSongId INTEGER, 
  currentSectionIndex INTEGER,
  currentLineIndex INTEGER DEFAULT 0,
  isPlaying BOOLEAN DEFAULT 0,
  performerSettings TEXT DEFAULT '{"gestures": true, "voice": true}',
  currentBackground TEXT DEFAULT NULL
)`).run();

// Add currentLineIndex column if it doesn't exist (for backward compatibility)
try {
  db.prepare(`ALTER TABLE state ADD COLUMN currentLineIndex INTEGER DEFAULT 0`).run();
} catch (e) {
  // Column already exists
}

let row = db.prepare('SELECT * FROM state WHERE id=1').get();
if (!row) {
  db.prepare(`INSERT INTO state (id, currentSongId, currentSectionIndex, currentLineIndex, isPlaying, performerSettings) 
              VALUES (1,1,0,0,0,'{"gestures": true, "voice": true}')`).run();
  row = { 
    currentSongId: 1, 
    currentSectionIndex: 0, 
    currentLineIndex: 0,
    isPlaying: false,
    performerSettings: '{"gestures": true, "voice": true}',
    currentBackground: null
  };
}

let state = { 
  currentSongId: row.currentSongId, 
  currentSectionIndex: row.currentSectionIndex,
  currentLineIndex: row.currentLineIndex || 0,
  isPlaying: Boolean(row.isPlaying),
  performerSettings: JSON.parse(row.performerSettings || '{"gestures": true, "voice": true}'),
  currentBackground: row.currentBackground ? JSON.parse(row.currentBackground) : null
};

function saveState(){
  db.prepare(`UPDATE state SET 
    currentSongId=?, 
    currentSectionIndex=?, 
    currentLineIndex=?,
    isPlaying=?, 
    performerSettings=?,
    currentBackground=?
    WHERE id=1`).run(
    state.currentSongId, 
    state.currentSectionIndex, 
    state.currentLineIndex,
    state.isPlaying ? 1 : 0,
    JSON.stringify(state.performerSettings),
    state.currentBackground ? JSON.stringify(state.currentBackground) : null
  );
}

function buildState() {
  const song = setlists.find(s => s.id === state.currentSongId) || setlists[0];
  const section = song.sections[state.currentSectionIndex] || {};
  const nextSection = song.sections[state.currentSectionIndex + 1] || {};
  
  // Use custom background if set, otherwise use section background
  const background = state.currentBackground || section.background;
  
  return {
    ...state,
    lyric: section.lyric || '',
    nextLyric: nextSection.lyric || '',
    background: background,
    currentSong: song
  };
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('state:update', buildState());
  
  // Handle control actions from any source (controller, performer)
  socket.on('control:action', ({ action }) => {
    console.log('Control action received:', action);
    handleAction(action);
  });

  // Handle performer-specific actions
  socket.on('performer:action', ({ action }) => {
    console.log('Performer action received:', action);
    handleAction(action);
    // Broadcast to controller interface
    socket.broadcast.emit('performer:action', { action });
  });

  // Handle performer settings changes
  socket.on('control:performer-settings', (settings) => {
    console.log('Performer settings update:', settings);
    state.performerSettings = { ...state.performerSettings, ...settings };
    saveState();
    io.emit('performer:settings', state.performerSettings);
  });

  // Handle audience display mode changes
  socket.on('control:audience-display', (mode) => {
    console.log('Audience display mode:', mode);
    io.emit('audience:display-mode', mode);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

function handleAction(action) {
  const currentSong = setlists.find(s => s.id === state.currentSongId) || setlists[0];
  const currentSection = currentSong.sections?.[state.currentSectionIndex];
  
  if (typeof action === 'string') {
    switch (action) {
      case 'NEXT_SLIDE':
        if (currentSection && currentSection.content) {
          const lines = currentSection.content.split('\n').filter(line => line.trim());
          if (state.currentLineIndex < lines.length - 1) {
            // Move to next line within section
            state.currentLineIndex++;
          } else if (state.currentSectionIndex < currentSong.sections.length - 1) {
            // Move to next section and reset line
            state.currentSectionIndex++;
            state.currentLineIndex = 0;
          }
        } else if (state.currentSectionIndex < currentSong.sections.length - 1) {
          // Fallback: move to next section if current section has no content
          state.currentSectionIndex++;
          state.currentLineIndex = 0;
        }
        break;
      case 'PREV_SLIDE':
        if (state.currentLineIndex > 0) {
          // Move to previous line within section
          state.currentLineIndex--;
        } else if (state.currentSectionIndex > 0) {
          // Move to previous section and go to last line
          state.currentSectionIndex--;
          const prevSection = currentSong.sections?.[state.currentSectionIndex];
          if (prevSection && prevSection.content) {
            const lines = prevSection.content.split('\n').filter(line => line.trim());
            state.currentLineIndex = Math.max(0, lines.length - 1);
          } else {
            state.currentLineIndex = 0;
          }
        }
        break;
      case 'NEXT_SECTION':
        if (state.currentSectionIndex < currentSong.sections.length - 1) {
          state.currentSectionIndex++;
          state.currentLineIndex = 0;
        }
        break;
      case 'PREV_SECTION':
        if (state.currentSectionIndex > 0) {
          state.currentSectionIndex--;
          state.currentLineIndex = 0;
        }
        break;
      case 'NEXT_SONG':
        const idx = setlists.findIndex(s => s.id === state.currentSongId);
        const nextSong = setlists[(idx + 1) % setlists.length];
        state.currentSongId = nextSong.id;
        state.currentSectionIndex = 0;
        state.currentLineIndex = 0;
        break;
      case 'DETECT_SONG':
        // Placeholder for song detection logic
        console.log('Song detection requested');
        break;
      case 'PLAY':
        state.isPlaying = true;
        break;
      case 'PAUSE':
        state.isPlaying = false;
        break;
      case 'PLAY_PAUSE':
        state.isPlaying = !state.isPlaying;
        break;
    }
  } else if (typeof action === 'object') {
    switch (action.type) {
      case 'SELECT_SONG':
        state.currentSongId = action.songId;
        state.currentSectionIndex = 0;
        state.currentLineIndex = 0;
        break;
      case 'GO_TO_SECTION':
        if (action.index >= 0 && action.index < currentSong.sections.length) {
          state.currentSectionIndex = action.index;
          state.currentLineIndex = 0;
        }
        break;
      case 'UPDATE_BACKGROUND':
        state.currentBackground = action.background;
        break;
    }
  }
  
  saveState();
  io.emit('state:update', buildState());
}

app.get('/api/state', (req, res) => {
  res.json(buildState());
});

app.get('/api/setlists', (req, res) => {
  // Combine original setlists with library songs
  const library = lyricsService.getLibrary();
  const allSongs = [...setlists, ...library];
  res.json(allSongs);
});

// Lyrics API endpoints
app.get('/api/library', (req, res) => {
  const library = lyricsService.getLibrary();
  res.json(library);
});

app.post('/api/lyrics/search', async (req, res) => {
  try {
    const { artist, title } = req.body;
    
    if (!artist || !title) {
      return res.status(400).json({ error: 'Artist and title are required' });
    }

    const song = await lyricsService.fetchLyrics(artist, title);
    res.json(song);
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/library/save', async (req, res) => {
  try {
    const { song } = req.body;
    
    if (!song || !song.title || !song.artist) {
      return res.status(400).json({ error: 'Invalid song data' });
    }

    const savedSong = lyricsService.saveToLibrary(song);
    res.json(savedSong);
  } catch (error) {
    console.error('Error saving to library:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/library/:songId', (req, res) => {
  try {
    const { songId } = req.params;
    const library = lyricsService.getLibrary();
    const updatedLibrary = library.filter(song => song.id !== songId);
    
    // Save updated library
    const fs = require('fs');
    const path = require('path');
    const libraryPath = path.join(__dirname, 'data', 'library.json');
    fs.writeFileSync(libraryPath, JSON.stringify(updatedLibrary, null, 2));
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting from library:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lyrics/detect', async (req, res) => {
  try {
    // Placeholder for audio detection
    // In a real implementation, this would process audio data
    res.json({
      artist: "Unknown Artist",
      title: "Unknown Song",
      confidence: 0.5,
      message: "Audio detection not yet implemented"
    });
  } catch (error) {
    console.error('Error detecting song:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/control', (req, res) => {
  const { action } = req.body;
  handleAction(action);
  res.json({ ok: true });
});

// New endpoints for enhanced functionality
app.post('/api/background', (req, res) => {
  const { background } = req.body;
  state.currentBackground = background;
  saveState();
  io.emit('state:update', buildState());
  res.json({ ok: true });
});

app.get('/api/performer/settings', (req, res) => {
  res.json(state.performerSettings);
});

app.post('/api/performer/settings', (req, res) => {
  const { settings } = req.body;
  state.performerSettings = { ...state.performerSettings, ...settings };
  saveState();
  io.emit('performer:settings', state.performerSettings);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  console.log(`Server listening on ${PORT}`);
  
  // Initialize demo songs if library is empty
  const library = lyricsService.getLibrary();
  if (library.length === 0) {
    console.log('Library is empty, initializing demo songs...');
    await lyricsService.initializeDemoSongs();
  }
});
