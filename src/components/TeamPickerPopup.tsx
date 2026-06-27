import React from 'react';
import { Team } from '../types';

export interface TeamPickerPopupProps {
  teams: Team[];
  title: string;
  subtitle?: string;
  onSelect: (teamId: string) => void;
  onCancel: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: '12px',
    padding: '28px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  title: {
    margin: '0 0 6px',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#e0e0ff',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 20px',
    fontSize: '0.9rem',
    color: '#aaa',
    textAlign: 'center',
  },
  teamList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  teamButton: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #444',
    backgroundColor: '#2a2a3e',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  teamScore: {
    fontSize: '0.85rem',
    color: '#a6e3a1',
    fontWeight: 500,
  },
  cancelButton: {
    padding: '10px 16px',
    borderRadius: '6px',
    border: '1px solid #555',
    backgroundColor: 'transparent',
    color: '#aaa',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
  },
};

export function TeamPickerPopup({ teams, title, subtitle, onSelect, onCancel }: TeamPickerPopupProps) {
  return (
    <div style={styles.overlay} data-testid="team-picker-popup">
      <div style={styles.card}>
        <h3 style={styles.title}>{title}</h3>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}

        <div style={styles.teamList}>
          {teams.map((team) => (
            <button
              key={team.id}
              style={styles.teamButton}
              onClick={() => onSelect(team.id)}
              data-testid={`pick-team-${team.id}`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF9800';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3a3a4e';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#444';
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2a2a3e';
              }}
            >
              <span>{team.name}</span>
              <span style={styles.teamScore}>{team.score} pts</span>
            </button>
          ))}
        </div>

        <button
          style={styles.cancelButton}
          onClick={onCancel}
          data-testid="team-picker-cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
