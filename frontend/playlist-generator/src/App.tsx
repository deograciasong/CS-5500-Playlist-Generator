import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './Pages/LandingPage';
import { Dashboard } from './Pages/Dashboard';
import { AuthCallback } from './Pages/AuthCallback';
import { Playlist } from './Pages/Playlist';
import { Library } from './Pages/Library';




export default function App() {
  return (    
   
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/auth/success" element={<AuthCallback />} />
        <Route path="/playlist" element={<Playlist />} />
        <Route path="/library" element={<Library />} />

      </Routes>
    </Router>
  );
}

