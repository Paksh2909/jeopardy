import { useState, useEffect, useCallback, useRef } from 'react';
import { GameStateProvider, useGameState } from './state/GameStateManager';
import { GameBoard } from './components/GameBoard';
import { QuestionOverlay } from './components/QuestionOverlay';
import { HostControlPanel } from './components/HostControlPanel';
import Scoreboard from './components/Scoreboard';
import { useTimer } from './hooks/useTimer';
import { validateGameConfig } from './utils/validation';
import { loadGameState } from './utils/persistence';
import { GameConfig, GamePhase, QuestionStatus } from './types';

/**
 * Sample game configuration for development/demo purposes.
 */
const SAMPLE_CONFIG: GameConfig = {
  title: 'Friday Trivia Night',
  defaultTimerSeconds: 30,
  topics: [
    {
      id: 'science',
      name: 'Science',
      questions: [
        { id: 'sci-1', text: 'What planet is closest to the sun?', answer: 'Mercury', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'sci-2', text: 'What is the chemical symbol for gold?', answer: 'Au', difficulty: 2, points: 200, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'sci-3', text: 'What is the powerhouse of the cell?', answer: 'Mitochondria', difficulty: 3, points: 300, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'sci-4', text: 'What is the speed of light in m/s (approx)?', answer: '299,792,458 m/s', difficulty: 4, points: 400, timerSeconds: 45, status: QuestionStatus.AVAILABLE },
      ],
    },
    {
      id: 'history',
      name: 'History',
      questions: [
        { id: 'his-1', text: 'In what year did World War II end?', answer: '1945', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'his-2', text: 'Who was the first Roman Emperor?', answer: 'Augustus', difficulty: 2, points: 200, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'his-3', text: 'What ancient wonder was located in Alexandria?', answer: 'The Lighthouse (Pharos)', difficulty: 3, points: 300, timerSeconds: null, status: QuestionStatus.AVAILABLE },
      ],
    },
    {
      id: 'pop-culture',
      name: 'Pop Culture',
      questions: [
        { id: 'pop-1', text: 'Who directed the movie Jaws?', answer: 'Steven Spielberg', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'pop-2', text: 'What band recorded "Bohemian Rhapsody"?', answer: 'Queen', difficulty: 2, points: 200, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'pop-3', text: 'In what year was the first iPhone released?', answer: '2007', difficulty: 3, points: 300, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'pop-4', text: 'What is the highest-grossing film of all time (unadjusted)?', answer: 'Avatar', difficulty: 4, points: 400, timerSeconds: 40, status: QuestionStatus.AVAILABLE },
      ],
    },
    {
      id: 'geography',
      name: 'Geography',
      questions: [
        { id: 'geo-1', text: 'What is the largest continent by area?', answer: 'Asia', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'geo-2', text: 'Which country has the most time zones?', answer: 'France', difficulty: 2, points: 200, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'geo-3', text: 'What is the smallest country in the world?', answer: 'Vatican City', difficulty: 2, points: 200, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'geo-4', text: 'What river flows through the most countries?', answer: 'The Danube (10 countries)', difficulty: 4, points: 400, timerSeconds: null, status: QuestionStatus.AVAILABLE },
      ],
    },
    {
      id: 'sports',
      name: 'Sports',
      questions: [
        { id: 'spo-1', text: 'How many players are on a soccer team?', answer: '11', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'spo-2', text: 'In which sport is the term "love" used for zero?', answer: 'Tennis', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'spo-3', text: 'Who holds the record for most Olympic gold medals?', answer: 'Michael Phelps', difficulty: 3, points: 300, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'spo-4', text: 'What country has won the most FIFA World Cups?', answer: 'Brazil (5)', difficulty: 3, points: 300, timerSeconds: null, status: QuestionStatus.AVAILABLE },
      ],
    },
    {
      id: 'food-drink',
      name: 'Food & Drink',
      questions: [
        { id: 'food-1', text: 'What country is the origin of sushi?', answer: 'Japan', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'food-2', text: 'What is the main ingredient in guacamole?', answer: 'Avocado', difficulty: 1, points: 100, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'food-3', text: 'What grain is used to make sake?', answer: 'Rice', difficulty: 2, points: 200, timerSeconds: null, status: QuestionStatus.AVAILABLE },
        { id: 'food-4', text: 'Which spice is the most expensive by weight?', answer: 'Saffron', difficulty: 4, points: 400, timerSeconds: null, status: QuestionStatus.AVAILABLE },
      ],
    },
  ],
  teams: [
    { name: 'Team Alpha' },
    { name: 'Team Beta' },
    { name: 'Team Gamma' },
  ],
};

// --- Styles ---

const appContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#0f0f1a',
  color: '#ffffff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const headerStyles: React.CSSProperties = {
  padding: '16px 24px',
  backgroundColor: '#1a1a2e',
  borderBottom: '1px solid #333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '1.4rem',
  fontWeight: 700,
  color: '#e0e0ff',
};

const mainContentStyles: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
};

const boardAreaStyles: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
};

const sidebarStyles: React.CSSProperties = {
  width: '280px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  borderLeft: '1px solid #333',
  overflowY: 'auto',
  backgroundColor: '#12121f',
  position: 'relative',
  zIndex: 1100,
};

const dialogOverlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const dialogStyles: React.CSSProperties = {
  backgroundColor: '#1e1e2e',
  borderRadius: '12px',
  padding: '32px',
  maxWidth: '400px',
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const dialogTitleStyles: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '1.3rem',
  fontWeight: 700,
  color: '#e0e0ff',
};

const dialogTextStyles: React.CSSProperties = {
  margin: '0 0 24px',
  fontSize: '0.95rem',
  color: '#aaa',
};

const dialogButtonRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
};

const dialogButtonStyles: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const resumeButtonStyles: React.CSSProperties = {
  ...dialogButtonStyles,
  backgroundColor: '#4CAF50',
  color: '#fff',
};

const freshButtonStyles: React.CSSProperties = {
  ...dialogButtonStyles,
  backgroundColor: '#607D8B',
  color: '#fff',
};

const errorContainerStyles: React.CSSProperties = {
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#0f0f1a',
  color: '#fff',
};

const errorTitleStyles: React.CSSProperties = {
  color: '#F44336',
  marginBottom: '16px',
};

const errorListStyles: React.CSSProperties = {
  textAlign: 'left',
  backgroundColor: '#1e1e2e',
  padding: '16px 24px',
  borderRadius: '8px',
  maxWidth: '600px',
  width: '100%',
};

// --- Inner App Content Component ---

function AppContent() {
  const {
    state,
    initializeGame,
    startRapidFire,
    revealAnswer,
    closeQuestion,
    awardFullPoints,
    awardHalfPoints,
    loadSavedGame,
    clearSavedGame,
    dispatch,
  } = useGameState();

  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Track previous phase to detect transitions
  const prevPhaseRef = useRef<GamePhase | null>(null);

  const timer = useTimer();

  // On mount: check for saved state
  useEffect(() => {
    if (initialized) return;

    const savedState = loadGameState();
    if (savedState) {
      setShowResumeDialog(true);
    } else {
      startFreshGame();
    }
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startFreshGame = useCallback(() => {
    // Validate config first
    const validation = validateGameConfig(SAMPLE_CONFIG);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    clearSavedGame();
    try {
      initializeGame(SAMPLE_CONFIG);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setValidationErrors([e.message]);
      }
    }
  }, [clearSavedGame, initializeGame]);

  const handleResume = useCallback(() => {
    setShowResumeDialog(false);
    loadSavedGame();
  }, [loadSavedGame]);

  const handleStartFresh = useCallback(() => {
    setShowResumeDialog(false);
    startFreshGame();
  }, [startFreshGame]);

  // Handle phase transitions for timer management
  useEffect(() => {
    if (!state) return;

    const prevPhase = prevPhaseRef.current;
    const currentPhase = state.phase;

    // Only act on transitions
    if (prevPhase === currentPhase) {
      prevPhaseRef.current = currentPhase;
      return;
    }

    // When transitioning TO QUESTION_OPEN: start the timer
    if (currentPhase === GamePhase.QUESTION_OPEN && prevPhase === null || currentPhase === GamePhase.QUESTION_OPEN && prevPhase === GamePhase.BOARD_VIEW) {
      if (state.activeQuestion) {
        const duration = state.activeQuestion.timerSeconds ?? state.config.defaultTimerSeconds;
        timer.start(duration);
      }
    }

    // When transitioning TO RAPID_FIRE: pause the timer
    if (currentPhase === GamePhase.RAPID_FIRE && prevPhase === GamePhase.QUESTION_OPEN) {
      timer.pause();
    }

    // When transitioning TO BOARD_VIEW from any active phase: reset the timer
    if (currentPhase === GamePhase.BOARD_VIEW && prevPhase !== null && prevPhase !== GamePhase.BOARD_VIEW) {
      timer.reset();
    }

    prevPhaseRef.current = currentPhase;
  }, [state, timer]);

  // Handle set current team via dispatch
  const handleSetCurrentTeam = useCallback((teamId: string) => {
    if (state) {
      dispatch({ type: 'SET_STATE', payload: { ...state, currentTeamId: teamId } });
    }
  }, [state, dispatch]);

  // Show validation errors
  if (validationErrors.length > 0) {
    return (
      <div style={errorContainerStyles}>
        <h1 style={errorTitleStyles}>Configuration Error</h1>
        <p>The game configuration is invalid:</p>
        <ul style={errorListStyles} data-testid="validation-errors">
          {validationErrors.map((error, idx) => (
            <li key={idx} style={{ marginBottom: '8px', color: '#ff8a80' }}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Show resume dialog
  if (showResumeDialog) {
    return (
      <div style={dialogOverlayStyles} data-testid="resume-dialog">
        <div style={dialogStyles}>
          <h2 style={dialogTitleStyles}>Saved Game Found</h2>
          <p style={dialogTextStyles}>
            A previous game was found. Would you like to resume where you left off or start a new game?
          </p>
          <div style={dialogButtonRowStyles}>
            <button
              style={resumeButtonStyles}
              onClick={handleResume}
              data-testid="resume-button"
            >
              Resume Game
            </button>
            <button
              style={freshButtonStyles}
              onClick={handleStartFresh}
              data-testid="start-fresh-button"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for initialization
  if (!state) {
    return <div style={{ padding: '24px', color: '#fff' }}>Loading...</div>;
  }

  const isQuestionActive = state.phase !== GamePhase.BOARD_VIEW;

  return (
    <div style={appContainerStyles}>
      {/* Header */}
      <header style={headerStyles}>
        <h1 style={titleStyles}>{state.config.title}</h1>
      </header>

      {/* Main content area */}
      <div style={mainContentStyles}>
        {/* Board area */}
        <div style={boardAreaStyles}>
          <GameBoard />
        </div>

        {/* Sidebar: Scoreboard + Host Controls */}
        <aside style={sidebarStyles}>
          <Scoreboard teams={state.teams} currentTeamId={state.currentTeamId} />
          <HostControlPanel
            teams={state.teams}
            currentTeamId={state.currentTeamId}
            phase={state.phase}
            isTimerRunning={timer.isRunning}
            onAwardFullPoints={(teamId) => { awardFullPoints(teamId); closeQuestion(); }}
            onAwardHalfPoints={(teamId) => { awardHalfPoints(teamId); closeQuestion(); }}
            onStartRapidFire={startRapidFire}
            onRevealAnswer={revealAnswer}
            onCloseQuestion={closeQuestion}
            onSetCurrentTeam={handleSetCurrentTeam}
            onPauseTimer={timer.pause}
            onResumeTimer={timer.resume}
          />
        </aside>
      </div>

      {/* Question Overlay */}
      {isQuestionActive && state.activeQuestion && (
        <QuestionOverlay
          question={state.activeQuestion}
          remainingTime={timer.remainingTime}
          isExpired={timer.isExpired}
          isRapidFire={state.isRapidFire}
          isAnswerRevealed={state.isAnswerRevealed}
          onClose={closeQuestion}
        />
      )}
    </div>
  );
}

// --- Main App Component with Provider ---

function App() {
  return (
    <GameStateProvider>
      <AppContent />
    </GameStateProvider>
  );
}

export default App;
