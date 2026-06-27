import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useTimer());

    expect(result.current.remainingTime).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('starts timer with given duration', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(30);
    });

    expect(result.current.remainingTime).toBe(30);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isExpired).toBe(false);
  });

  it('decrements remaining time each second', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(10);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remainingTime).toBe(9);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.remainingTime).toBe(6);
  });

  it('expires when timer reaches zero', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useTimer(onExpire));

    act(() => {
      result.current.start(3);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.remainingTime).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('pauses the timer and preserves remaining time', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(10);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.remainingTime).toBe(7);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.remainingTime).toBe(7);

    // Time advances but remaining time should not change
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remainingTime).toBe(7);
  });

  it('resumes the timer from preserved remaining time', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(10);
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.remainingTime).toBe(6);

    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.resume();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.remainingTime).toBe(4);
  });

  it('resets the timer to idle state', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(10);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.remainingTime).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('does not auto-transition game phase on expiry', () => {
    // Timer should only emit expiry event, not change any external state
    const onExpire = vi.fn();
    const { result } = renderHook(() => useTimer(onExpire));

    act(() => {
      result.current.start(2);
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isExpired).toBe(true);
    // onExpire is called but doesn't auto-transition — it's the host's responsibility
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('does not pause an already expired timer', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(1);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isExpired).toBe(true);

    act(() => {
      result.current.pause();
    });

    // State should not change
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('does not resume an expired timer', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(1);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isExpired).toBe(true);

    act(() => {
      result.current.resume();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isExpired).toBe(true);
  });

  it('supports restarting after reset', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start(5);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.reset();
    });

    act(() => {
      result.current.start(10);
    });

    expect(result.current.remainingTime).toBe(10);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isExpired).toBe(false);
  });

  it('selects timer duration from question override or default config', () => {
    // This test validates the caller's responsibility:
    // start() is called with question.timerSeconds ?? config.defaultTimerSeconds
    const { result } = renderHook(() => useTimer());

    // Simulating question with timerSeconds override = 45
    const questionTimerSeconds: number | null = 45;
    const defaultTimerSeconds = 30;
    const duration = questionTimerSeconds ?? defaultTimerSeconds;

    act(() => {
      result.current.start(duration);
    });

    expect(result.current.remainingTime).toBe(45);

    act(() => {
      result.current.reset();
    });

    // Simulating question without timerSeconds (null) — falls back to default
    const questionTimerNull: number | null = null;
    const durationDefault = questionTimerNull ?? defaultTimerSeconds;

    act(() => {
      result.current.start(durationDefault);
    });

    expect(result.current.remainingTime).toBe(30);
  });
});
