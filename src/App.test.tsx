import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the game title from config', () => {
    render(<App />)
    expect(screen.getByText('Friday Trivia Night')).toBeInTheDocument()
  })

  it('renders the game board', () => {
    render(<App />)
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
  })

  it('renders the scoreboard with teams', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: 'Scoreboard' })).toBeInTheDocument()
    // Team names appear in both scoreboard and host control panel select
    expect(screen.getAllByText('Team Alpha').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Team Beta').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Team Gamma').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the host control panel', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: 'Host Control Panel' })).toBeInTheDocument()
  })

  it('shows resume dialog when saved state exists', () => {
    // Set up fake saved state
    const fakeState = {
      config: { title: 'Test', topics: [], teams: [], defaultTimerSeconds: 30 },
      teams: [],
      currentTeamId: '',
      activeQuestion: null,
      isRapidFire: false,
      isAnswerRevealed: false,
      answeredQuestions: [],
      phase: 'BOARD_VIEW',
    }
    localStorage.setItem('trivia-game-state', JSON.stringify(fakeState))

    render(<App />)
    expect(screen.getByTestId('resume-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('resume-button')).toBeInTheDocument()
    expect(screen.getByTestId('start-fresh-button')).toBeInTheDocument()
  })
})
