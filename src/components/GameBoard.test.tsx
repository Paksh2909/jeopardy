import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameBoard, getDifficultyColor } from './GameBoard';
import { GamePhase, QuestionStatus } from '../types';
import type { GameState } from '../types';

// Mock the useGameState hook
const mockSelectQuestion = vi.fn();

vi.mock('../state/GameStateManager', () => ({
  useGameState: () => mockGameState,
}));

let mockGameState: { state: GameState | null; selectQuestion: typeof mockSelectQuestion };

function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    config: {
      title: 'Test Trivia',
      defaultTimerSeconds: 30,
      topics: [
        {
          id: 'topic-1',
          name: 'Science',
          questions: [
            { id: 'q1', text: 'Easy question', answer: 'A', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
            { id: 'q2', text: 'Hard question', answer: 'B', difficulty: 5, points: 500, timerSeconds: null, status: QuestionStatus.AVAILABLE },
            { id: 'q3', text: 'Medium question', answer: 'C', difficulty: 3, points: 300, timerSeconds: null, status: QuestionStatus.AVAILABLE },
          ],
        },
        {
          id: 'topic-2',
          name: 'History',
          questions: [
            { id: 'q4', text: 'History easy', answer: 'D', difficulty: 2, points: 200, timerSeconds: null, status: QuestionStatus.ANSWERED },
            { id: 'q5', text: 'History hard', answer: 'E', difficulty: 4, points: 400, timerSeconds: null, status: QuestionStatus.SKIPPED },
          ],
        },
      ],
      teams: [{ name: 'Team A' }],
    },
    teams: [{ id: 'team-a-0', name: 'Team A', score: 0, questionsAnswered: 0 }],
    currentTeamId: 'team-a-0',
    activeQuestion: null,
    isRapidFire: false,
    isAnswerRevealed: false,
    answeredQuestions: new Set<string>(),
    phase: GamePhase.BOARD_VIEW,
    ...overrides,
  };
}

describe('getDifficultyColor', () => {
  it('returns green for difficulty 1', () => {
    expect(getDifficultyColor(1)).toBe('rgba(76, 175, 80, 0.35)');
  });

  it('returns light green for difficulty 2', () => {
    expect(getDifficultyColor(2)).toBe('rgba(139, 195, 74, 0.35)');
  });

  it('returns amber for difficulty 3', () => {
    expect(getDifficultyColor(3)).toBe('rgba(255, 193, 7, 0.3)');
  });

  it('returns orange for difficulty 4', () => {
    expect(getDifficultyColor(4)).toBe('rgba(255, 152, 0, 0.3)');
  });

  it('returns red for difficulty 5', () => {
    expect(getDifficultyColor(5)).toBe('rgba(244, 67, 54, 0.3)');
  });

  it('returns grey fallback for unknown difficulty', () => {
    expect(getDifficultyColor(0)).toBe('rgba(158, 158, 158, 0.25)');
    expect(getDifficultyColor(6)).toBe('rgba(158, 158, 158, 0.25)');
  });
});

describe('GameBoard', () => {
  beforeEach(() => {
    mockSelectQuestion.mockClear();
  });

  it('renders nothing loaded when state is null', () => {
    mockGameState = { state: null, selectQuestion: mockSelectQuestion };
    render(<GameBoard />);
    expect(screen.getByText('No game loaded.')).toBeInTheDocument();
  });

  it('renders all topic swimlanes', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('renders questions sorted by difficulty within each swimlane', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const scienceSwimlane = screen.getByTestId('swimlane-topic-1');
    const cards = scienceSwimlane.querySelectorAll('[data-testid^="question-card-"]');

    // Should be sorted: q1 (diff 1), q3 (diff 3), q2 (diff 5)
    expect(cards[0].getAttribute('data-difficulty')).toBe('1');
    expect(cards[1].getAttribute('data-difficulty')).toBe('3');
    expect(cards[2].getAttribute('data-difficulty')).toBe('5');
  });

  it('shows answered questions with reduced opacity and checkmark', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const answeredCard = screen.getByTestId('question-card-q4');
    expect(answeredCard).toHaveStyle({ opacity: '0.4' });
    expect(answeredCard).toHaveStyle({ textDecoration: 'line-through' });
    expect(answeredCard.textContent).toContain('✓');
  });

  it('shows skipped questions greyed out with dash indicator', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const skippedCard = screen.getByTestId('question-card-q5');
    expect(skippedCard).toHaveStyle({ backgroundColor: 'rgba(60,60,70,0.2)' });
    expect(skippedCard.textContent).toContain('—');
  });

  it('calls selectQuestion on available question click in BOARD_VIEW phase', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const availableCard = screen.getByTestId('question-card-q1');
    fireEvent.click(availableCard);

    expect(mockSelectQuestion).toHaveBeenCalledWith('topic-1', 'q1');
  });

  it('does NOT call selectQuestion on answered question click', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const answeredCard = screen.getByTestId('question-card-q4');
    fireEvent.click(answeredCard);

    expect(mockSelectQuestion).not.toHaveBeenCalled();
  });

  it('does NOT call selectQuestion on skipped question click', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const skippedCard = screen.getByTestId('question-card-q5');
    fireEvent.click(skippedCard);

    expect(mockSelectQuestion).not.toHaveBeenCalled();
  });

  it('does NOT call selectQuestion when phase is not BOARD_VIEW', () => {
    const stateWithOpenQuestion = createMockState({
      phase: GamePhase.QUESTION_OPEN,
      activeQuestion: { id: 'q1', text: 'Easy question', answer: 'A', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
    });
    mockGameState = { state: stateWithOpenQuestion, selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const availableCard = screen.getByTestId('question-card-q3');
    fireEvent.click(availableCard);

    expect(mockSelectQuestion).not.toHaveBeenCalled();
  });

  it('makes available questions keyboard-accessible in BOARD_VIEW', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const availableCard = screen.getByTestId('question-card-q1');
    expect(availableCard.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(availableCard, { key: 'Enter' });
    expect(mockSelectQuestion).toHaveBeenCalledWith('topic-1', 'q1');
  });

  it('non-available questions are not keyboard-focusable', () => {
    mockGameState = { state: createMockState(), selectQuestion: mockSelectQuestion };
    render(<GameBoard />);

    const answeredCard = screen.getByTestId('question-card-q4');
    expect(answeredCard.getAttribute('tabindex')).toBe('-1');
  });
});
