import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows team setup screen on fresh start', () => {
    render(<App />)
    expect(screen.getByText('Team Setup')).toBeInTheDocument()
    expect(screen.getByTestId('start-game-button')).toBeInTheDocument()
  })

  it('starts the game after team setup', () => {
    render(<App />)
    // Click start with default team names
    fireEvent.click(screen.getByTestId('start-game-button'))

    expect(screen.getByText('Birthday Game Night Trivia')).toBeInTheDocument()
    expect(screen.getByTestId('game-board')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Scoreboard' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Host Control Panel' })).toBeInTheDocument()
  })

  it('renders teams from setup in the scoreboard', () => {
    render(<App />)

    // Change team names
    const input0 = screen.getByTestId('team-input-0') as HTMLInputElement
    const input1 = screen.getByTestId('team-input-1') as HTMLInputElement
    fireEvent.change(input0, { target: { value: 'Rockets' } })
    fireEvent.change(input1, { target: { value: 'Stars' } })

    fireEvent.click(screen.getByTestId('start-game-button'))

    expect(screen.getAllByText('Rockets').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Stars').length).toBeGreaterThanOrEqual(1)
  })

  it('shows resume dialog when saved state exists', () => {
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

  it('shows team setup when user picks Start Fresh from resume dialog', () => {
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
    fireEvent.click(screen.getByTestId('start-fresh-button'))

    expect(screen.getByText('Team Setup')).toBeInTheDocument()
  })
})
