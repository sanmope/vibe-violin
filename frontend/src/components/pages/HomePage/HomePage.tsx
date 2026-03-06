import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-page__hero">
        <h1 className="home-page__title">
          Vibe
          <span className="home-page__subtitle">Violin Sheet Music Reader</span>
        </h1>

        <p className="home-page__description">
          Transform PDF sheet music into interactive violin learning experiences.
          See exactly where to place your fingers and how to use your bow.
        </p>

        <div className="home-page__actions">
          <button
            className="home-page__button home-page__button--primary"
            onClick={() => navigate('/upload')}
          >
            Upload Sheet Music
          </button>
          <button
            className="home-page__button home-page__button--secondary"
            onClick={() => navigate('/library')}
          >
            Browse Library
          </button>
        </div>
      </div>

      <div className="home-page__features">
        <div className="home-page__feature" onClick={() => navigate('/tuner')} role="button" tabIndex={0}>
          <div className="home-page__feature-icon">🎯</div>
          <h3>Afinador</h3>
          <p>Afina tu violin con el afinador cromatico en tiempo real</p>
        </div>

        <div className="home-page__feature" onClick={() => navigate('/practice/write')} role="button" tabIndex={0}>
          <div className="home-page__feature-icon">🎤</div>
          <h3>Practica con Microfono</h3>
          <p>Toca y ve las notas aparecer en el pentagrama en tiempo real</p>
        </div>

        <div className="home-page__feature">
          <div className="home-page__feature-icon">🎻</div>
          <h3>Interactive Fingerboard</h3>
          <p>See exactly where to place your fingers on each string</p>
        </div>

        <div className="home-page__feature">
          <div className="home-page__feature-icon">🎵</div>
          <h3>Bow Technique</h3>
          <p>Learn proper bow direction, portion, and technique for each note</p>
        </div>

        <div className="home-page__feature">
          <div className="home-page__feature-icon">⏯️</div>
          <h3>Step-by-Step Playback</h3>
          <p>Practice at your own pace with adjustable tempo</p>
        </div>
      </div>
    </div>
  );
};
