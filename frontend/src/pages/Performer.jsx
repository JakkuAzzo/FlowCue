import { useState, useEffect } from 'react';
import { socket } from '../services/socket.js';

export default function Performer() {
  const [state, setState] = useState(null);

  useEffect(() => {
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', setState);
    return () => socket.off('state:update', setState);
  }, []);

  if (!state) return null;

  return (
    <div className="p-8">
      <div className="text-5xl mb-4">{state.lyric}</div>
      <div className="text-2xl opacity-60">{state.nextLyric}</div>
    </div>
  );
}
