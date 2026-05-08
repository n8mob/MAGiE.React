import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BitSequence } from "../BitSequence.ts";
import { BinaryEncoder } from "../encoding/BinaryEncoder.ts";
import { BitButton } from "./BitButton.tsx";
import { DisplayMatrix } from "./DisplayMatrix.tsx";
import { debug } from "../Logger.ts";

const BIT_SIZE_PX = 32;
const WIN_SEQUENCE = BitSequence.fromString("10101011");

type DoorLockState = "idle" | "entering" | "accepted" | "rejected";

const CLUES: Record<DoorLockState, string> = {
  idle: "SWIPE CARD ⏎",
  entering: "ENTER CODE",
  accepted: "ACCESS GRANTED",
  rejected: "ACCESS DENIED",
};

const keyboardAssetModules = import.meta.glob("../assets/keyboard/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const keyboardAssetMap: Record<string, string> = Object.entries(keyboardAssetModules).reduce<Record<string, string>>(
  (assetMap, [modulePath, url]) => {
    const fileName = modulePath.split("/").pop();
    if (fileName) {
      assetMap[fileName] = url;
    }
    return assetMap;
  },
  {}
);

interface DoorLockProps {
  encoder: BinaryEncoder;
}

const DoorLock = (props: DoorLockProps) => {
  const [gameState, setGameState] = useState<DoorLockState>("idle");
  const [stagingBits, setStagingBits] = useState(() => BitSequence.empty());
  const [cardBits, setCardBits] = useState(() => BitSequence.empty());
  const [bitsPerRow, setBitsPerRow] = useState(8);
  const encoder = props.encoder;
  const displayRef = useRef<HTMLDivElement>(null);
  const winAudio = useRef<HTMLAudioElement | null>(null);
  const [win, setWin] = useState("");
  const [hint, setHint] = useState("Guess the bit sequence!");

  useEffect(() => {
    winAudio.current = new Audio('/sounds/big-ta-da.wav');
    winAudio.current.load();
    winAudio.current.volume = 0.25;
    return () => { winAudio.current?.pause(); };
  }, []);

  useEffect(() => {
    const el = displayRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setBitsPerRow(Math.max(1, Math.floor(width / BIT_SIZE_PX)));
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
    if (bitIndex === undefined) return;
    setStagingBits(prev => prev.toggleBit(parseInt(bitIndex)));
  }, []);

  const submit = useCallback(() => {
    if (gameState === "idle") {
      setGameState("entering");
      return;
    }
    if (gameState === "entering" || gameState === "rejected") {
      setCardBits(stagingBits);
      const isCorrect = stagingBits.equals(WIN_SEQUENCE);
      if (isCorrect) {
        setHint("");
        setWin("You got it!");
        winAudio.current?.play().catch((error) => { console.warn("Audio playback failed:", error); });
      } else {
        const diff = parseInt(WIN_SEQUENCE.toPlainString(), 2) - parseInt(stagingBits.toPlainString(), 2);
        setHint(`Off by ${diff > 0 ? "+" : ""}${diff}`);
      }
      setGameState(isCorrect ? "accepted" : "rejected");
      return;
    }

    if (gameState === "accepted") {
      setStagingBits(BitSequence.empty());
      setCardBits(BitSequence.empty());
      setGameState("idle");
      setHint("");
      setWin("You got it!");
    }
  }, [gameState, stagingBits]);

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
    <div id="game-content">
      <div id="main-display" className="display" ref={displayRef}>
        <p id="clue-text">{CLUES[gameState]}</p>
        {cardBits.isEmpty
          ? <span className="decode-guess-placeholder">_ _ _ _ _ _ _ _</span>
          : <DisplayMatrix
            displayRows={cardRows}
            renderBit={(bit) => <BitButton key={`bit-${bit.index}`} bit={bit} />}
          />
        }
        <p>{hint ?? win}</p>
      </div>
      <div id="magie-staging" className="display">
        {stagingBits.isEmpty
          ? <span className="decode-guess-placeholder">_ _ _ _ _ _ _ _</span>
          : <DisplayMatrix
            displayRows={stagingRows}
            renderBit={(bit) => <BitButton key={`bit-${bit.index}`} bit={bit} onChange={handleStagingBitClick} />}
          />
        }
      </div>
      <div id="puzzle-inputs">
        <div className="decode-keyboard-row" role="group" aria-label="Bit input">
          <button type="button" className="decode-keyboard-key" aria-label="1" onClick={() => appendBit("1")}>
            <img src={keyboardAssetMap["keyboard_Bit_on_32x32.png"]}
                 alt=""
                 aria-hidden="true"
                 draggable={false}
                 className="decode-keyboard-key-image" />
          </button>
          <button type="button" className="decode-keyboard-key" aria-label="0" onClick={() => appendBit("0")}>
            <img src={keyboardAssetMap["keyboard_Bit_off_32x32.png"]}
                 alt=""
                 aria-hidden="true"
                 draggable={false}
                 className="decode-keyboard-key-image" />
          </button>
          <button type="button" className="decode-keyboard-key" aria-label="delete" onClick={deleteBit}>
            <img src={keyboardAssetMap["keyboard_delete_32x32.png"]}
                 alt=""
                 aria-hidden="true"
                 draggable={false}
                 className="decode-keyboard-key-image" />
          </button>
          <button type="button" className="decode-keyboard-key" aria-label="submit" onClick={submit}>
            <img src={keyboardAssetMap["keyboard_return_32x32.png"]}
                 alt=""
                 aria-hidden="true"
                 draggable={false}
                 className="decode-keyboard-key-image" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { DoorLock };
