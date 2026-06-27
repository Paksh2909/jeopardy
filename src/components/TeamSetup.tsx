import React, { useState, useCallback } from 'react';

export interface TeamSetupProps {
  initialTeams?: string[];
  onStart: (teamNames: string[]) => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#0f0f1a',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '2rem',
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#e0e0ff',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 24px',
    fontSize: '0.9rem',
    color: '#aaa',
    textAlign: 'center',
  },
  teamList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  teamRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  teamInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #444',
    backgroundColor: '#2a2a3e',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
  },
  teamInputFocused: {
    borderColor: '#89b4fa',
  },
  removeButton: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#F44336',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  addButton: {
    padding: '10px 16px',
    borderRadius: '6px',
    border: '1px dashed #555',
    backgroundColor: 'transparent',
    color: '#89b4fa',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginBottom: '24px',
  },
  startButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  startButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    color: '#ff8a80',
    fontSize: '0.85rem',
    margin: '0 0 12px',
    textAlign: 'center',
  },
  teamNumber: {
    color: '#666',
    fontSize: '0.85rem',
    fontWeight: 600,
    minWidth: '24px',
  },
};

export function TeamSetup({ initialTeams, onStart }: TeamSetupProps) {
  const [teams, setTeams] = useState<string[]>(
    initialTeams && initialTeams.length > 0
      ? [...initialTeams]
      : ['', '', '']
  );
  const [error, setError] = useState('');

  const handleTeamChange = useCallback((index: number, value: string) => {
    setTeams((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
    setError('');
  }, []);

  const handleAddTeam = useCallback(() => {
    if (teams.length >= 8) {
      setError('Maximum 8 teams allowed');
      return;
    }
    setTeams((prev) => [...prev, '']);
  }, [teams.length]);

  const handleRemoveTeam = useCallback((index: number) => {
    if (teams.length <= 2) {
      setError('Minimum 2 teams required');
      return;
    }
    setTeams((prev) => prev.filter((_, i) => i !== index));
    setError('');
  }, [teams.length]);

  const handleStart = useCallback(() => {
    const trimmed = teams.map((t) => t.trim()).filter((t) => t.length > 0);

    if (trimmed.length < 2) {
      setError('Enter at least 2 team names');
      return;
    }

    const uniqueNames = new Set(trimmed.map((n) => n.toLowerCase()));
    if (uniqueNames.size !== trimmed.length) {
      setError('Team names must be unique');
      return;
    }

    setError('');
    onStart(trimmed);
  }, [teams, onStart]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  }, [handleStart]);

  const validTeamCount = teams.filter((t) => t.trim().length > 0).length;
  const canStart = validTeamCount >= 2;

  return (
    <div style={styles.container}>
      <div style={styles.card} onKeyDown={handleKeyDown}>
        <h1 style={styles.title}>Team Setup</h1>
        <p style={styles.subtitle}>
          Add your teams below. You need at least 2 teams to start.
        </p>

        {error && <p style={styles.error} data-testid="team-setup-error">{error}</p>}

        <div style={styles.teamList} data-testid="team-list">
          {teams.map((team, index) => (
            <div key={index} style={styles.teamRow}>
              <span style={styles.teamNumber}>{index + 1}.</span>
              <input
                style={styles.teamInput}
                type="text"
                value={team}
                onChange={(e) => handleTeamChange(index, e.target.value)}
                placeholder={`Team ${index + 1}`}
                aria-label={`Team ${index + 1} name`}
                data-testid={`team-input-${index}`}
                autoFocus={index === 0}
              />
              <button
                style={styles.removeButton}
                onClick={() => handleRemoveTeam(index)}
                aria-label={`Remove team ${index + 1}`}
                data-testid={`remove-team-${index}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          style={styles.addButton}
          onClick={handleAddTeam}
          data-testid="add-team-button"
        >
          + Add Team
        </button>

        <button
          style={{
            ...styles.startButton,
            ...(canStart ? {} : styles.startButtonDisabled),
          }}
          onClick={handleStart}
          disabled={!canStart}
          data-testid="start-game-button"
        >
          Start Game ({validTeamCount} teams)
        </button>
      </div>
    </div>
  );
}
