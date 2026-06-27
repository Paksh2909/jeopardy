import React from 'react';
import { GamePhase, Team } from '../types';

export interface HostControlPanelProps {
  teams: Team[];
  currentTeamId: string;
  phase: GamePhase;
  isTimerRunning: boolean;
  onAwardFullPoints: (teamId: string) => void;
  onAwardHalfPoints: (teamId: string) => void;
  onStartRapidFire: () => void;
  onRevealAnswer: () => void;
  onCloseQuestion: () => void;
  onSetCurrentTeam: (teamId: string) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#1e1e2e',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  heading: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    borderBottom: '1px solid #444',
    paddingBottom: '8px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#aaa',
    margin: 0,
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  button: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  awardFullBtn: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  awardHalfBtn: {
    backgroundColor: '#FF9800',
    color: '#fff',
  },
  rapidFireBtn: {
    backgroundColor: '#F44336',
    color: '#fff',
  },
  revealBtn: {
    backgroundColor: '#9C27B0',
    color: '#fff',
  },
  closeBtn: {
    backgroundColor: '#607D8B',
    color: '#fff',
  },
  timerBtn: {
    backgroundColor: '#2196F3',
    color: '#fff',
  },
  select: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #555',
    backgroundColor: '#2a2a3e',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export const HostControlPanel: React.FC<HostControlPanelProps> = ({
  teams,
  currentTeamId,
  phase,
  isTimerRunning,
  onAwardFullPoints,
  onAwardHalfPoints,
  onStartRapidFire,
  onRevealAnswer,
  onCloseQuestion,
  onSetCurrentTeam,
  onPauseTimer,
  onResumeTimer,
}) => {
  const isQuestionActive = phase !== GamePhase.BOARD_VIEW;

  // Button enable/disable logic
  const canAwardFullPoints =
    phase === GamePhase.QUESTION_OPEN ||
    phase === GamePhase.RAPID_FIRE ||
    phase === GamePhase.ANSWER_REVEALED;

  const canStartRapidFire = phase === GamePhase.QUESTION_OPEN;

  const canAwardHalfPoints = phase === GamePhase.RAPID_FIRE;

  const canRevealAnswer =
    phase === GamePhase.QUESTION_OPEN || phase === GamePhase.RAPID_FIRE;

  const canClose = isQuestionActive;

  const canPauseTimer = isTimerRunning;

  const canResumeTimer = !isTimerRunning && isQuestionActive;

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSetCurrentTeam(e.target.value);
  };

  return (
    <div style={styles.container} role="region" aria-label="Host Control Panel">
      <h3 style={styles.heading}>Host Controls</h3>

      {/* Team Selection */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>Current Team</p>
        <select
          style={styles.select}
          value={currentTeamId}
          onChange={handleTeamChange}
          aria-label="Select current team"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {/* Point Awards */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>Point Awards</p>
        <div style={styles.buttonRow}>
          <button
            style={{
              ...styles.button,
              ...styles.awardFullBtn,
              ...(canAwardFullPoints ? {} : styles.buttonDisabled),
            }}
            disabled={!canAwardFullPoints}
            onClick={() => onAwardFullPoints(currentTeamId)}
            aria-label="Award full points to current team"
          >
            Award Full Points
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.awardHalfBtn,
              ...(canAwardHalfPoints ? {} : styles.buttonDisabled),
            }}
            disabled={!canAwardHalfPoints}
            onClick={() => onAwardHalfPoints(currentTeamId)}
            aria-label="Award half points to current team"
          >
            Award Half Points
          </button>
        </div>
      </div>

      {/* Game Flow */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>Game Flow</p>
        <div style={styles.buttonRow}>
          <button
            style={{
              ...styles.button,
              ...styles.rapidFireBtn,
              ...(canStartRapidFire ? {} : styles.buttonDisabled),
            }}
            disabled={!canStartRapidFire}
            onClick={onStartRapidFire}
            aria-label="Start rapid fire round"
          >
            Start Rapid Fire
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.revealBtn,
              ...(canRevealAnswer ? {} : styles.buttonDisabled),
            }}
            disabled={!canRevealAnswer}
            onClick={onRevealAnswer}
            aria-label="Reveal answer"
          >
            Reveal Answer
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.closeBtn,
              ...(canClose ? {} : styles.buttonDisabled),
            }}
            disabled={!canClose}
            onClick={onCloseQuestion}
            aria-label="Close or skip current question"
          >
            Skip / Close
          </button>
        </div>
      </div>

      {/* Timer Controls */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>Timer</p>
        <div style={styles.buttonRow}>
          <button
            style={{
              ...styles.button,
              ...styles.timerBtn,
              ...(canPauseTimer ? {} : styles.buttonDisabled),
            }}
            disabled={!canPauseTimer}
            onClick={onPauseTimer}
            aria-label="Pause timer"
          >
            Pause Timer
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.timerBtn,
              ...(canResumeTimer ? {} : styles.buttonDisabled),
            }}
            disabled={!canResumeTimer}
            onClick={onResumeTimer}
            aria-label="Resume timer"
          >
            Resume Timer
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostControlPanel;
