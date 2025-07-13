import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000');

function Controller(){
  const [state, setState] = useState(null);

  useEffect(() => {
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', setState);
    return () => socket.off('state:update');
  }, []);

  const sendAction = action => {
    fetch('/api/control', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action })
    });
  };

  const setlist = ['Verse 1', 'Chorus', 'Verse 2'];

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Controller</h1>
      <div style={{ marginBottom: '1rem' }}>
        Current Section: {state?.currentSectionIndex}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => sendAction('prev')}>Prev</button>
        <button onClick={() => sendAction('next')} style={{ marginLeft: '0.5rem' }}>Next</button>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <h2>Setlist</h2>
        <ol>
          {setlist.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
      <div>
        <h2>Gesture Mapping</h2>
        <label>
          Next Gesture
          <input style={{ marginLeft: '0.5rem' }} defaultValue="SwipeRight" />
        </label>
        <br />
        <label>
          Prev Gesture
          <input style={{ marginLeft: '0.5rem' }} defaultValue="SwipeLeft" />
        </label>
      </div>
    </div>
  );
}

export default Controller;
