import React from 'react';
import { Team } from '../types';

interface ScoreboardProps {
  teams: Team[];
  currentTeamId: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    background: 'rgba(30,30,50,0.7)',
    borderRadius: '12px',
    minWidth: '200px',
    border: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(8px)',
  },
  heading: {
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#58a6ff',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  teamCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(50,50,70,0.5)',
    transition: 'background-color 0.2s, border-color 0.2s',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  teamCardActive: {
    backgroundColor: 'rgba(88,166,255,0.08)',
    border: '1px solid rgba(88,166,255,0.4)',
  },
  teamName: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#cdd6f4',
  },
  teamNameActive: {
    color: '#89b4fa',
    fontWeight: 700,
  },
  teamScore: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#a6e3a1',
    fontVariantNumeric: 'tabular-nums',
  },
  activeIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#89b4fa',
    marginRight: '8px',
    flexShrink: 0,
  },
  teamInfo: {
    display: 'flex',
    alignItems: 'center',
  },
};

/**
 * Scoreboard component displays all teams with their current scores.
 * Highlights the currently active team and updates reactively on score changes.
 *
 * @param teams - List of teams with their scores
 * @param currentTeamId - ID of the currently active team
 */
const Scoreboard: React.FC<ScoreboardProps> = ({ teams, currentTeamId }) => {
  return (
    <div style={styles.container} role="region" aria-label="Scoreboard">
      <h2 style={styles.heading}>Scoreboard</h2>
      {teams.map((team) => {
        const isActive = team.id === currentTeamId;
        return (
          <div
            key={team.id}
            style={{
              ...styles.teamCard,
              ...(isActive ? styles.teamCardActive : {}),
            }}
            aria-current={isActive ? 'true' : undefined}
            data-testid={`team-${team.id}`}
          >
            <div style={styles.teamInfo}>
              {isActive && (
                <span
                  style={styles.activeIndicator}
                  aria-hidden="true"
                  data-testid="active-indicator"
                />
              )}
              <span
                style={{
                  ...styles.teamName,
                  ...(isActive ? styles.teamNameActive : {}),
                }}
              >
                {team.name}
              </span>
            </div>
            <span style={styles.teamScore} aria-label={`${team.name}: ${team.score} points`}>
              {team.score}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Scoreboard;
