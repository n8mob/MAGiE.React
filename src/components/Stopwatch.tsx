import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const ONE_MINUTE_IN_SECONDS = 60;
const ONE_HOUR_IN_SECONDS = ONE_MINUTE_IN_SECONDS * 60;

interface StopwatchHandle {
  stop: () => void;
  getTime: () => number;
  displayTime: () => string;
  getHours: () => number;
  getMinutes: () => number;
  getSeconds: () => number;
}

export const Stopwatch = forwardRef((_props, ref) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!isRunning && time !== 0) {
      clearInterval(interval!);
    }

    return () => clearInterval(interval!);
  }, [isRunning, time]);

  const getHours = () => {
    return Math.floor(time / ONE_HOUR_IN_SECONDS);
  }

  const getMinutes = () => {
    return Math.floor((time % ONE_HOUR_IN_SECONDS) / ONE_MINUTE_IN_SECONDS);
  }

  const getSeconds = () => {
    return time % ONE_MINUTE_IN_SECONDS;
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
      <p id="stopwatch-display">{displayTime()}</p>
  );
});


export type { StopwatchHandle };
