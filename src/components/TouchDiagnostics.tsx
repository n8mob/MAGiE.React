import { FC, useEffect, useState } from "react";

/**
 * Temporary on-screen instrumentation for issue #186 (adjacent bits cancelling
 * each other on touch). Renders only when the URL carries ?diag=touch, so it
 * costs nothing in normal play.
 *
 * Answers two questions without needing a USB cable:
 *  1. Did the touch-action CSS actually reach the bit checkboxes?
 *  2. For a 3-then-4 tap, what events fire, on which bit, and how far apart?
 */

interface LogEntry {
  type: string;
  bit: string;
  delta: number;
}

const MAX_ENTRIES = 14;

const TouchDiagnostics: FC = () => {
  const [styleInfo, setStyleInfo] = useState<string>("looking for a bit…");
  const [log, setLog] = useState<LogEntry[]>([]);

  // Poll until a bit checkbox exists, then report what CSS actually applied.
  useEffect(() => {
    const read = () => {
      const bit = document.querySelector<HTMLInputElement>("input.bit-checkbox");
      if (!bit) {
        return false;
      }
      const style = window.getComputedStyle(bit);
      const box = bit.getBoundingClientRect();
      setStyleInfo(
        `touch-action: ${style.touchAction} | user-select: ${style.userSelect} | ${Math.round(box.width)}x${Math.round(box.height)}px`
      );
      return true;
    };
    if (read()) {
      return;
    }
    const timer = window.setInterval(() => { if (read()) { window.clearInterval(timer); } }, 400);
    return () => window.clearInterval(timer);
  }, []);

  // Capture-phase listeners so we see events regardless of what React does.
  useEffect(() => {
    let last = 0;
    const record = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.classList?.contains("bit-checkbox")) {
        return;
      }
      const now = Math.round(performance.now());
      const delta = last ? now - last : 0;
      last = now;
      const bit = target.dataset.bitIndex ?? "?";
      setLog(prev => [{ type: event.type, bit, delta }, ...prev].slice(0, MAX_ENTRIES));
    };

    const types = ["touchstart", "touchend", "pointerdown", "click", "change", "dblclick"];
    types.forEach(t => document.addEventListener(t, record, true));
    return () => types.forEach(t => document.removeEventListener(t, record, true));
  }, []);

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)", color: "#0f0",
        font: "11px/1.35 ui-monospace, Menlo, monospace",
        padding: "4px 6px", textTransform: "none", maxHeight: "42vh", overflowY: "auto",
      }}
    >
      <div style={{ color: "#ff0", marginBottom: 3 }}>{styleInfo}</div>
      <button
        onClick={() => setLog([])}
        style={{ font: "inherit", marginBottom: 3, padding: "1px 6px" }}
      >
        clear
      </button>
      {log.map((entry, i) => (
        <div key={i}>
          +{String(entry.delta).padStart(4)}ms {entry.type.padEnd(11)} bit[{entry.bit}]
        </div>
      ))}
    </div>
  );
};

export { TouchDiagnostics };
