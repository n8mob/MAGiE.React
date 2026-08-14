import { CSSProperties, RefObject, useLayoutEffect, useMemo, useState } from "react";

const MIN_PROSE_PX = 12;
// A modest step up from the normal 16px text. Four-bit encodings can make bits
// enormous, but prose should not follow them into headline territory.
const MAX_PROSE_PX = 20;
// Exact-fit text is prone to losing its final glyph to fractional-pixel font
// metrics, scrollbars, and small differences in mobile font rasterization.
const TEXT_SAFETY_PX = 16;
const TEXT_FIT_RATIO = 0.98;

type PuzzleSizingStyle = CSSProperties & { "--puzzle-prose-size"?: string };

/** Maximize a known-width bit row, reserving its fixed text gutters. */
export function useMaximizedBitSize(
  containerRef: RefObject<HTMLElement | null>,
  bitCount: number,
  reservedWidthPx: number,
  minimumPx: number,
  maximumPx: number
) {
  const [bitSize, setBitSize] = useState(minimumPx);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || bitCount < 1) {
      return;
    }
    const measure = () => setBitSize(Math.min(maximumPx, Math.max(
      minimumPx,
      Math.floor((container.clientWidth - reservedWidthPx) / bitCount)
    )));
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [bitCount, containerRef, maximumPx, minimumPx, reservedWidthPx]);

  return bitSize;
}

/** Fit authored lines to the display while preserving their deliberate breaks. */
export function usePuzzleProseSizing(
  containerRef: RefObject<HTMLElement | null>,
  lines: string[]
): PuzzleSizingStyle {
  const [proseSize, setProseSize] = useState<number>();
  const lineKey = lines.join("\u0000");
  const authoredLines = useMemo(
    () => lineKey.split("\u0000").filter(Boolean),
    [lineKey]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || authoredLines.length === 0) {
      setProseSize(undefined);
      return;
    }

    const measure = () => {
      const availableWidth = Math.max(0, container.clientWidth - TEXT_SAFETY_PX);
      const computed = getComputedStyle(container);
      const baseSize = parseFloat(computed.fontSize) || 16;
      if (availableWidth === 0) {
        return;
      }
      const probe = document.createElement("div");
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.width = "max-content";
      probe.style.whiteSpace = "pre";
      probe.style.fontFamily = computed.fontFamily;
      probe.style.fontSize = `${baseSize}px`;
      probe.style.fontStyle = computed.fontStyle;
      probe.style.fontWeight = computed.fontWeight;
      probe.style.fontStretch = computed.fontStretch;
      probe.style.letterSpacing = computed.letterSpacing;
      probe.style.textTransform = computed.textTransform;
      for (const line of authoredLines) {
        const lineProbe = document.createElement("div");
        lineProbe.textContent = line;
        probe.appendChild(lineProbe);
      }
      document.body.appendChild(probe);
      const measuredWidth = Math.max(
        ...Array.from(probe.children, child => child.getBoundingClientRect().width)
      );
      probe.remove();
      if (measuredWidth === 0) {
        return;
      }
      setProseSize(Math.min(MAX_PROSE_PX, Math.max(
        MIN_PROSE_PX,
        baseSize * availableWidth / measuredWidth * TEXT_FIT_RATIO
      )));
    };

    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(container);
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [authoredLines, containerRef]);

  return proseSize === undefined ? {} : { "--puzzle-prose-size": `${proseSize}px` };
}
