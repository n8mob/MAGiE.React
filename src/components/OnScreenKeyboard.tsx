import { FC, useCallback } from "react";
import "./OnScreenKeyboard.css";

type KeyboardAction = "append" | "delete" | "return";

interface KeyboardKeySpec {
  id: string;
  ariaLabel: string;
  action: KeyboardAction;
  value?: string;
  assetUrl: string;
}

interface OnScreenKeyboardProps {
  onCharacter: (character: string) => void;
  onDelete: () => void;
  onReturn: () => void;
  disabled?: boolean;
}

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

const resolveAsset = (fileName: string): string => {
  const resolvedAsset = keyboardAssetMap[fileName];
  if (!resolvedAsset) {
    throw new Error(`Missing keyboard asset: ${fileName}`);
  }
  return resolvedAsset;
};

const letterKey = (letter: string): KeyboardKeySpec => ({
  id: `char-${letter}`,
  ariaLabel: letter,
  action: "append",
  value: letter,
  assetUrl: resolveAsset(`keyboard_${letter}.png`),
});

const punctuationKey = (id: string, label: string, symbol: string, fileName: string): KeyboardKeySpec => ({
  id,
  ariaLabel: label,
  action: "append",
  value: symbol,
  assetUrl: resolveAsset(fileName),
});

const KEYBOARD_BORDER = resolveAsset("Keyboard_Border.png");

const KEY_ROWS: KeyboardKeySpec[][] = [
  [..."QWERTYUIOP"].map(letterKey),
  [..."ASDFGHJKL"].map(letterKey),
  [..."ZXCVBNM"].map(letterKey).concat([
    punctuationKey("char-comma", "comma", ",", "keyboard_Comma.png"),
    punctuationKey("char-period", "period", ".", "keyboard_Period.png"),
  ]),
  [
    punctuationKey("char-exclamation", "exclamation mark", "!", "keyboard_Exclamation.png"),
    punctuationKey("char-question", "question mark", "?", "keyboard_Question.png"),
    {
      id: "char-space",
      ariaLabel: "space",
      action: "append",
      value: " ",
      assetUrl: resolveAsset("Keyboard_Space.png"),
    },
    {
      id: "key-delete",
      ariaLabel: "delete",
      action: "delete",
      assetUrl: resolveAsset("keyboard_Delete.png"),
    },
    {
      id: "key-return",
      ariaLabel: "check answer",
      action: "return",
      assetUrl: resolveAsset("keyboard_Return.png"),
    },
  ],
];

const OnScreenKeyboard: FC<OnScreenKeyboardProps> = (
  {
    onCharacter,
    onDelete,
    onReturn,
    disabled = false,
  }) => {
  const handlePress = useCallback((key: KeyboardKeySpec) => {
    if (disabled) {
      return;
    }

    switch (key.action) {
      case "append":
        if (key.value) {
          onCharacter(key.value);
        }
        return;
      case "delete":
        onDelete();
        return;
      case "return":
        onReturn();
        return;
      default:
        return;
    }
  }, [disabled, onCharacter, onDelete, onReturn]);

  return (
    <div className="decode-keyboard" role="group" aria-label="On-screen keyboard">
      <div
        className="decode-keyboard-border"
        style={{ backgroundImage: `url(${KEYBOARD_BORDER})` }}
        aria-hidden="true"
      />
      {KEY_ROWS.map((keyRow, rowIndex) => (
        <div className="decode-keyboard-row" key={`decode-keyboard-row-${rowIndex}`}>
          {keyRow.map((key) => (
            <button
              type="button"
              key={key.id}
              className="decode-keyboard-key"
              onClick={() => handlePress(key)}
              disabled={disabled}
              aria-label={key.ariaLabel}
            >
              <img
                src={key.assetUrl}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="decode-keyboard-key-image"
              />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export { OnScreenKeyboard };
