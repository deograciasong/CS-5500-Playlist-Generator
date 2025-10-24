# 🎵 CS5500 Playlist Generator

> An intelligent playlist generator that creates personalized music playlists based on your mood using AI and the Spotify API.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/cloud/atlas)

---

## 👥 Team

**CS5500 Development Team**

- GitHub: [@deograciasong](https://github.com/deograciasong)

- GitHub: [@jennyncodes](https://github.com/jennyncodes)



---

## 📖 About The Project

The CS5500 Playlist Generator is a smart system that lets users describe their mood and automatically generates a personalized playlist from their Spotify library. The application:

- 🎯 Matches the energy, tempo, and overall feel you're going for
- 🔄 Ensures songs flow nicely together
- 🧠 Gets smarter over time based on what you skip or like
- 🎧 Integrates seamlessly with your Spotify account

### Built With

**MERN Stack:**
- **MongoDB** - NoSQL database for storing user data and playlists
- **Express.js** - Backend API framework
- **React 19** - Modern UI library with hooks
- **Node.js** - JavaScript runtime environment

**Frontend Technologies:**
- [Vite](https://vitejs.dev/) - Lightning-fast build tool
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful React components
- [Lucide React](https://lucide.dev/) - Icon library

**Backend Technologies:**
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling
- [JWT](https://jwt.io/) - Secure authentication
- [Express Validator](https://express-validator.github.io/) - Input validation

**Machine Learning:**
- Python (TensorFlow/PyTorch) - ML model for mood-based recommendations

**APIs:**
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) - Music data and user library access

---

## ✨ Features

### Current Features
- ✅ User-friendly interface with React 19
- ✅ Responsive design with Tailwind CSS
- ✅ Component library with shadcn/ui
- ✅ TypeScript for type safety
- ✅ Fast development with Vite HMR

### Planned Features
- 🔜 User authentication and authorization
- 🔜 Spotify OAuth integration
- 🔜 Mood-based playlist generation
- 🔜 AI-powered song recommendations
- 🔜 Playlist management (CRUD operations)
- 🔜 Song skip/like tracking for ML training
- 🔜 Public/private playlist sharing
- 🔜 Real-time collaboration on playlists
- 🔜 Audio preview functionality
- 🔜 Playlist analytics dashboard

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
  ```bash
  node --version
  ```
  Download: [https://nodejs.org/](https://nodejs.org/)

- **npm** (v9.0.0 or higher, comes with Node.js)
  ```bash
  npm --version
  ```

- **Git**
  ```bash
  git --version
  ```
  Download: [https://git-scm.com/](https://git-scm.com/)

- **MongoDB** (Atlas or local installation)
  - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (recommended for beginners)
  - [MongoDB Community Edition](https://www.mongodb.com/try/download/community) (local)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/deograciasong/CS-5500-Playlist-Generator.git
   cd CS-5500-Playlist-Generator
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend/playlist-generator
   npm install
   npm install axios  # For API calls
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../../backend
   npm install
   ```

4. **Configure Environment Variables**
   
   Create a `.env` file in the `backend/` directory:
   ```env
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/playlist-generator
   # Or local: MONGODB_URI=mongodb://localhost:27017/playlist-generator
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # JWT
   JWT_SECRET=your-super-secret-key-change-in-production
   JWT_EXPIRE=7d
   
   # Spotify API (get from https://developer.spotify.com/)
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

5. **Setup MongoDB**
   
   **Option A: MongoDB Atlas (Cloud)**
   - Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster (free tier available)
   - Create a database user
   - Whitelist your IP (or use 0.0.0.0/0 for development)
   - Get your connection string and add it to `.env`
   
   **Option B: Local MongoDB**
   ```bash
   # Mac (Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows - runs automatically as a service
   ```

---

## 🎮 Running the Application

### Development Mode

You'll need **two terminal windows** - one for backend, one for frontend.

**Terminal 1: Start Backend Server**
```bash
cd backend
npm run dev
```
✅ Backend will run on: `http://localhost:5000`

**Terminal 2: Start Frontend Development Server**
```bash
cd frontend/playlist-generator
npm run dev
```
✅ Frontend will run on: `http://localhost:5173`

### Production Build

**Build Frontend:**
```bash
cd frontend/playlist-generator
npm run build
npm run preview  # Preview the production build
```

---

## 📁 Project Structure

```
CS-5500-Playlist-Generator/
├── frontend/
│   └── playlist-generator/          # React frontend
│       ├── src/
│       │   ├── components/          # React components
│       │   │   └── ui/              # shadcn/ui components
│       │   ├── services/            # API services
│       │   ├── assets/              # Static assets
│       │   ├── App.tsx              # Main App component
│       │   ├── main.tsx             # Entry point
│       │   └── index.css            # Global styles
│       ├── public/                  # Public assets
│       ├── package.json             # Frontend dependencies
│       ├── vite.config.ts           # Vite configuration
│       ├── tsconfig.json            # TypeScript config
│       └── components.json          # shadcn/ui config
│
├── backend/                         # Express.js backend
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js
│   │   └── Playlist.js
│   ├── controllers/                 # Route controllers
│   │   ├── authController.js
│   │   └── playlistController.js
│   ├── routes/                      # Express routes
│   │   ├── auth.js
│   │   └── playlists.js
│   ├── middleware/                  # Custom middleware
│   │   └── auth.js
│   ├── config/                      # Configuration files
│   │   └── db.js
│   ├── utils/                       # Helper functions
│   ├── .env                         # Environment variables
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Backend dependencies
│   └── server.js                    # Express server
│
├── ml_model/                        # Python ML model
│   ├── model.py                     # ML model implementation
│   ├── train.py                     # Training script
│   └── requirements.txt             # Python dependencies
│
├── docs/                            # Documentation
│   └── CS5500-SRS-031025-030722.pdf
│
├── .gitignore                       # Root gitignore
└── README.md                        # This file
```

---

## 🛠️ Available Scripts

### Frontend Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Backend Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend with nodemon (auto-restart) |
| `npm start` | Start backend in production mode |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Playlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playlists` | Get all playlists |
| POST | `/api/playlists` | Create new playlist |
| GET | `/api/playlists/:id` | Get playlist by ID |
| PUT | `/api/playlists/:id` | Update playlist |
| DELETE | `/api/playlists/:id` | Delete playlist |
| POST | `/api/playlists/:id/songs` | Add song to playlist |
| DELETE | `/api/playlists/:id/songs/:songId` | Remove song |

### Spotify Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spotify/authorize` | Initiate Spotify OAuth |
| GET | `/api/spotify/callback` | OAuth callback |
| GET | `/api/spotify/playlists` | Get user's Spotify playlists |

### ML Predictions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/generate` | Generate playlist based on mood |
| POST | `/api/ml/recommend` | Get song recommendations |

---

## 🎨 Adding shadcn/ui Components

To add new UI components:

```bash
# Navigate to frontend directory
cd frontend/playlist-generator

# Add a component
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog

# Or add multiple at once
npx shadcn@latest add button card dialog input
```

Available components: [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)

---

## 🔧 Development Workflow

### Creating a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Test locally
   - Follow the project's coding standards

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add description of your feature"
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to GitHub
   - Create a new Pull Request
   - Request code review from team members

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat: Add user authentication"
git commit -m "fix: Resolve playlist generation bug"
git commit -m "docs: Update API documentation"
```

---

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

**Problem:** `Error: Port 5173 or 5000 is already in use`

**Solution:**
```bash
# Mac/Linux - Kill process on port
lsof -ti:5173 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

#### MongoDB Connection Failed

**Problem:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
1. Check if MongoDB is running (local installation)
2. Verify connection string in `.env`
3. For Atlas: Check IP whitelist and database credentials
4. Ensure database name is included in URI

#### Module Not Found

**Problem:** `Error: Cannot find module`

**Solution:**
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### CORS Errors

**Problem:** `Access-Control-Allow-Origin` errors

**Solution:**
- Verify CORS is configured in backend `server.js`
- Check frontend URL in CORS settings matches your dev server
- Ensure backend is running before making API calls

---

## 🧪 Testing

### Frontend Testing
```bash
cd frontend/playlist-generator
npm run test
```

### Backend Testing
```bash
cd backend
npm run test
```

### API Testing
Use [Thunder Client](https://www.thunderclient.com/) (VS Code extension) or [Postman](https://www.postman.com/) to test API endpoints.

---

### Code Review Process

1. All code changes require review by at least one team member
2. Ensure all tests pass before requesting review
3. Address any feedback from reviewers
4. Once approved, code will be merged to main branch

---

## 📋 Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Project setup and structure
- [x] Frontend boilerplate with React + Vite
- [x] shadcn/ui integration
- [ ] Backend API setup
- [ ] MongoDB connection
- [ ] User authentication

### Phase 2: Core Features (Weeks 3-4)
- [ ] Spotify OAuth integration
- [ ] Playlist CRUD operations
- [ ] User profile management
- [ ] Basic UI components

### Phase 3: ML Integration (Weeks 5-6)
- [ ] Mood detection algorithm
- [ ] ML model training
- [ ] Playlist generation based on mood
- [ ] Song recommendation engine

### Phase 4: Enhancement (Weeks 7-8)
- [ ] Real-time features
- [ ] Social features (sharing, likes)
- [ ] Audio preview
- [ ] Analytics dashboard

### Phase 5: Deployment (Week 9-10)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Production deployment
- [ ] Documentation completion

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---


## 🙏 Acknowledgments

- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Spotify Web API](https://developer.spotify.com/) - Music data
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Database hosting

---

## 📊 Project Status

🚧 **Currently in active development** 🚧

- ✅ Frontend boilerplate complete
- 🔄 Backend API in progress
- ⏳ ML model pending
- ⏳ Spotify integration pending
