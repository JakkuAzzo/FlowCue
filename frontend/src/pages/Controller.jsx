import { useEffect, useState } from 'react';
import { socket } from '../services/socket.js';
import useGestures from '../hooks/useGestures.js';
import useVoice from '../hooks/useVoice.js';

export default function Controller() {
  const [setlists, setSetlists] = useState([]);
  const [state, setState] = useState(null);

  useEffect(() => {
    fetch('/api/setlists').then(res => res.json()).then(setSetlists);
    fetch('/api/state').then(res => res.json()).then(setState);
    socket.on('state:update', setState);
    return () => socket.off('state:update', setState);
  }, []);

  const emit = action => socket.emit('control:action', { action });

  const { start: startGestures, stop: stopGestures } = useGestures(emit);
  const { start: startVoice, stop: stopVoice } = useVoice(emit);
  useEffect(() => { startGestures(); startVoice(); return () => { stopGestures(); stopVoice(); }; }, []);

  if (!state) return null;
  const song = setlists.find(s => s.id === state.currentSongId) || {};

  return (
    <div className="flex h-screen">
      <div className="w-1/4 p-4 border-r overflow-y-auto">
        <h2 className="font-bold mb-2">Setlist</h2>
        <select className="mb-4 w-full">
          {setlists.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <ol>
          {(song.sections || []).map((sec, i) => (
            <li key={i} className={i === state.currentSectionIndex ? 'font-bold' : ''}>{sec.label}</li>
          ))}
        </ol>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="border p-4 w-3/4 text-center">
          <div className="text-xl mb-2">{state.lyric}</div>
        </div>
      </div>
      <div className="w-1/4 p-4 border-l flex flex-col gap-2">
        <button onClick={() => emit('PREV_SLIDE')} className="border p-2">Prev Slide</button>
        <button onClick={() => emit('NEXT_SLIDE')} className="border p-2">Next Slide</button>
        <button onClick={() => emit('NEXT_SONG')} className="border p-2">Next Song</button>
        <button onClick={() => emit('DETECT_SONG')} className="border p-2">Detect Song</button>
      </div>
    </div>
  );
}
