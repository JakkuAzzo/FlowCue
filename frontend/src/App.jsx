import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Controller from './pages/Controller.jsx';
import Performer from './pages/Performer.jsx';
import Audience from './pages/Audience.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/controller" element={<Controller />} />
        <Route path="/performer" element={<Performer />} />
        <Route path="/audience" element={<Audience />} />
        <Route path="*" element={<Controller />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
