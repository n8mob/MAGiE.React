import { FC, useCallback } from "react";
import "./OnScreenKeyboard.css";
import "./BitInputs.css";

type BitInputAction = "append" | "delete" | "submit";

interface BitKeySpec {
  id: string;
  ariaLabel: string;
  action: BitInputAction;
  value?: "0" | "1";
  assetUrl: string;
}

interface BitInputsProps {
  onBit: (bit: "0" | "1") => void;
  onDelete: () => void;
  onSubmit: () => void;
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

const BIT_KEYS: BitKeySpec[] = [
  {
    id: "bit-1",
    ariaLabel: "1",
    action: "append",
    value: "1",
    assetUrl: resolveAsset("keyboard_Bit_on_32x32.png"),
  },
  {
    id: "bit-0",
    ariaLabel: "0",
    action: "append",
    value: "0",
    assetUrl: resolveAsset("keyboard_Bit_off_32x32.png"),
  },
  {
    id: "key-delete",
    ariaLabel: "delete",
    action: "delete",
    assetUrl: resolveAsset("keyboard_delete_32x32.png"),
  },
  {
    id: "key-submit",
    ariaLabel: "submit",
    action: "submit",
    assetUrl: resolveAsset("keyboard_return_32x32.png"),
  },
];

const BitInputs: FC<BitInputsProps> = (
  {
    onBit,
    onDelete,
    onSubmit,
    disabled = false,
  }) => {
  const handlePress = useCallback((key: BitKeySpec) => {
    if (disabled) {
      return;
    }

    switch (key.action) {
      case "append":
        if (key.value) {
          onBit(key.value);
        }
        return;
      case "delete":
        onDelete();
        return;
      case "submit":
        onSubmit();
        return;
      default:
        return;
    }
  }, [disabled, onBit, onDelete, onSubmit]);

  return (
    <div className="bit-buttons">
      <div className="keyboard-row" role="group" aria-label="Bit input">
        {BIT_KEYS.map((key) => (
          <button
            type="button"
            key={key.id}
            className="keyboard-key"
            onClick={() => handlePress(key)}
            disabled={disabled}
            aria-label={key.ariaLabel}
          >
            <img
              src={key.assetUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="keyboard-key-image"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export { BitInputs };
