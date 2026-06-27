import { useEffect, useRef } from 'react';
import { Question } from '../types';

export interface QuestionOverlayProps {
  question: Question;
  remainingTime: number;
  isExpired: boolean;
  isRapidFire: boolean;
  isAnswerRevealed: boolean;
  onClose?: () => void;
  /** Total duration in seconds (used for circular progress calculation) */
  totalDuration?: number;
}

// --- Circular Timer Component ---

function CircularTimer({
  remainingTime,
  totalDuration,
  isExpired,
}: {
  remainingTime: number;
  totalDuration: number;
  isExpired: boolean;
}) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? remainingTime / totalDuration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const isUrgent = remainingTime <= 10 && !isExpired;
  const strokeColor = isExpired ? '#F44336' : isUrgent ? '#F44336' : '#58a6ff';

  return (
    <div style={{ position: 'relative', width: '150px', height: '150px' }} data-testid="circular-timer">
      <svg
        width="150"
        height="150"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      {/* Time text in center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: isExpired ? '1.2rem' : '2.5rem',
          fontWeight: 700,
          color: isExpired ? '#F44336' : isUrgent ? '#F44336' : '#ffffff',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
        data-testid="timer-display"
      >
        {isExpired ? "TIME'S\nUP" : remainingTime}
      </div>
    </div>
  );
}

// --- Keyframe styles injected once ---

const KEYFRAMES = `
@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes cardFlipIn {
  0% { transform: perspective(800px) rotateY(90deg) scale(0.5); opacity: 0; }
  60% { transform: perspective(800px) rotateY(-10deg) scale(1.02); opacity: 1; }
  80% { transform: perspective(800px) rotateY(5deg) scale(1); }
  100% { transform: perspective(800px) rotateY(0deg) scale(1); opacity: 1; }
}
@keyframes pulseUrgent {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
`;

function injectKeyframes() {
  const id = 'trivia-overlay-keyframes';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

// --- Main Component ---

export function QuestionOverlay({
  question,
  remainingTime,
  isExpired,
  isRapidFire,
  isAnswerRevealed,
  onClose,
  totalDuration = 30,
}: QuestionOverlayProps) {
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!injectedRef.current) {
      injectKeyframes();
      injectedRef.current = true;
    }
  }, []);

  const isUrgent = remainingTime <= 10 && !isExpired;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, rgba(10,10,15,0.94) 0%, rgba(0,0,0,0.97) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        boxSizing: 'border-box',
        backdropFilter: 'blur(4px)',
        animation: 'overlayFadeIn 0.3s ease-out',
      }}
      data-testid="question-overlay"
    >
      {onClose && (
        <button
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.3)',
            backgroundColor: 'rgba(96, 125, 139, 0.8)',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={onClose}
          aria-label="Close question and return to board"
          data-testid="overlay-close-button"
        >
          ✕ Close
        </button>
      )}

      {/* Card flip container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          maxWidth: '800px',
          width: '100%',
          animation: 'cardFlipIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {isRapidFire && (
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#FFC107',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(255, 193, 7, 0.15)',
              border: '2px solid #FFC107',
              animation: 'pulseUrgent 1s infinite',
            }}
            data-testid="rapid-fire-indicator"
          >
            ⚡ RAPID FIRE
          </div>
        )}

        <div
          style={{
            fontSize: '2.2rem',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.4,
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          data-testid="question-text"
        >
          {question.text}
        </div>

        {/* Circular countdown timer */}
        <div style={isUrgent ? { animation: 'pulseUrgent 0.5s infinite' } : {}}>
          <CircularTimer
            remainingTime={remainingTime}
            totalDuration={totalDuration}
            isExpired={isExpired}
          />
        </div>

        {isExpired && (
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#F44336',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
            data-testid="expired-indicator"
          >
            TIME'S UP
          </div>
        )}

        {isAnswerRevealed && (
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#8BC34A',
              textAlign: 'center',
              marginTop: '1rem',
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(139, 195, 74, 0.1)',
              border: '1px solid rgba(139, 195, 74, 0.3)',
            }}
            data-testid="answer-text"
          >
            {question.answer}
          </div>
        )}
      </div>
    </div>
  );
}
