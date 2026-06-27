import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { GameStateProvider, useGameState } from './GameStateManager';
import type { GameConfig } from '../types';
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
          {
            id: 'q2',
            text: 'What is the speed of light?',
            answer: '299,792,458 m/s',
            difficulty: 3,
            points: 300,
            timerSeconds: 45,
            status: QuestionStatus.AVAILABLE,
          },
        ],
      },
    ],
    teams: [{ name: 'Team Alpha' }, { name: 'Team Beta' }],
    ...overrides,
  };
}

describe('Persistence Integration with GameStateManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameStateProvider>{children}</GameStateProvider>
  );

  describe('Auto-save on state change', () => {
    it('saves state to localStorage after initializeGame', async () => {
      const { result } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result.current.initializeGame(config);
      });

      // useEffect runs after render
      const raw = localStorage.getItem('trivia-game-state');
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      expect(parsed.config.title).toBe('Test Trivia');
      expect(parsed.phase).toBe(GamePhase.BOARD_VIEW);
      expect(parsed.teams).toHaveLength(2);
      expect(parsed.teams[0].score).toBe(0);
    });

    it('saves state to localStorage after selectQuestion', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result.current.initializeGame(config);
      });

      act(() => {
        result.current.selectQuestion('topic-1', 'q1');
      });

      const raw = localStorage.getItem('trivia-game-state');
      const parsed = JSON.parse(raw!);
      expect(parsed.phase).toBe(GamePhase.QUESTION_OPEN);
      expect(parsed.activeQuestion).not.toBeNull();
      expect(parsed.activeQuestion.id).toBe('q1');
    });

    it('saves state to localStorage after awardFullPoints', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result.current.initializeGame(config);
      });
      act(() => {
        result.current.selectQuestion('topic-1', 'q1');
      });

      const teamId = result.current.state!.teams[0].id;
      act(() => {
        result.current.awardFullPoints(teamId);
      });

      const raw = localStorage.getItem('trivia-game-state');
      const parsed = JSON.parse(raw!);
      const team = parsed.teams.find((t: any) => t.id === teamId);
      expect(team.score).toBe(100);
      expect(team.questionsAnswered).toBe(1);
    });

    it('saves state to localStorage after closeQuestion', () => {
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

      const raw = localStorage.getItem('trivia-game-state');
      const parsed = JSON.parse(raw!);
      expect(parsed.phase).toBe(GamePhase.BOARD_VIEW);
      expect(parsed.activeQuestion).toBeNull();
      // q1 should be marked as SKIPPED since it wasn't scored
      const q1 = parsed.config.topics[0].questions.find((q: any) => q.id === 'q1');
      expect(q1.status).toBe(QuestionStatus.SKIPPED);
    });

    it('saves state to localStorage after startRapidFire', () => {
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

      const raw = localStorage.getItem('trivia-game-state');
      const parsed = JSON.parse(raw!);
      expect(parsed.phase).toBe(GamePhase.RAPID_FIRE);
      expect(parsed.isRapidFire).toBe(true);
    });

    it('does not save to localStorage when state is null', () => {
      renderHook(() => useGameState(), { wrapper });

      const raw = localStorage.getItem('trivia-game-state');
      expect(raw).toBeNull();
    });
  });

  describe('loadSavedGame', () => {
    it('restores saved state from localStorage into context', () => {
      // First, initialize and save a game
      const { result: result1, unmount } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result1.current.initializeGame(config);
      });

      const teamId = result1.current.state!.teams[0].id;
      act(() => {
        result1.current.selectQuestion('topic-1', 'q1');
      });
      act(() => {
        result1.current.awardFullPoints(teamId);
      });
      act(() => {
        result1.current.closeQuestion();
      });

      unmount();

      // Now create a new provider and load the saved game
      const { result: result2 } = renderHook(() => useGameState(), { wrapper });

      expect(result2.current.state).toBeNull();

      act(() => {
        const loaded = result2.current.loadSavedGame();
        expect(loaded).not.toBeNull();
      });

      // Verify state was restored
      expect(result2.current.state).not.toBeNull();
      expect(result2.current.state!.phase).toBe(GamePhase.BOARD_VIEW);

      const team = result2.current.state!.teams.find((t) => t.id === teamId);
      expect(team!.score).toBe(100);
      expect(team!.questionsAnswered).toBe(1);
    });

    it('restores question statuses from localStorage', () => {
      // Initialize, answer a question, then reload
      const { result: result1, unmount } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result1.current.initializeGame(config);
      });
      act(() => {
        result1.current.selectQuestion('topic-1', 'q1');
      });

      const teamId = result1.current.state!.teams[0].id;
      act(() => {
        result1.current.awardFullPoints(teamId);
      });
      act(() => {
        result1.current.closeQuestion();
      });

      unmount();

      // Load in a new provider
      const { result: result2 } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result2.current.loadSavedGame();
      });

      // q1 should be ANSWERED
      const q1 = result2.current.state!.config.topics[0].questions.find((q) => q.id === 'q1');
      expect(q1!.status).toBe(QuestionStatus.ANSWERED);

      // q2 should still be AVAILABLE
      const q2 = result2.current.state!.config.topics[0].questions.find((q) => q.id === 'q2');
      expect(q2!.status).toBe(QuestionStatus.AVAILABLE);
    });

    it('restores team data from localStorage', () => {
      const { result: result1, unmount } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result1.current.initializeGame(config);
      });
      act(() => {
        result1.current.selectQuestion('topic-1', 'q1');
      });

      const team0Id = result1.current.state!.teams[0].id;
      act(() => {
        result1.current.awardFullPoints(team0Id);
      });
      act(() => {
        result1.current.closeQuestion();
      });

      unmount();

      const { result: result2 } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result2.current.loadSavedGame();
      });

      expect(result2.current.state!.teams[0].score).toBe(100);
      expect(result2.current.state!.teams[0].questionsAnswered).toBe(1);
      expect(result2.current.state!.teams[1].score).toBe(0);
      expect(result2.current.state!.teams[1].questionsAnswered).toBe(0);
    });

    it('returns null when no saved state exists', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      let loaded: any;
      act(() => {
        loaded = result.current.loadSavedGame();
      });

      expect(loaded).toBeNull();
      expect(result.current.state).toBeNull();
    });
  });

  describe('clearSavedGame', () => {
    it('removes saved state from localStorage', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result.current.initializeGame(config);
      });

      // Confirm it was saved
      expect(localStorage.getItem('trivia-game-state')).not.toBeNull();

      act(() => {
        result.current.clearSavedGame();
      });

      expect(localStorage.getItem('trivia-game-state')).toBeNull();
    });

    it('does not throw when no saved state exists', () => {
      const { result } = renderHook(() => useGameState(), { wrapper });

      expect(() => {
        act(() => {
          result.current.clearSavedGame();
        });
      }).not.toThrow();
    });
  });

  describe('Resume vs Start-fresh workflow', () => {
    it('full resume workflow: load saved game restores complete state', () => {
      // Simulate a game in progress
      const { result: result1, unmount } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result1.current.initializeGame(config);
      });

      // Play through some actions
      act(() => {
        result1.current.selectQuestion('topic-1', 'q1');
      });
      const teamId = result1.current.state!.teams[0].id;
      act(() => {
        result1.current.awardFullPoints(teamId);
      });
      act(() => {
        result1.current.closeQuestion();
      });
      act(() => {
        result1.current.selectQuestion('topic-1', 'q2');
      });
      act(() => {
        result1.current.startRapidFire();
      });
      act(() => {
        result1.current.closeQuestion();
      });

      unmount();

      // Simulate app reload - resume
      const { result: result2 } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result2.current.loadSavedGame();
      });

      expect(result2.current.state!.phase).toBe(GamePhase.BOARD_VIEW);
      expect(result2.current.state!.teams[0].score).toBe(100);

      // q1 ANSWERED, q2 SKIPPED
      const q1 = result2.current.state!.config.topics[0].questions.find((q) => q.id === 'q1');
      const q2 = result2.current.state!.config.topics[0].questions.find((q) => q.id === 'q2');
      expect(q1!.status).toBe(QuestionStatus.ANSWERED);
      expect(q2!.status).toBe(QuestionStatus.SKIPPED);
    });

    it('full start-fresh workflow: clear saved state and start new game', () => {
      // Simulate a previous game was saved
      const { result: result1, unmount } = renderHook(() => useGameState(), { wrapper });
      const config = createValidConfig();

      act(() => {
        result1.current.initializeGame(config);
      });
      act(() => {
        result1.current.selectQuestion('topic-1', 'q1');
      });
      const teamId = result1.current.state!.teams[0].id;
      act(() => {
        result1.current.awardFullPoints(teamId);
      });
      act(() => {
        result1.current.closeQuestion();
      });

      unmount();

      // Simulate app reload - user chooses start fresh
      const { result: result2 } = renderHook(() => useGameState(), { wrapper });

      act(() => {
        result2.current.clearSavedGame();
      });

      // Confirm localStorage is cleared
      expect(localStorage.getItem('trivia-game-state')).toBeNull();

      // Initialize a new game
      act(() => {
        result2.current.initializeGame(config);
      });

      // Fresh state
      expect(result2.current.state!.teams[0].score).toBe(0);
      expect(result2.current.state!.teams[0].questionsAnswered).toBe(0);
      const q1 = result2.current.state!.config.topics[0].questions.find((q) => q.id === 'q1');
      expect(q1!.status).toBe(QuestionStatus.AVAILABLE);
    });
  });
});
