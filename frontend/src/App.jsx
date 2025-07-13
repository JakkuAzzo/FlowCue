import { Routes, Route, Navigate } from 'react-router-dom';
import Audience from './pages/Audience.jsx';
import Performer from './pages/Performer.jsx';
import Controller from './pages/Controller.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/controller" replace />} />
      <Route path="/controller" element={<Controller />} />
      <Route path="/performer" element={<Performer />} />
      <Route path="/audience" element={<Audience />} />
    </Routes>
  );
}

export default App;
