# Requirements Document

## Introduction

The Trivia Game Website is a host-controlled, whiteboard-style trivia board web application. A single host operator manages the entire game flow through their browser — selecting questions, managing timers, revealing answers, and awarding points to teams. The board displays topics as swimlanes with color-coded sticky-note questions of increasing difficulty. The system requires no user accounts or server-side infrastructure; all state is managed client-side with localStorage persistence.

## Glossary

- **Host**: The single operator who controls all game interactions through the browser interface
- **Board**: The main whiteboard-style view displaying all topics and questions as a visual grid
- **Swimlane**: A vertical column on the board representing a single topic category
- **Sticky_Note**: A visual card element representing a single question, color-coded by difficulty
- **Question_Overlay**: A full-screen modal that expands from a sticky note to display question text, timer, and host controls
- **Timer_Engine**: The component responsible for countdown timing per question
- **Rapid_Fire**: A game mode triggered when the original team cannot answer, allowing other teams to answer for half points
- **Scoreboard**: The component tracking team names and accumulated scores
- **Game_State_Manager**: The central state management component coordinating all game data and phase transitions
- **Game_Phase**: One of BOARD_VIEW, QUESTION_OPEN, RAPID_FIRE, or ANSWER_REVEALED
- **Difficulty**: An integer from 1 (easiest) to 5 (hardest) determining question color and point value
- **Full_Points**: The complete point value awarded when the assigned team answers correctly
- **Half_Points**: Floor of full points divided by 2 (minimum 1), awarded during Rapid_Fire rounds

## Requirements

### Requirement 1: Board Layout and Topic Display

**User Story:** As a host, I want to see all topics and questions organized as a whiteboard with swimlanes, so that I can visually navigate the trivia game and select questions.

#### Acceptance Criteria

1. WHEN the game loads with a valid configuration, THE Board SHALL display each topic as a vertical swimlane column
2. WHEN a topic contains questions, THE Board SHALL render each question as a Sticky_Note within its respective swimlane
3. THE Board SHALL arrange Sticky_Notes within each swimlane in order of increasing difficulty from top to bottom
4. THE Board SHALL apply a distinct background color to each Sticky_Note based on its difficulty level (green for 1, light green for 2, amber for 3, orange for 4, red for 5)
5. WHEN a question has been answered, THE Board SHALL display the corresponding Sticky_Note in a visually distinct answered state
6. WHEN a question has been skipped, THE Board SHALL display the corresponding Sticky_Note in a visually distinct skipped state

### Requirement 2: Question Selection and Overlay

**User Story:** As a host, I want to click a question to expand it into a full-screen overlay, so that all players can clearly see the question text and timer.

#### Acceptance Criteria

1. WHEN the host clicks an available Sticky_Note while the Game_Phase is BOARD_VIEW, THE Game_State_Manager SHALL transition to QUESTION_OPEN phase and display the Question_Overlay
2. WHEN the host clicks an answered or skipped Sticky_Note, THE Board SHALL take no action and maintain the current state
3. WHEN the Question_Overlay opens, THE Question_Overlay SHALL display the question text prominently at readable size
4. WHEN the Question_Overlay is displayed, THE Board SHALL remain visible in the background in a dimmed state
5. WHEN a question is open, THE Game_State_Manager SHALL prevent opening any additional questions until the current question is closed

### Requirement 3: Timer Management

**User Story:** As a host, I want a configurable countdown timer for each question, so that teams have a defined time limit to answer.

#### Acceptance Criteria

1. WHEN a question with a per-question timer override is selected, THE Timer_Engine SHALL start counting down from the question-specific duration in seconds
2. WHEN a question without a per-question timer override is selected, THE Timer_Engine SHALL start counting down from the default timer duration specified in the game configuration
3. WHILE the Timer_Engine is active, THE Timer_Engine SHALL emit a tick event each second with the remaining time
4. WHEN the Timer_Engine reaches zero, THE Timer_Engine SHALL emit an expiry event and display a visual time-expired indicator
5. WHEN the timer expires, THE Game_State_Manager SHALL wait for the host to decide the next action without auto-transitioning
6. WHEN the host pauses the timer, THE Timer_Engine SHALL stop counting down and preserve the remaining time
7. WHEN the host resumes a paused timer, THE Timer_Engine SHALL continue counting down from the preserved remaining time

### Requirement 4: Scoring and Point Awards

**User Story:** As a host, I want to award full or half points to teams, so that correct answers are tracked and rapid-fire rounds are scored appropriately.

#### Acceptance Criteria

1. WHEN the host awards full points to a team, THE Scoreboard SHALL add the question's full point value to that team's score
2. WHEN the host awards half points to a team during Rapid_Fire, THE Scoreboard SHALL add the floor of the question's point value divided by 2 to that team's score
3. WHEN half points are calculated and the result is zero, THE Scoreboard SHALL award a minimum of 1 point
4. WHEN points are awarded to a team, THE Scoreboard SHALL increment that team's questions-answered count by 1
5. WHEN points are awarded, THE Game_State_Manager SHALL mark the question status as ANSWERED
6. THE Scoreboard SHALL maintain a non-negative score for every team at all times

### Requirement 5: Rapid Fire Mode

**User Story:** As a host, I want to trigger a rapid-fire round when the assigned team cannot answer, so that other teams get a chance to earn half points.

#### Acceptance Criteria

1. WHEN the host triggers Rapid_Fire while the Game_Phase is QUESTION_OPEN, THE Game_State_Manager SHALL transition to RAPID_FIRE phase
2. WHEN Rapid_Fire mode is activated, THE Question_Overlay SHALL display a visual rapid-fire indicator
3. WHEN Rapid_Fire is activated and the timer has not expired, THE Timer_Engine SHALL pause the countdown
4. WHILE the Game_Phase is RAPID_FIRE, THE Game_State_Manager SHALL allow the host to select any team for a half-point award
5. IF the host triggers Rapid_Fire while the Game_Phase is not QUESTION_OPEN, THEN THE Game_State_Manager SHALL reject the action and maintain the current state

### Requirement 6: Answer Reveal

**User Story:** As a host, I want to manually reveal the answer at my discretion, so that I control the pacing and dramatic timing of the game.

#### Acceptance Criteria

1. WHEN the host triggers answer reveal while a question is active and the answer has not been revealed, THE Game_State_Manager SHALL transition to ANSWER_REVEALED phase and display the answer text in the Question_Overlay
2. IF the host triggers answer reveal when the answer has already been revealed, THEN THE Game_State_Manager SHALL reject the action and maintain the current state
3. WHEN the answer is revealed, THE Question_Overlay SHALL display the answer text clearly below or alongside the question text

### Requirement 7: Question Close and Board Return

**User Story:** As a host, I want to close the question overlay and return to the board, so that I can proceed with the next question.

#### Acceptance Criteria

1. WHEN the host closes a question, THE Game_State_Manager SHALL transition to BOARD_VIEW phase and dismiss the Question_Overlay
2. WHEN the host closes a question that was never scored, THE Game_State_Manager SHALL mark the question status as SKIPPED
3. WHEN the host closes a question while the timer is still running, THE Timer_Engine SHALL stop and reset the timer
4. WHEN the question is closed, THE Game_State_Manager SHALL clear all active question state including rapid-fire flag and answer-revealed flag

### Requirement 8: Team Management

**User Story:** As a host, I want to manage teams by name and assign the current answering team, so that I can track which team is responding to each question.

#### Acceptance Criteria

1. WHEN the game initializes with a configuration containing team names, THE Scoreboard SHALL create a team entry for each configured team with a score of zero
2. THE Scoreboard SHALL enforce unique non-empty names for all teams
3. WHEN the host sets the current team, THE Scoreboard SHALL update the active team indicator to reflect the selected team
4. THE Scoreboard SHALL display all teams and their current scores in a visible panel during gameplay

### Requirement 9: Game Configuration Validation

**User Story:** As a host, I want the system to validate my game configuration, so that I can be confident the game data is well-formed before starting.

#### Acceptance Criteria

1. WHEN a game configuration is loaded, THE Game_State_Manager SHALL validate that each topic contains between 1 and 6 questions
2. WHEN a game configuration is loaded, THE Game_State_Manager SHALL validate that each question has a difficulty value between 1 and 5 inclusive
3. WHEN a game configuration is loaded, THE Game_State_Manager SHALL validate that each question has a positive integer point value
4. WHEN a game configuration is loaded, THE Game_State_Manager SHALL validate that all question IDs are unique across all topics
5. WHEN a game configuration is loaded, THE Game_State_Manager SHALL validate that the default timer duration is a positive integer
6. IF a game configuration fails validation, THEN THE Game_State_Manager SHALL display a descriptive error message identifying the invalid field

### Requirement 10: State Persistence

**User Story:** As a host, I want the game state to persist in the browser, so that an accidental page refresh does not lose game progress.

#### Acceptance Criteria

1. WHEN any game state change occurs (score update, question status change, phase transition), THE Game_State_Manager SHALL persist the complete game state to localStorage
2. WHEN the application loads and a saved game state exists in localStorage, THE Game_State_Manager SHALL offer the host a choice to resume the saved game or start fresh
3. WHEN the host chooses to resume, THE Game_State_Manager SHALL restore all game state including scores, question statuses, and team data from localStorage
4. WHEN the host chooses to start fresh, THE Game_State_Manager SHALL clear the saved state from localStorage and initialize a new game

### Requirement 11: Game Phase Integrity

**User Story:** As a host, I want the game to enforce valid state transitions, so that the game never enters an inconsistent or broken state.

#### Acceptance Criteria

1. WHILE the Game_Phase is BOARD_VIEW, THE Game_State_Manager SHALL maintain a null active question reference
2. WHILE the Game_Phase is not BOARD_VIEW, THE Game_State_Manager SHALL maintain a non-null active question reference
3. THE Game_State_Manager SHALL allow half-point awards only while the Game_Phase is RAPID_FIRE
4. THE Game_State_Manager SHALL ensure the total number of answered and skipped questions never exceeds the total number of questions in the configuration
5. THE Game_State_Manager SHALL ensure at most one question is in an active state (QUESTION_OPEN or RAPID_FIRE) at any time
