import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuestionOverlay } from './QuestionOverlay';
import { Question, QuestionStatus } from '../types';

const mockQuestion: Question = {
  id: 'q1',
  text: 'What is the capital of France?',
  answer: 'Paris',
  difficulty: 2,
  points: 200,
  timerSeconds: null,
  status: QuestionStatus.AVAILABLE,
};

describe('QuestionOverlay', () => {
  it('displays question text prominently', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={25}
        isExpired={false}
        isRapidFire={false}
        isAnswerRevealed={false}
      />
    );

    expect(screen.getByTestId('question-text')).toHaveTextContent(
      'What is the capital of France?'
    );
  });

  it('shows countdown timer display with remaining time', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={18}
        isExpired={false}
        isRapidFire={false}
        isAnswerRevealed={false}
      />
    );

    expect(screen.getByTestId('timer-display')).toHaveTextContent('18');
  });

  it('applies red color to timer when remaining time is below 10 seconds', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={7}
        isExpired={false}
        isRapidFire={false}
        isAnswerRevealed={false}
      />
    );

    const timer = screen.getByTestId('timer-display');
    expect(timer).toHaveStyle({ color: '#F44336' });
  });

  it('shows white color for timer when remaining time is 10 or more', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={15}
        isExpired={false}
        isRapidFire={false}
        isAnswerRevealed={false}
      />
    );

    const timer = screen.getByTestId('timer-display');
    expect(timer).toHaveStyle({ color: '#ffffff' });
  });

  it('shows TIME\'S UP indicator when timer is expired', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={0}
        isExpired={true}
        isRapidFire={false}
        isAnswerRevealed={false}
      />
    );

    expect(screen.getByTestId('expired-indicator')).toHaveTextContent("TIME'S UP");
    // Timer display still exists in circular timer but shows TIME'S UP text
    const timer = screen.getByTestId('timer-display');
    expect(timer).toHaveTextContent("TIME'S");
  });

  it('shows rapid fire indicator when in RAPID_FIRE phase', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={15}
        isExpired={false}
        isRapidFire={true}
        isAnswerRevealed={false}
      />
    );

    expect(screen.getByTestId('rapid-fire-indicator')).toHaveTextContent(
      '⚡ RAPID FIRE'
    );
  });

  it('does not show rapid fire indicator when not in rapid fire mode', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={15}
        isExpired={false}
        isRapidFire={false}
        isAnswerRevealed={false}
      />
    );

    expect(screen.queryByTestId('rapid-fire-indicator')).not.toBeInTheDocument();
  });

  it('displays answer text when answer is revealed', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={0}
        isExpired={true}
        isRapidFire={false}
        isAnswerRevealed={true}
      />
    );

    expect(screen.getByTestId('answer-text')).toHaveTextContent('Paris');
  });

  it('does not display answer text when answer is not revealed', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={20}
        isExpired={false}
        isRapidFire={false}
        isAnswerRevealed={false}
      />
    );

    expect(screen.queryByTestId('answer-text')).not.toBeInTheDocument();
  });

  it('renders full-screen overlay with semi-transparent background', () => {
    render(
      <QuestionOverlay
        question={mockQuestion}
        remainingTime={20}
        isExpired={false}
        isRapidFire={false}
        isAnswerRevealed={false}
      />
    );

    const overlay = screen.getByTestId('question-overlay');
    expect(overlay).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
    });
  });
});
