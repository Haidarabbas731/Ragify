import { useCallback, useEffect, useState } from "react";

/**
 * Counts down the seconds until a new code may be requested.
 * Measured against the clock, not by counting ticks, so a throttled background tab stays right.
 * @param initialSeconds - The wait to start with
 * @returns The seconds left (0 when a code may be requested) and a function to start a new wait
 */
export function useResendCountdown(initialSeconds: number) {
  const [endsAt, setEndsAt] = useState(
    () => Date.now() + initialSeconds * 1000,
  );
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const restart = useCallback(
    (seconds: number) => setEndsAt(Date.now() + seconds * 1000),
    [],
  );

  return { remaining, restart };
}
