import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing a countdown timer.
 *
 * Provides start, pause, resume, and reset controls.
 * Emits an expiry event (via onExpire callback) when the timer reaches zero.
 * Does NOT auto-transition game phase on expiry — the host decides next action.
 *
 * Timer duration selection: use question.timerSeconds if set, else config.defaultTimerSeconds.
 * This hook accepts the resolved duration via start(durationSeconds).
 */
export interface UseTimerReturn {
  /** Seconds remaining on the countdown */
  remainingTime: number;
  /** Whether the timer has reached zero */
  isExpired: boolean;
  /** Whether the timer is actively counting down */
  isRunning: boolean;
  /** Start the timer with a given duration in seconds */
  start: (durationSeconds: number) => void;
  /** Pause the timer, preserving remaining time */
  pause: () => void;
  /** Resume the timer from the preserved remaining time */
  resume: () => void;
  /** Reset the timer to idle state */
  reset: () => void;
}

export function useTimer(onExpire?: () => void): UseTimerReturn {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep the onExpire callback ref up to date without causing re-renders
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((durationSeconds: number) => {
    clearTimer();
    setRemainingTime(durationSeconds);
    setIsExpired(false);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          // Timer has expired
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
          setIsExpired(true);
          onExpireRef.current?.();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    if (isRunning && !isExpired) {
      clearTimer();
      setIsRunning(false);
    }
  }, [isRunning, isExpired, clearTimer]);

  const resume = useCallback(() => {
    if (!isRunning && !isExpired && remainingTime > 0) {
      setIsRunning(true);

      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setIsRunning(false);
            setIsExpired(true);
            onExpireRef.current?.();
            return 0;
          }
          return next;
        });
      }, 1000);
    }
  }, [isRunning, isExpired, remainingTime]);

  const reset = useCallback(() => {
    clearTimer();
    setRemainingTime(0);
    setIsRunning(false);
    setIsExpired(false);
  }, [clearTimer]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    remainingTime,
    isExpired,
    isRunning,
    start,
    pause,
    resume,
    reset,
  };
}
