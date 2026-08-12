import { CSSProperties, RefObject, useLayoutEffect, useMemo, useState } from "react";

const MIN_PROSE_PX = 12;
const MAX_PROSE_PX = 24;
const TEXT_SAFETY_PX = 8;

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
  const longestLine = useMemo(
    () => lines.reduce((longest, line) => line.length > longest.length ? line : longest, ""),
    [lines]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !longestLine) {
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
      const probe = document.createElement("span");
      probe.textContent = longestLine;
      probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${computed.font};font-size:${baseSize}px`;
      document.body.appendChild(probe);
      const measuredWidth = probe.getBoundingClientRect().width;
      probe.remove();
      if (measuredWidth === 0) {
        return;
      }
      setProseSize(Math.min(MAX_PROSE_PX, Math.max(
        MIN_PROSE_PX,
        baseSize * availableWidth / measuredWidth
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
  }, [containerRef, longestLine]);

  return proseSize === undefined ? {} : { "--puzzle-prose-size": `${proseSize}px` };
}
