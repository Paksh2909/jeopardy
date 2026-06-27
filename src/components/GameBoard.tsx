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
    1: 'rgba(76, 175, 80, 0.55)',   // Green (easy)
    2: 'rgba(139, 195, 74, 0.5)',   // Light green
    3: 'rgba(255, 193, 7, 0.45)',   // Amber (medium)
    4: 'rgba(255, 152, 0, 0.45)',   // Orange
    5: 'rgba(244, 67, 54, 0.45)',   // Red (hard)
  };
  return colorMap[difficulty] ?? 'rgba(158, 158, 158, 0.35)';
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
    1: 'rgba(76, 175, 80, 0.7)',
    2: 'rgba(139, 195, 74, 0.65)',
    3: 'rgba(255, 193, 7, 0.6)',
    4: 'rgba(255, 152, 0, 0.6)',
    5: 'rgba(244, 67, 54, 0.6)',
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
