import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000');

function Audience(){
  const [state, setState] = useState(null);

  useEffect(() => {
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', setState);
    return () => socket.off('state:update');
  }, []);

  if (!state) return null;

  const style = {
    backgroundImage: `url(${state.background || '/bg.jpg'})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-image 0.5s ease',
    color: state.dark ? '#fff' : '#000',
    textShadow: '0 0 10px rgba(0,0,0,0.5)'
  };

  return (
    <div style={style}>
      <div style={{ fontSize: '4rem', textAlign: 'center', animation: 'fade 0.5s' }}>
        {state.lyric || `Section ${state.currentSectionIndex}`}
      </div>
    </div>
  );
}

export default Audience;
