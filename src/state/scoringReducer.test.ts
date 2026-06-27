import { describe, it, expect } from 'vitest';
import { scoringReducer, calculateHalfPoints } from './scoringReducer';
import type { GameState, GameConfig } from '../types';
import { GamePhase, QuestionStatus } from '../types';

// --- Test Helpers ---

function createTestConfig(): GameConfig {
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
            timerSeconds: null,
            status: QuestionStatus.AVAILABLE,
          },
        ],
      },
    ],
    teams: [{ name: 'Team Alpha' }, { name: 'Team Beta' }],
  };
}

function createTestState(overrides: Partial<GameState> = {}): GameState {
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

// --- calculateHalfPoints ---

describe('calculateHalfPoints', () => {
  it('returns floor(points / 2) for even point values', () => {
    expect(calculateHalfPoints(100)).toBe(50);
    expect(calculateHalfPoints(200)).toBe(100);
    expect(calculateHalfPoints(400)).toBe(200);
  });

  it('returns floor(points / 2) for odd point values', () => {
    expect(calculateHalfPoints(3)).toBe(1);
    expect(calculateHalfPoints(5)).toBe(2);
    expect(calculateHalfPoints(7)).toBe(3);
    expect(calculateHalfPoints(301)).toBe(150);
  });

  it('returns minimum of 1 when floor(points/2) is 0', () => {
    expect(calculateHalfPoints(1)).toBe(1);
  });

  it('returns 1 for points = 2', () => {
    expect(calculateHalfPoints(2)).toBe(1);
  });
});

// --- AWARD_FULL_POINTS ---

describe('scoringReducer - AWARD_FULL_POINTS', () => {
  it('adds full question points to team score', () => {
    const state = createTestState();
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.teams[0].score).toBe(100);
  });

  it('increments team questionsAnswered by 1', () => {
    const state = createTestState();
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.teams[0].questionsAnswered).toBe(1);
  });

  it('marks the active question as ANSWERED', () => {
    const state = createTestState();
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.activeQuestion!.status).toBe(QuestionStatus.ANSWERED);
  });

  it('adds question id to answeredQuestions set', () => {
    const state = createTestState();
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.answeredQuestions.has('q1')).toBe(true);
  });

  it('updates the question status in config topics', () => {
    const state = createTestState();
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    const q1InConfig = result.config.topics[0].questions[0];
    expect(q1InConfig.status).toBe(QuestionStatus.ANSWERED);
  });

  it('does not modify other teams', () => {
    const state = createTestState();
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.teams[1].score).toBe(0);
    expect(result.teams[1].questionsAnswered).toBe(0);
  });

  it('works in RAPID_FIRE phase', () => {
    const state = createTestState({ phase: GamePhase.RAPID_FIRE, isRapidFire: true });
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-beta-1' },
    });

    expect(result.teams[1].score).toBe(100);
  });

  it('works in ANSWER_REVEALED phase', () => {
    const state = createTestState({ phase: GamePhase.ANSWER_REVEALED, isAnswerRevealed: true });
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.teams[0].score).toBe(100);
  });

  it('rejects action when no active question', () => {
    const state = createTestState({ activeQuestion: null, phase: GamePhase.BOARD_VIEW });
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result).toBe(state);
  });

  it('rejects action in BOARD_VIEW phase', () => {
    const state = createTestState({ phase: GamePhase.BOARD_VIEW, activeQuestion: null });
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result).toBe(state);
  });

  it('rejects action for non-existent team', () => {
    const state = createTestState();
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'non-existent-team' },
    });

    expect(result).toBe(state);
  });

  it('accumulates scores across multiple awards', () => {
    const config = createTestConfig();
    let state = createTestState({
      activeQuestion: config.topics[0].questions[1], // 300 points
    });

    state = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    // Simulate a new question being opened (reset active question)
    state = {
      ...state,
      activeQuestion: { ...config.topics[0].questions[0], status: QuestionStatus.AVAILABLE },
      phase: GamePhase.QUESTION_OPEN,
    };

    state = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(state.teams[0].score).toBe(400); // 300 + 100
    expect(state.teams[0].questionsAnswered).toBe(2);
  });
});

// --- AWARD_HALF_POINTS ---

describe('scoringReducer - AWARD_HALF_POINTS', () => {
  it('adds half points (floor(points/2)) to team score in RAPID_FIRE', () => {
    const state = createTestState({ phase: GamePhase.RAPID_FIRE, isRapidFire: true });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-beta-1' },
    });

    expect(result.teams[1].score).toBe(50); // floor(100 / 2)
  });

  it('awards minimum 1 point when floor(points/2) is 0', () => {
    const config = createTestConfig();
    config.topics[0].questions[0].points = 1;
    const state = createTestState({
      config,
      activeQuestion: config.topics[0].questions[0],
      phase: GamePhase.RAPID_FIRE,
      isRapidFire: true,
    });

    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.teams[0].score).toBe(1);
  });

  it('increments team questionsAnswered by 1', () => {
    const state = createTestState({ phase: GamePhase.RAPID_FIRE, isRapidFire: true });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.teams[0].questionsAnswered).toBe(1);
  });

  it('marks the active question as ANSWERED', () => {
    const state = createTestState({ phase: GamePhase.RAPID_FIRE, isRapidFire: true });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.activeQuestion!.status).toBe(QuestionStatus.ANSWERED);
  });

  it('rejects half points when NOT in RAPID_FIRE phase', () => {
    // QUESTION_OPEN phase
    const state = createTestState({ phase: GamePhase.QUESTION_OPEN });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result).toBe(state);
  });

  it('rejects half points in ANSWER_REVEALED phase', () => {
    const state = createTestState({ phase: GamePhase.ANSWER_REVEALED, isAnswerRevealed: true });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result).toBe(state);
  });

  it('rejects half points in BOARD_VIEW phase', () => {
    const state = createTestState({ phase: GamePhase.BOARD_VIEW, activeQuestion: null });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result).toBe(state);
  });

  it('rejects action for non-existent team', () => {
    const state = createTestState({ phase: GamePhase.RAPID_FIRE, isRapidFire: true });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'does-not-exist' },
    });

    expect(result).toBe(state);
  });

  it('rejects action when no active question', () => {
    const state = createTestState({
      phase: GamePhase.RAPID_FIRE,
      isRapidFire: true,
      activeQuestion: null,
    });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result).toBe(state);
  });

  it('correctly calculates half points for larger values', () => {
    const config = createTestConfig();
    const state = createTestState({
      config,
      activeQuestion: config.topics[0].questions[1], // 300 points
      phase: GamePhase.RAPID_FIRE,
      isRapidFire: true,
    });

    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.teams[0].score).toBe(150); // floor(300 / 2)
  });
});

// --- Score Non-Negativity ---

describe('scoringReducer - score non-negativity', () => {
  it('scores start at 0 and only increase', () => {
    const state = createTestState({ phase: GamePhase.RAPID_FIRE, isRapidFire: true });
    const result = scoringReducer(state, {
      type: 'AWARD_HALF_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    expect(result.teams[0].score).toBeGreaterThanOrEqual(0);
    expect(result.teams[1].score).toBeGreaterThanOrEqual(0);
  });

  it('all team scores remain non-negative after full point award', () => {
    const state = createTestState();
    const result = scoringReducer(state, {
      type: 'AWARD_FULL_POINTS',
      payload: { teamId: 'team-alpha-0' },
    });

    for (const team of result.teams) {
      expect(team.score).toBeGreaterThanOrEqual(0);
    }
  });
});
