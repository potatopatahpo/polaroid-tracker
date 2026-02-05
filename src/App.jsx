import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Album from './pages/Album';
import Detail from './pages/Detail';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import EventForm from './pages/EventForm';

function App() {
    return (
        <Router>
            <div className="container">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/album" element={<Album />} />
                    <Route path="/detail/:id" element={<Detail />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/event-form" element={<EventForm />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
