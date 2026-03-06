/**
 * Practice Summary Component
 * Shows evaluation results after completing a practice session.
 */

import React from 'react';
import type { PracticeEvaluation } from '@/types';
import './PracticeSummary.css';

interface PracticeSummaryProps {
  evaluation: PracticeEvaluation;
  onRestart: () => void;
}

export const PracticeSummary: React.FC<PracticeSummaryProps> = ({
  evaluation,
  onRestart,
}) => {
  const overallRating =
    evaluation.overallScore >= 80 ? 'excellent' :
    evaluation.overallScore >= 60 ? 'good' :
    evaluation.overallScore >= 40 ? 'fair' :
    'needs-work';

  const ratingLabels: Record<string, string> = {
    excellent: 'Excelente',
    good: 'Bien',
    fair: 'Regular',
    'needs-work': 'Necesita Practica',
  };

  return (
    <div className="practice-summary">
      <h2 className="practice-summary__title">Resumen de Practica</h2>

      {/* Overall Score */}
      <div className={`practice-summary__score practice-summary__score--${overallRating}`}>
        <div className="practice-summary__score-number">
          {Math.round(evaluation.overallScore)}%
        </div>
        <div className="practice-summary__score-label">
          {ratingLabels[overallRating]}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="practice-summary__stats">
        <div className="practice-summary__stat">
          <span className="practice-summary__stat-value">{evaluation.totalNotes}</span>
          <span className="practice-summary__stat-label">Total Notas</span>
        </div>
        <div className="practice-summary__stat practice-summary__stat--correct">
          <span className="practice-summary__stat-value">{evaluation.correctNotes}</span>
          <span className="practice-summary__stat-label">Correctas</span>
        </div>
        <div className="practice-summary__stat practice-summary__stat--close">
          <span className="practice-summary__stat-value">{evaluation.closeNotes}</span>
          <span className="practice-summary__stat-label">Casi</span>
        </div>
        <div className="practice-summary__stat practice-summary__stat--wrong">
          <span className="practice-summary__stat-value">{evaluation.wrongNotes}</span>
          <span className="practice-summary__stat-label">Incorrectas</span>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="practice-summary__details">
        <div className="practice-summary__detail">
          <span className="practice-summary__detail-label">Precision de Pitch</span>
          <div className="practice-summary__bar">
            <div
              className="practice-summary__bar-fill practice-summary__bar-fill--pitch"
              style={{ width: `${evaluation.averagePitchScore}%` }}
            />
          </div>
          <span className="practice-summary__detail-value">
            {Math.round(evaluation.averagePitchScore)}%
          </span>
        </div>
        <div className="practice-summary__detail">
          <span className="practice-summary__detail-label">Precision de Timing</span>
          <div className="practice-summary__bar">
            <div
              className="practice-summary__bar-fill practice-summary__bar-fill--timing"
              style={{ width: `${evaluation.averageTimingScore}%` }}
            />
          </div>
          <span className="practice-summary__detail-value">
            {Math.round(evaluation.averageTimingScore)}%
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="practice-summary__actions">
        <button
          className="practice-summary__restart-btn"
          onClick={onRestart}
        >
          Practicar de Nuevo
        </button>
      </div>
    </div>
  );
};
