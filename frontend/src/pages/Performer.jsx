import { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket.js';
import useGestures from '../hooks/useGestures.js';
import useVoice from '../hooks/useVoice.js';

export default function Performer() {
  const [state, setState] = useState(null);
  const [setlists, setSetlists] = useState([]);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch('/api/setlists').then(res => res.json()).then(setSetlists);
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', setState);
    return () => socket.off('state:update', setState);
  }, []);

  const emit = (action, gestureType = null) => {
    socket.emit('control:action', { action });
    // Also update controller interface with gesture type
    socket.emit('performer:action', { action, gestureType });
  };

  const { start: startGestures, stop: stopGestures } = useGestures((action, gestureType) => {
    emit(action, gestureType);
  });
  const { start: startVoice, stop: stopVoice } = useVoice(emit);

  useEffect(() => {
    if (gesturesEnabled && webcamEnabled) {
      startGestures(videoRef.current);
    } else {
      stopGestures();
    }
    if (voiceEnabled) {
      startVoice();
    } else {
      stopVoice();
    }
    return () => { stopGestures(); stopVoice(); };
  }, [gesturesEnabled, voiceEnabled, webcamEnabled]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      videoRef.current.srcObject = stream;
      setWebcamEnabled(true);
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamEnabled(false);
  };

  if (!state) return null;

  const currentSong = setlists.find(s => s.id === state.currentSongId) || {};
  const currentSection = currentSong.sections?.[state.currentSectionIndex];
  const nextSection = currentSong.sections?.[state.currentSectionIndex + 1];
  
  // Get upcoming sections
  const upcomingSections = [];
  if (nextSection) upcomingSections.push(nextSection);
  if (currentSong.sections?.[state.currentSectionIndex + 2]) {
    upcomingSections.push(currentSong.sections[state.currentSectionIndex + 2]);
  }

  return (
    <div className="relative h-screen bg-gray-900 text-white overflow-hidden">
      {/* Current Lyrics - Large Display in Center/Top */}
      <div className="absolute top-0 left-0 right-0 h-3/4 flex items-center justify-center p-8">
        <div className="text-center max-w-6xl">
          {currentSection ? (
            <>
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                {currentSection.content.split('\n').map((line, index) => (
                  <div key={index} className="mb-2">
                    {line}
                  </div>
                ))}
              </div>
              <div className="text-2xl opacity-60">
                {currentSection.label} - {currentSong.title}
              </div>
            </>
          ) : (
            <div className="text-6xl font-bold opacity-50">
              No lyrics loaded
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Lyrics - Bottom Left */}
      <div className="absolute bottom-4 left-4 w-80 max-h-64 bg-black bg-opacity-60 rounded-lg p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-2 text-yellow-400">Upcoming:</h3>
        {upcomingSections.length > 0 ? (
          <div className="space-y-3">
            {upcomingSections.map((section, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-blue-300">{section.label}</div>
                <div className="text-gray-300 leading-relaxed">
                  {section.content.split('\n').slice(0, 3).map((line, lineIndex) => (
                    <div key={lineIndex}>{line}</div>
                  ))}
                  {section.content.split('\n').length > 3 && (
                    <div className="text-gray-500">...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-sm">End of song</div>
        )}
      </div>

      {/* Webcam and Controls - Bottom Right */}
      <div className="absolute bottom-4 right-4 w-80">
        {/* Webcam Display */}
        <div className="mb-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video 
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-48 object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            {gesturesEnabled && webcamEnabled && (
              <div className="absolute top-2 left-2 bg-green-500 text-xs px-2 py-1 rounded">
                Gesture Tracking Active
              </div>
            )}
            {!webcamEnabled && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Camera Off
              </div>
            )}
          </div>
          
          {/* Camera Controls */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={webcamEnabled ? stopWebcam : startWebcam}
              className={`px-3 py-2 rounded text-sm flex-1 ${
                webcamEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {webcamEnabled ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="bg-black bg-opacity-60 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Controls</h3>
          <div className="space-y-2 text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={gesturesEnabled}
                onChange={() => setGesturesEnabled(!gesturesEnabled)}
                className="mr-2"
              />
              Gesture Recognition
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={() => setVoiceEnabled(!voiceEnabled)}
                className="mr-2"
              />
              Voice Commands
            </label>
          </div>
          
          {/* Manual Controls */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => emit('PREV_SLIDE')}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
            >
              ← Prev
            </button>
            <button
              onClick={() => emit('NEXT_SLIDE')}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
