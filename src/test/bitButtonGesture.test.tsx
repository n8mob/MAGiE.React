// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { BitButton } from "../components/BitButton";
import { IndexedBit } from "../IndexedBit";

afterEach(cleanup);

const gesture = (
  input: HTMLInputElement,
  pointerId: number,
  from: [number, number],
  to: [number, number],
) => {
  fireEvent.pointerDown(input, { pointerId, clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(input, { pointerId, clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(input, { pointerId, clientX: to[0], clientY: to[1] });
};

describe("bit button pointer gestures", () => {
  it("toggles a tap on pointerup, not pointerdown", () => {
    const onBitToggle = vi.fn();
    const { getByRole } = render(
      <BitButton bit={IndexedBit.falseAtIndex(3)} onBitToggle={onBitToggle} />
    );
    const bit = getByRole("checkbox") as HTMLInputElement;

    fireEvent.pointerDown(bit, { pointerId: 1, clientX: 20, clientY: 20 });
    expect(onBitToggle).not.toHaveBeenCalled();

    fireEvent.pointerUp(bit, { pointerId: 1, clientX: 20, clientY: 20 });
    expect(onBitToggle).toHaveBeenCalledOnce();
    expect(onBitToggle).toHaveBeenCalledWith(3);
  });

  it("treats generous finger wobble as a tap", () => {
    const onBitToggle = vi.fn();
    const { getByRole } = render(
      <BitButton bit={IndexedBit.falseAtIndex(0)} onBitToggle={onBitToggle} />
    );

    gesture(getByRole("checkbox") as HTMLInputElement, 2, [10, 10], [22, 20]);

    expect(onBitToggle).toHaveBeenCalledOnce();
  });

  it("does not toggle a clear drag", () => {
    const onBitToggle = vi.fn();
    const { getByRole } = render(
      <BitButton bit={IndexedBit.falseAtIndex(0)} onBitToggle={onBitToggle} />
    );

    gesture(getByRole("checkbox") as HTMLInputElement, 3, [10, 10], [10, 40]);

    expect(onBitToggle).not.toHaveBeenCalled();
  });

  it("does not toggle when the browser takes the gesture for scrolling", () => {
    const onBitToggle = vi.fn();
    const { getByRole } = render(
      <BitButton bit={IndexedBit.falseAtIndex(0)} onBitToggle={onBitToggle} />
    );
    const bit = getByRole("checkbox") as HTMLInputElement;

    fireEvent.pointerDown(bit, { pointerId: 4, clientX: 10, clientY: 10 });
    fireEvent.pointerCancel(bit, { pointerId: 4 });
    fireEvent.pointerUp(bit, { pointerId: 4, clientX: 10, clientY: 10 });

    expect(onBitToggle).not.toHaveBeenCalled();
  });

  it("keeps rapid adjacent taps distinct", () => {
    const onBitToggle = vi.fn();
    const { getAllByRole } = render(
      <>
        <BitButton bit={IndexedBit.falseAtIndex(0)} onBitToggle={onBitToggle} />
        <BitButton bit={IndexedBit.falseAtIndex(1)} onBitToggle={onBitToggle} />
      </>
    );
    const [first, second] = getAllByRole("checkbox") as HTMLInputElement[];

    gesture(first, 5, [10, 10], [10, 10]);
    gesture(second, 6, [42, 10], [42, 10]);

    expect(onBitToggle.mock.calls).to.deep.equal([[0], [1]]);
  });
});
