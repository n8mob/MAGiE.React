import { FC, useEffect, useRef } from "react";

interface GuessDisplayProps {
  guessText: string;
  placeholder: string;
  showCursor?: boolean;
}

/**
 * The single-line "what you've entered so far" box shown above the puzzle inputs.
 * Overflow clips on the left (see .scroll-tail in App.css) and the view stays
 * pinned to the end of the text, so the newest input is always visible.
 */
const GuessDisplay: FC<GuessDisplayProps> = (
  {
    guessText,
    placeholder,
    showCursor = true,
  }) => {
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const display = displayRef.current;
    if (display) {
      display.scrollLeft = display.scrollWidth;
    }
  }, [guessText]);

  return (
    <div className="guess-text-display scroll-tail" aria-label="Current guess" ref={displayRef}>
      <span className={guessText.length > 0 ? "guess-text" : "guess-placeholder"}>
        {guessText.length > 0 ? guessText : placeholder}
      </span>
      {showCursor && (
        <span className="guess-cursor blink" aria-hidden="true">_</span>
      )}
    </div>
  );
};

export { GuessDisplay };
