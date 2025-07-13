import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

function Controller(){
  const [state, setState] = useState(null);

  useEffect(()=>{
    socket.on('state:update', setState);
    return ()=>{ socket.off('state:update'); };
  },[]);

  const sendAction = action => {
    fetch('/api/control', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action })
    });
  };

  return (
    <div>
      <h1>Controller</h1>
      <pre>{JSON.stringify(state,null,2)}</pre>
      <button onClick={()=>sendAction('prev')}>Prev</button>
      <button onClick={()=>sendAction('next')}>Next</button>
    </div>
  );
}

export default Controller;
