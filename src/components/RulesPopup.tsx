import React from 'react';

export interface RulesPopupProps {
  onDismiss: () => void;
}

const RULES = [
  {
    title: 'Team Turns',
    text: 'Teams take turns in order. After each question (whether answered, skipped, or sent to rapid fire), the turn passes to the next team.',
  },
  {
    title: 'Selecting a Question',
    text: 'The current team picks any available question from the board. Questions are color-coded by difficulty: green (easy) to red (hard).',
  },
  {
    title: 'Timer',
    text: 'Each question has a countdown timer. The host can pause/resume. When time runs out, the host decides what happens next.',
  },
  {
    title: 'Awarding Full Points',
    text: 'If the current team answers correctly, they receive the full point value shown on the card.',
  },
  {
    title: 'Rapid Fire',
    text: 'If the current team cannot answer, the host triggers Rapid Fire. Any other team can buzz in for a chance to answer.',
  },
  {
    title: 'Half Points',
    text: 'During Rapid Fire, the team that answers correctly earns half the question\'s point value (minimum 1 point).',
  },
  {
    title: 'Skipping',
    text: 'The host can skip/close a question at any time. Skipped questions cannot be selected again.',
  },
  {
    title: 'Rounds',
    text: 'A round is complete once every team has had one turn. The round counter in the header tracks progress.',
  },
];

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    padding: '2rem',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: '12px',
    padding: '28px 32px',
    maxWidth: '560px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  title: {
    margin: '0 0 20px',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#e0e0ff',
    textAlign: 'center',
  },
  ruleItem: {
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #333',
  },
  ruleItemLast: {
    marginBottom: '0',
    paddingBottom: '0',
    borderBottom: 'none',
  },
  ruleTitle: {
    margin: '0 0 4px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#89b4fa',
  },
  ruleText: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#cdd6f4',
    lineHeight: 1.5,
  },
  dismissButton: {
    display: 'block',
    margin: '24px auto 0',
    padding: '10px 28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export function RulesPopup({ onDismiss }: RulesPopupProps) {
  return (
    <div style={styles.overlay} data-testid="rules-popup">
      <div style={styles.card}>
        <h2 style={styles.title}>📋 Game Rules</h2>
        {RULES.map((rule, idx) => (
          <div
            key={idx}
            style={idx === RULES.length - 1 ? styles.ruleItemLast : styles.ruleItem}
          >
            <h4 style={styles.ruleTitle}>{rule.title}</h4>
            <p style={styles.ruleText}>{rule.text}</p>
          </div>
        ))}
        <button
          style={styles.dismissButton}
          onClick={onDismiss}
          data-testid="rules-dismiss-button"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
