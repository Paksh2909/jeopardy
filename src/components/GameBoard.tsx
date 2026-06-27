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
    1: '#4CAF50', // Green (easy)
    2: '#8BC34A', // Light green
    3: '#FFC107', // Amber (medium)
    4: '#FF9800', // Orange
    5: '#F44336', // Red (hard)
  };
  return colorMap[difficulty] ?? '#9E9E9E';
}

// --- Styles ---

const boardStyles: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  padding: '24px',
  overflowX: 'auto',
  minHeight: '100%',
};

const swimlaneStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minWidth: '200px',
  flex: '1 1 0',
};

const swimlaneHeaderStyles: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '1.1rem',
  textAlign: 'center',
  padding: '12px 8px',
  backgroundColor: '#263238',
  color: '#ffffff',
  borderRadius: '8px 8px 0 0',
};

function getCardStyles(question: Question, isClickable: boolean): React.CSSProperties {
  const baseColor = getDifficultyColor(question.difficulty);
  const isAnswered = question.status === QuestionStatus.ANSWERED;
  const isSkipped = question.status === QuestionStatus.SKIPPED;

  return {
    padding: '16px 12px',
    borderRadius: '6px',
    backgroundColor: isSkipped ? '#BDBDBD' : baseColor,
    color: isSkipped ? '#757575' : '#ffffff',
    opacity: isAnswered ? 0.5 : 1,
    textDecoration: isAnswered ? 'line-through' : 'none',
    cursor: isClickable ? 'pointer' : 'default',
    fontWeight: 500,
    fontSize: '0.95rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    userSelect: 'none' as const,
    position: 'relative' as const,
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
