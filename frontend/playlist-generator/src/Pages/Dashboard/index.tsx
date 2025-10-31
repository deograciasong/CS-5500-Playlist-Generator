// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Sidebar } from '../../components/ui/Sidebar';
// import { authService } from '../../services/auth.service';
// import type { User } from '../../types';
// import '../../main.css';

// const toolTabs = [
//   '🎧 Mood Assistant',
//   '🎵 AI Playlist',
//   '⚡ Quick Vibe',
//   '🎹 Mood Mix',
//   '🔀 Blend',
//   '📻 Radio',
// ];

// const examplePrompts = [
//   'Create a chill lo-fi beats playlist perfect for late-night coding sessions',
//   'Energetic workout mix with high tempo, motivating vibes for gym time',
//   'Melancholic indie playlist for rainy days, soft vocals and acoustic guitars',
// ];

// export const Dashboard: React.FC = () => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState<User | null>(null);
//   const [activeTab, setActiveTab] = useState(1);
//   const [moodInput, setMoodInput] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadUserData();
//   }, []);

//   const loadUserData = async () => {
//     try {
//       const userData = await authService.getCurrentUser();
//       setUser(userData);
//       setLoading(false);
//     } catch (error) {
//       console.error('Failed to load user:', error);
//       navigate('/');
//     }
//   };

//   const handleLogout = () => {
//     authService.logout();
//     navigate('/');
//   };

//   const handleGenerate = () => {
//     if (!moodInput.trim()) return;
//     console.log('Generating playlist for:', moodInput);
//     // TODO: Call API to generate playlist
//   };

//   const handleExampleClick = (prompt: string) => {
//     setMoodInput(prompt);
//   };

//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     const name = user?.displayName || 'there';
//     if (hour < 12) return `Good Morning, ${name}! 👋`;
//     if (hour < 18) return `Good Afternoon, ${name}! 👋`;
//     return `Good Evening, ${name}! 👋`;
//   };

//   if (loading) {
//     return (
//       <>
//         <div className="gradient-bg"></div>
//         <div style={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           minHeight: '100vh',
//           color: 'white'
//         }}>
//           Loading...
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <div className="gradient-bg"></div>
//       <Sidebar onLogin={() => {}} onSignup={() => {}} isAuthenticated={true} onLogout={handleLogout} />

//       <div className="main-content">
//         <h1 className="greeting">{getGreeting()}</h1>

//         <div className="tool-tabs">
//           {toolTabs.map((tab, index) => (
//             <div
//               key={index}
//               className={`tool-tab ${activeTab === index ? 'active' : ''}`}
//               onClick={() => setActiveTab(index)}
//             >
//               {tab}
//             </div>
//           ))}
//         </div>

//         <div className="input-section">
//           <div className="input-wrapper">
//             <textarea
//               className="main-input"
//               placeholder="Describe your mood and we'll create the perfect playlist from your Spotify library...

// Example: 'Cozy rainy morning vibes, mid-tempo, acoustic, lo-fi beats for studying'"
//               value={moodInput}
//               onChange={(e) => setMoodInput(e.target.value)}
//               onKeyPress={(e) => {
//                 if (e.key === 'Enter' && e.ctrlKey) {
//                   handleGenerate();
//                 }
//               }}
//             />
//             <button className="send-button" onClick={handleGenerate}>
//               <svg viewBox="0 0 24 24">
//                 <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
//               </svg>
//             </button>
//           </div>
//           <div className="input-options">
//             <button className="option-btn">📎 Attach Playlist</button>
//             <button className="option-btn">⚙️ Custom Settings</button>
//           </div>
//         </div>

//         <div className="example-prompts">
//           {examplePrompts.map((prompt, index) => (
//             <div
//               key={index}
//               className="example-prompt"
//               onClick={() => handleExampleClick(prompt)}
//             >
//               {prompt}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="featured-section">
//         <div className="featured-header">
//           <h3>Your Recent Playlists</h3>
//           <button className="play-all-btn">▶️ Play All</button>
//         </div>
//         <div className="featured-items">
//           {[1, 2, 3, 4, 5].map((i) => (
//             <div key={i} className="featured-item"></div>
//           ))}
//         </div>
//       </div>
//     </>
//   );
// };
import React, { useState } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import type { User } from '../../types';
import '../../main.css';

const toolTabs = [
  '🎧 Mood Assistant',
  '🎵 AI Playlist',
  '⚡ Quick Vibe',
  '🎹 Mood Mix',
  '🔀 Blend',
  '📻 Radio',
];

const examplePrompts = [
  'Create a chill lo-fi beats playlist perfect for late-night coding sessions',
  'Energetic workout mix with high tempo, motivating vibes for gym time',
  'Melancholic indie playlist for rainy days, soft vocals and acoustic guitars',
];

export const Dashboard: React.FC = () => {
  const [user] = useState<User | null>({ displayName: 'Jenny' } as User); // temp mock user
  const [activeTab, setActiveTab] = useState(1);
  const [moodInput, setMoodInput] = useState('');

  const handleLogout = () => {
    console.log('Logged out');
  };

  const handleGenerate = () => {
    if (!moodInput.trim()) return;
    console.log('Generating playlist for:', moodInput);
  };

  const handleExampleClick = (prompt: string) => {
    setMoodInput(prompt);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.displayName || 'there';
    if (hour < 12) return `Good Morning, ${name}! 👋`;
    if (hour < 18) return `Good Afternoon, ${name}! 👋`;
    return `Good Evening, ${name}! 👋`;
  };

  return (
    <>
      <div className="gradient-bg"></div>
      <Sidebar onLogin={() => {}} onSignup={() => {}} isAuthenticated={true} onLogout={handleLogout} />

      <div className="main-content">
        <h1 className="greeting">{getGreeting()}</h1>

        <div className="tool-tabs">
          {toolTabs.map((tab, index) => (
            <div
              key={index}
              className={`tool-tab ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className="input-section">
          <div className="input-wrapper">
            <textarea
              className="main-input"
              placeholder="Describe your mood and we'll create the perfect playlist from your Spotify library...

Example: 'Cozy rainy morning vibes, mid-tempo, acoustic, lo-fi beats for studying'"
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleGenerate();
                }
              }}
            />
            <button className="send-button" onClick={handleGenerate}>
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <div className="input-options">
            <button className="option-btn">📎 Attach Playlist</button>
            <button className="option-btn">⚙️ Custom Settings</button>
          </div>
        </div>

        <div className="example-prompts">
          {examplePrompts.map((prompt, index) => (
            <div
              key={index}
              className="example-prompt"
              onClick={() => handleExampleClick(prompt)}
            >
              {prompt}
            </div>
          ))}
        </div>
      </div>

      <div className="featured-section">
        <div className="featured-header">
          <h3>Your Recent Playlists</h3>
          <button className="play-all-btn">▶️ Play All</button>
        </div>
        <div className="featured-items">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="featured-item"></div>
          ))}
        </div>
      </div>
    </>
  );
};
