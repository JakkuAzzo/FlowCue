import { useEffect, useState, useRef } from 'react';
import { socket } from '../services/socket.js';

export default function Controller() {
  const [setlists, setSetlists] = useState([]);
  const [library, setLibrary] = useState([]);
  const [state, setState] = useState(null);
  const [performerInputs, setPerformerInputs] = useState({ gestures: true, voice: true });
  const [backgroundType, setBackgroundType] = useState('image');
  const [customBackground, setCustomBackground] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('control'); // control, schedule, settings, library
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchArtist, setSearchArtist] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [gestureMessage, setGestureMessage] = useState('');
  const [showGestureMessage, setShowGestureMessage] = useState(false);
  const [isRecordingGesture, setIsRecordingGesture] = useState(false);
  const [recordingAction, setRecordingAction] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/setlists').then(res => res.json()).then(setSetlists);
    fetch('/api/library').then(res => res.json()).then(setLibrary);
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', setState);
    socket.on('performer:action', (data) => {
      handleAction(data.action);
      // Show gesture detection message
      if (data.action) {
        const actionName = typeof data.action === 'string' ? data.action : data.action.type || 'action';
        const displayAction = actionName === 'NEXT_SLIDE' ? 'next slide' : 
                            actionName === 'PREV_SLIDE' ? 'previous slide' : 
                            actionName.toLowerCase();
        setGestureMessage(`${data.gestureType || 'Gesture'} detected doing ${displayAction}`);
        setShowGestureMessage(true);
        setTimeout(() => setShowGestureMessage(false), 3000);
      }
    });
    return () => {
      socket.off('state:update', setState);
      socket.off('performer:action');
    };
  }, []);

  const emit = action => socket.emit('control:action', { action });
  const handleAction = action => emit(action);

  const selectSong = (songId) => {
    emit({ type: 'SELECT_SONG', songId });
  };

  const togglePerformerGestures = () => {
    setPerformerInputs(prev => ({ ...prev, gestures: !prev.gestures }));
    socket.emit('control:performer-settings', { gestures: !performerInputs.gestures });
  };

  const togglePerformerVoice = () => {
    setPerformerInputs(prev => ({ ...prev, voice: !prev.voice }));
    socket.emit('control:performer-settings', { voice: !performerInputs.voice });
  };

  const startGestureRecording = (action) => {
    setIsRecordingGesture(true);
    setRecordingAction(action);
    // Emit to performer/audience pages to start recording
    socket.emit('control:start-gesture-recording', { action });
  };

  const stopGestureRecording = () => {
    setIsRecordingGesture(false);
    setRecordingAction('');
    // Emit to performer/audience pages to stop recording
    socket.emit('control:stop-gesture-recording');
  };

  const updateBackground = () => {
    if (customBackground) {
      emit({ 
        type: 'UPDATE_BACKGROUND', 
        background: { 
          type: backgroundType, 
          src: customBackground 
        } 
      });
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomBackground(url);
      const fileType = file.type.startsWith('video') ? 'video' : 'image';
      setBackgroundType(fileType);
      emit({ 
        type: 'UPDATE_BACKGROUND', 
        background: { 
          type: fileType, 
          src: url 
        } 
      });
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    emit(isPlaying ? 'PAUSE' : 'PLAY');
  };

  const searchLyrics = async () => {
    if (!searchArtist.trim() || !searchTitle.trim()) {
      alert('Please enter both artist and title');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch('/api/lyrics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          artist: searchArtist.trim(), 
          title: searchTitle.trim() 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lyrics');
      }

      const song = await response.json();
      
      // Save to library
      await saveToLibrary(song);
      
      // Clear search fields
      setSearchArtist('');
      setSearchTitle('');
      
      alert(`Successfully added "${song.title}" by ${song.artist} to library!`);
    } catch (error) {
      console.error('Error searching lyrics:', error);
      alert('Failed to fetch lyrics. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const saveToLibrary = async (song) => {
    try {
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song })
      });

      if (!response.ok) {
        throw new Error('Failed to save to library');
      }

      // Refresh library
      const libraryResponse = await fetch('/api/library');
      const updatedLibrary = await libraryResponse.json();
      setLibrary(updatedLibrary);
      
      // Refresh setlists (which now includes library)
      const setlistsResponse = await fetch('/api/setlists');
      const updatedSetlists = await setlistsResponse.json();
      setSetlists(updatedSetlists);

      return await response.json();
    } catch (error) {
      console.error('Error saving to library:', error);
      throw error;
    }
  };

  const deleteFromLibrary = async (songId) => {
    if (!confirm('Are you sure you want to delete this song from your library?')) {
      return;
    }

    try {
      const response = await fetch(`/api/library/${songId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete from library');
      }

      // Refresh library and setlists
      const libraryResponse = await fetch('/api/library');
      const updatedLibrary = await libraryResponse.json();
      setLibrary(updatedLibrary);
      
      const setlistsResponse = await fetch('/api/setlists');
      const updatedSetlists = await setlistsResponse.json();
      setSetlists(updatedSetlists);

    } catch (error) {
      console.error('Error deleting from library:', error);
      alert('Failed to delete song from library');
    }
  };

  const detectSong = async () => {
    try {
      const response = await fetch('/api/lyrics/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: 'placeholder' })
      });

      const result = await response.json();
      
      if (result.artist !== "Unknown Artist") {
        setSearchArtist(result.artist);
        setSearchTitle(result.title);
      } else {
        alert(result.message || 'Could not detect song from audio');
      }
    } catch (error) {
      console.error('Error detecting song:', error);
      alert('Song detection failed');
    }
  };

  if (!state) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto animate-pulse"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">FlowCue Controller</h2>
        <p className="text-gray-600">Initializing your presentation control center...</p>
      </div>
    </div>
  );

  const song = setlists.find(s => s.id === state.currentSongId) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Gesture Detection Message */}
      {showGestureMessage && (
        <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-xl animate-slideInRight">
          <div className="flex items-center space-x-3">
            <span className="text-2xl animate-bounce">🤲</span>
            <div>
              <p className="font-semibold">Gesture Detected!</p>
              <p className="text-sm opacity-90">{gestureMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Gesture Message */}
      {isRecordingGesture && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-xl shadow-xl">
          <div className="flex items-center space-x-3">
            <span className="animate-pulse text-2xl">🔴</span>
            <div className="flex-1">
              <p className="font-semibold">Recording Gesture</p>
              <p className="text-sm opacity-90">For: {recordingAction}</p>
            </div>
            <button 
              onClick={stopGestureRecording}
              className="ml-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium transition-all"
            >
              Stop
            </button>
          </div>
        </div>
      )}
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100/80 transition-all transform hover:scale-105"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FlowCue</h1>
            <p className="text-xs text-gray-600">Controller</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.open('/performer', '_blank')}
            className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4m0 0H4a1 1 0 00-1 1v14a1 1 0 001 1h3" />
            </svg>
          </button>
          <button
            onClick={() => window.open('/audience', '_blank')}
            className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex h-screen lg:h-auto">
        {/* Sidebar - Mobile Overlay / Desktop Static */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl shadow-2xl lg:shadow-xl border-r border-gray-200/60 transition-transform duration-300 ease-in-out lg:transition-none`}>
          
          {/* Desktop Header */}
          <div className="hidden lg:block p-6 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-purple-50">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FlowCue Controller</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your presentation flow</p>
          </div>

          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Controls</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl hover:bg-white/60 transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200/60 px-6 bg-gradient-to-r from-gray-50 to-gray-100">
            {[
              { id: 'control', label: 'Control', icon: '🎮' },
              { id: 'schedule', label: 'Schedule', icon: '📋' },
              { id: 'library', label: 'Library', icon: '📚' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-3 text-sm font-medium border-b-2 transition-all transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/80 rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-t-xl'
                }`}
              >
                <span className="text-lg mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-gray-50/50">
            {activeTab === 'control' && (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-blue-600 mr-2">⚡</span>
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => emit('PREV_SLIDE')}
                      className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 px-4 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md flex items-center justify-center"
                    >
                      <span className="mr-2">←</span>
                      Previous
                    </button>
                    <button
                      onClick={() => emit('NEXT_SLIDE')}
                      className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 px-4 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md flex items-center justify-center"
                    >
                      Next
                      <span className="ml-2">→</span>
                    </button>
                    <button
                      onClick={() => emit('DETECT_SONG')}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg col-span-2 flex items-center justify-center"
                    >
                      🎵 Detect Song
                    </button>
                    <button
                      onClick={() => emit('NEXT_SONG')}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg col-span-2 flex items-center justify-center"
                    >
                      Skip to Next Song
                    </button>
                  </div>
                </div>

                {/* Current Song Sections */}
                {song.sections && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-green-600 mr-2">🎵</span>
                      Song Sections
                    </h3>
                    <div className="space-y-3">
                      {song.sections.map((sec, i) => (
                        <button
                          key={i}
                          onClick={() => emit({ type: 'GO_TO_SECTION', index: i })}
                          className={`w-full text-left p-4 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md ${
                            i === state.currentSectionIndex
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-300 shadow-lg'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{sec.label}</span>
                            {i === state.currentSectionIndex && (
                              <span className="text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Current</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Screens */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-purple-600 mr-2">📱</span>
                    External Screens
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => window.open('/audience', '_blank')}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Open Audience Display
                    </button>
                    <button
                      onClick={() => window.open('/performer', '_blank')}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4m0 0H4a1 1 0 00-1 1v14a1 1 0 001 1h3" />
                      </svg>
                      Open Performer Screen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-8">
                {/* Song Selector */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-orange-600 mr-2">🎯</span>
                    Current Song
                  </h3>
                  <select 
                    className="w-full p-4 border border-gray-300 rounded-xl bg-gradient-to-r from-white to-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md transition-all hover:shadow-lg"
                    value={state.currentSongId || ''}
                    onChange={(e) => selectSong(e.target.value)}
                  >
                    <option value="">Select a song...</option>
                    {setlists.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                {/* Full Setlist */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-green-600 mr-2">📋</span>
                    Full Setlist
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {setlists.map((s, index) => (
                      <button
                        key={s.id}
                        onClick={() => selectSong(s.id)}
                        className={`w-full text-left p-4 rounded-xl text-sm transition-all transform hover:scale-105 shadow-md ${
                          s.id === state.currentSongId
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border border-green-300 shadow-lg'
                            : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{s.title}</div>
                            <div className="text-xs opacity-70">Song {index + 1}</div>
                          </div>
                          {s.id === state.currentSongId && (
                            <span className="text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Playing</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="space-y-8">
                {/* Lyrics Search */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-purple-600 mr-2">🔍</span>
                    Search & Add Songs
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Artist</label>
                      <input
                        type="text"
                        value={searchArtist}
                        onChange={(e) => setSearchArtist(e.target.value)}
                        placeholder="e.g., Hillsong Worship"
                        className="w-full p-4 border border-gray-300 rounded-xl bg-gradient-to-r from-white to-gray-50 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-md transition-all hover:shadow-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Song Title</label>
                      <input
                        type="text"
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        placeholder="e.g., Amazing Grace"
                        className="w-full p-4 border border-gray-300 rounded-xl bg-gradient-to-r from-white to-gray-50 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-md transition-all hover:shadow-lg"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={detectSong}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-4 px-6 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg"
                      >
                        🎵 Detect Song
                      </button>
                      <button
                        onClick={searchLyrics}
                        disabled={searchLoading}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
                      >
                        {searchLoading ? 'Searching...' : 'Search & Add'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Library Songs */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-blue-600 mr-2">📚</span>
                    Your Library ({library.length} songs)
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {library.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-gray-500 text-lg font-medium mb-2">No songs in library yet</p>
                        <p className="text-gray-400 text-sm">Search for songs above to get started!</p>
                      </div>
                    ) : (
                      library.map((song) => (
                        <div
                          key={song.id}
                          className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4 hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105 shadow-md"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{song.title}</div>
                              <div className="text-sm text-gray-600">{song.artist}</div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <span className="mr-2">{song.sections?.length || 0} sections</span>
                                {song.isDemo && <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full">Demo</span>}
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-3">
                              <button
                                onClick={() => selectSong(song.id)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all transform hover:scale-110"
                                title="Select this song"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1" />
                                </svg>
                              </button>
                              {!song.isDemo && (
                                <button
                                  onClick={() => deleteFromLibrary(song.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all transform hover:scale-110"
                                  title="Delete from library"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                {/* Performer Controls */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-indigo-600 mr-2">🎭</span>
                    Performer Controls
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer">
                      <div>
                        <div className="font-semibold text-gray-900">Gesture Recognition</div>
                        <div className="text-sm text-gray-600">Enable hand gesture controls</div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={performerInputs.gestures}
                          onChange={togglePerformerGestures}
                          className="sr-only"
                          id="gesture-toggle"
                        />
                        <label 
                          htmlFor="gesture-toggle"
                          className={`block w-12 h-6 rounded-full cursor-pointer transition-all ${
                            performerInputs.gestures ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            performerInputs.gestures ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`}></span>
                        </label>
                      </div>
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer">
                      <div>
                        <div className="font-semibold text-gray-900">Voice Commands</div>
                        <div className="text-sm text-gray-600">Enable voice control</div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={performerInputs.voice}
                          onChange={togglePerformerVoice}
                          className="sr-only"
                          id="voice-toggle"
                        />
                        <label 
                          htmlFor="voice-toggle"
                          className={`block w-12 h-6 rounded-full cursor-pointer transition-all ${
                            performerInputs.voice ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            performerInputs.voice ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`}></span>
                        </label>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Gesture Recording */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-red-600 mr-2">🎬</span>
                    Gesture Recording
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                      📝 Record custom gestures for specific actions. Users can perform the gesture during recording to associate it with an action.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => startGestureRecording('Next Slide')}
                        disabled={isRecordingGesture}
                        className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-sm font-semibold transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
                      >
                        🤲 Record "Next" Gesture
                      </button>
                      <button
                        onClick={() => startGestureRecording('Previous Slide')}
                        disabled={isRecordingGesture}
                        className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-sm font-semibold transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
                      >
                        🤲 Record "Previous" Gesture
                      </button>
                      <button
                        onClick={() => startGestureRecording('Play/Pause')}
                        disabled={isRecordingGesture}
                        className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-sm font-semibold transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
                      >
                        🤲 Record "Play/Pause" Gesture
                      </button>
                      <button
                        onClick={() => startGestureRecording('Next Song')}
                        disabled={isRecordingGesture}
                        className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-sm font-semibold transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
                      >
                        🤲 Record "Next Song" Gesture
                      </button>
                    </div>
                    {isRecordingGesture && (
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-300 rounded-xl p-6 shadow-lg">
                        <div className="flex items-center mb-2">
                          <span className="animate-pulse text-red-500 text-xl mr-2">🔴</span>
                          <p className="text-red-800 font-bold">
                            Recording gesture for: {recordingAction}
                          </p>
                        </div>
                        <p className="text-red-600 text-sm">
                          📹 Perform the gesture in front of your camera on the Performer page, then click Stop above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Background Settings */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-pink-600 mr-2">🎨</span>
                    Background Settings
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Background Type</label>
                      <select
                        value={backgroundType}
                        onChange={(e) => setBackgroundType(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-xl bg-gradient-to-r from-white to-gray-50 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-md transition-all hover:shadow-lg"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Upload File</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={backgroundType === 'video' ? 'video/*' : 'image/*'}
                        onChange={handleFileUpload}
                        className="w-full p-4 border border-gray-300 rounded-xl text-sm bg-gradient-to-r from-white to-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-md transition-all hover:shadow-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Or URL</label>
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={customBackground}
                          onChange={(e) => setCustomBackground(e.target.value)}
                          placeholder="https://example.com/background.jpg"
                          className="w-full p-4 border border-gray-300 rounded-xl text-sm bg-gradient-to-r from-white to-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-md transition-all hover:shadow-lg"
                        />
                        <button
                          onClick={updateBackground}
                          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-4 px-6 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg"
                        >
                          Apply Background
                        </button>
                      </div>
                    </div>

                    {/* Quick Background Presets */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Presets</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            emit({ 
                              type: 'UPDATE_BACKGROUND', 
                              background: { type: 'none', src: null } 
                            });
                          }}
                          className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-sm font-semibold hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-105 shadow-lg"
                        >
                          🚫 No Background
                        </button>
                        <button
                          onClick={() => {
                            emit({ 
                              type: 'UPDATE_BACKGROUND', 
                              background: { 
                                type: 'image', 
                                src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop' 
                              } 
                            });
                          }}
                          className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
                        >
                          🏔️ Mountain
                        </button>
                        <button
                          onClick={() => {
                            emit({ 
                              type: 'UPDATE_BACKGROUND', 
                              background: { 
                                type: 'image', 
                                src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop' 
                              } 
                            });
                          }}
                          className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg"
                        >
                          🌲 Forest
                        </button>
                        <button
                          onClick={() => {
                            emit({ 
                              type: 'UPDATE_BACKGROUND', 
                              background: { 
                                type: 'image', 
                                src: 'https://images.unsplash.com/photo-1514475315108-6ed6ac2b52ac?w=1920&h=1080&fit=crop' 
                              } 
                            });
                          }}
                          className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 shadow-lg"
                        >
                          🌈 Gradient
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
          {/* Desktop Header */}
          <div className="hidden lg:block bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/60 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {song.title || 'No Song Selected'}
                </h2>
                {song.title && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Section {state.currentSectionIndex + 1} of {song.sections?.length || 1}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-full shadow-md">
                  <span className={`inline-block w-3 h-3 rounded-full animate-pulse ${isPlaying ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="text-sm font-medium text-gray-700">{isPlaying ? 'Playing' : 'Paused'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Window */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-black to-gray-900 shadow-inner">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-2xl lg:text-4xl xl:text-6xl text-center px-4 lg:px-8 relative z-10 max-w-5xl leading-relaxed font-light drop-shadow-2xl">
                {state.lyric || (
                  <div className="text-gray-400 text-xl lg:text-3xl">
                    <div className="mb-4">🎵</div>
                    <div>No lyrics to display</div>
                    <div className="text-sm lg:text-lg mt-4 opacity-60">Select a song to begin</div>
                  </div>
                )}
              </div>
              {state.background && (
                <div className="absolute inset-0">
                  {state.background.type === 'video' ? (
                    <video
                      src={state.background.src}
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-cover opacity-40"
                    />
                  ) : (
                    <img
                      src={state.background.src}
                      className="w-full h-full object-cover opacity-40"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-6 shadow-2xl border-t border-gray-700">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => emit('PREV_SLIDE')}
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center font-semibold"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={togglePlayback}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center font-semibold text-lg"
                >
                  {isPlaying ? (
                    <>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                      </svg>
                      Pause
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1" />
                      </svg>
                      Play
                    </>
                  )}
                </button>
                <button
                  onClick={() => emit('NEXT_SLIDE')}
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center font-semibold"
                >
                  Next
                  <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="text-sm text-gray-300 text-center lg:text-right">
                <div className="lg:hidden mb-2">
                  {song.title && (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-xl text-white font-semibold">
                      {song.title} - Section {state.currentSectionIndex + 1}/{song.sections?.length || 1}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center lg:justify-end space-x-2 bg-gradient-to-r from-gray-700 to-gray-600 px-4 py-2 rounded-xl">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-medium">Connected devices: Performer & Audience displays</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
