import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const ONE_MINUTE_IN_SECONDS = 60;
const ONE_HOUR_IN_SECONDS = ONE_MINUTE_IN_SECONDS * 60;

interface StopwatchHandle {
  stop: () => void;
  getTotalSeconds: () => number;
  displayTime: () => string;
  getHours: () => number;
  getMinutes: () => number;
  getSeconds: () => number;
}

export const Stopwatch = forwardRef((_props, ref) => {
  const [solveTimeSeconds, setSolveTimeSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSolveTimeSeconds(prevTimeSeconds => prevTimeSeconds + 1);
      }, 1000);
    } else if (!isRunning && solveTimeSeconds !== 0) {
      clearInterval(interval!);
    }

    return () => clearInterval(interval!);
  }, [isRunning, solveTimeSeconds]);

  const getHours = () => {
    return Math.floor(solveTimeSeconds / ONE_HOUR_IN_SECONDS);
  }

  const getMinutes = () => {
    return Math.floor((solveTimeSeconds % ONE_HOUR_IN_SECONDS) / ONE_MINUTE_IN_SECONDS);
  }

  const getSeconds = () => {
    return solveTimeSeconds % ONE_MINUTE_IN_SECONDS;
  }

  const pad = (num: number) => String(num).padStart(2, '0');
  const displayTime = () => {
    if (getHours() > 0) {
      return `${pad(getHours())}:${pad(getMinutes())}:${pad(getSeconds())}`;
    } else {
      return `${pad(getMinutes())}:${pad(getSeconds())}`;
    }
  };

  useImperativeHandle(ref, () => ({
    stop() {
      setIsRunning(false);
    },

    getTotalSeconds() {
      return solveTimeSeconds;
    },

    displayTime() {
      return displayTime();
    },

    getHours() {
      return getHours();
    },
    getMinutes() {
      return getMinutes();
    },
    getSeconds() {
      return getSeconds();
    }
  }));

  return (
      <div id="stopwatch-display">{displayTime()}</div>
  );
});


export type { StopwatchHandle };
