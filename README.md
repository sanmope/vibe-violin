# Vibe - Violin Smart TEacher

An intelligent web application that transforms PDF sheet music into interactive violin learning experiences with real-time visual feedback for finger positions and bow techniques.

## 🎻 Features

### Current (Phase 1 - Frontend Prototype)
- **Interactive Fingerboard Visualization**: See exactly where to place your fingers on each of the 4 strings (G, D, A, E)
- **Bow Technique Guidance**: Real-time visualization of bow direction (up/down), portion (frog/middle/tip), and technique (détaché, legato, staccato, etc.)
- **Step-by-Step Playback**: Practice at your own pace with play/pause and note-by-note navigation
- **Adjustable Tempo**: Slow down or speed up to match your skill level (40-240 BPM)
- **Sheet Music Library**: Browse and select from pre-loaded practice pieces
- **Fully Functional with Mock Data**: Complete frontend experience without backend dependency

### Coming Soon (Phase 2 - Backend Integration)
- **PDF Upload & Processing**: Upload real PDF sheet music files
- **Optical Music Recognition (OMR)**: Automatic conversion of PDF notation to digital format using music21
- **Intelligent Position Detection**: AI-powered determination of optimal finger positions
- **MIDI Audio Playback**: Hear reference audio for each note
- **Practice Session Tracking**: Save and review your practice history
- **Progress Analytics**: Track improvement over time

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Using the Application

1. **Home Page**: Welcome screen with feature overview
2. **Library**: Browse pre-loaded sheet music (Twinkle Twinkle Little Star, Ode to Joy, Scale Exercises)
3. **Practice**: Click any piece to start practicing
   - See finger positions highlighted on the fingerboard
   - View bow direction and technique
   - Use playback controls to practice note-by-note or continuously
   - Adjust tempo to your comfort level
4. **Upload**: (Currently simulated) Upload new sheet music PDFs

## 📁 Project Structure

```
vibe/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── common/       # Reusable components (Button, etc.)
│   │   │   ├── violin/       # Violin-specific visualizations
│   │   │   │   ├── Fingerboard/
│   │   │   │   └── BowVisualizer/
│   │   │   ├── playback/     # Playback controls
│   │   │   └── pages/        # Page components
│   │   ├── services/         # Data service layer
│   │   │   ├── mock/         # Mock data services (Phase 1)
│   │   │   ├── api/          # Real API services (Phase 2)
│   │   │   └── ServiceFactory.ts  # Service abstraction
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript definitions
│   │   ├── store/            # State management
│   │   └── styles/           # Global styles
│   └── package.json
├── backend/                  # Django backend (Phase 2)
├── docs/                     # Documentation
└── README.md
```

## 🏗️ Architecture

### Design Principles
- **Modular & Extensible**: Clear separation of concerns, easy to add new features
- **Type-Safe**: Full TypeScript coverage for robust development
- **Service Layer Pattern**: Clean abstraction between UI and data sources
- **Phase-Based Development**: Working prototype first, then backend integration

### Key Architectural Patterns

#### 1. Service Factory Pattern
Allows seamless switching between mock data (Phase 1) and real API (Phase 2):

```typescript
// Automatically uses mock services in Phase 1
const { sheetMusicService } = useServices();
const notes = await sheetMusicService.getNotes(sheetMusicId);

// Later in Phase 2, just change one config and it uses real API
ServiceFactory.setMode(ServiceMode.API);
```

#### 2. Component Composition
Complex UIs built from simple, reusable components:
- `PracticePage` orchestrates `Fingerboard`, `BowVisualizer`, and `PlaybackControls`
- Each component is self-contained and testable
- Props flow down, events bubble up

#### 3. Custom Hooks
Encapsulate complex logic for reusability:
- `usePlayback`: Manages playback state, timing, and navigation
- `useServices`: Provides access to data services
- Easy to test and reuse across components

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architectural documentation.

## 🎯 Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **CSS Modules**: Scoped styling

### Backend (Phase 2)
- **Django**: Web framework
- **Django REST Framework**: API development
- **music21**: Music analysis and OMR
- **PostgreSQL**: Production database
- **SQLite**: Development database

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm run test
```

### Project Configuration

#### Service Mode
The application uses a Service Factory to switch between mock and real data:

```typescript
// In src/main.tsx
import { initializeServices, ServiceMode } from './services/ServiceFactory';

// Phase 1: Use mock data
initializeServices(ServiceMode.MOCK);

// Phase 2: Use real API
initializeServices(ServiceMode.API);
```

#### Environment Variables
Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SERVICE_MODE=mock  # or 'api' for Phase 2
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed architectural design and patterns
- **[API Documentation](./docs/api/)**: API endpoints and request/response formats (Phase 2)
- **[Development Guide](./docs/development.md)**: Setup instructions and best practices
- **[Contributing Guide](./CONTRIBUTING.md)**: How to contribute to the project

## 🎵 How It Works

### Violin Theory
The application uses music theory principles to determine:

1. **Finger Positions**: Which finger (0-4) presses which string at which position (1st-8th)
   - Open strings (0): G3, D4, A4, E5
   - Fingers 1-4: Index through pinky
   - Positions: Distance from nut (1st position closest)

2. **Bow Techniques**:
   - **Détaché**: Separate, smooth strokes (default)
   - **Legato**: Multiple notes in one bow
   - **Staccato**: Short, detached notes
   - **Spiccato**: Bouncing bow

3. **Bow Portions**:
   - **Frog**: Heavy, strong sound
   - **Middle**: Balanced, versatile
   - **Tip**: Light, delicate sound

### Mock Data Structure
Sample pieces include realistic violin fingerings:
- **Twinkle Twinkle Little Star**: Beginner-friendly in C major
- **Ode to Joy**: Beethoven's theme in D major
- **Scale Exercises**: C major scale with proper fingering

## 🚧 Roadmap

### Phase 1 ✅ (Current)
- [x] Frontend prototype with mock data
- [x] Interactive fingerboard visualization
- [x] Bow technique visualizer
- [x] Playback controls with tempo adjustment
- [x] Library browsing and navigation
- [x] Responsive design

### Phase 2 (Next)
- [ ] Django backend setup
- [ ] PDF upload endpoint
- [ ] OMR integration with music21
- [ ] Database models for sheet music and notes
- [ ] REST API development
- [ ] Frontend integration with real API
- [ ] MIDI audio playback
- [ ] Practice session tracking

### Phase 3 (Future)
- [ ] User authentication
- [ ] Personal practice history
- [ ] Progress analytics and charts
- [ ] Social features (share pieces, compare progress)
- [ ] Mobile app (React Native)
- [ ] Support for other string instruments (viola, cello)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **music21**: Python toolkit for computer-aided musicology
- **VexFlow**: JavaScript library for rendering music notation
- **Tone.js**: Web Audio framework
- Inspired by the need to make violin practice more accessible and visual

## 📧 Contact

For questions, suggestions, or feedback, please open an issue on GitHub.

---

**Built with ❤️ for violinists everywhere**
