import { GameState } from '../types';

const STORAGE_KEY = 'trivia-game-state';

/**
 * Serialized form of GameState for localStorage.
 * Converts Set<string> to string[] since JSON doesn't support Sets.
 */
interface SerializedGameState extends Omit<GameState, 'answeredQuestions'> {
  answeredQuestions: string[];
}

/**
 * Persists the current game state to localStorage.
 * Converts the answeredQuestions Set to an array for JSON serialization.
 */
export function saveGameState(state: GameState): void {
  const serialized: SerializedGameState = {
    ...state,
    answeredQuestions: Array.from(state.answeredQuestions),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

/**
 * Loads a previously saved game state from localStorage.
 * Converts the answeredQuestions array back to a Set.
 * Returns null if no saved state exists or if the stored data is invalid.
 */
export function loadGameState(): GameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: SerializedGameState = JSON.parse(raw);
    const state: GameState = {
      ...parsed,
      answeredQuestions: new Set(parsed.answeredQuestions),
    };
    return state;
  } catch {
    return null;
  }
}

/**
 * Removes saved game state from localStorage.
 */
export function clearGameState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
