import { useRef, useEffect } from 'react';

export default function useGestures(onGesture) {
  const isActiveRef = useRef(false);
  const videoRef = useRef(null);
  const lastGestureRef = useRef(null);
  const gestureTimeoutRef = useRef(null);

  const detectGesture = async (videoElement) => {
    // This is a simplified gesture detection
    // In a real implementation, you would use TensorFlow.js hand detection
    // For now, we'll use keyboard simulation for testing
    
    // Placeholder for actual hand tracking logic
    // You would integrate @tensorflow-models/handpose here
    console.log('Gesture detection active...');
  };

  const handleKeyboardGesture = (e) => {
    if (!isActiveRef.current) return;
    
    let action = null;
    let gestureType = 'keyboard';
    
    switch (e.key) {
      case 'ArrowRight':
        action = 'NEXT_SLIDE';
        gestureType = 'Right arrow key';
        break;
      case 'ArrowLeft':
        action = 'PREV_SLIDE';
        gestureType = 'Left arrow key';
        break;
      case ' ':
        action = 'PLAY_PAUSE';
        gestureType = 'Spacebar';
        e.preventDefault();
        break;
      case 'n':
      case 'N':
        action = 'NEXT_SONG';
        gestureType = 'N key';
        break;
      default:
        return;
    }

    if (action) {
      // Debounce gestures
      if (lastGestureRef.current === action) return;
      
      lastGestureRef.current = action;
      onGesture(action, gestureType);
      
      // Clear debounce after 1 second
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
      gestureTimeoutRef.current = setTimeout(() => {
        lastGestureRef.current = null;
      }, 1000);
    }
  };

  const start = (videoElement = null) => {
    isActiveRef.current = true;
    videoRef.current = videoElement;
    
    // Set up keyboard listeners (for testing)
    window.addEventListener('keydown', handleKeyboardGesture);
    
    // If video element provided, start gesture detection
    if (videoElement) {
      detectGesture(videoElement);
    }
    
    console.log('Gesture recognition started');
  };

  const stop = () => {
    isActiveRef.current = false;
    window.removeEventListener('keydown', handleKeyboardGesture);
    
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
    
    console.log('Gesture recognition stopped');
  };

  return { start, stop };
}
