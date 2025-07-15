import { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket.js';
import { averageLuminance } from '../utils/contrast.js';
import useGestures from '../hooks/useGestures.js';

export default function Audience() {
  const [state, setState] = useState(null);
  const [textStyle, setTextStyle] = useState({ color: '#fff', textShadow: '0 0 10px #000' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState('lyrics'); // 'lyrics', 'title', 'blank'
  const [fadeOut, setFadeOut] = useState(false);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [gestureMessage, setGestureMessage] = useState('');
  const [showGestureMessage, setShowGestureMessage] = useState(false);
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const prevLyricRef = useRef('');

  const emit = (action, gestureType = null) => {
    socket.emit('control:action', { action });
    // Flash gesture detection message
    if (action) {
      const actionName = typeof action === 'string' ? action : action.type || 'action';
      const displayAction = actionName === 'NEXT_SLIDE' ? 'Next Slide' : 
                          actionName === 'PREV_SLIDE' ? 'Previous Slide' : 
                          actionName === 'PLAY_PAUSE' ? 'Play/Pause' :
                          actionName;
      setGestureMessage(`${gestureType || 'Gesture'} detected: ${displayAction}`);
      setShowGestureMessage(true);
      setTimeout(() => setShowGestureMessage(false), 2000);
    }
  };

  const { start: startGestures, stop: stopGestures } = useGestures((action, gestureType) => {
    emit(action, gestureType);
  });

  useEffect(() => {
    if (gesturesEnabled) {
      startGestures();
    } else {
      stopGestures();
    }
    return () => stopGestures();
  }, [gesturesEnabled]);

  useEffect(() => {
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', (newState) => {
      // Trigger fade out if lyrics are changing
      if (newState.lyric !== prevLyricRef.current && prevLyricRef.current) {
        setFadeOut(true);
        setTimeout(() => {
          setState(newState);
          prevLyricRef.current = newState.lyric;
          setFadeOut(false);
        }, 300); // Fade out duration
      } else {
        setState(newState);
        prevLyricRef.current = newState.lyric;
      }
    });
    
    // Listen for display mode changes from controller
    socket.on('audience:display-mode', (mode) => {
      setDisplayMode(mode);
    });

    // Listen for gesture enable/disable from controller
    socket.on('audience:gestures', (enabled) => {
      setGesturesEnabled(enabled);
    });

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      socket.off('state:update');
      socket.off('audience:display-mode');
      socket.off('audience:gestures');
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      stopGestures();
    };
  }, []);

  useEffect(() => {
    const element = videoRef.current || imgRef.current;
    if (!element || !state?.background) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Wait for media to load
    const analyzeContrast = () => {
      canvas.width = element.videoWidth || element.naturalWidth || 640;
      canvas.height = element.videoHeight || element.naturalHeight || 360;
      
      try {
        ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const lum = averageLuminance(imageData.data);
        
        if (lum > 0.6) {
          setTextStyle({ 
            color: '#000', 
            textShadow: '2px 2px 4px rgba(255,255,255,0.8), -1px -1px 2px rgba(255,255,255,0.5)' 
          });
        } else {
          setTextStyle({ 
            color: '#fff', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)' 
          });
        }
      } catch (error) {
        // Fallback to default styling if canvas operation fails
        setTextStyle({ color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' });
      }
    };

    if (element.tagName === 'VIDEO') {
      element.addEventListener('loadeddata', analyzeContrast);
      if (element.readyState >= 2) analyzeContrast();
    } else {
      element.addEventListener('load', analyzeContrast);
      if (element.complete) analyzeContrast();
    }
  }, [state?.currentSectionIndex, state?.background]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!state) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Connecting to FlowCue...</div>
      </div>
    );
  }

  const bg = state.background || {};
  const currentSong = state.currentSong || {};

  const renderContent = () => {
    switch (displayMode) {
      case 'title':
        return (
          <div style={textStyle} className="text-6xl font-bold text-center px-4">
            {currentSong.title}
            {currentSong.artist && (
              <div className="text-3xl mt-4 opacity-80">
                by {currentSong.artist}
              </div>
            )}
          </div>
        );
      case 'blank':
        return null;
      case 'lyrics':
      default:
        const currentSection = currentSong.sections?.[state.currentSectionIndex];
        if (!currentSection) {
          return (
            <div style={textStyle} className="text-center px-8 max-w-6xl">
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                {state.lyric || 'No lyrics available'}
              </div>
            </div>
          );
        }

        // Split section content into lines
        const lines = currentSection.content.split('\n').filter(line => line.trim());
        const currentLineIndex = state.currentLineIndex || 0;
        
        return (
          <div style={textStyle} className="text-center px-8 max-w-7xl">
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold leading-relaxed space-y-2">
              {lines.map((line, index) => (
                <div 
                  key={index}
                  className={`transition-all duration-300 ${
                    index === currentLineIndex 
                      ? 'underline decoration-4 underline-offset-8 opacity-100' 
                      : 'opacity-70'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
            {/* Section label */}
            <div className="text-2xl mt-8 opacity-50">
              {currentSection.label}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background Media */}
      {bg.src && (
        <div className="absolute inset-0">
          {bg.type === 'video' ? (
            <video
              key={`${state.currentSectionIndex}-${bg.src}`}
              ref={videoRef}
              src={bg.src}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            />
          ) : (
            <img
              key={`${state.currentSectionIndex}-${bg.src}`}
              ref={imgRef}
              src={bg.src}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            />
          )}
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
      )}

      {/* Hidden canvas for contrast analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Content */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}>
        {renderContent()}
      </div>

      {/* Gesture Detection Message */}
      {showGestureMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg text-xl font-semibold animate-pulse">
            {gestureMessage}
          </div>
        </div>
      )}

      {/* Fullscreen Toggle (only visible when not in fullscreen) */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-75 transition-opacity"
          title="Press F for fullscreen"
        >
          ⛶ Fullscreen
        </button>
      )}

      {/* Song Info (only visible when not in fullscreen) */}
      {!isFullscreen && currentSong.title && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-sm">
          {currentSong.title}
          {state.currentSectionIndex !== undefined && (
            <span className="ml-2 opacity-75">
              ({state.currentSectionIndex + 1}/{currentSong.sections?.length || 1})
            </span>
          )}
        </div>
      )}

      {/* Cast Instructions (only visible when not in fullscreen) */}
      {!isFullscreen && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded text-sm max-w-xs">
          <div className="font-semibold mb-1">Cast this display:</div>
          <div className="text-xs opacity-75">
            Use your browser's cast feature or press F for fullscreen
          </div>
        </div>
      )}
    </div>
  );
}
