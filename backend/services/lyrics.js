const { Client } = require('genius-lyrics');
const fs = require('fs');
const path = require('path');

// Initialize Genius client (no API key needed for basic usage)
const genius = new Client();

class LyricsService {
  constructor() {
    this.libraryPath = path.join(__dirname, '..', 'data', 'library.json');
    this.ensureLibraryExists();
  }

  ensureLibraryExists() {
    const dataDir = path.dirname(this.libraryPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.libraryPath)) {
      fs.writeFileSync(this.libraryPath, JSON.stringify([], null, 2));
    }
  }

  getLibrary() {
    try {
      const data = fs.readFileSync(this.libraryPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading library:', error);
      return [];
    }
  }

  saveToLibrary(song) {
    try {
      const library = this.getLibrary();
      
      // Check if song already exists
      const existingIndex = library.findIndex(s => s.id === song.id);
      
      if (existingIndex >= 0) {
        library[existingIndex] = song;
      } else {
        library.push(song);
      }
      
      fs.writeFileSync(this.libraryPath, JSON.stringify(library, null, 2));
      return song;
    } catch (error) {
      console.error('Error saving to library:', error);
      throw error;
    }
  }

  async fetchLyrics(artist, title) {
    try {
      console.log(`Fetching lyrics for: ${artist} - ${title}`);
      
      // Search for the song on Genius
      const searches = await genius.songs.search(`${artist} ${title}`);
      
      if (!searches || searches.length === 0) {
        throw new Error('No songs found');
      }
      
      // Get the first result (most relevant)
      const song = searches[0];
      
      // Fetch the full lyrics
      const lyrics = await song.lyrics();
      
      if (lyrics) {
        const processedSong = this.processLyrics(lyrics, title, artist);
        return processedSong;
      }
      
      throw new Error('No lyrics found');
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      throw error;
    }
  }

  processLyrics(rawLyrics, title, artist) {
    const lines = rawLyrics.split('\n').filter(line => line.trim());
    const sections = [];
    let currentSection = null;
    let currentLabel = 'Verse 1';
    let verseCount = 1;
    let chorusCount = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;

      // Check for section markers like [Verse 1], [Chorus], etc.
      const sectionMatch = line.match(/^\[(.*?)\]/);
      if (sectionMatch) {
        if (currentSection && currentSection.lyrics.length > 0) {
          sections.push({
            label: currentSection.label,
            content: currentSection.lyrics.join('\n')
          });
        }
        
        currentLabel = sectionMatch[1];
        currentSection = {
          label: currentLabel,
          lyrics: []
        };
        continue;
      }

      if (!currentSection) {
        currentSection = {
          label: currentLabel,
          lyrics: []
        };
      }

      currentSection.lyrics.push(line);
    }

    // Add final section
    if (currentSection && currentSection.lyrics.length > 0) {
      sections.push({
        label: currentSection.label,
        content: currentSection.lyrics.join('\n')
      });
    }

    // If no sections detected, create one section
    if (sections.length === 0) {
      sections.push({
        label: 'Verse 1',
        content: lines.join('\n')
      });
    }

    return {
      id: `${title}-${artist}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      title,
      artist,
      sections,
      rawLyrics,
      dateAdded: new Date().toISOString()
    };
  }

  async initializeDemoSongs() {
    const demoSongs = [
      { artist: 'Hillsong Worship', title: 'Amazing Grace' },
      { artist: 'Chris Tomlin', title: 'How Great Is Our God' },
      { artist: 'Bethel Music', title: 'Goodness of God' },
      { artist: 'Elevation Worship', title: 'O Come to the Altar' },
      { artist: 'Kari Jobe', title: 'The Blessing' }
    ];

    console.log('Initializing demo songs...');
    
    for (const demo of demoSongs) {
      try {
        const song = await this.fetchLyrics(demo.artist, demo.title);
        this.saveToLibrary(song);
        console.log(`✅ Added: ${demo.artist} - ${demo.title}`);
      } catch (error) {
        console.log(`❌ Failed to add: ${demo.artist} - ${demo.title}`, error.message);
        
        // Create a fallback demo song if lyrics can't be fetched
        const fallbackSong = {
          id: `${demo.title}-${demo.artist}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          title: demo.title,
          artist: demo.artist,
          sections: [
            {
              label: 'Verse 1',
              content: `${demo.title} lyrics would appear here\nThis is a demo placeholder\nWhen lyrics are fetched, they will replace this content`
            },
            {
              label: 'Chorus',
              content: `${demo.title} chorus\nSing along with the melody\nPraise and worship together`
            }
          ],
          rawLyrics: `Demo song: ${demo.title} by ${demo.artist}`,
          dateAdded: new Date().toISOString(),
          isDemo: true
        };
        
        this.saveToLibrary(fallbackSong);
        console.log(`📝 Added fallback demo: ${demo.artist} - ${demo.title}`);
      }
    }
    
    console.log('Demo songs initialization complete!');
  }
}

module.exports = new LyricsService();
