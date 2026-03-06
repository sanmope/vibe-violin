import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/layout/Navigation/Navigation'
import { HomePage } from './components/pages/HomePage/HomePage'
import { PracticePage } from './components/pages/PracticePage/PracticePage'
import { UploadPage } from './components/pages/UploadPage/UploadPage'
import { LibraryPage } from './components/pages/LibraryPage/LibraryPage'
import { TunerPage } from './components/pages/TunerPage/TunerPage'

function App() {
  return (
    <Router>
      <Navigation>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/practice/write" element={<PracticePage />} />
          <Route path="/practice/:sheetMusicId" element={<PracticePage />} />
          <Route path="/tuner" element={<TunerPage />} />
        </Routes>
      </Navigation>
    </Router>
  )
}

export default App
