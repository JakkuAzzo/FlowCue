import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000');

function Performer(){
  const [state, setState] = useState(null);

  useEffect(() => {
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', setState);
    return () => socket.off('state:update');
  }, []);

  if (!state) return null;

  return (
    <div style={{ padding: '2rem', fontSize: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>{state.lyric || `Section ${state.currentSectionIndex}`}</div>
      <div style={{ opacity: 0.6 }}>{state.nextLyric || `Section ${state.currentSectionIndex + 1}`}</div>
    </div>
  );
}

export default Performer;
