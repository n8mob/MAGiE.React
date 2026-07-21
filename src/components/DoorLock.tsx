import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactGA4 from "react-ga4";
import { BitSequence } from "../BitSequence.ts";
import { BinaryEncoder } from "../encoding/BinaryEncoder.ts";
import { BitButton } from "./BitButton.tsx";
import { BitInputs } from "./BitInputs.tsx";
import { DisplayMatrix } from "./DisplayMatrix.tsx";
import { debug } from "../Logger.ts";
import { useBitSounds } from "../hooks/useBitSounds.ts";
import { loadSound, playSound } from "../audio/SoundPlayer.ts";
import { SOUNDS } from "../audio/sounds.ts";

const randomSequence = (bits: number = 8) =>
  BitSequence.fromString(Math.floor(Math.random() * (2 ** bits)).toString(2).padStart(bits, "0"));

type DoorLockState = "idle" | "entering" | "accepted" | "rejected";

const CLUES: Record<DoorLockState, string> = {
  idle: "SWIPE CARD ⏎",
  entering: "ENTER CODE",
  accepted: "ACCESS GRANTED",
  rejected: "ACCESS DENIED",
};

interface DoorLockProps {
  encoder: BinaryEncoder;
  presets?: string[];
}

const DoorLock = (props: DoorLockProps) => {
  const { encoder, presets } = props;
  const [gameState, setGameState] = useState<DoorLockState>("idle");
  const [stagingBits, setStagingBits] = useState(() => BitSequence.empty());
  const [cardBits, setCardBits] = useState(() => BitSequence.empty());
  // Staging is the live input; the card only changes on a swipe, so it stays silent.
  useBitSounds(stagingBits);
  const bitsPerRow = 8;
  const [presetIndex, setPresetIndex] = useState(0);
  const [winSequence, setWinSequence] = useState(() =>
    presets?.[0] ? BitSequence.fromString(presets[0]) : randomSequence()
  );

  const mainDisplayRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState("Guess the bit sequence!");

  useEffect(() => {
    void loadSound(SOUNDS.win);
  }, []);

  useEffect(() => {
    const el = mainDisplayRef.current;
    if (!el?.parentElement) { return; }
    const gameContent = el.parentElement;
    const observer = new ResizeObserver(([entry]) => {
      const bitSize = Math.floor(entry.contentRect.width / 8);
      gameContent.style.setProperty('--door-lock-bit-size', `${bitSize}px`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cardRows = useMemo(() => {
      return [...encoder.splitForDisplay(cardBits, bitsPerRow)];
    }, [cardBits, bitsPerRow, encoder]
  );
  const stagingRows = useMemo(() => {
      return [...encoder.splitForDisplay(stagingBits, bitsPerRow)];
    }, [stagingBits, bitsPerRow, encoder]
  );

  const appendBit = useCallback((bit: "0" | "1") => {
    if (gameState !== "entering") {
      setGameState("entering");
    }
    setStagingBits(prev => {
      debug(`Appending bit ${bit} to staging sequence "${prev.toString()}"`)
      return prev.appendBit(bit);
    });
  }, [gameState]);

  const deleteBit = useCallback(() => {
    setStagingBits(prev => prev.slice(0, -1));
  }, []);

  const handleStagingBitClick = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const bitIndex = event.target.dataset.bitIndex;
    if (bitIndex === undefined) { return; }
    setStagingBits(prev => prev.toggleBit(parseInt(bitIndex)));
  }, []);

  const submit = useCallback(() => {
    if (gameState === "idle" && stagingBits.isEmpty) {
      setGameState("entering");
      return;
    }
    if (gameState === "idle" || gameState === "entering" || gameState === "rejected") {
      setCardBits(stagingBits);
      const guessValue = parseInt(stagingBits.toPlainString(), 2);
      const winValue = parseInt(winSequence.toPlainString(), 2);
      const isCorrect = guessValue === winValue;
      const diff = guessValue - winValue;
      const pagePath = window.location.pathname + window.location.search;
      ReactGA4.event("door_lock_submit", { is_correct: isCorrect, diff, preset_index: presetIndex, pagePath });
      if (isCorrect) {
        ReactGA4.event("door_lock_win", { preset_index: presetIndex, pagePath });
        setHint("You got it!");
        playSound(SOUNDS.win);
      } else {
        setHint(`BAD KEY ${diff > 0 ? "+" : ""}${diff}`);
      }
      setGameState(isCorrect ? "accepted" : "rejected");
      return;
    }

    if (gameState === "accepted") {
      setCardBits(BitSequence.empty());
      setGameState("idle");
      setHint("Guess the bit sequence!");
      const nextIndex = presetIndex + 1;
      setPresetIndex(nextIndex);
      setWinSequence(presets?.[nextIndex] ? BitSequence.fromString(presets[nextIndex]) : randomSequence());
    }
  }, [gameState, stagingBits, winSequence, presetIndex, presets]);

  /**
   * keyboard handler
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "0") {
        appendBit("0");
      } else if (event.key === "1") {
        appendBit("1");
      } else if (event.key === "Backspace") {
        deleteBit();
      } else if (event.key === "Enter") {
        submit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appendBit, deleteBit, submit]);

  return (
    <div id="game-content" className="door-lock">
      <div id="main-display" className="display" ref={mainDisplayRef}>
        <p id="clue-text">{CLUES[gameState]}</p>
        {cardBits.isEmpty
          ? <span className="guess-placeholder">_ _ _ _ _ _ _ _</span>
          : <DisplayMatrix
            displayRows={cardRows}
            renderBit={(bit) => <BitButton key={`bit-${bit.index}`} bit={bit} />}
          />
        }
        <p>{hint}</p>
        {gameState === "accepted" && <p>{parseInt(winSequence.toPlainString(), 2)}</p>}
        {gameState === "accepted" && (
          <div className="after-win-controls">
            <button type="button" onClick={submit}>Next ▶▶</button>
          </div>
        )}
      </div>
      <div id="magie-staging" className="display">
        {stagingBits.isEmpty
          ? <span className="guess-placeholder">_ _ _ _ _ _ _ _</span>
          : <DisplayMatrix
            displayRows={stagingRows}
            renderBit={(bit) => <BitButton key={`bit-${bit.index}`} bit={bit} onChange={handleStagingBitClick} />}
          />
        }
      </div>
      <div id="puzzle-inputs">
        <BitInputs onBit={appendBit} onDelete={deleteBit} onSubmit={submit} />
      </div>
    </div>
  );
};

export { DoorLock };
