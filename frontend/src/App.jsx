import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Audience from './pages/Audience.jsx';
import Performer from './pages/Performer.jsx';
import Controller from './pages/Controller.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/controller" element={<Controller />} />
      <Route path="/performer" element={<Performer />} />
      <Route path="/audience" element={<Audience />} />
    </Routes>
  );
}

export default App;
