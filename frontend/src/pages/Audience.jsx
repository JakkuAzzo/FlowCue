import { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket.js';
import { averageLuminance } from '../utils/contrast.js';

export default function Audience() {
  const [state, setState] = useState(null);
  const [textStyle, setTextStyle] = useState({ color: '#fff', textShadow: '0 0 10px #000' });
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', setState);
    return () => socket.off('state:update', setState);
  }, []);

  useEffect(() => {
    const element = videoRef.current || imgRef.current;
    if (!element) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = element.videoWidth || element.naturalWidth || 640;
    canvas.height = element.videoHeight || element.naturalHeight || 360;
    ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
    const lum = averageLuminance(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
    if (lum > 0.6) {
      setTextStyle({ color: '#000', textShadow: '0 0 10px #fff' });
    } else {
      setTextStyle({ color: '#fff', textShadow: '0 0 10px #000' });
    }
  }, [state?.currentSectionIndex, state?.background]);

  if (!state) return null;
  const bg = state.background || {};

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {bg.type === 'video' ? (
        <video
          key={state.currentSectionIndex}
          ref={videoRef}
          src={bg.src}
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
        />
      ) : (
        <img
          key={state.currentSectionIndex}
          ref={imgRef}
          src={bg.src}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
        />
      )}
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out">
        <div style={textStyle} className="text-5xl text-center px-4">
          {state.lyric}
        </div>
      </div>
    </div>
  );
}
