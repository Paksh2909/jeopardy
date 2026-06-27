/**
 * Scoring reducer logic for the Trivia Game.
 *
 * Handles AWARD_FULL_POINTS and AWARD_HALF_POINTS actions.
 * Separated from the main GameStateManager to allow parallel development
 * of phase-transition and scoring features.
 */

import type { GameState, Question } from '../types';
import { GamePhase, QuestionStatus } from '../types';

// --- Scoring Action Types ---

export type ScoringAction =
  | { type: 'AWARD_FULL_POINTS'; payload: { teamId: string } }
  | { type: 'AWARD_HALF_POINTS'; payload: { teamId: string } };

// --- Pure Helpers ---

/**
 * Calculates half points: max(1, floor(points / 2))
 * Ensures at least 1 point is always awarded during rapid-fire.
 */
export function calculateHalfPoints(fullPoints: number): number {
  return Math.max(1, Math.floor(fullPoints / 2));
}

// --- Scoring Reducer ---

/**
 * Processes scoring actions against the current game state.
 * Returns the updated state, or the unchanged state if the action is invalid.
 *
 * Invariants enforced:
 * - A question must be active (activeQuestion !== null)
 * - Half points can only be awarded in RAPID_FIRE phase
 * - Full points can be awarded in QUESTION_OPEN, RAPID_FIRE, or ANSWER_REVEALED phase
 * - Scores remain non-negative
 * - Question is marked ANSWERED after any point award
 * - Team's questionsAnswered is incremented
 */
export function scoringReducer(state: GameState, action: ScoringAction): GameState {
  switch (action.type) {
    case 'AWARD_FULL_POINTS': {
      const { teamId } = action.payload;

      // Must have an active question
      if (!state.activeQuestion) {
        return state;
      }

      // Full points allowed in QUESTION_OPEN, RAPID_FIRE, or ANSWER_REVEALED
      if (
        state.phase !== GamePhase.QUESTION_OPEN &&
        state.phase !== GamePhase.RAPID_FIRE &&
        state.phase !== GamePhase.ANSWER_REVEALED
      ) {
        return state;
      }

      // Find the team
      const teamIndex = state.teams.findIndex((t) => t.id === teamId);
      if (teamIndex === -1) {
        return state;
      }

      const pointsToAward = state.activeQuestion.points;
      const updatedTeams = state.teams.map((team, idx) => {
        if (idx === teamIndex) {
          return {
            ...team,
            score: team.score + pointsToAward,
            questionsAnswered: team.questionsAnswered + 1,
          };
        }
        return team;
      });

      // Mark question as answered
      const updatedQuestion: Question = {
        ...state.activeQuestion,
        status: QuestionStatus.ANSWERED,
      };

      // Update answeredQuestions set
      const updatedAnswered = new Set(state.answeredQuestions);
      updatedAnswered.add(state.activeQuestion.id);

      // Update the question in the config topics as well
      const updatedConfig = {
        ...state.config,
        topics: state.config.topics.map((topic) => ({
          ...topic,
          questions: topic.questions.map((q) =>
            q.id === state.activeQuestion!.id
              ? { ...q, status: QuestionStatus.ANSWERED }
              : q
          ),
        })),
      };

      return {
        ...state,
        teams: updatedTeams,
        activeQuestion: updatedQuestion,
        answeredQuestions: updatedAnswered,
        config: updatedConfig,
      };
    }

    case 'AWARD_HALF_POINTS': {
      const { teamId } = action.payload;

      // Must have an active question
      if (!state.activeQuestion) {
        return state;
      }

      // Half points ONLY allowed in RAPID_FIRE phase (Requirement 11.3, 5.4)
      if (state.phase !== GamePhase.RAPID_FIRE) {
        return state;
      }

      // Find the team
      const teamIndex = state.teams.findIndex((t) => t.id === teamId);
      if (teamIndex === -1) {
        return state;
      }

      const pointsToAward = calculateHalfPoints(state.activeQuestion.points);
      const updatedTeams = state.teams.map((team, idx) => {
        if (idx === teamIndex) {
          return {
            ...team,
            score: team.score + pointsToAward,
            questionsAnswered: team.questionsAnswered + 1,
          };
        }
        return team;
      });

      // Mark question as answered
      const updatedQuestion: Question = {
        ...state.activeQuestion,
        status: QuestionStatus.ANSWERED,
      };

      // Update answeredQuestions set
      const updatedAnswered = new Set(state.answeredQuestions);
      updatedAnswered.add(state.activeQuestion.id);

      // Update the question in the config topics as well
      const updatedConfig = {
        ...state.config,
        topics: state.config.topics.map((topic) => ({
          ...topic,
          questions: topic.questions.map((q) =>
            q.id === state.activeQuestion!.id
              ? { ...q, status: QuestionStatus.ANSWERED }
              : q
          ),
        })),
      };

      return {
        ...state,
        teams: updatedTeams,
        activeQuestion: updatedQuestion,
        answeredQuestions: updatedAnswered,
        config: updatedConfig,
      };
    }

    default:
      return state;
  }
}
