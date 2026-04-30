import { useCallback, useEffect, useState } from "react";

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
  const [guess, setGuess] = useState("");

  const appendBit = useCallback((bit: "0" | "1") => {
    setGuess(prev => prev + bit);
  }, []);

  const deleteBit = useCallback(() => {
    setGuess(prev => prev.slice(0, -1));
  }, []);

  const submit = useCallback(() => {
    // TODO: judgment logic
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "0") appendBit("0");
      else if (event.key === "1") appendBit("1");
      else if (event.key === "Backspace") deleteBit();
      else if (event.key === "Enter") submit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appendBit, deleteBit, submit]);

  return (
    <div id="game-content">
      <div id="main-display" className="display">
        <p className="decode-guess-text">{guess || <span className="decode-guess-placeholder">_ _ _ _ _ _ _ _</span>}</p>
      </div>
      <div id="puzzle-inputs">
        <div className="decode-keyboard-row" role="group" aria-label="Bit input">
          <button type="button" className="decode-keyboard-key" aria-label="1" onClick={() => appendBit("1")}>
            <img src={keyboardAssetMap["keyboard_Bit_on_32x32.png"]} alt="" aria-hidden="true" draggable={false} className="decode-keyboard-key-image" />
          </button>
          <button type="button" className="decode-keyboard-key" aria-label="0" onClick={() => appendBit("0")}>
            <img src={keyboardAssetMap["keyboard_Bit_off_32x32.png"]} alt="" aria-hidden="true" draggable={false} className="decode-keyboard-key-image" />
          </button>
          <button type="button" className="decode-keyboard-key" aria-label="delete" onClick={deleteBit}>
            <img src={keyboardAssetMap["keyboard_delete_32x32.png"]} alt="" aria-hidden="true" draggable={false} className="decode-keyboard-key-image" />
          </button>
          <button type="button" className="decode-keyboard-key" aria-label="submit" onClick={submit}>
            <img src={keyboardAssetMap["keyboard_return_32x32.png"]} alt="" aria-hidden="true" draggable={false} className="decode-keyboard-key-image" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { DoorLock };
