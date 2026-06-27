import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { GameConfig, GameState, Question, Team } from '../types';
import { GamePhase, QuestionStatus } from '../types';
import { validateGameConfig } from '../utils/validation';
import { scoringReducer, type ScoringAction } from './scoringReducer';
import { saveGameState, loadGameState, clearGameState } from '../utils/persistence';

/**
 * Slugifies a team name to produce a stable, URL-friendly ID.
 * e.g. "Team Alpha" -> "team-alpha"
 */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Creates a unique team ID from a name, appending an index suffix
 * to guarantee uniqueness even if two names slugify the same way.
 */
function createTeamId(name: string, index: number): string {
  const slug = slugify(name);
  return slug ? `${slug}-${index}` : `team-${index}`;
}

// --- Actions ---

export type GameAction =
  | { type: 'INITIALIZE_GAME'; payload: GameState }
  | { type: 'SET_STATE'; payload: GameState }
  | { type: 'SELECT_QUESTION'; payload: { topicId: string; questionId: string } }
  | { type: 'START_RAPID_FIRE' }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'CLOSE_QUESTION' }
  | ScoringAction;

// --- Helper: find a question by topicId + questionId ---

function findQuestion(state: GameState, topicId: string, questionId: string): Question | null {
  const topic = state.config.topics.find((t) => t.id === topicId);
  if (!topic) return null;
  return topic.questions.find((q) => q.id === questionId) ?? null;
}

// --- Reducer ---

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return action.payload;
    case 'SET_STATE':
      return action.payload;

    case 'SELECT_QUESTION': {
      if (!state) return state;
      if (state.phase !== GamePhase.BOARD_VIEW) return state;

      const { topicId, questionId } = action.payload;
      const question = findQuestion(state, topicId, questionId);
      if (!question) return state;
      if (question.status !== QuestionStatus.AVAILABLE) return state;

      return {
        ...state,
        phase: GamePhase.QUESTION_OPEN,
        activeQuestion: question,
        isRapidFire: false,
        isAnswerRevealed: false,
      };
    }

    case 'START_RAPID_FIRE': {
      if (!state) return state;
      if (state.phase !== GamePhase.QUESTION_OPEN) return state;

      return {
        ...state,
        phase: GamePhase.RAPID_FIRE,
        isRapidFire: true,
      };
    }

    case 'REVEAL_ANSWER': {
      if (!state) return state;
      if (state.phase !== GamePhase.QUESTION_OPEN && state.phase !== GamePhase.RAPID_FIRE) return state;
      if (state.isAnswerRevealed) return state;

      return {
        ...state,
        phase: GamePhase.ANSWER_REVEALED,
        isAnswerRevealed: true,
      };
    }

    case 'CLOSE_QUESTION': {
      if (!state) return state;
      if (state.phase === GamePhase.BOARD_VIEW) return state;
      if (!state.activeQuestion) return state;

      const questionId = state.activeQuestion.id;
      const shouldMarkSkipped = state.activeQuestion.status === QuestionStatus.AVAILABLE;

      // Safety guard: ensure answered + skipped never exceeds total questions
      if (shouldMarkSkipped) {
        const totalQuestions = state.config.topics.reduce(
          (sum, topic) => sum + topic.questions.length,
          0
        );
        const currentAnsweredOrSkipped = state.config.topics.reduce(
          (sum, topic) =>
            sum +
            topic.questions.filter(
              (q) => q.status === QuestionStatus.ANSWERED || q.status === QuestionStatus.SKIPPED
            ).length,
          0
        );
        // If marking this as skipped would exceed total, don't mark it
        if (currentAnsweredOrSkipped >= totalQuestions) {
          return {
            ...state,
            phase: GamePhase.BOARD_VIEW,
            activeQuestion: null,
            isRapidFire: false,
            isAnswerRevealed: false,
          };
        }
      }

      // Mark unanswered question as SKIPPED in the topics array
      let updatedTopics = state.config.topics;
      if (shouldMarkSkipped) {
        updatedTopics = state.config.topics.map((topic) => ({
          ...topic,
          questions: topic.questions.map((q) =>
            q.id === questionId
              ? { ...q, status: QuestionStatus.SKIPPED }
              : q
          ),
        }));
      }

      // Track the question as done in the answeredQuestions set
      const updatedAnsweredQuestions = new Set(state.answeredQuestions);
      updatedAnsweredQuestions.add(questionId);

      return {
        ...state,
        config: { ...state.config, topics: updatedTopics },
        phase: GamePhase.BOARD_VIEW,
        activeQuestion: null,
        isRapidFire: false,
        isAnswerRevealed: false,
        answeredQuestions: updatedAnsweredQuestions,
      };
    }

    case 'AWARD_FULL_POINTS':
    case 'AWARD_HALF_POINTS': {
      if (!state) return state;
      return scoringReducer(state, action);
    }

    default:
      return state;
  }
}

// --- Context ---

interface GameContextValue {
  state: GameState | null;
  dispatch: React.Dispatch<GameAction>;
  initializeGame: (config: GameConfig) => GameState;
  selectQuestion: (topicId: string, questionId: string) => void;
  startRapidFire: () => void;
  revealAnswer: () => void;
  closeQuestion: () => void;
  awardFullPoints: (teamId: string) => void;
  awardHalfPoints: (teamId: string) => void;
  loadSavedGame: () => GameState | null;
  clearSavedGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// --- Provider ---

interface GameStateProviderProps {
  children: React.ReactNode;
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, null);

  // Persist state to localStorage after every state change
  useEffect(() => {
    if (state !== null) {
      saveGameState(state);
    }
  }, [state]);

  const initializeGame = useCallback((config: GameConfig): GameState => {
    const validation = validateGameConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid game configuration:\n${validation.errors.join('\n')}`
      );
    }

    const teams: Team[] = config.teams.map((teamConfig, index) => ({
      id: createTeamId(teamConfig.name, index),
      name: teamConfig.name,
      score: 0,
      questionsAnswered: 0,
    }));

    const initialState: GameState = {
      config,
      teams,
      currentTeamId: teams[0].id,
      activeQuestion: null,
      isRapidFire: false,
      isAnswerRevealed: false,
      answeredQuestions: new Set<string>(),
      phase: GamePhase.BOARD_VIEW,
    };

    dispatch({ type: 'INITIALIZE_GAME', payload: initialState });

    return initialState;
  }, []);

  const loadSavedGame = useCallback((): GameState | null => {
    const savedState = loadGameState();
    if (savedState) {
      dispatch({ type: 'SET_STATE', payload: savedState });
    }
    return savedState;
  }, []);

  const clearSavedGame = useCallback((): void => {
    clearGameState();
  }, []);

  const selectQuestion = useCallback((topicId: string, questionId: string) => {
    dispatch({ type: 'SELECT_QUESTION', payload: { topicId, questionId } });
  }, []);

  const startRapidFire = useCallback(() => {
    dispatch({ type: 'START_RAPID_FIRE' });
  }, []);

  const revealAnswer = useCallback(() => {
    dispatch({ type: 'REVEAL_ANSWER' });
  }, []);

  const closeQuestion = useCallback(() => {
    dispatch({ type: 'CLOSE_QUESTION' });
  }, []);

  const awardFullPoints = useCallback((teamId: string) => {
    dispatch({ type: 'AWARD_FULL_POINTS', payload: { teamId } });
  }, []);

  const awardHalfPoints = useCallback((teamId: string) => {
    dispatch({ type: 'AWARD_HALF_POINTS', payload: { teamId } });
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, initializeGame, selectQuestion, startRapidFire, revealAnswer, closeQuestion, awardFullPoints, awardHalfPoints, loadSavedGame, clearSavedGame }}>
      {children}
    </GameContext.Provider>
  );
}

// --- Hook ---

export function useGameState(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}

// Export helpers for testing
export { slugify, createTeamId, gameReducer, findQuestion };
