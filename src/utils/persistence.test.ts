import { describe, it, expect, beforeEach } from 'vitest';
import { saveGameState, loadGameState, clearGameState } from './persistence';
import { GameState, GamePhase, QuestionStatus } from '../types';

function createTestGameState(overrides?: Partial<GameState>): GameState {
  return {
    config: {
      title: 'Test Game',
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
            {
              id: 'q2',
              text: 'What is the speed of light?',
              answer: '299,792,458 m/s',
              difficulty: 3,
              points: 300,
              timerSeconds: 45,
              status: QuestionStatus.ANSWERED,
            },
          ],
        },
      ],
      teams: [{ name: 'Team A' }, { name: 'Team B' }],
      defaultTimerSeconds: 30,
    },
    teams: [
      { id: 'team-1', name: 'Team A', score: 200, questionsAnswered: 1 },
      { id: 'team-2', name: 'Team B', score: 0, questionsAnswered: 0 },
    ],
    currentTeamId: 'team-1',
    activeQuestion: null,
    isRapidFire: false,
    isAnswerRevealed: false,
    answeredQuestions: new Set(['q2']),
    phase: GamePhase.BOARD_VIEW,
    ...overrides,
  };
}

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveGameState', () => {
    it('persists game state to localStorage', () => {
      const state = createTestGameState();
      saveGameState(state);

      const raw = localStorage.getItem('trivia-game-state');
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      expect(parsed.config.title).toBe('Test Game');
      expect(parsed.teams[0].score).toBe(200);
    });

    it('serializes answeredQuestions Set as an array', () => {
      const state = createTestGameState({
        answeredQuestions: new Set(['q1', 'q2', 'q3']),
      });
      saveGameState(state);

      const raw = localStorage.getItem('trivia-game-state');
      const parsed = JSON.parse(raw!);
      expect(Array.isArray(parsed.answeredQuestions)).toBe(true);
      expect(parsed.answeredQuestions).toHaveLength(3);
      expect(parsed.answeredQuestions).toContain('q1');
      expect(parsed.answeredQuestions).toContain('q2');
      expect(parsed.answeredQuestions).toContain('q3');
    });
  });

  describe('loadGameState', () => {
    it('returns null when no saved state exists', () => {
      const result = loadGameState();
      expect(result).toBeNull();
    });

    it('restores game state from localStorage', () => {
      const state = createTestGameState();
      saveGameState(state);

      const loaded = loadGameState();
      expect(loaded).not.toBeNull();
      expect(loaded!.config.title).toBe('Test Game');
      expect(loaded!.teams[0].score).toBe(200);
      expect(loaded!.phase).toBe(GamePhase.BOARD_VIEW);
    });

    it('deserializes answeredQuestions back to a Set', () => {
      const state = createTestGameState({
        answeredQuestions: new Set(['q1', 'q2']),
      });
      saveGameState(state);

      const loaded = loadGameState();
      expect(loaded!.answeredQuestions).toBeInstanceOf(Set);
      expect(loaded!.answeredQuestions.size).toBe(2);
      expect(loaded!.answeredQuestions.has('q1')).toBe(true);
      expect(loaded!.answeredQuestions.has('q2')).toBe(true);
    });

    it('returns null for invalid JSON in localStorage', () => {
      localStorage.setItem('trivia-game-state', 'not valid json{{{');

      const result = loadGameState();
      expect(result).toBeNull();
    });
  });

  describe('clearGameState', () => {
    it('removes saved state from localStorage', () => {
      const state = createTestGameState();
      saveGameState(state);
      expect(localStorage.getItem('trivia-game-state')).not.toBeNull();

      clearGameState();
      expect(localStorage.getItem('trivia-game-state')).toBeNull();
    });

    it('does not throw when no saved state exists', () => {
      expect(() => clearGameState()).not.toThrow();
    });
  });

  describe('round-trip with Set conversion', () => {
    it('preserves an empty Set through save/load', () => {
      const state = createTestGameState({
        answeredQuestions: new Set(),
      });
      saveGameState(state);

      const loaded = loadGameState();
      expect(loaded!.answeredQuestions).toBeInstanceOf(Set);
      expect(loaded!.answeredQuestions.size).toBe(0);
    });

    it('preserves a large Set through save/load', () => {
      const ids = Array.from({ length: 50 }, (_, i) => `q-${i}`);
      const state = createTestGameState({
        answeredQuestions: new Set(ids),
      });
      saveGameState(state);

      const loaded = loadGameState();
      expect(loaded!.answeredQuestions.size).toBe(50);
      ids.forEach((id) => {
        expect(loaded!.answeredQuestions.has(id)).toBe(true);
      });
    });

    it('preserves full game state through round-trip', () => {
      const state = createTestGameState({
        phase: GamePhase.RAPID_FIRE,
        isRapidFire: true,
        currentTeamId: 'team-2',
        answeredQuestions: new Set(['q1', 'q2']),
      });
      saveGameState(state);

      const loaded = loadGameState();
      expect(loaded!.phase).toBe(GamePhase.RAPID_FIRE);
      expect(loaded!.isRapidFire).toBe(true);
      expect(loaded!.currentTeamId).toBe('team-2');
      expect(loaded!.answeredQuestions.has('q1')).toBe(true);
      expect(loaded!.answeredQuestions.has('q2')).toBe(true);
    });
  });
});
