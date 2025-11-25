import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './Pages/LandingPage';
import { Dashboard } from './Pages/Dashboard';
import { AuthCallback } from './Pages/AuthCallback';
import { Playlist } from './Pages/Playlist';
import { Library } from './Pages/Library';
import { SignupPage } from './Pages/SignupPage'; 



export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth/success" element={<AuthCallback />} />
        <Route path="/playlist" element={<Playlist />} />
        <Route path="/library" element={<Library />} />
        <Route path="/signup" element={<SignupPage />} />  

      </Routes>
    </Router>
  );
}