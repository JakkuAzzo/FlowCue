import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Controller from './pages/Controller.jsx';
import Performer from './pages/Performer.jsx';
import Audience from './pages/Audience.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/controller" element={<Controller />} />
        <Route path="/performer" element={<Performer />} />
        <Route path="/audience" element={<Audience />} />
        <Route path="*" element={<Controller />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
