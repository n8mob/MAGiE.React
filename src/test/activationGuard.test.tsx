// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useActivationGuard } from "../hooks/useActivationGuard";

/*
 * Bits toggle on pointerdown (#186), so the winning tap re-renders the DOM while
 * the finger is still down, and the click that follows is hit-tested against the
 * new layout. On touch the browser synthesises that click at the touch point
 * after touchend, so it lands on whatever now occupies the spot — the [Next ▶▶]
 * button that just appeared, skipping the win message.
 *
 * fireEvent.click defaults to detail 0, which is how a *keyboard* activation
 * reports itself. Every pointer-driven case below therefore passes detail 1
 * explicitly, or it would be testing the wrong path.
 */

const Guarded = ({ onActivate }: { onActivate: () => void }) => {
  const control = useActivationGuard(onActivate);
  return <button type="button" {...control}>Next</button>;
};

const renderGuarded = () => {
  const onActivate = vi.fn();
  render(<Guarded onActivate={onActivate} />);
  return { onActivate, button: screen.getByRole("button", { name: "Next" }) };
};

afterEach(cleanup);

describe("useActivationGuard", () => {
  it("ignores a click that never went down on this control", () => {
    const { onActivate, button } = renderGuarded();

    fireEvent.click(button, { detail: 1 });

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("honours a click that began on this control", () => {
    const { onActivate, button } = renderGuarded();

    fireEvent.pointerDown(button);
    fireEvent.click(button, { detail: 1 });

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("honours keyboard activation, which has no pointerdown to match", () => {
    const { onActivate, button } = renderGuarded();

    // detail 0 is what a real Enter/Space activation reports.
    fireEvent.click(button, { detail: 0 });

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("disarms after use, so one press can't authorise a later stray click", () => {
    const { onActivate, button } = renderGuarded();

    fireEvent.pointerDown(button);
    fireEvent.click(button, { detail: 1 });
    fireEvent.click(button, { detail: 1 });

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("disarms on pointercancel, which produces no click of its own", () => {
    const { onActivate, button } = renderGuarded();

    fireEvent.pointerDown(button);
    fireEvent.pointerCancel(button);
    fireEvent.click(button, { detail: 1 });

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("cancels the rejected click, so a guarded <Link> won't still navigate", () => {
    const { button } = renderGuarded();

    // dispatchEvent returns false when preventDefault was called.
    expect(fireEvent.click(button, { detail: 1 })).to.equal(false);
  });

  it("leaves an honoured click alone, so default navigation still happens", () => {
    const { button } = renderGuarded();

    fireEvent.pointerDown(button);
    expect(fireEvent.click(button, { detail: 1 })).to.equal(true);
  });

  it("stays usable for every press after the first", () => {
    const { onActivate, button } = renderGuarded();

    for (let press = 0; press < 3; press++) {
      fireEvent.pointerDown(button);
      fireEvent.click(button, { detail: 1 });
    }

    expect(onActivate).toHaveBeenCalledTimes(3);
  });
});
