import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

function Performer(){
  const [state, setState] = useState(null);

  useEffect(()=>{
    socket.on('state:update', setState);
    return ()=>{ socket.off('state:update'); };
  },[]);

  return (
    <div>
      <h1>Performer</h1>
      <pre>{JSON.stringify(state,null,2)}</pre>
    </div>
  );
}

export default Performer;
