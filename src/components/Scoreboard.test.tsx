import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Scoreboard from './Scoreboard';
import { Team } from '../types';

const mockTeams: Team[] = [
  { id: 'team-1', name: 'Team Alpha', score: 300, questionsAnswered: 3 },
  { id: 'team-2', name: 'Team Beta', score: 150, questionsAnswered: 2 },
  { id: 'team-3', name: 'Team Gamma', score: 0, questionsAnswered: 0 },
];

describe('Scoreboard', () => {
  it('renders all teams with their names and scores', () => {
    render(<Scoreboard teams={mockTeams} currentTeamId="team-1" />);

    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText('Team Gamma')).toBeInTheDocument();

    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('highlights the active team', () => {
    render(<Scoreboard teams={mockTeams} currentTeamId="team-2" />);

    const activeCard = screen.getByTestId('team-team-2');
    expect(activeCard).toHaveAttribute('aria-current', 'true');

    // Active indicator should be present for the active team
    expect(screen.getByTestId('active-indicator')).toBeInTheDocument();
  });

  it('does not highlight inactive teams', () => {
    render(<Scoreboard teams={mockTeams} currentTeamId="team-1" />);

    const inactiveCard = screen.getByTestId('team-team-2');
    expect(inactiveCard).not.toHaveAttribute('aria-current');
  });

  it('renders the scoreboard heading', () => {
    render(<Scoreboard teams={mockTeams} currentTeamId="team-1" />);

    expect(screen.getByRole('heading', { name: 'Scoreboard' })).toBeInTheDocument();
  });

  it('has accessible region landmark', () => {
    render(<Scoreboard teams={mockTeams} currentTeamId="team-1" />);

    expect(screen.getByRole('region', { name: 'Scoreboard' })).toBeInTheDocument();
  });

  it('updates reactively when props change', () => {
    const { rerender } = render(
      <Scoreboard teams={mockTeams} currentTeamId="team-1" />
    );

    expect(screen.getByText('300')).toBeInTheDocument();

    // Simulate score update via new props
    const updatedTeams: Team[] = [
      { id: 'team-1', name: 'Team Alpha', score: 500, questionsAnswered: 5 },
      { id: 'team-2', name: 'Team Beta', score: 150, questionsAnswered: 2 },
      { id: 'team-3', name: 'Team Gamma', score: 0, questionsAnswered: 0 },
    ];

    rerender(<Scoreboard teams={updatedTeams} currentTeamId="team-1" />);

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.queryByText('300')).not.toBeInTheDocument();
  });

  it('updates active team indicator when currentTeamId changes', () => {
    const { rerender } = render(
      <Scoreboard teams={mockTeams} currentTeamId="team-1" />
    );

    expect(screen.getByTestId('team-team-1')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('team-team-2')).not.toHaveAttribute('aria-current');

    rerender(<Scoreboard teams={mockTeams} currentTeamId="team-2" />);

    expect(screen.getByTestId('team-team-1')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('team-team-2')).toHaveAttribute('aria-current', 'true');
  });

  it('renders correctly with an empty teams list', () => {
    render(<Scoreboard teams={[]} currentTeamId="" />);

    expect(screen.getByRole('heading', { name: 'Scoreboard' })).toBeInTheDocument();
    // No team cards rendered
    expect(screen.queryByTestId(/^team-/)).not.toBeInTheDocument();
  });
});
