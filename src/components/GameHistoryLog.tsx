import React, { useState } from 'react';

export interface HistoryEntry {
  id: number;
  timestamp: string;
  type: 'full_points' | 'half_points' | 'skipped';
  teamName?: string;
  questionText: string;
  category: string;
  points?: number;
  round: number;
}

export interface GameHistoryLogProps {
  entries: HistoryEntry[];
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(10,10,18,0.8)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(8px)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerTitle: {
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#58a6ff',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  chevron: {
    fontSize: '0.8rem',
    color: '#888',
    transition: 'transform 0.2s ease',
  },
  body: {
    maxHeight: '250px',
    overflowY: 'auto',
    padding: '0 12px 12px',
  },
  emptyState: {
    padding: '16px',
    textAlign: 'center',
    color: '#666',
    fontSize: '0.85rem',
  },
  entry: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    padding: '8px 4px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  entryIcon: {
    fontSize: '1rem',
    minWidth: '20px',
    textAlign: 'center',
  },
  entryContent: {
    flex: 1,
    minWidth: 0,
  },
  entryMain: {
    fontSize: '0.82rem',
    color: '#cdd6f4',
    lineHeight: 1.4,
    margin: 0,
  },
  entryMeta: {
    fontSize: '0.72rem',
    color: '#666',
    margin: '2px 0 0',
  },
  pointsBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: '4px',
    marginLeft: '6px',
  },
};

function getIcon(type: HistoryEntry['type']): string {
  switch (type) {
    case 'full_points': return '✅';
    case 'half_points': return '⚡';
    case 'skipped': return '⏭️';
  }
}

function getPointsBadgeStyle(type: HistoryEntry['type']): React.CSSProperties {
  const base = styles.pointsBadge;
  switch (type) {
    case 'full_points':
      return { ...base, backgroundColor: 'rgba(67,160,71,0.2)', color: '#43a047' };
    case 'half_points':
      return { ...base, backgroundColor: 'rgba(249,168,37,0.2)', color: '#f9a825' };
    default:
      return { ...base, backgroundColor: 'rgba(100,100,100,0.2)', color: '#888' };
  }
}

export function GameHistoryLog({ entries }: GameHistoryLogProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={styles.container} data-testid="game-history-log">
      <div
        style={styles.header}
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        aria-expanded={!isCollapsed}
        aria-label="Toggle game history"
      >
        <h3 style={styles.headerTitle}>
          Game Log ({entries.length})
        </h3>
        <span style={{ ...styles.chevron, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </div>

      {!isCollapsed && (
        <div style={styles.body} data-testid="history-entries">
          {entries.length === 0 ? (
            <div style={styles.emptyState}>No actions yet</div>
          ) : (
            [...entries].reverse().map((entry) => (
              <div key={entry.id} style={styles.entry}>
                <span style={styles.entryIcon}>{getIcon(entry.type)}</span>
                <div style={styles.entryContent}>
                  <p style={styles.entryMain}>
                    {entry.type === 'skipped' ? (
                      <>Skipped — <em>{entry.questionText}</em></>
                    ) : (
                      <>
                        <strong>{entry.teamName}</strong> answered <em>{entry.questionText}</em>
                        <span style={getPointsBadgeStyle(entry.type)}>
                          +{entry.points}
                        </span>
                      </>
                    )}
                  </p>
                  <p style={styles.entryMeta}>
                    {entry.category} • Round {entry.round} • {entry.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
