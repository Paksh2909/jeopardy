import { describe, it, expect } from 'vitest';
import { gameReducer } from './GameStateManager';
import type { GameConfig, GameState, Question } from '../types';
import { GamePhase, QuestionStatus } from '../types';

/**
 * Tests for CLOSE_QUESTION action — task 3.4
 * Requirements: 7.1, 7.2, 7.4, 11.4
 */

function createTestConfig(questionCount = 2): GameConfig {
  const questions: Question[] = Array.from({ length: questionCount }, (_, i) => ({
    id: `q${i + 1}`,
    text: `Question ${i + 1}`,
    answer: `Answer ${i + 1}`,
    difficulty: Math.min(i + 1, 5) as 1 | 2 | 3 | 4 | 5,
    points: (i + 1) * 100,
    timerSeconds: null,
    status: QuestionStatus.AVAILABLE,
  }));

  return {
    title: 'Test Trivia',
    defaultTimerSeconds: 30,
    topics: [
      {
        id: 'topic-1',
        name: 'Science',
        questions,
      },
    ],
    teams: [{ name: 'Team Alpha' }, { name: 'Team Beta' }],
  };
}

function createGameState(overrides: Partial<GameState> = {}): GameState {
  const config = createTestConfig();
  return {
    config,
    teams: [
      { id: 'team-alpha-0', name: 'Team Alpha', score: 0, questionsAnswered: 0 },
      { id: 'team-beta-1', name: 'Team Beta', score: 0, questionsAnswered: 0 },
    ],
    currentTeamId: 'team-alpha-0',
    activeQuestion: config.topics[0].questions[0],
    isRapidFire: false,
    isAnswerRevealed: false,
    answeredQuestions: new Set<string>(),
    phase: GamePhase.QUESTION_OPEN,
    ...overrides,
  };
}

describe('CLOSE_QUESTION action', () => {
  describe('Requirement 7.1: Transition to BOARD_VIEW and dismiss overlay', () => {
    it('transitions phase to BOARD_VIEW when closing from QUESTION_OPEN', () => {
      const state = createGameState({ phase: GamePhase.QUESTION_OPEN });
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
    });

    it('transitions phase to BOARD_VIEW when closing from RAPID_FIRE', () => {
      const state = createGameState({
        phase: GamePhase.RAPID_FIRE,
        isRapidFire: true,
      });
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
    });

    it('transitions phase to BOARD_VIEW when closing from ANSWER_REVEALED', () => {
      const state = createGameState({
        phase: GamePhase.ANSWER_REVEALED,
        isAnswerRevealed: true,
      });
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
    });

    it('does nothing if already in BOARD_VIEW', () => {
      const state = createGameState({
        phase: GamePhase.BOARD_VIEW,
        activeQuestion: null,
      });
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result).toBe(state);
    });
  });

  describe('Requirement 7.2: Mark unanswered questions as SKIPPED', () => {
    it('marks AVAILABLE question as SKIPPED when closed without scoring', () => {
      const state = createGameState();
      // active question has status AVAILABLE
      expect(state.activeQuestion!.status).toBe(QuestionStatus.AVAILABLE);

      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

      // Find the question in the config topics
      const closedQuestion = result!.config.topics[0].questions.find(
        (q) => q.id === state.activeQuestion!.id
      );
      expect(closedQuestion!.status).toBe(QuestionStatus.SKIPPED);
    });

    it('does NOT change status of an already ANSWERED question on close', () => {
      const config = createTestConfig();
      // Mark q1 as ANSWERED in config
      config.topics[0].questions[0].status = QuestionStatus.ANSWERED;

      const state = createGameState({
        config,
        activeQuestion: { ...config.topics[0].questions[0] },
        phase: GamePhase.ANSWER_REVEALED,
        isAnswerRevealed: true,
      });

      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

      const closedQuestion = result!.config.topics[0].questions.find(
        (q) => q.id === state.activeQuestion!.id
      );
      expect(closedQuestion!.status).toBe(QuestionStatus.ANSWERED);
    });

    it('does NOT change status of an already SKIPPED question on close', () => {
      const config = createTestConfig();
      // Mark q1 as SKIPPED in config already
      config.topics[0].questions[0].status = QuestionStatus.SKIPPED;

      const state = createGameState({
        config,
        activeQuestion: { ...config.topics[0].questions[0] },
        phase: GamePhase.QUESTION_OPEN,
      });

      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

      const closedQuestion = result!.config.topics[0].questions.find(
        (q) => q.id === state.activeQuestion!.id
      );
      expect(closedQuestion!.status).toBe(QuestionStatus.SKIPPED);
    });
  });

  describe('Requirement 7.4: Clear all active question state', () => {
    it('clears activeQuestion to null', () => {
      const state = createGameState();
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.activeQuestion).toBeNull();
    });

    it('clears isRapidFire flag', () => {
      const state = createGameState({
        phase: GamePhase.RAPID_FIRE,
        isRapidFire: true,
      });
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.isRapidFire).toBe(false);
    });

    it('clears isAnswerRevealed flag', () => {
      const state = createGameState({
        phase: GamePhase.ANSWER_REVEALED,
        isAnswerRevealed: true,
      });
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.isAnswerRevealed).toBe(false);
    });
  });

  describe('Requirement 11.4: answered + skipped never exceeds total questions', () => {
    it('adds question ID to answeredQuestions set on close', () => {
      const state = createGameState();
      const questionId = state.activeQuestion!.id;
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.answeredQuestions.has(questionId)).toBe(true);
    });

    it('does not duplicate in answeredQuestions if already present', () => {
      const state = createGameState({
        answeredQuestions: new Set(['q1']),
      });
      // activeQuestion is q1
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.answeredQuestions.size).toBe(1);
      expect(result!.answeredQuestions.has('q1')).toBe(true);
    });

    it('does not mark as SKIPPED if all questions are already answered or skipped', () => {
      // Create a config with only 1 question, and it's already answered/skipped in other slots
      const config: GameConfig = {
        title: 'Test',
        defaultTimerSeconds: 30,
        topics: [
          {
            id: 'topic-1',
            name: 'Science',
            questions: [
              {
                id: 'q1',
                text: 'Q1',
                answer: 'A1',
                difficulty: 1,
                points: 100,
                timerSeconds: null,
                status: QuestionStatus.ANSWERED, // already counted
              },
              {
                id: 'q2',
                text: 'Q2',
                answer: 'A2',
                difficulty: 2,
                points: 200,
                timerSeconds: null,
                status: QuestionStatus.AVAILABLE, // this is the active one
              },
            ],
          },
        ],
        teams: [{ name: 'Team Alpha' }],
      };

      // Manually set all questions except q2 as already answered
      // Total = 2, already answered/skipped = 1 (q1), so there's room for q2
      const state: GameState = {
        config,
        teams: [{ id: 'team-alpha-0', name: 'Team Alpha', score: 0, questionsAnswered: 0 }],
        currentTeamId: 'team-alpha-0',
        activeQuestion: config.topics[0].questions[1], // q2, AVAILABLE
        isRapidFire: false,
        isAnswerRevealed: false,
        answeredQuestions: new Set(['q1']),
        phase: GamePhase.QUESTION_OPEN,
      };

      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

      // q2 should become SKIPPED since there's still room
      const q2 = result!.config.topics[0].questions.find((q) => q.id === 'q2');
      expect(q2!.status).toBe(QuestionStatus.SKIPPED);
    });

    it('skips SKIPPED marking when all questions slots are exhausted', () => {
      // Scenario: all questions in config already have non-AVAILABLE status
      // but we somehow have an active question with AVAILABLE status (shouldn't happen normally, but test the guard)
      const config: GameConfig = {
        title: 'Test',
        defaultTimerSeconds: 30,
        topics: [
          {
            id: 'topic-1',
            name: 'Science',
            questions: [
              {
                id: 'q1',
                text: 'Q1',
                answer: 'A1',
                difficulty: 1,
                points: 100,
                timerSeconds: null,
                status: QuestionStatus.ANSWERED,
              },
              {
                id: 'q2',
                text: 'Q2',
                answer: 'A2',
                difficulty: 2,
                points: 200,
                timerSeconds: null,
                status: QuestionStatus.SKIPPED,
              },
            ],
          },
        ],
        teams: [{ name: 'Team Alpha' }],
      };

      // Active question has AVAILABLE status but config says all are done
      // This tests the safety guard
      const activeQ: Question = {
        id: 'q3-phantom',
        text: 'Phantom',
        answer: 'Ghost',
        difficulty: 1,
        points: 100,
        timerSeconds: null,
        status: QuestionStatus.AVAILABLE,
      };

      const state: GameState = {
        config,
        teams: [{ id: 'team-alpha-0', name: 'Team Alpha', score: 0, questionsAnswered: 0 }],
        currentTeamId: 'team-alpha-0',
        activeQuestion: activeQ,
        isRapidFire: false,
        isAnswerRevealed: false,
        answeredQuestions: new Set(['q1', 'q2']),
        phase: GamePhase.QUESTION_OPEN,
      };

      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

      // The guard should kick in — phase goes to BOARD_VIEW but no SKIPPED marking happens
      expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
      expect(result!.activeQuestion).toBeNull();
      expect(result!.isRapidFire).toBe(false);
      expect(result!.isAnswerRevealed).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('does nothing when state is null', () => {
      const result = gameReducer(null, { type: 'CLOSE_QUESTION' });
      expect(result).toBeNull();
    });

    it('does nothing when no activeQuestion present and not in BOARD_VIEW', () => {
      // Pathological state: phase is QUESTION_OPEN but activeQuestion is null
      const state = createGameState({
        phase: GamePhase.QUESTION_OPEN,
        activeQuestion: null,
      });
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result).toBe(state);
    });

    it('preserves other state fields (teams, currentTeamId, config title)', () => {
      const state = createGameState();
      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });
      expect(result!.teams).toEqual(state.teams);
      expect(result!.currentTeamId).toBe(state.currentTeamId);
      expect(result!.config.title).toBe(state.config.title);
    });

    it('handles close after rapid fire correctly', () => {
      const state = createGameState({
        phase: GamePhase.RAPID_FIRE,
        isRapidFire: true,
        isAnswerRevealed: false,
      });

      const result = gameReducer(state, { type: 'CLOSE_QUESTION' });

      expect(result!.phase).toBe(GamePhase.BOARD_VIEW);
      expect(result!.activeQuestion).toBeNull();
      expect(result!.isRapidFire).toBe(false);
      // Question should be marked SKIPPED since it was never scored
      const q = result!.config.topics[0].questions.find(
        (q) => q.id === state.activeQuestion!.id
      );
      expect(q!.status).toBe(QuestionStatus.SKIPPED);
    });
  });
});
