MAGiE Architecture Philosophy
=============================

## Purpose
MAGiE is a puzzle and encoding game inspired by retro computing and low-level bit manipulation.
Its core systems are designed for readability, flexibility, and future growth.

## Core Concepts

### BitSequence
- Represents a sequence of bits (`'0' | '1'`) as structured, interactive objects.
- Supports safe toggling, serialization (`toPlainString()`), and future metadata extensions (like judgment or animation states).
- Used internally for all encoding and decoding operations.

### DisplayRow
- Extends BitSequence for UI purposes.
- Adds optional decoded character annotations for player feedback.
- Keeps display logic cleanly separated from encoding logic.

## Design Priorities
- **Separation of concerns:** Core bit logic vs. display logic are cleanly separated.
- **Type safety:** TypeScript is leveraged to catch errors early and document intentions.
- **Future-proofing:** New puzzle types (e.g., XOR puzzles, timed challenges) can build on these clean abstractions.
- **Readable source code:** Future players, hackers, and contributors should be able to explore and extend the game easily.

## Inspiration
- "Slow is smooth. Smooth is fast."
- "Compound interest: pay it on your tech debt, or earn it on good architecture."
- The spirit of open systems and educational computing.

---

*(Written by ChatGPT for future players, future teammates, and future me.)*
