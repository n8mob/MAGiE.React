// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DualChannel } from "../components/DualChannel";
import { TRANSMISSIONS } from "../dualChannel/transmissions";
import { fiveBitA1 } from "../encoding/FiveBitA1";

/*
 * The strip is the whole feature. It is the only thing on screen telling a
 * first-time player that a second channel exists, so what these cover is that
 * it stays present, stays tunable, and goes unread when the broadcast moves on
 * without it.
 */

vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
  primeAudio: vi.fn(),
}));
vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));

const renderChannels = () => render(<MemoryRouter><DualChannel /></MemoryRouter>);

const strip = () => document.querySelector(".channel-strip") as HTMLElement;

afterEach(cleanup);

describe("dual channel", () => {
  it("opens tuned to the announcement, with the side channel only a strip", () => {
    renderChannels();

    expect(screen.getByText(TRANSMISSIONS[0].announcement[0])).toBeTruthy();
    expect(strip().textContent).toContain("CH 2");
    // The secret is never spelled out on the strip — only its bits leak.
    expect(strip().textContent).not.toContain(TRANSMISSIONS[0].secret);
  });

  it("starts with the side channel unread, because nothing else invites the player over", () => {
    renderChannels();
    expect(strip().classList.contains("unread")).toBe(true);
  });

  it("tunes to the other channel when the strip is pressed, and clears its unread mark", () => {
    renderChannels();

    fireEvent.click(strip());

    // CH 1 is now the strip, and the bits have the screen.
    expect(strip().textContent).toContain("CH 1");
    expect(document.querySelectorAll(".bit-checkbox").length)
      .toBe(fiveBitA1.encodeText(TRANSMISSIONS[0].secret).length);
    expect(strip().classList.contains("unread")).toBe(false);
  });

  it("marks the channel you are not watching unread when the broadcast advances", () => {
    renderChannels();

    // Tune to CH 2 and back, so both channels are caught up.
    fireEvent.click(strip());
    fireEvent.click(strip());
    expect(strip().classList.contains("unread")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText(TRANSMISSIONS[1].announcement[0])).toBeTruthy();
    expect(strip().classList.contains("unread")).toBe(true);
  });

  it("stops advancing at the end of the broadcast", () => {
    renderChannels();

    for (let i = 1; i < TRANSMISSIONS.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    }

    const lastAdvance = screen.getByRole("button", { name: /end of broadcast/i });
    expect(lastAdvance.hasAttribute("disabled")).toBe(true);
  });

  it("keeps the secret out of the DOM until the decoder is opened", () => {
    renderChannels();
    fireEvent.click(strip());

    expect(screen.queryByText(TRANSMISSIONS[0].secret[0])).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /decoder/i }));

    // Annotations are per row, one character each.
    expect(screen.getAllByText(TRANSMISSIONS[0].secret[0]).length).toBeGreaterThan(0);
  });
});
