import { Question } from '../types';

export interface QuestionOverlayProps {
  question: Question;
  remainingTime: number;
  isExpired: boolean;
  isRapidFire: boolean;
  isAnswerRevealed: boolean;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem',
    boxSizing: 'border-box' as const,
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '1.5rem',
    maxWidth: '800px',
    width: '100%',
  },
  questionText: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center' as const,
    lineHeight: 1.4,
  },
  timer: {
    fontSize: '3rem',
    fontWeight: 700,
    color: '#ffffff',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  timerLow: {
    color: '#F44336',
  },
  expiredIndicator: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#F44336',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  rapidFireIndicator: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#FFC107',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    border: '2px solid #FFC107',
  },
  answerText: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#8BC34A',
    textAlign: 'center' as const,
    marginTop: '1rem',
    padding: '1rem 1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    border: '1px solid rgba(139, 195, 74, 0.3)',
  },
};

export function QuestionOverlay({
  question,
  remainingTime,
  isExpired,
  isRapidFire,
  isAnswerRevealed,
}: QuestionOverlayProps) {
  const timerStyle = {
    ...styles.timer,
    ...(remainingTime < 10 && !isExpired ? styles.timerLow : {}),
  };

  return (
    <div style={styles.overlay} data-testid="question-overlay">
      <div style={styles.content}>
        {isRapidFire && (
          <div style={styles.rapidFireIndicator} data-testid="rapid-fire-indicator">
            ⚡ RAPID FIRE
          </div>
        )}

        <div style={styles.questionText} data-testid="question-text">
          {question.text}
        </div>

        {isExpired ? (
          <div style={styles.expiredIndicator} data-testid="expired-indicator">
            TIME'S UP
          </div>
        ) : (
          <div style={timerStyle} data-testid="timer-display">
            {remainingTime}
          </div>
        )}

        {isAnswerRevealed && (
          <div style={styles.answerText} data-testid="answer-text">
            {question.answer}
          </div>
        )}
      </div>
    </div>
  );
}
