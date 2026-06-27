import React from 'react';
import { useGameState } from '../state/GameStateManager';
import { GamePhase, QuestionStatus } from '../types';
import type { Question, Topic } from '../types';

/**
 * Returns the hex background color for a given difficulty level (1-5).
 * Green (easy) → Red (hard).
 */
export function getDifficultyColor(difficulty: number): string {
  const colorMap: Record<number, string> = {
    1: '#2e7d42',   // Muted forest green (easy)
    2: '#558b2f',   // Muted olive green
    3: '#c49000',   // Muted gold (medium)
    4: '#d4700a',   // Muted burnt orange
    5: '#c62828',   // Muted deep red (hard)
  };
  return colorMap[difficulty] ?? '#546e7a';
}

// --- Styles ---

const boardStyles: React.CSSProperties = {
  display: 'flex',
  gap: '14px',
  padding: '20px',
  overflowX: 'auto',
  minHeight: '100%',
};

const swimlaneStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  minWidth: '180px',
  flex: '1 1 0',
};

const swimlaneHeaderStyles: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '0.95rem',
  textAlign: 'center',
  padding: '14px 8px',
  background: 'linear-gradient(135deg, #0d1117, #161b22)',
  color: '#58a6ff',
  borderRadius: '10px 10px 0 0',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  border: '1px solid rgba(255,255,255,0.06)',
  borderBottom: 'none',
};

function getCardStyles(question: Question, isClickable: boolean): React.CSSProperties {
  const baseColor = getDifficultyColor(question.difficulty);
  const isAnswered = question.status === QuestionStatus.ANSWERED;
  const isSkipped = question.status === QuestionStatus.SKIPPED;

  // Solid border hint color (slightly more opaque version)
  const borderColors: Record<number, string> = {
    1: 'rgba(46, 125, 66, 0.7)',
    2: 'rgba(85, 139, 47, 0.7)',
    3: 'rgba(196, 144, 0, 0.7)',
    4: 'rgba(212, 112, 10, 0.7)',
    5: 'rgba(198, 40, 40, 0.7)',
  };
  const borderColor = isSkipped
    ? 'rgba(255,255,255,0.05)'
    : (borderColors[question.difficulty] ?? 'rgba(255,255,255,0.08)');

  return {
    padding: '18px 14px',
    borderRadius: '8px',
    backgroundColor: isSkipped ? 'rgba(60,60,70,0.2)' : baseColor,
    color: isSkipped ? '#666' : 'rgba(255,255,255,0.9)',
    opacity: isAnswered ? 0.4 : 1,
    textDecoration: isAnswered ? 'line-through' : 'none',
    cursor: isClickable ? 'pointer' : 'default',
    fontWeight: 600,
    fontSize: '1rem',
    boxShadow: isClickable
      ? '0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    userSelect: 'none' as const,
    position: 'relative' as const,
    border: `1px solid ${borderColor}`,
    backdropFilter: 'blur(4px)',
  };
}

// --- Component ---

export function GameBoard() {
  const { state, selectQuestion } = useGameState();

  if (!state) {
    return <div style={{ padding: '24px' }}>No game loaded.</div>;
  }

  const { config, phase } = state;
  const isBoardViewPhase = phase === GamePhase.BOARD_VIEW;

  const handleQuestionClick = (topicId: string, question: Question) => {
    if (!isBoardViewPhase) return;
    if (question.status !== QuestionStatus.AVAILABLE) return;
    selectQuestion(topicId, question.id);
  };

  return (
    <div style={boardStyles} data-testid="game-board">
      {config.topics.map((topic: Topic) => {
        // Sort questions by difficulty ascending (top = easiest)
        const sortedQuestions = [...topic.questions].sort(
          (a, b) => a.difficulty - b.difficulty
        );

        return (
          <div key={topic.id} style={swimlaneStyles} data-testid={`swimlane-${topic.id}`}>
            <div style={swimlaneHeaderStyles}>{topic.name}</div>
            {sortedQuestions.map((question) => {
              const isClickable =
                isBoardViewPhase && question.status === QuestionStatus.AVAILABLE;

              return (
                <div
                  key={question.id}
                  style={getCardStyles(question, isClickable)}
                  onClick={() => handleQuestionClick(topic.id, question)}
                  data-testid={`question-card-${question.id}`}
                  data-status={question.status}
                  data-difficulty={question.difficulty}
                  role="button"
                  aria-label={`${question.text} - Difficulty ${question.difficulty} - ${question.points} points - ${question.status}`}
                  aria-disabled={!isClickable}
                  tabIndex={isClickable ? 0 : -1}
                  onKeyDown={(e) => {
                    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleQuestionClick(topic.id, question);
                    }
                  }}
                >
                  <span>{question.points} pts</span>
                  {question.status === QuestionStatus.ANSWERED && (
                    <span style={{ marginLeft: '8px' }}>✓</span>
                  )}
                  {question.status === QuestionStatus.SKIPPED && (
                    <span style={{ marginLeft: '8px' }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
