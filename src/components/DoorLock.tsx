import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BitSequence } from "../BitSequence.ts";
import { BitButton } from "./BitButton.tsx";

const BIT_SIZE_PX = 32;

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

const DoorLock = () => {
  const [gameState, setGameState] = useState<DoorLockState>("idle");
  const [guess, setGuess] = useState(() => BitSequence.empty());
  const displayRef = useRef<HTMLDivElement>(null);
  const [bitsPerRow, setBitsPerRow] = useState(8);

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

  const rows = useMemo(() => {
    const bits = [...guess];
    const result: typeof bits[] = [];
    for (let i = 0; i < bits.length; i += bitsPerRow) {
      result.push(bits.slice(i, i + bitsPerRow));
    }
    return result;
  }, [guess, bitsPerRow]);

  const appendBit = useCallback(
    (bit: "0" | "1") => {
      if (gameState !== "entering") {
        setGameState("entering");
      }
      setGuess(prev => prev.appendBit(bit));
    }, [gameState]);

  const deleteBit = useCallback(() => {
    if (guess.isEmpty) {
      return;
    }
    setGuess(prev => prev.slice(0, -1));
  }, [guess]);

  const submit = useCallback(() => {
    if (gameState === "idle") {
      setGameState("entering");
      return;
    }

    if (gameState === "entering" || gameState === "rejected") {
      const winSequence = BitSequence.fromString("10101011")
      if (guess.equals(winSequence)) {
        setGameState("accepted");
        return;
      }
      setGameState("rejected");
      return;
    }
    if (gameState === "accepted") {
      setGuess(BitSequence.empty());
      setGameState("idle");
    }
  }, [gameState]);

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
        {guess.isEmpty
          ? <span className="decode-guess-placeholder">_ _ _ _ _ _ _ _</span>
          : rows.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: "flex", flexDirection: "row" }}>
              {row.map((bit) => (
                <BitButton
                  key={`bit-${bit.index}`}
                  bit={bit}
                />
              ))}
            </div>
          ))
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
