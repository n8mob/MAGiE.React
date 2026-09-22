// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

/*
 * VITE_EXTRA_FEATURES exists so that unlocking an area on one developer's
 * machine is a line in .env.local rather than a commit — a change to
 * NORMAL_FEATURES for local testing had already reached a shared branch once,
 * which would have shipped the mall to everybody.
 *
 * The constant is read at module load, so each case resets the module registry
 * and imports the hook again.
 */

const flagsWith = async (extra?: string) => {
  vi.resetModules();
  if (extra === undefined) {
    vi.stubEnv("VITE_EXTRA_FEATURES", "");
  } else {
    vi.stubEnv("VITE_EXTRA_FEATURES", extra);
  }
  const { useFeatureFlags } = await import("../hooks/useFeatureFlags");
  return renderHook(() => useFeatureFlags()).result.current;
};

afterEach(() => {
  vi.unstubAllEnvs();
  cleanup();
});

describe("feature flags", () => {
  it("ships the normal set when nothing is set locally", async () => {
    const features = await flagsWith();
    expect([...features].sort()).toEqual(["chocolate", "date", "doorLock", "tutorial"]);
    // The gated areas stay gated — this is what production gets.
    expect(features).not.toContain("mall");
    expect(features).not.toContain("vintage");
  });

  it("adds the local extras to the normal set", async () => {
    const features = await flagsWith("mall,vintage");
    expect(features).toContain("mall");
    expect(features).toContain("vintage");
    // Without losing anything that was already on.
    expect(features).toContain("tutorial");
  });

  it("tolerates spacing and empty entries", async () => {
    const features = await flagsWith(" mall , , vintage ");
    expect(features).toContain("mall");
    expect(features).toContain("vintage");
    expect(features).not.toContain("");
  });

  it("never lists a feature twice", async () => {
    const features = await flagsWith("chocolate,mall");
    expect(features.filter(feature => feature === "chocolate")).toHaveLength(1);
  });
});
