import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SheetMusic } from '@/types';
import { useServices } from '@/services/ServiceFactory';
import './LibraryPage.css';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { sheetMusicService } = useServices();
  const [library, setLibrary] = useState<SheetMusic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const response = await sheetMusicService.listSheetMusic();
      setLibrary(response.results);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="library-page library-page--loading">Loading...</div>;
  }

  return (
    <div className="library-page">
      <header className="library-page__header">
        <h1>Sheet Music Library</h1>
        <button
          className="library-page__upload-button"
          onClick={() => navigate('/upload')}
        >
          + Upload New
        </button>
      </header>

      <div className="library-page__grid">
        {library.map((sheet) => (
          <div
            key={sheet.id}
            className="library-page__card"
            onClick={() => navigate(`/practice/${sheet.id}`)}
          >
            <div className="library-page__card-header">
              <h3>{sheet.title}</h3>
              <p>{sheet.composer}</p>
            </div>
            <div className="library-page__card-meta">
              <span>{sheet.keySignature}</span>
              <span>•</span>
              <span>{sheet.timeSignature}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
