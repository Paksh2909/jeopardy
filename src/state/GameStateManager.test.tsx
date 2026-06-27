import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { GameStateProvider, useGameState, slugify, createTeamId, gameReducer } from './GameStateManager';
import type { GameConfig, GameState } from '../types';
import { GamePhase, QuestionStatus } from '../types';

function createValidConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    title: 'Test Trivia',
    defaultTimerSeconds: 30,
    topics: [
      {
        id: 'topic-1',
        name: 'Science',
        questions: [
          {
            id: 'q1',
            text: 'What is H2O?',
            answer: 'Water',
            difficulty: 1,
            points: 100,
            timerSeconds: null,
            status: QuestionStatus.AVAILABLE,
          },
        ],
      },
    ],
    teams: [
      { name: 'Team Alpha' },
      { name: 'Team Beta' },
    ],
    ...overrides,
  };
}

describe('slugify', () => {
  it('converts a name to lowercase kebab-case', () => {
    expect(slugify('Team Alpha')).toBe('team-alpha');
  });

  it('removes special characters', () => {
    expect(slugify('Team #1!')).toBe('team-1');
  });

  it('trims whitespace', () => {
    expect(slugify('  Spaced Out  ')).toBe('spaced-out');
  });

  it('returns empty string for name with no alphanumeric chars', () => {
    expect(slugify('!@#$%')).toBe('');
  });
});

describe('createTeamId', () => {
  it('creates an id from name and index', () => {
    expect(createTeamId('Team Alpha', 0)).toBe('team-alpha-0');
  });

  it('falls back to team-N when slug is empty', () => {
    expect(createTeamId('!!!', 2)).toBe('team-2');
  });
});

describe('gameReducer', () => {
  it('returns null as initial state', () => {
    expect(gameReducer(null, { type: 'SET_STATE' as any, payload: null as any })).toBeNull();
  });

  it('handles INITIALIZE_GAME action', () => {
    const config = createValidConfig();
    const gameState = {
      config,
      teams: [{ id: 'team-alpha-0', name: 'Team Alpha', score: 0, questionsAnswered: 0 }],
      currentTeamId: 'team-alpha-0',
      activeQuestion: null,
      isRapidFire: false,
      isAnswerRevealed: false,
      answeredQuestions: new Set<string>(),
      phase: GamePhase.BOARD_VIEW,
    };

    const result = gameReducer(null, { type: 'INITIALIZE_GAME', payload: gameState });
    expect(result).toEqual(gameState);
  });
});

describe('GameStateProvider + useGameState', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameStateProvider>{children}</GameStateProvider>
  );

  it('provides null state initially', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    expect(result.current.state).toBeNull();
  });

  it('initializes game from valid config', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig();

    let gameState: ReturnType<typeof result.current.initializeGame> = undefined as unknown as ReturnType<typeof result.current.initializeGame>;
    act(() => {
      gameState = result.current.initializeGame(config);
    });

    // Verify returned state
    expect(gameState!.phase).toBe(GamePhase.BOARD_VIEW);
    expect(gameState!.activeQuestion).toBeNull();
    expect(gameState!.isRapidFire).toBe(false);
    expect(gameState!.isAnswerRevealed).toBe(false);
    expect(gameState!.answeredQuestions.size).toBe(0);

    // Verify teams
    expect(gameState!.teams).toHaveLength(2);
    expect(gameState!.teams[0].name).toBe('Team Alpha');
    expect(gameState!.teams[0].score).toBe(0);
    expect(gameState!.teams[0].questionsAnswered).toBe(0);
    expect(gameState!.teams[1].name).toBe('Team Beta');
    expect(gameState!.teams[1].score).toBe(0);
    expect(gameState!.teams[1].questionsAnswered).toBe(0);

    // Verify context state is updated
    expect(result.current.state).toEqual(gameState);
  });

  it('sets currentTeamId to the first team', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig();

    act(() => {
      result.current.initializeGame(config);
    });

    expect(result.current.state!.currentTeamId).toBe(result.current.state!.teams[0].id);
  });

  it('throws an error for invalid config', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const invalidConfig = createValidConfig({ defaultTimerSeconds: -5 });

    expect(() => {
      act(() => {
        result.current.initializeGame(invalidConfig);
      });
    }).toThrow('Invalid game configuration');
  });

  it('creates unique team IDs', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig({
      teams: [
        { name: 'Alpha' },
        { name: 'Beta' },
        { name: 'Gamma' },
      ],
    });

    act(() => {
      result.current.initializeGame(config);
    });

    const ids = result.current.state!.teams.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('stores the config in state', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig();

    act(() => {
      result.current.initializeGame(config);
    });

    expect(result.current.state!.config).toBe(config);
  });
});

describe('useGameState outside provider', () => {
  it('throws if used outside GameStateProvider', () => {
    expect(() => {
      renderHook(() => useGameState());
    }).toThrow('useGameState must be used within a GameStateProvider');
  });
});

// --- Phase Transition Tests ---

function createInitializedState(configOverrides: Partial<GameConfig> = {}): GameState {
  const config = createValidConfig(configOverrides);
  return {
    config,
    teams: [
      { id: 'team-alpha-0', name: 'Team Alpha', score: 0, questionsAnswered: 0 },
      { id: 'team-beta-1', name: 'Team Beta', score: 0, questionsAnswered: 0 },
    ],
    currentTeamId: 'team-alpha-0',
    activeQuestion: null,
    isRapidFire: false,
    isAnswerRevealed: false,
    answeredQuestions: new Set<string>(),
    phase: GamePhase.BOARD_VIEW,
  };
}

describe('SELECT_QUESTION action', () => {
  it('transitions from BOARD_VIEW to QUESTION_OPEN for an available question', () => {
    const state = createInitializedState();
    const result = gameReducer(state, {
      type: 'SELECT_QUESTION',
      payload: { topicId: 'topic-1', questionId: 'q1' },
    });

    expect(result!.phase).toBe(GamePhase.QUESTION_OPEN);
    expect(result!.activeQuestion).not.toBeNull();
    expect(result!.activeQuestion!.id).toBe('q1');
    expect(result!.isRapidFire).toBe(false);
    expect(result!.isAnswerRevealed).toBe(false);
  });

  it('rejects selection when phase is not BOARD_VIEW', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.QUESTION_OPEN,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, {
      type: 'SELECT_QUESTION',
      payload: { topicId: 'topic-1', questionId: 'q1' },
    });

    expect(result).toBe(state); // unchanged
  });

  it('rejects selection of a non-available (ANSWERED) question', () => {
    const config = createValidConfig({
      topics: [{
        id: 'topic-1',
        name: 'Science',
        questions: [{
          id: 'q1', text: 'x', answer: 'y', difficulty: 1,
          points: 100, timerSeconds: null, status: QuestionStatus.ANSWERED,
        }],
      }],
    });
    const state: GameState = { ...createInitializedState(), config };

    const result = gameReducer(state, {
      type: 'SELECT_QUESTION',
      payload: { topicId: 'topic-1', questionId: 'q1' },
    });

    expect(result).toBe(state); // unchanged
  });

  it('rejects selection of a non-available (SKIPPED) question', () => {
    const config = createValidConfig({
      topics: [{
        id: 'topic-1',
        name: 'Science',
        questions: [{
          id: 'q1', text: 'x', answer: 'y', difficulty: 1,
          points: 100, timerSeconds: null, status: QuestionStatus.SKIPPED,
        }],
      }],
    });
    const state: GameState = { ...createInitializedState(), config };

    const result = gameReducer(state, {
      type: 'SELECT_QUESTION',
      payload: { topicId: 'topic-1', questionId: 'q1' },
    });

    expect(result).toBe(state); // unchanged
  });

  it('rejects selection with an invalid topicId', () => {
    const state = createInitializedState();
    const result = gameReducer(state, {
      type: 'SELECT_QUESTION',
      payload: { topicId: 'nonexistent', questionId: 'q1' },
    });

    expect(result).toBe(state);
  });

  it('rejects selection with an invalid questionId', () => {
    const state = createInitializedState();
    const result = gameReducer(state, {
      type: 'SELECT_QUESTION',
      payload: { topicId: 'topic-1', questionId: 'nonexistent' },
    });

    expect(result).toBe(state);
  });

  it('returns state unchanged if state is null', () => {
    const result = gameReducer(null, {
      type: 'SELECT_QUESTION',
      payload: { topicId: 'topic-1', questionId: 'q1' },
    });

    expect(result).toBeNull();
  });
});

describe('START_RAPID_FIRE action', () => {
  it('transitions from QUESTION_OPEN to RAPID_FIRE', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.QUESTION_OPEN,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'START_RAPID_FIRE' });

    expect(result!.phase).toBe(GamePhase.RAPID_FIRE);
    expect(result!.isRapidFire).toBe(true);
    expect(result!.activeQuestion).not.toBeNull();
  });

  it('rejects rapid fire when phase is BOARD_VIEW', () => {
    const state = createInitializedState();
    const result = gameReducer(state, { type: 'START_RAPID_FIRE' });

    expect(result).toBe(state);
  });

  it('rejects rapid fire when phase is RAPID_FIRE (already in rapid fire)', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.RAPID_FIRE,
      isRapidFire: true,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'START_RAPID_FIRE' });

    expect(result).toBe(state);
  });

  it('rejects rapid fire when phase is ANSWER_REVEALED', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.ANSWER_REVEALED,
      isAnswerRevealed: true,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'START_RAPID_FIRE' });

    expect(result).toBe(state);
  });

  it('returns state unchanged if state is null', () => {
    const result = gameReducer(null, { type: 'START_RAPID_FIRE' });
    expect(result).toBeNull();
  });
});

describe('REVEAL_ANSWER action', () => {
  it('transitions from QUESTION_OPEN to ANSWER_REVEALED', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.QUESTION_OPEN,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'REVEAL_ANSWER' });

    expect(result!.phase).toBe(GamePhase.ANSWER_REVEALED);
    expect(result!.isAnswerRevealed).toBe(true);
  });

  it('transitions from RAPID_FIRE to ANSWER_REVEALED', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.RAPID_FIRE,
      isRapidFire: true,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'REVEAL_ANSWER' });

    expect(result!.phase).toBe(GamePhase.ANSWER_REVEALED);
    expect(result!.isAnswerRevealed).toBe(true);
  });

  it('rejects reveal when answer is already revealed', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.ANSWER_REVEALED,
      isAnswerRevealed: true,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'REVEAL_ANSWER' });

    expect(result).toBe(state);
  });

  it('rejects reveal when phase is BOARD_VIEW', () => {
    const state = createInitializedState();
    const result = gameReducer(state, { type: 'REVEAL_ANSWER' });

    expect(result).toBe(state);
  });

  it('returns state unchanged if state is null', () => {
    const result = gameReducer(null, { type: 'REVEAL_ANSWER' });
    expect(result).toBeNull();
  });
});

describe('CLOSE_QUESTION action', () => {
  it('transitions from QUESTION_OPEN to BOARD_VIEW and clears active state', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.QUESTION_OPEN,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

    expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
    expect(result!.activeQuestion).toBeNull();
    expect(result!.isRapidFire).toBe(false);
    expect(result!.isAnswerRevealed).toBe(false);
  });

  it('transitions from RAPID_FIRE to BOARD_VIEW and clears active state', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.RAPID_FIRE,
      isRapidFire: true,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

    expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
    expect(result!.activeQuestion).toBeNull();
    expect(result!.isRapidFire).toBe(false);
    expect(result!.isAnswerRevealed).toBe(false);
  });

  it('transitions from ANSWER_REVEALED to BOARD_VIEW and clears active state', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.ANSWER_REVEALED,
      isAnswerRevealed: true,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

    expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
    expect(result!.activeQuestion).toBeNull();
    expect(result!.isRapidFire).toBe(false);
    expect(result!.isAnswerRevealed).toBe(false);
  });

  it('marks unanswered (AVAILABLE) question as SKIPPED on close', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.QUESTION_OPEN,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

    // The question in config should be marked SKIPPED
    const q = result!.config.topics[0].questions.find((q) => q.id === 'q1');
    expect(q!.status).toBe(QuestionStatus.SKIPPED);
  });

  it('does not change status of an ANSWERED question on close', () => {
    const config = createValidConfig({
      topics: [{
        id: 'topic-1',
        name: 'Science',
        questions: [{
          id: 'q1', text: 'x', answer: 'y', difficulty: 1,
          points: 100, timerSeconds: null, status: QuestionStatus.ANSWERED,
        }],
      }],
    });
    const state: GameState = {
      ...createInitializedState(),
      config,
      phase: GamePhase.QUESTION_OPEN,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.ANSWERED,
      },
    };

    const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

    const q = result!.config.topics[0].questions.find((q) => q.id === 'q1');
    expect(q!.status).toBe(QuestionStatus.ANSWERED);
  });

  it('does nothing when phase is already BOARD_VIEW', () => {
    const state = createInitializedState();
    const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

    expect(result).toBe(state);
  });

  it('returns state unchanged if state is null', () => {
    const result = gameReducer(null, { type: 'CLOSE_QUESTION' });
    expect(result).toBeNull();
  });
});

describe('Phase-activeQuestion invariant', () => {
  it('BOARD_VIEW phase has null activeQuestion after initialization', () => {
    const state = createInitializedState();
    expect(state.phase).toBe(GamePhase.BOARD_VIEW);
    expect(state.activeQuestion).toBeNull();
  });

  it('non-BOARD_VIEW phase has non-null activeQuestion after select', () => {
    const state = createInitializedState();
    const result = gameReducer(state, {
      type: 'SELECT_QUESTION',
      payload: { topicId: 'topic-1', questionId: 'q1' },
    });

    expect(result!.phase).not.toBe(GamePhase.BOARD_VIEW);
    expect(result!.activeQuestion).not.toBeNull();
  });

  it('closeQuestion restores BOARD_VIEW with null activeQuestion', () => {
    const state: GameState = {
      ...createInitializedState(),
      phase: GamePhase.RAPID_FIRE,
      isRapidFire: true,
      activeQuestion: {
        id: 'q1', text: 'x', answer: 'y', difficulty: 1,
        points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE,
      },
    };

    const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

    expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
    expect(result!.activeQuestion).toBeNull();
  });
});

describe('Context dispatch helpers for phase transitions', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameStateProvider>{children}</GameStateProvider>
  );

  it('selectQuestion transitions to QUESTION_OPEN via context', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig();

    act(() => {
      result.current.initializeGame(config);
    });

    act(() => {
      result.current.selectQuestion('topic-1', 'q1');
    });

    expect(result.current.state!.phase).toBe(GamePhase.QUESTION_OPEN);
    expect(result.current.state!.activeQuestion!.id).toBe('q1');
  });

  it('startRapidFire transitions to RAPID_FIRE via context', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig();

    act(() => {
      result.current.initializeGame(config);
    });
    act(() => {
      result.current.selectQuestion('topic-1', 'q1');
    });
    act(() => {
      result.current.startRapidFire();
    });

    expect(result.current.state!.phase).toBe(GamePhase.RAPID_FIRE);
    expect(result.current.state!.isRapidFire).toBe(true);
  });

  it('revealAnswer transitions to ANSWER_REVEALED via context', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig();

    act(() => {
      result.current.initializeGame(config);
    });
    act(() => {
      result.current.selectQuestion('topic-1', 'q1');
    });
    act(() => {
      result.current.revealAnswer();
    });

    expect(result.current.state!.phase).toBe(GamePhase.ANSWER_REVEALED);
    expect(result.current.state!.isAnswerRevealed).toBe(true);
  });

  it('closeQuestion transitions back to BOARD_VIEW via context', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig();

    act(() => {
      result.current.initializeGame(config);
    });
    act(() => {
      result.current.selectQuestion('topic-1', 'q1');
    });
    act(() => {
      result.current.closeQuestion();
    });

    expect(result.current.state!.phase).toBe(GamePhase.BOARD_VIEW);
    expect(result.current.state!.activeQuestion).toBeNull();
    expect(result.current.state!.isRapidFire).toBe(false);
    expect(result.current.state!.isAnswerRevealed).toBe(false);
  });

  it('full flow: select → rapid fire → reveal → close', () => {
    const { result } = renderHook(() => useGameState(), { wrapper });
    const config = createValidConfig();

    act(() => {
      result.current.initializeGame(config);
    });

    // Select question
    act(() => {
      result.current.selectQuestion('topic-1', 'q1');
    });
    expect(result.current.state!.phase).toBe(GamePhase.QUESTION_OPEN);

    // Start rapid fire
    act(() => {
      result.current.startRapidFire();
    });
    expect(result.current.state!.phase).toBe(GamePhase.RAPID_FIRE);

    // Reveal answer
    act(() => {
      result.current.revealAnswer();
    });
    expect(result.current.state!.phase).toBe(GamePhase.ANSWER_REVEALED);

    // Close question
    act(() => {
      result.current.closeQuestion();
    });
    expect(result.current.state!.phase).toBe(GamePhase.BOARD_VIEW);
    expect(result.current.state!.activeQuestion).toBeNull();
  });
});
