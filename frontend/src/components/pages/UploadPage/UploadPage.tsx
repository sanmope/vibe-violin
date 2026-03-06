/**
 * Upload Page
 * Upload sheet music files: PDF (backend processing) or MusicXML (browser parsing).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '@/services/ServiceFactory';
import { parseMusicXMLToSheetMusic } from '@/utils/musicXmlParser';
import './UploadPage.css';

const ACCEPTED_EXTENSIONS = '.pdf,.xml,.musicxml';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { sheetMusicService } = useServices();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMusicXML = (f: File) => {
    const ext = f.name.toLowerCase();
    return ext.endsWith('.xml') || ext.endsWith('.musicxml');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Auto-fill title from filename if not set
      if (!title) {
        setTitle(selectedFile.name.replace(/\.(pdf|xml|musicxml)$/i, ''));
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      if (isMusicXML(file)) {
        // Parse MusicXML in the browser
        const xmlText = await file.text();
        const { sheetMusic, notes } = parseMusicXMLToSheetMusic(xmlText, title.trim());

        // Override title/composer with form values
        sheetMusic.title = title.trim();
        if (composer.trim()) {
          sheetMusic.composer = composer.trim();
        }

        // Add to mock service
        if ('addParsedSheetMusic' in sheetMusicService) {
          (sheetMusicService as any).addParsedSheetMusic(sheetMusic, notes);
        }

        navigate('/library');
      } else {
        // PDF: upload to backend (mock service)
        await sheetMusicService.uploadSheetMusic(file, {
          title: title.trim(),
          composer: composer.trim() || undefined,
        });

        setTimeout(() => {
          navigate('/library');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-page__container">
        <h1>Upload Sheet Music</h1>

        <form onSubmit={handleSubmit} className="upload-page__form">
          {/* File Input */}
          <div className="upload-page__field">
            <label className="upload-page__file-label">
              <input
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileChange}
                className="upload-page__file-input"
                disabled={uploading}
              />
              <div className="upload-page__file-button">
                {file ? `Selected: ${file.name}` : 'Choose PDF or MusicXML File'}
              </div>
            </label>
            <span className="upload-page__file-hint">
              PDF, .xml, .musicxml
            </span>
          </div>

          {/* Title Input */}
          <div className="upload-page__field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Twinkle Twinkle Little Star"
              disabled={uploading}
              required
            />
          </div>

          {/* Composer Input */}
          <div className="upload-page__field">
            <label htmlFor="composer">Composer</label>
            <input
              id="composer"
              type="text"
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder="e.g., Wolfgang Amadeus Mozart"
              disabled={uploading}
            />
          </div>

          {/* MusicXML Info */}
          {file && isMusicXML(file) && (
            <div className="upload-page__info">
              MusicXML files are parsed directly in the browser - no server needed.
            </div>
          )}

          {/* Error Message */}
          {error && <div className="upload-page__error">{error}</div>}

          {/* Actions */}
          <div className="upload-page__actions">
            <button
              type="button"
              onClick={() => navigate('/library')}
              className="upload-page__button upload-page__button--secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="upload-page__button upload-page__button--primary"
              disabled={uploading || !file}
            >
              {uploading ? 'Processing...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
