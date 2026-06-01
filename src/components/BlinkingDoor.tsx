import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const bitAssetModules = import.meta.glob("../assets/Bit_*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const bitAssetMap: Record<string, string> = Object.entries(bitAssetModules).reduce<Record<string, string>>(
  (map, [path, url]) => {
    const fileName = path.split("/").pop();
    if (fileName) {map[fileName] = url;}
    return map;
  },
  {}
);

const keyboardAssetModules = import.meta.glob("../assets/keyboard/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const keyboardAssetMap: Record<string, string> = Object.entries(keyboardAssetModules).reduce<Record<string, string>>(
  (map, [path, url]) => {
    const fileName = path.split("/").pop();
    if (fileName) {map[fileName] = url;}
    return map;
  },
  {}
);

type BlinkState = "idle" | "wake_received" | "door_blinking" | "await_first" | "player_responding" | "success" | "failure";
type Phase = "handshake" | "code";

const BLINK_ON_MS = 300;
const BLINK_OFF_MS = 200;
const AWAIT_FIRST_MS = 3000;
const PLAYER_TIMEOUT_MS = 1000;

const CLUES: Record<BlinkState, string> = {
  idle: "TAP TO WAKE",
  wake_received: "...",
  door_blinking: "WATCH...",
  await_first: "YOUR TURN",
  player_responding: "...",
  success: "ACCESS GRANTED",
  failure: "ACCESS DENIED",
};

function BlinkingDoor() {
  const navigate = useNavigate();
  const [blinkState, setBlinkState] = useState<BlinkState>("idle");
  const [ledOn, setLedOn] = useState(false);
  const [playerLedOn, setPlayerLedOn] = useState(false);
  const [playerBlinkCount, setPlayerBlinkCount] = useState(0);
  const [resultMessage, setResultMessage] = useState("");
  const [showOpenButton, setShowOpenButton] = useState(false);

  const winAudio = useRef<HTMLAudioElement | null>(null);
  const blinkStateRef = useRef<BlinkState>("idle");
  const phaseRef = useRef<Phase>("handshake");
  const playerBlinkCountRef = useRef(0);
  const codeCountRef = useRef(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animateDoorBlinksRef = useRef<(remaining: number, onComplete: () => void) => void>(null!);

  useEffect(() => {
    winAudio.current = new Audio('/sounds/big-ta-da.wav');
    winAudio.current.preload = "auto";
    winAudio.current.volume = 0.25;
    return () => {
      winAudio.current?.pause();
      if (flashTimerRef.current) {clearTimeout(flashTimerRef.current);}
      if (evalTimerRef.current) {clearTimeout(evalTimerRef.current);}
    };
  }, []);

  const updateState = useCallback((s: BlinkState) => {
    blinkStateRef.current = s;
    setBlinkState(s);
  }, []);

  const clearFlashTimer = useCallback(() => {
    if (flashTimerRef.current) { clearTimeout(flashTimerRef.current); flashTimerRef.current = null; }
  }, []);

  const clearEvalTimer = useCallback(() => {
    if (evalTimerRef.current) { clearTimeout(evalTimerRef.current); evalTimerRef.current = null; }
  }, []);

  const resetToIdle = useCallback(() => {
    clearFlashTimer();
    clearEvalTimer();
    phaseRef.current = "handshake";
    playerBlinkCountRef.current = 0;
    setPlayerBlinkCount(0);
    setLedOn(false);
    setPlayerLedOn(false);
    setResultMessage("");
    setShowOpenButton(false);
    updateState("idle");
  }, [clearFlashTimer, clearEvalTimer, updateState]);

  const startEvalTimer = useCallback(() => {
    clearEvalTimer();
    evalTimerRef.current = setTimeout(() => {
      const playerCount = playerBlinkCountRef.current;
      const codeCount = codeCountRef.current;
      if (playerCount === codeCount) {
        updateState("success");
        if (winAudio.current) {
          winAudio.current.currentTime = 0;
          winAudio.current.play().catch((error) => { console.warn("Audio playback failed:", error); });
        }
        evalTimerRef.current = setTimeout(() => {
          setResultMessage("the door unlocks...");
          evalTimerRef.current = setTimeout(() => setShowOpenButton(true), 700);
        }, 700);
      } else {
        updateState("failure");
        setResultMessage(`YOU: ${playerCount}  DOOR: ${codeCount}`);
      }
    }, PLAYER_TIMEOUT_MS);
  }, [clearEvalTimer, updateState]);

  useEffect(() => {
    animateDoorBlinksRef.current = (remaining: number, onComplete: () => void) => {
      if (remaining === 0) { onComplete(); return; }
      setLedOn(true);
      flashTimerRef.current = setTimeout(() => {
        setLedOn(false);
        flashTimerRef.current = setTimeout(() => {
          animateDoorBlinksRef.current(remaining - 1, onComplete);
        }, BLINK_OFF_MS);
      }, BLINK_ON_MS);
    };
  });

  const startCodePhase = useCallback(() => {
    const count = Math.floor(Math.random() * 5) + 3; // 3–7 inclusive
    codeCountRef.current = count;
    phaseRef.current = "code";
    playerBlinkCountRef.current = 0;
    setPlayerBlinkCount(0);
    updateState("door_blinking");
    animateDoorBlinksRef.current(count, () => {
      updateState("await_first");
      evalTimerRef.current = setTimeout(resetToIdle, AWAIT_FIRST_MS);
    });
  }, [updateState, resetToIdle]);

  const startWakeTimer = useCallback(() => {
    clearEvalTimer();
    evalTimerRef.current = setTimeout(() => {
      if (playerBlinkCountRef.current === 1) {
        updateState("door_blinking");
        animateDoorBlinksRef.current(1, () => {
          updateState("await_first");
          evalTimerRef.current = setTimeout(resetToIdle, AWAIT_FIRST_MS);
        });
      } else {
        resetToIdle();
      }
    }, PLAYER_TIMEOUT_MS);
  }, [clearEvalTimer, updateState, resetToIdle]);

  const flashPlayerLed = useCallback((onAfterFlash: () => void) => {
    clearFlashTimer();
    setPlayerLedOn(true);
    flashTimerRef.current = setTimeout(() => {
      setPlayerLedOn(false);
      onAfterFlash();
    }, BLINK_ON_MS);
  }, [clearFlashTimer]);

  const handleTap = useCallback(() => {
    const state = blinkStateRef.current;

    if (state === "idle") {
      phaseRef.current = "handshake";
      playerBlinkCountRef.current = 1;
      updateState("wake_received");
      flashPlayerLed(startWakeTimer);
      return;
    }

    if (state === "wake_received") {
      clearEvalTimer();
      playerBlinkCountRef.current += 1;
      flashPlayerLed(startWakeTimer);
      return;
    }

    if (state === "await_first") {
      clearEvalTimer();
      if (phaseRef.current === "handshake") {
        // Player repeats the handshake blink — flash LED, pause, then start code phase
        flashPlayerLed(() => {
          evalTimerRef.current = setTimeout(startCodePhase, PLAYER_TIMEOUT_MS);
        });
      } else {
        // First blink of code response
        playerBlinkCountRef.current = 1;
        setPlayerBlinkCount(1);
        updateState("player_responding");
        flashPlayerLed(() => {
          startEvalTimer();
        });
      }
      return;
    }

    if (state === "player_responding") {
      clearEvalTimer();
      const newCount = playerBlinkCountRef.current + 1;
      playerBlinkCountRef.current = newCount;
      setPlayerBlinkCount(newCount);
      flashPlayerLed(() => {
        startEvalTimer();
      });
      return;
    }

    if (state === "success" || state === "failure") {
      resetToIdle();
      return;
    }
  }, [updateState, resetToIdle, clearEvalTimer, flashPlayerLed, startWakeTimer, startCodePhase, startEvalTimer]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "1" || event.key === " ") {
        event.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTap]);

  return (
    <div id="game-content" className="blinking-door">
      <div id="main-display" className="display">
        <p id="clue-text">{CLUES[blinkState]}</p>
        <div className="blinking-door-led blinking-door-led--door">
          <img
            src={ledOn ? bitAssetMap["Bit_on_Red.png"] : bitAssetMap["Bit_off_Red.png"]}
            alt={ledOn ? "door light on" : "door light off"}
            className="blinking-door-led-image blinking-door-led-image--door"
          />
        </div>
        {resultMessage && <p className="result-message">{resultMessage}</p>}
      </div>
      <div id="puzzle-inputs">
        <div className="keyboard">
          <div className="keyboard-row blinking-door-input-row" role="group" aria-label="Blink input">
            {showOpenButton && (
              <button type="button" className="blinking-door-open-btn" onClick={() => navigate("/story")}>
                Open the door ▶▶
              </button>
            )}
            <div className="blinking-door-led blinking-door-led--player">
              <img
                src={playerLedOn ? bitAssetMap["Bit_on.png"] : bitAssetMap["Bit_off.png"]}
                alt={playerLedOn ? "player light on" : "player light off"}
                className="blinking-door-led-image blinking-door-led-image--player"
              />
              {blinkState === "player_responding" && (
                <p className="blink-count">{playerBlinkCount}</p>
              )}
            </div>
            <button
              type="button"
              className="keyboard-key"
              aria-label="blink"
              onClick={handleTap}
              disabled={blinkState === "door_blinking"}
            >
              <img
                src={keyboardAssetMap["keyboard_Bit_on_32x32.png"]}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="keyboard-key-image"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { BlinkingDoor };
