# Architecture Documentation

## Overview

Vibe is designed as a modular, extensible web application with clear separation between frontend and backend. The architecture follows industry best practices and is optimized for maintainability, scalability, and developer experience.

## Design Philosophy

### 1. Modularity
Every component, service, and utility is self-contained and has a single responsibility. This makes the codebase easy to understand, test, and extend.

### 2. Extensibility
The application uses plugin-like patterns that allow adding new features without modifying existing code:
- Service Factory for data sources
- Component composition for UI
- Custom hooks for reusable logic

### 3. Type Safety
Full TypeScript coverage ensures:
- Compile-time error detection
- Better IDE support and autocomplete
- Self-documenting code
- Safer refactoring

### 4. Phase-Based Development
**Phase 1** delivers a working prototype with mock data, allowing frontend development and UX testing without backend dependencies. **Phase 2** adds the backend while maintaining the same frontend API.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  Page Components │    │  UI Components   │               │
│  │  - HomePage      │    │  - Fingerboard   │               │
│  │  - PracticePage  │    │  - BowVisualizer │               │
│  │  - LibraryPage   │    │  - Playback      │               │
│  └────────┬─────────┘    └────────┬─────────┘               │
│           │                       │                          │
│           └───────┬───────────────┘                          │
│                   │                                          │
│           ┌───────▼───────┐                                 │
│           │  Custom Hooks  │                                 │
│           │  - usePlayback │                                 │
│           │  - useServices │                                 │
│           └───────┬───────┘                                 │
│                   │                                          │
│           ┌───────▼───────────┐                             │
│           │  Service Factory  │ ◄─── Service Mode           │
│           └────┬──────┬───────┘      (Mock/API)             │
│                │      │                                      │
│      ┌─────────┘      └─────────┐                           │
│      │                          │                           │
│  ┌───▼──────────┐      ┌────────▼──────┐                   │
│  │ Mock Service │      │  API Service  │ (Phase 2)         │
│  │  (Phase 1)   │      │               │                   │
│  └──────────────┘      └────────┬──────┘                   │
│                                 │                           │
└─────────────────────────────────┼───────────────────────────┘
                                  │
                                  │ HTTP/REST
                                  │
                        ┌─────────▼────────────┐
                        │   Backend (Django)   │
                        │      (Phase 2)       │
                        └──────────────────────┘
```

## Frontend Architecture

### Layer 1: Components

#### Page Components
Top-level components that represent entire pages:
- **HomePage**: Landing page with features overview
- **LibraryPage**: Browse available sheet music
- **PracticePage**: Main practice interface
- **UploadPage**: Upload new sheet music

#### Feature Components
Domain-specific components:
- **Fingerboard**: Violin fingerboard with position highlighting
- **BowVisualizer**: Bow technique and portion indicator
- **PlaybackControls**: Playback navigation and tempo control

#### Common Components
Reusable UI primitives:
- **Button**: Various button styles and states
- **Card**: Container component
- **Modal**: Overlay dialogs
- **Slider**: Range input controls

### Layer 2: Hooks

Custom hooks encapsulate complex logic:

#### usePlayback
Manages playback state and timing:
```typescript
interface UsePlaybackReturn {
  currentNoteIndex: number;
  isPlaying: boolean;
  tempo: number;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setTempo: (bpm: number) => void;
  currentNote: Note | null;
}
```

**Implementation Details**:
- Uses `setTimeout` for note advancement based on duration and tempo
- Calculates note duration: `(60 / tempo) * 1000 * durationBeats`
- Automatically stops at end of piece
- Cleans up timers on unmount

#### useServices
Provides access to data services:
```typescript
function useServices() {
  return {
    sheetMusicService: ServiceFactory.getSheetMusicService(),
    sessionService: ServiceFactory.getSessionService(),
    isMockMode: ServiceFactory.isMockMode(),
  };
}
```

### Layer 3: Service Layer

The Service Layer provides a stable API for data operations, abstracting whether data comes from mock sources or a real backend.

#### Service Factory Pattern

**Purpose**: Enable seamless transition from Phase 1 (mock data) to Phase 2 (real API) without changing component code.

```typescript
export class ServiceFactory {
  private static mode: ServiceMode = ServiceMode.MOCK;

  static getSheetMusicService(): ISheetMusicService {
    if (this.mode === ServiceMode.MOCK) {
      return new MockSheetMusicService();
    } else {
      return new ApiSheetMusicService();
    }
  }

  static setMode(mode: ServiceMode): void {
    this.mode = mode;
    // Clear cached instances
  }
}
```

**Key Benefits**:
1. **Components don't know about data source**: They just call service methods
2. **Easy testing**: Swap to mock services in tests
3. **Gradual migration**: Transition one service at a time from mock to API
4. **No code changes needed**: Just flip the mode configuration

#### Service Interfaces

All services implement well-defined interfaces:

```typescript
interface ISheetMusicService {
  uploadSheetMusic(file: File, metadata: UploadMetadata): Promise<UploadResponse>;
  getSheetMusic(id: string): Promise<SheetMusic | null>;
  listSheetMusic(page?: number, limit?: number): Promise<PaginatedResponse<SheetMusic>>;
  deleteSheetMusic(id: string): Promise<void>;
  getNotes(sheetMusicId: string): Promise<Note[]>;
}
```

#### Mock Services (Phase 1)

Mock services simulate real backend behavior:
- **Realistic delays**: Network latency simulation
- **Async operations**: All methods return Promises
- **Processing simulation**: Fake PDF processing with timeouts
- **Error handling**: Can simulate errors for testing

```typescript
class MockSheetMusicService implements ISheetMusicService {
  private library: SheetMusic[] = [...mockSheetMusicLibrary];

  async uploadSheetMusic(file: File, metadata: UploadMetadata) {
    // Simulate upload delay
    await delay(1500);

    // Create new sheet music entry
    const newSheet = { /* ... */ };
    this.library.push(newSheet);

    // Simulate processing (3-5 seconds)
    setTimeout(() => {
      newSheet.status = 'READY';
      newSheet.notes = generateMockNotes(20);
    }, 3000);

    return { id: newSheet.id, status: 'PROCESSING' };
  }
}
```

### Layer 4: Types

Comprehensive TypeScript definitions ensure type safety across the application:

#### Music Types
```typescript
export interface Note {
  id: string;
  sequenceNumber: number;
  pitch: string;
  octave: number;
  duration: NoteDuration;
  durationBeats: number;
  measure: number;
  beat: number;
  violinString: ViolinString;
  fingerPosition: number;  // 0-4
  handPosition: number;    // 1-8
  bowDirection: BowDirection;
  bowPortion: BowPortion;
  technique: BowTechnique;
}
```

#### Violin Types
```typescript
export type ViolinString = 'G' | 'D' | 'A' | 'E';
export type BowDirection = 'DOWN' | 'UP';
export type BowPortion = 'FROG' | 'MIDDLE' | 'TIP' | 'WHOLE';
export type BowTechnique =
  | 'DETACHE'
  | 'LEGATO'
  | 'STACCATO'
  | 'SPICCATO'
  | 'PIZZICATO';
```

## Data Flow

### Phase 1: Mock Data Flow

```
User Action (Click "Practice")
    │
    ▼
Component (PracticePage)
    │
    ▼
Hook (useServices)
    │
    ▼
Service Factory
    │ (mode: MOCK)
    ▼
MockSheetMusicService
    │ (simulated delay)
    ▼
Mock Data (mockSheetMusicLibrary)
    │
    ▼
Component State Update
    │
    ▼
Re-render with Data
```

### Phase 2: Real API Flow

```
User Action (Click "Practice")
    │
    ▼
Component (PracticePage)
    │
    ▼
Hook (useServices)
    │
    ▼
Service Factory
    │ (mode: API)
    ▼
ApiSheetMusicService
    │ (Axios HTTP request)
    ▼
Django REST API
    │
    ▼
Database Query
    │
    ▼
JSON Response
    │
    ▼
Service Layer (parsing)
    │
    ▼
Component State Update
    │
    ▼
Re-render with Data
```

## State Management

### Local State (useState)
Used for component-specific state:
- Form inputs
- UI toggles
- Loading states

### Custom Hooks
Encapsulate complex stateful logic:
- `usePlayback`: Playback state and timing
- Shareable across components

### Future: Global State (Zustand)
For Phase 2, consider Zustand for:
- User authentication state
- Current session data
- App-wide settings

## Styling Architecture

### CSS Organization
```
src/styles/
├── global.css           # Global styles and CSS variables
└── (component-specific CSS colocated with components)
```

### CSS Variables
Centralized design tokens in `global.css`:
```css
:root {
  /* Colors */
  --color-primary: #6366f1;
  --color-background: #0f172a;

  /* Spacing */
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;

  /* Transitions */
  --transition-fast: 150ms ease;
}
```

### Component Styles
Each component has its own CSS file:
```
components/
└── violin/
    └── Fingerboard/
        ├── Fingerboard.tsx
        └── Fingerboard.css
```

**Benefits**:
- Easy to find styles for a component
- Can be lazy-loaded
- Clear ownership

## Backend Architecture (Phase 2)

### Django Structure

```
backend/
├── config/                    # Django project settings
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   └── urls.py
│
├── core/                      # Core Django app
│   ├── models/                # Database models
│   │   ├── sheet_music.py
│   │   ├── note.py
│   │   └── session.py
│   ├── views/                 # API views
│   ├── serializers/           # DRF serializers
│   └── urls.py
│
└── music_processing/          # Music analysis engine
    ├── abstract/              # Base classes
    │   ├── processor.py
    │   ├── parser.py
    │   └── converter.py
    ├── plugins/               # Concrete implementations
    │   ├── parsers/
    │   ├── analyzers/
    │   └── converters/
    ├── factories/             # Factory classes
    └── pipeline/              # Processing pipeline
```

### Plugin Architecture

Inspired by the Network_Framework project, the backend uses a plugin/factory pattern:

```python
class Processor(ABC):
    """Base class for all processors"""

    @abstractmethod
    def execute(self, context: ProcessingContext) -> ProcessingContext:
        pass

    @abstractmethod
    def validate(self, context: ProcessingContext) -> bool:
        pass
```

**Concrete implementations**:
- `PDFParser`: Extracts images from PDF
- `OMRParser`: Optical Music Recognition with music21
- `NoteAnalyzer`: Identifies notes and rhythm
- `PositionConverter`: Converts notes to violin positions
- `BowConverter`: Assigns bowing techniques

**Factory creates pipeline**:
```python
class ViolinProcessorFactory:
    @classmethod
    def create_full_pipeline(cls) -> ProcessingPipeline:
        pipeline = ProcessingPipeline("Violin Processing")
        pipeline.add_stage(cls.create_parser('pdf'))
        pipeline.add_stage(cls.create_parser('omr'))
        pipeline.add_stage(cls.create_analyzer('note'))
        pipeline.add_stage(cls.create_converter('position'))
        pipeline.add_stage(cls.create_converter('bow'))
        return pipeline
```

## API Design (Phase 2)

### RESTful Endpoints

```
Base: /api/v1/

# Sheet Music
GET    /sheet-music/              List all sheet music
POST   /sheet-music/upload/       Upload new PDF
GET    /sheet-music/{id}/         Get specific sheet music
DELETE /sheet-music/{id}/         Delete sheet music
GET    /sheet-music/{id}/notes/   Get all notes

# Practice Sessions
GET    /sessions/                 List sessions
POST   /sessions/                 Create new session
GET    /sessions/{id}/            Get session details
PUT    /sessions/{id}/            Update session
POST   /sessions/{id}/complete/   Mark complete
```

### Request/Response Format

```json
// POST /sheet-music/upload/
Request (multipart/form-data):
{
  "file": <PDF>,
  "title": "Violin Concerto",
  "composer": "Mozart"
}

Response (202 Accepted):
{
  "id": "uuid",
  "status": "PROCESSING",
  "processingUrl": "/api/v1/processing/status/uuid/"
}

// GET /sheet-music/{id}/notes/
Response (200 OK):
{
  "count": 120,
  "notes": [
    {
      "id": "uuid",
      "pitch": "A4",
      "duration": "quarter",
      "violinString": "A",
      "fingerPosition": 0,
      "bowDirection": "DOWN",
      "technique": "DETACHE"
    },
    // ...
  ]
}
```

## Performance Considerations

### Frontend Optimization
1. **Code Splitting**: Lazy load route components
2. **Memoization**: Use `React.memo()` for expensive components
3. **Virtual Scrolling**: For long note lists
4. **Debouncing**: Tempo slider updates

### Backend Optimization (Phase 2)
1. **Async Processing**: PDF processing in background tasks
2. **Caching**: Cache processed sheet music data
3. **Database Indexing**: On frequently queried fields
4. **Pagination**: Limit response sizes

## Security Considerations

### Phase 2 Security
1. **Authentication**: JWT tokens
2. **File Upload Validation**: Check file types and sizes
3. **Rate Limiting**: Prevent abuse
4. **CORS**: Configure allowed origins
5. **Input Sanitization**: Validate all user inputs

## Testing Strategy

### Frontend Tests
- **Unit Tests**: Individual components and hooks (Vitest)
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user workflows (Playwright)

### Backend Tests (Phase 2)
- **Unit Tests**: Models, serializers, utilities
- **Integration Tests**: API endpoints
- **Pipeline Tests**: Music processing accuracy

## Deployment

### Frontend Deployment
- Build: `npm run build`
- Static hosting: Vercel, Netlify, or AWS S3 + CloudFront
- Environment variables for API URL

### Backend Deployment (Phase 2)
- Container: Docker
- Platform: AWS ECS, Google Cloud Run, or Heroku
- Database: Managed PostgreSQL
- File Storage: S3 for PDFs

## Future Enhancements

### Extensibility Points
1. **New Instruments**: Add viola, cello by extending converters
2. **Custom Visualizations**: Plugin system for different displays
3. **Alternative Notations**: Support for tablature, etc.
4. **Multiple Languages**: i18n support

### Scalability
- Microservices: Split processing into separate service
- Message Queue: For async job processing
- CDN: For static assets and processed files

---

**This architecture balances immediate functionality (Phase 1) with future growth (Phase 2+), ensuring a solid foundation for long-term success.**
