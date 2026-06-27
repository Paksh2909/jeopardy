import type { GameConfig } from '../types';

/** Result of validating a GameConfig */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a GameConfig object against all game rules.
 *
 * Checks:
 * - Each topic has 1-6 questions
 * - Each question has difficulty 1-5
 * - Each question has positive integer points
 * - All question IDs are unique across topics
 * - Default timer is a positive integer
 * - Team names are non-empty and unique
 */
export function validateGameConfig(config: GameConfig): ValidationResult {
  const errors: string[] = [];

  // Validate default timer is a positive integer
  if (
    !Number.isInteger(config.defaultTimerSeconds) ||
    config.defaultTimerSeconds <= 0
  ) {
    errors.push(
      `defaultTimerSeconds must be a positive integer, got ${config.defaultTimerSeconds}`
    );
  }

  // Validate team names are non-empty and unique
  const teamNames = new Set<string>();
  for (let i = 0; i < config.teams.length; i++) {
    const team = config.teams[i];
    const trimmedName = team.name.trim();
    if (trimmedName.length === 0) {
      errors.push(`teams[${i}].name must be non-empty`);
    } else if (teamNames.has(trimmedName)) {
      errors.push(`teams[${i}].name "${trimmedName}" is a duplicate team name`);
    } else {
      teamNames.add(trimmedName);
    }
  }

  // Validate topics and their questions
  const questionIds = new Set<string>();

  for (let t = 0; t < config.topics.length; t++) {
    const topic = config.topics[t];

    // Each topic must have 1-6 questions
    if (topic.questions.length < 1 || topic.questions.length > 6) {
      errors.push(
        `topics[${t}] ("${topic.name}") must have between 1 and 6 questions, got ${topic.questions.length}`
      );
    }

    for (let q = 0; q < topic.questions.length; q++) {
      const question = topic.questions[q];

      // Difficulty must be between 1 and 5 inclusive
      if (
        !Number.isInteger(question.difficulty) ||
        question.difficulty < 1 ||
        question.difficulty > 5
      ) {
        errors.push(
          `topics[${t}].questions[${q}] (id: "${question.id}") difficulty must be an integer between 1 and 5, got ${question.difficulty}`
        );
      }

      // Points must be a positive integer
      if (!Number.isInteger(question.points) || question.points <= 0) {
        errors.push(
          `topics[${t}].questions[${q}] (id: "${question.id}") points must be a positive integer, got ${question.points}`
        );
      }

      // Question IDs must be unique across all topics
      if (questionIds.has(question.id)) {
        errors.push(
          `topics[${t}].questions[${q}] has duplicate question id "${question.id}"`
        );
      } else {
        questionIds.add(question.id);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
