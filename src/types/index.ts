/**
 * Core type definitions for the Trivia Game.
 */

/** Status of a question on the game board */
export enum QuestionStatus {
  AVAILABLE = 'AVAILABLE',
  ANSWERED = 'ANSWERED',
  SKIPPED = 'SKIPPED',
}

/** Current phase of the game flow */
export enum GamePhase {
  BOARD_VIEW = 'BOARD_VIEW',
  QUESTION_OPEN = 'QUESTION_OPEN',
  RAPID_FIRE = 'RAPID_FIRE',
  ANSWER_REVEALED = 'ANSWER_REVEALED',
}

/** A single trivia question */
export interface Question {
  id: string;
  text: string;
  answer: string;
  /** Difficulty level from 1 (easiest) to 5 (hardest) */
  difficulty: number;
  /** Points awarded for a correct answer (positive integer) */
  points: number;
  /** Optional per-question timer override in seconds (null uses default) */
  timerSeconds: number | null;
  status: QuestionStatus;
}

/** A topic (category) containing a list of questions */
export interface Topic {
  id: string;
  name: string;
  questions: Question[];
}

/** Configuration for a team before game initialization */
export interface TeamConfig {
  name: string;
}

/** Full game configuration loaded at startup */
export interface GameConfig {
  title: string;
  topics: Topic[];
  teams: TeamConfig[];
  defaultTimerSeconds: number;
}

/** A team participating in the game with live score tracking */
export interface Team {
  id: string;
  name: string;
  score: number;
  questionsAnswered: number;
}

/** Complete runtime state of the game */
export interface GameState {
  config: GameConfig;
  teams: Team[];
  currentTeamId: string;
  activeQuestion: Question | null;
  isRapidFire: boolean;
  isAnswerRevealed: boolean;
  answeredQuestions: Set<string>;
  phase: GamePhase;
}
