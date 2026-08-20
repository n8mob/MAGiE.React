import { useEffect } from "react";

// Every CorrectnessBitButton sprite: off/on pairs for unguessed (yellow),
// correct (teal), and incorrect (purple). There is no "hidden" sprite because
// hidden bits carry no data-correctness attribute and render nothing.
const BIT_SPRITE_URLS = [
  'assets/Bit_off_Yellow.png',
  'assets/Bit_on_Yellow.png',
  'assets/Bit_off_Teal.png',
  'assets/Bit_on_Teal.png',
  'assets/Bit_off_Purple.png',
  'assets/Bit_on_Purple.png',
];

/** Warm the browser's cache for every CorrectnessBitButton sprite on mount. */
export function usePreloadBitSprites(): void {
  useEffect(() => {
    BIT_SPRITE_URLS.forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
  }, []);
}
