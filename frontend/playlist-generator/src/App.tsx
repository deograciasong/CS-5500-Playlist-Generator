import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './Pages/LandingPage';
import { Dashboard } from './Pages/Dashboard';
import { Playlist } from './Pages/Playlist';
import { Library } from './Pages/Library';
import { SignupPage } from './Pages/SignupPage'; 
import AccountSettings from './Pages/AccountSettings';



export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/playlist" element={<Playlist />} />
        <Route path="/library" element={<Library />} />
        <Route path="/signup" element={<SignupPage />} />  
        <Route path="/account" element={<AccountSettings />} />

      </Routes>
    </Router>
  );
}
