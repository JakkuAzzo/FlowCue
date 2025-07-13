import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

function Audience(){
  const [state, setState] = useState(null);

  useEffect(()=>{
    socket.on('state:update', setState);
    return ()=>{ socket.off('state:update'); };
  },[]);

  return (
    <div>
      <h1>Audience</h1>
      <pre>{JSON.stringify(state,null,2)}</pre>
    </div>
  );
}

export default Audience;
