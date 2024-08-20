import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const ONE_HOUR_IN_SECONDS = 60 * 60;

const Stopwatch = forwardRef((_props, ref) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!isRunning && time !== 0) {
      clearInterval(interval!);
    }

    return () => clearInterval(interval!);
  }, [isRunning, time]);

  useImperativeHandle(ref, () => ({
    stop() {
      setIsRunning(false);
    },
    getTime() {
      return time;
    }
  }));

  const reset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const timeSliceStart = time < ONE_HOUR_IN_SECONDS ? 14 : 11;

  return (
    <div>
      <h2>Stopwatch</h2>
      <p>{new Date(time * 1000).toISOString().slice(timeSliceStart, 19)}</p>
      <button onClick={() => setIsRunning(true)}>Start</button>
      <button onClick={() => setIsRunning(false)}>Stop</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
});

export default Stopwatch;
