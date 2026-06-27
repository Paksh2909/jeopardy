import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HostControlPanel, HostControlPanelProps } from './HostControlPanel';
import { GamePhase, Team } from '../types';

const mockTeams: Team[] = [
  { id: 'team-1', name: 'Team Alpha', score: 100, questionsAnswered: 2 },
  { id: 'team-2', name: 'Team Beta', score: 50, questionsAnswered: 1 },
  { id: 'team-3', name: 'Team Gamma', score: 0, questionsAnswered: 0 },
];

function createProps(overrides?: Partial<HostControlPanelProps>): HostControlPanelProps {
  return {
    teams: mockTeams,
    currentTeamId: 'team-1',
    phase: GamePhase.BOARD_VIEW,
    isTimerRunning: false,
    onAwardFullPoints: vi.fn(),
    onAwardHalfPoints: vi.fn(),
    onStartRapidFire: vi.fn(),
    onRevealAnswer: vi.fn(),
    onCloseQuestion: vi.fn(),
    onSetCurrentTeam: vi.fn(),
    onPauseTimer: vi.fn(),
    onResumeTimer: vi.fn(),
    ...overrides,
  };
}

describe('HostControlPanel', () => {
  describe('rendering', () => {
    it('renders all control buttons', () => {
      render(<HostControlPanel {...createProps()} />);

      expect(screen.getByRole('button', { name: /award full points/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /award half points/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start rapid fire/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reveal answer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close or skip/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume timer/i })).toBeInTheDocument();
    });

    it('renders team selector with all teams', () => {
      render(<HostControlPanel {...createProps()} />);

      const select = screen.getByLabelText(/select current team/i);
      expect(select).toBeInTheDocument();

      mockTeams.forEach((team) => {
        expect(screen.getByRole('option', { name: team.name })).toBeInTheDocument();
      });
    });

    it('shows the current team as selected', () => {
      render(<HostControlPanel {...createProps({ currentTeamId: 'team-2' })} />);

      const select = screen.getByLabelText(/select current team/i) as HTMLSelectElement;
      expect(select.value).toBe('team-2');
    });
  });

  describe('button enable/disable in BOARD_VIEW', () => {
    it('disables all action buttons in BOARD_VIEW', () => {
      render(<HostControlPanel {...createProps({ phase: GamePhase.BOARD_VIEW })} />);

      expect(screen.getByRole('button', { name: /award full points/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /award half points/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /start rapid fire/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /reveal answer/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /close or skip/i })).toBeDisabled();
    });
  });

  describe('button enable/disable in QUESTION_OPEN', () => {
    it('enables Award Full Points, Start Rapid Fire, Reveal Answer, and Close', () => {
      render(<HostControlPanel {...createProps({ phase: GamePhase.QUESTION_OPEN })} />);

      expect(screen.getByRole('button', { name: /award full points/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /start rapid fire/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /reveal answer/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /close or skip/i })).toBeEnabled();
    });

    it('disables Award Half Points in QUESTION_OPEN', () => {
      render(<HostControlPanel {...createProps({ phase: GamePhase.QUESTION_OPEN })} />);

      expect(screen.getByRole('button', { name: /award half points/i })).toBeDisabled();
    });
  });

  describe('button enable/disable in RAPID_FIRE', () => {
    it('enables Award Full Points, Award Half Points, Reveal Answer, and Close', () => {
      render(<HostControlPanel {...createProps({ phase: GamePhase.RAPID_FIRE })} />);

      expect(screen.getByRole('button', { name: /award full points/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /award half points/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /reveal answer/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /close or skip/i })).toBeEnabled();
    });

    it('disables Start Rapid Fire in RAPID_FIRE phase', () => {
      render(<HostControlPanel {...createProps({ phase: GamePhase.RAPID_FIRE })} />);

      expect(screen.getByRole('button', { name: /start rapid fire/i })).toBeDisabled();
    });
  });

  describe('button enable/disable in ANSWER_REVEALED', () => {
    it('enables Award Full Points and Close', () => {
      render(<HostControlPanel {...createProps({ phase: GamePhase.ANSWER_REVEALED })} />);

      expect(screen.getByRole('button', { name: /award full points/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /close or skip/i })).toBeEnabled();
    });

    it('disables Start Rapid Fire, Award Half Points, and Reveal Answer', () => {
      render(<HostControlPanel {...createProps({ phase: GamePhase.ANSWER_REVEALED })} />);

      expect(screen.getByRole('button', { name: /start rapid fire/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /award half points/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /reveal answer/i })).toBeDisabled();
    });
  });

  describe('timer controls', () => {
    it('enables Pause Timer when timer is running', () => {
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.QUESTION_OPEN, isTimerRunning: true })}
        />
      );

      expect(screen.getByRole('button', { name: /pause timer/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /resume timer/i })).toBeDisabled();
    });

    it('enables Resume Timer when timer is paused and question is active', () => {
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.QUESTION_OPEN, isTimerRunning: false })}
        />
      );

      expect(screen.getByRole('button', { name: /pause timer/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /resume timer/i })).toBeEnabled();
    });

    it('disables both timer buttons in BOARD_VIEW', () => {
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.BOARD_VIEW, isTimerRunning: false })}
        />
      );

      expect(screen.getByRole('button', { name: /pause timer/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /resume timer/i })).toBeDisabled();
    });
  });

  describe('interactions', () => {
    it('calls onAwardFullPoints with currentTeamId when clicked', () => {
      const onAwardFullPoints = vi.fn();
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.QUESTION_OPEN, onAwardFullPoints })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /award full points/i }));
      expect(onAwardFullPoints).toHaveBeenCalledWith('team-1');
    });

    it('calls onAwardHalfPoints with currentTeamId when clicked', () => {
      const onAwardHalfPoints = vi.fn();
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.RAPID_FIRE, onAwardHalfPoints })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /award half points/i }));
      expect(onAwardHalfPoints).toHaveBeenCalledWith('team-1');
    });

    it('calls onStartRapidFire when clicked', () => {
      const onStartRapidFire = vi.fn();
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.QUESTION_OPEN, onStartRapidFire })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /start rapid fire/i }));
      expect(onStartRapidFire).toHaveBeenCalled();
    });

    it('calls onRevealAnswer when clicked', () => {
      const onRevealAnswer = vi.fn();
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.QUESTION_OPEN, onRevealAnswer })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /reveal answer/i }));
      expect(onRevealAnswer).toHaveBeenCalled();
    });

    it('calls onCloseQuestion when clicked', () => {
      const onCloseQuestion = vi.fn();
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.QUESTION_OPEN, onCloseQuestion })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /close or skip/i }));
      expect(onCloseQuestion).toHaveBeenCalled();
    });

    it('calls onSetCurrentTeam when team selection changes', () => {
      const onSetCurrentTeam = vi.fn();
      render(
        <HostControlPanel {...createProps({ onSetCurrentTeam })} />
      );

      const select = screen.getByLabelText(/select current team/i);
      fireEvent.change(select, { target: { value: 'team-3' } });
      expect(onSetCurrentTeam).toHaveBeenCalledWith('team-3');
    });

    it('calls onPauseTimer when clicked', () => {
      const onPauseTimer = vi.fn();
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.QUESTION_OPEN, isTimerRunning: true, onPauseTimer })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /pause timer/i }));
      expect(onPauseTimer).toHaveBeenCalled();
    });

    it('calls onResumeTimer when clicked', () => {
      const onResumeTimer = vi.fn();
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.QUESTION_OPEN, isTimerRunning: false, onResumeTimer })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /resume timer/i }));
      expect(onResumeTimer).toHaveBeenCalled();
    });

    it('does not call handlers when disabled buttons are clicked', () => {
      const onStartRapidFire = vi.fn();
      render(
        <HostControlPanel
          {...createProps({ phase: GamePhase.BOARD_VIEW, onStartRapidFire })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /start rapid fire/i }));
      expect(onStartRapidFire).not.toHaveBeenCalled();
    });
  });
});
