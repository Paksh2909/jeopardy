import { useState, useEffect, useCallback, useRef } from 'react';
import { GameStateProvider, useGameState } from './state/GameStateManager';
import { GameBoard } from './components/GameBoard';
import { QuestionOverlay } from './components/QuestionOverlay';
import { HostControlPanel } from './components/HostControlPanel';
import Scoreboard from './components/Scoreboard';
import { TeamSetup } from './components/TeamSetup';
import { TeamPickerPopup } from './components/TeamPickerPopup';
import { RulesPopup } from './components/RulesPopup';
import { useTimer } from './hooks/useTimer';
import { validateGameConfig } from './utils/validation';
import { loadGameState } from './utils/persistence';
import { GameConfig, GamePhase, QuestionStatus } from './types';

/**
 * Sample game configuration for development/demo purposes.
 */
const SAMPLE_CONFIG: GameConfig = {
  title: 'Birthday Game Night Trivia',
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
  backgroundColor: 'transparent',
  color: '#e0e6ef',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const headerStyles: React.CSSProperties = {
  padding: '14px 28px',
  background: 'linear-gradient(90deg, rgba(10,10,18,0.95) 0%, rgba(13,17,23,0.95) 100%)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backdropFilter: 'blur(10px)',
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 800,
  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
  background: 'linear-gradient(135deg, #58a6ff, #3fb8af)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '-0.02em',
};

const mainContentStyles: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
};

const boardAreaStyles: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '8px',
};

const sidebarStyles: React.CSSProperties = {
  width: '290px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  borderLeft: '1px solid rgba(255,255,255,0.06)',
  overflowY: 'auto',
  background: 'rgba(10,10,18,0.7)',
  backdropFilter: 'blur(10px)',
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
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  const [showHalfPointsPicker, setShowHalfPointsPicker] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [round, setRound] = useState(1);
  const [turnIndex, setTurnIndex] = useState(0);
  const [pendingAdvance, setPendingAdvance] = useState(false);

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
      setShowTeamSetup(true);
    }
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGameWithTeams = useCallback((teamNames: string[]) => {
    const config: GameConfig = {
      ...SAMPLE_CONFIG,
      teams: teamNames.map((name) => ({ name })),
    };

    const validation = validateGameConfig(config);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    clearSavedGame();
    try {
      initializeGame(config);
      setShowTeamSetup(false);
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
    setShowTeamSetup(true);
  }, []);

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

    // When transitioning TO ANSWER_REVEALED: stop the timer
    if (currentPhase === GamePhase.ANSWER_REVEALED) {
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

  // Award full points, close question, and flag advance
  const handleAwardFullPoints = useCallback((teamId: string) => {
    awardFullPoints(teamId);
    closeQuestion();
    setPendingAdvance(true);
  }, [awardFullPoints, closeQuestion]);

  // Show half-points team picker popup
  const handleHalfPointsClick = useCallback(() => {
    setShowHalfPointsPicker(true);
  }, []);

  // Award half points to selected team, close, and flag advance
  const handleHalfPointsSelect = useCallback((teamId: string) => {
    awardHalfPoints(teamId);
    closeQuestion();
    setShowHalfPointsPicker(false);
    setPendingAdvance(true);
  }, [awardHalfPoints, closeQuestion]);

  // Close/skip question and flag advance
  const handleCloseQuestion = useCallback(() => {
    closeQuestion();
    setPendingAdvance(true);
  }, [closeQuestion]);

  // Effect: advance to next team once state has settled back to BOARD_VIEW
  useEffect(() => {
    if (!pendingAdvance || !state) return;
    if (state.phase !== GamePhase.BOARD_VIEW) return;

    const teamCount = state.teams.length;
    const nextIndex = (turnIndex + 1) % teamCount;
    const nextTeamId = state.teams[nextIndex].id;

    if (nextIndex === 0) {
      setRound((r) => r + 1);
    }
    setTurnIndex(nextIndex);
    setPendingAdvance(false);
    dispatch({ type: 'SET_STATE', payload: { ...state, currentTeamId: nextTeamId } });
  }, [pendingAdvance, state, turnIndex, dispatch]);

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
  if (showTeamSetup) {
    return (
      <TeamSetup
        initialTeams={['Team Alpha', 'Team Beta', 'Team Gamma']}
        onStart={startGameWithTeams}
      />
    );
  }

  if (!state) {
    return <div style={{ padding: '24px', color: '#fff' }}>Loading...</div>;
  }

  const isQuestionActive = state.phase !== GamePhase.BOARD_VIEW;

  return (
    <div style={appContainerStyles}>
      {/* Header */}
      <header style={headerStyles}>
        <h1 style={titleStyles}>{state.config.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.9rem', color: '#aaa' }}>Round {round}</span>
          <button
            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: '#58a6ff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setShowRules(true)}
            data-testid="rules-button"
          >
            📋 Rules
          </button>
        </div>
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
            onAwardFullPoints={handleAwardFullPoints}
            onAwardHalfPoints={handleHalfPointsClick}
            onStartRapidFire={startRapidFire}
            onRevealAnswer={revealAnswer}
            onCloseQuestion={handleCloseQuestion}
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
          onClose={handleCloseQuestion}
        />
      )}

      {/* Half Points Team Picker Popup */}
      {showHalfPointsPicker && (
        <TeamPickerPopup
          teams={state.teams}
          title="Award Half Points"
          subtitle="Which team answered during rapid fire?"
          onSelect={handleHalfPointsSelect}
          onCancel={() => setShowHalfPointsPicker(false)}
        />
      )}

      {/* Rules Popup */}
      {showRules && (
        <RulesPopup onDismiss={() => setShowRules(false)} />
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
