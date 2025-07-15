const API_BASE_URL = 'http://localhost:4000/api';

class LyricsService {
  constructor() {
    this.cache = new Map();
  }

  async searchAndFetchLyrics(artist, title) {
    const cacheKey = `${artist}-${title}`.toLowerCase();
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      console.log(`Fetching lyrics for: ${artist} - ${title}`);
      
      const response = await fetch(`${API_BASE_URL}/lyrics/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artist, title }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const songData = await response.json();
      this.cache.set(cacheKey, songData);
      return songData;
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      throw error;
    }
  }

  async saveToLibrary(song) {
    try {
      const response = await fetch(`${API_BASE_URL}/library/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ song }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving to library:', error);
      throw error;
    }
  }

  async getLibrary() {
    try {
      const response = await fetch(`${API_BASE_URL}/library`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching library:', error);
      throw error;
    }
  }

  async deleteFromLibrary(songId) {
    try {
      const response = await fetch(`${API_BASE_URL}/library/${songId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting from library:', error);
      throw error;
    }
  }

  // Method to detect song from audio (calls backend endpoint)
  async detectSongFromAudio(audioData) {
    try {
      const response = await fetch(`${API_BASE_URL}/lyrics/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error detecting song:', error);
      throw error;
    }
  }
}

export default new LyricsService();
