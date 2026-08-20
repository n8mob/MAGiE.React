import { FC, ReactNode } from "react";

/**
 * The non-modal counterpart to WinScreen (see its own doc comment): an
 * already-solved demo screen and a tutorial lesson both point at the bits on
 * display, which a modal would cover. Whether either applies is one decision —
 * `isWinInline` in model.ts — but the caller still renders these two pieces in
 * different spots of its own layout (the message beside the puzzle, the
 * controls below it), so they stay two small components rather than one.
 */
interface InlineWinMessageProps {
  show: boolean;
  winMessage: string[];
}

/** The puzzle's own win text, captioning the bits above it rather than
 * rewarding anything — see isWinInline. */
export const InlineWinMessage: FC<InlineWinMessageProps> = ({ show, winMessage }) => {
  if (!show) {
    return null;
  }
  return (
    <div id="win-message" className="display">
      {winMessage.map((winLine, winIndex) => <p key={`win-message-${winIndex}`}>{winLine}</p>)}
    </div>
  );
};

interface AfterWinControlsProps {
  show: boolean;
  actions?: ReactNode;
}

/** Where winActions land when the win stays inline instead of going to WinScreen. */
export const AfterWinControls: FC<AfterWinControlsProps> = ({ show, actions }) => {
  if (!show || !actions) {
    return null;
  }
  return <div className="after-win-controls">{actions}</div>;
};
