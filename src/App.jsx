import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Upload from './pages/Upload';
import EventForm from './pages/EventForm';
import Album from './pages/Album';
import Stats from './pages/Stats';
import Detail from './pages/Detail';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/form" element={<EventForm />} />
        <Route path="/album" element={<Album />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Navigation />
    </BrowserRouter>
  );
}

export default App;
