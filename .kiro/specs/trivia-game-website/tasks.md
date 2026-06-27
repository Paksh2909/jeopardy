# Implementation Plan: Trivia Game Website

## Overview

Implement a host-controlled, whiteboard-style trivia board as a single-page React application using TypeScript. The app uses Vite for bundling, Vitest + fast-check for testing, and localStorage for state persistence. All game flow is controlled by a single host operator through the browser.

## Tasks

- [x] 1. Set up project structure and core types
  - [x] 1.1 Initialize Vite + React + TypeScript project
    - Create project with `npm create vite` using React + TypeScript template
    - Install dependencies: react, react-dom, vitest, @testing-library/react, fast-check
    - Configure Vitest in vite.config.ts
    - Set up directory structure: `src/components/`, `src/state/`, `src/types/`, `src/utils/`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 1.2 Define TypeScript types and interfaces
    - Create `src/types/index.ts` with GameConfig, Topic, Question, QuestionStatus, Team, TeamConfig, GameState, and GamePhase types
    - Define QuestionStatus enum: AVAILABLE, ANSWERED, SKIPPED
    - Define GamePhase enum: BOARD_VIEW, QUESTION_OPEN, RAPID_FIRE, ANSWER_REVEALED
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.2_

- [x] 2. Implement game configuration validation
  - [x] 2.1 Create validation module
    - Create `src/utils/validation.ts`
    - Implement `validateGameConfig(config: GameConfig): ValidationResult` that checks:
      - Each topic has 1-6 questions
      - Each question has difficulty 1-5
      - Each question has positive integer points
      - All question IDs are unique across topics
      - Default timer is a positive integer
      - Team names are non-empty and unique
    - Return descriptive error messages identifying invalid fields
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 8.2_

  - [ ]* 2.2 Write property test for configuration validation
    - **Property 19: Configuration validation rejects invalid data**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

  - [ ]* 2.3 Write unit tests for validation edge cases
    - Test boundary values (0 questions, 7 questions, difficulty 0, difficulty 6)
    - Test duplicate question IDs across different topics
    - Test empty team names and duplicate team names
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 8.2_

- [x] 3. Implement Game State Manager
  - [x] 3.1 Create game state manager with React context
    - Create `src/state/GameStateManager.tsx` with React Context and useReducer
    - Implement state initialization from validated GameConfig
    - Initialize teams with score 0 and questionsAnswered 0
    - Set initial phase to BOARD_VIEW with null activeQuestion
    - _Requirements: 8.1, 11.1, 11.2_

  - [x] 3.2 Implement game phase transitions
    - Implement `selectQuestion(topicId, questionId)`: BOARD_VIEW → QUESTION_OPEN
    - Implement `startRapidFire()`: QUESTION_OPEN → RAPID_FIRE
    - Implement `revealAnswer()`: QUESTION_OPEN/RAPID_FIRE → ANSWER_REVEALED
    - Implement `closeQuestion()`: any active phase → BOARD_VIEW
    - Enforce phase-activeQuestion invariant (BOARD_VIEW ↔ null activeQuestion)
    - Reject invalid transitions (e.g., rapid fire when not in QUESTION_OPEN)
    - _Requirements: 2.1, 2.2, 2.5, 5.1, 5.5, 6.1, 6.2, 7.1, 7.4, 11.1, 11.2, 11.3, 11.5_

  - [x] 3.3 Implement scoring actions
    - Implement `awardFullPoints(teamId)`: add question.points to team score
    - Implement `awardHalfPoints(teamId)`: add max(1, floor(points/2)) to team score
    - Increment team.questionsAnswered on any point award
    - Mark question as ANSWERED after point award
    - Restrict half-point awards to RAPID_FIRE phase only
    - Ensure scores remain non-negative
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.4, 11.3_

  - [x] 3.4 Implement question close logic
    - Mark unanswered (AVAILABLE status) questions as SKIPPED on close
    - Clear activeQuestion, isRapidFire, isAnswerRevealed flags
    - Transition phase to BOARD_VIEW
    - Ensure answered + skipped never exceeds total questions
    - _Requirements: 7.1, 7.2, 7.4, 11.4_

  - [ ]* 3.5 Write property tests for game state transitions
    - **Property 3: Selecting an available question transitions to QUESTION_OPEN**
    - **Property 4: Non-available questions cannot be selected**
    - **Property 5: At most one question is active at any time**
    - **Property 13: Rapid fire transition from QUESTION_OPEN**
    - **Property 15: Answer cannot be revealed twice**
    - **Property 16: Close question cleanup**
    - **Property 22: Phase-activeQuestion invariant**
    - **Validates: Requirements 2.1, 2.2, 2.5, 5.1, 5.3, 6.2, 7.1, 7.4, 11.1, 11.2, 11.5**

  - [ ]* 3.6 Write property tests for scoring
    - **Property 9: Full point award correctness**
    - **Property 10: Half point calculation**
    - **Property 11: Point award side effects**
    - **Property 12: Scores are non-negative**
    - **Property 14: Half points only in RAPID_FIRE**
    - **Property 17: Unanswered question becomes SKIPPED on close**
    - **Property 21: Total answered plus skipped never exceeds total questions**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.4, 7.2, 11.3, 11.4**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Timer Engine
  - [x] 5.1 Create timer engine hook
    - Create `src/hooks/useTimer.ts` custom hook
    - Implement `start(durationSeconds)`, `pause()`, `resume()`, `reset()`
    - Use `setInterval` for 1-second tick events
    - Emit expiry event when timer reaches zero
    - Select timer duration: use question.timerSeconds if set, else config.defaultTimerSeconds
    - Do NOT auto-transition game phase on expiry
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 5.2 Write property tests for timer
    - **Property 6: Timer duration selection**
    - **Property 7: Timer pause-resume round trip**
    - **Property 8: Timer expiry does not auto-transition game phase**
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.6, 3.7**

- [x] 6. Implement localStorage persistence
  - [x] 6.1 Create persistence module
    - Create `src/utils/persistence.ts`
    - Implement `saveGameState(state: GameState): void` to persist to localStorage
    - Implement `loadGameState(): GameState | null` to restore from localStorage
    - Implement `clearGameState(): void` to remove saved state
    - Persist on every state change (score update, question status change, phase transition)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 6.2 Integrate persistence with game state manager
    - Call `saveGameState` after every reducer dispatch
    - On app load, check for saved state and offer resume/start-fresh choice
    - Restore all scores, question statuses, and team data on resume
    - Clear localStorage on start-fresh
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 6.3 Write property test for state persistence
    - **Property 20: State persistence round trip**
    - **Validates: Requirements 10.1, 10.3**

  - [ ]* 6.4 Write property test for team initialization
    - **Property 18: Team initialization from config**
    - **Validates: Requirements 8.1, 8.2**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Board UI component
  - [x] 8.1 Create GameBoard component
    - Create `src/components/GameBoard.tsx`
    - Render topics as vertical swimlane columns
    - Render questions as sticky-note cards within each swimlane
    - Arrange sticky notes in order of increasing difficulty (top to bottom)
    - Apply difficulty-based background colors: green (#4CAF50), light green (#8BC34A), amber (#FFC107), orange (#FF9800), red (#F44336)
    - Show visually distinct states for answered and skipped questions
    - Handle click events: only allow selection of AVAILABLE questions in BOARD_VIEW phase
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2_

  - [ ]* 8.2 Write property tests for board rendering logic
    - **Property 1: Questions display in difficulty order**
    - **Property 2: Difficulty color mapping is deterministic**
    - **Validates: Requirements 1.3, 1.4**

- [x] 9. Implement Question Overlay component
  - [x] 9.1 Create QuestionOverlay component
    - Create `src/components/QuestionOverlay.tsx`
    - Display question text prominently at readable size
    - Show countdown timer display
    - Keep board visible in background with dimmed overlay
    - Show rapid-fire indicator when in RAPID_FIRE phase
    - Display answer text when revealed (below or alongside question text)
    - _Requirements: 2.3, 2.4, 5.2, 6.1, 6.3_

  - [x] 9.2 Create HostControlPanel component
    - Create `src/components/HostControlPanel.tsx`
    - Add buttons: Award Full Points, Start Rapid Fire, Award Half Points, Reveal Answer, Skip/Close
    - Enable/disable buttons based on current game phase
    - Add team selection for point awards
    - Add current team selector
    - Pause/resume timer controls
    - _Requirements: 3.6, 3.7, 4.1, 4.2, 5.1, 5.4, 6.1, 7.1, 8.3_

- [x] 10. Implement Team Scoreboard component
  - [x] 10.1 Create Scoreboard component
    - Create `src/components/Scoreboard.tsx`
    - Display all teams with current scores in a visible panel
    - Show active team indicator
    - Update scores reactively on point awards
    - _Requirements: 8.1, 8.3, 8.4_

- [x] 11. Wire components together and implement App shell
  - [x] 11.1 Create App component and integrate all pieces
    - Create `src/App.tsx` integrating GameBoard, QuestionOverlay, HostControlPanel, Scoreboard
    - Wire GameStateManager context provider at root
    - Implement resume/start-fresh dialog on load when saved state exists
    - Show validation errors if config is invalid
    - Connect timer hook to question overlay and game state
    - Stop and reset timer on question close
    - Pause timer on rapid-fire transition
    - _Requirements: 2.4, 3.4, 5.3, 7.3, 9.6, 10.2_

  - [ ]* 11.2 Write integration tests for full game flows
    - Test selecting a question, awarding points, revealing answer, closing
    - Test rapid-fire flow: question open → rapid fire → half points → close
    - Test skip flow: open question → close without scoring → marked SKIPPED
    - Test localStorage persistence and resume
    - _Requirements: 2.1, 4.1, 4.2, 5.1, 7.2, 10.2, 10.3_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The stack is React + TypeScript + Vite + Vitest + fast-check
- All state is client-side with localStorage persistence — no backend needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "5.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "5.2"] },
    { "id": 5, "tasks": ["3.5", "3.6", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["8.1", "9.1", "10.1"] },
    { "id": 8, "tasks": ["8.2", "9.2"] },
    { "id": 9, "tasks": ["11.1"] },
    { "id": 10, "tasks": ["11.2"] }
  ]
}
```
