# MAGiE Color Palette

All colors used in the project, with their semantic roles and source files.

---

## Core Palette

| Token (informal) | Value     | Role                                            | Where defined                     |
|------------------|-----------|-------------------------------------------------|-----------------------------------|
| `bg`             | `#d0d4d4` | Viewport / app background (light grey-teal)     | `index.css`, `App.css`            |
| `fg`             | `#1e272a` | Body text / foreground (dark teal-grey)         | `App.css`                         |
| `link`           | `#008080` | Link color (standard teal)                      | `index.css`                       |
| `link-hover`     | `#1ba8a8` | Link hover (lighter teal)                       | `index.css`                       |
| `accent`         | `#646cff` | Button hover, "coming soon" text (blue-violet)  | `index.css`, `Dialog.css`         |
| `error`          | `#962c2c` | Error messages (dark red)                       | `App.css`                         |
| `focus-ring`     | `#dfed84` | Keyboard focus outlines (yellow-green)          | `App.css`, `OnScreenKeyboard.css` |
| `panel-bg`       | `#d1d8d8` | Dialog / card background (slightly darker grey) | `Dialog.css`                      |
| `title`          | `silver`  | MAGiE title text (`h1#magie-title`)             | `App.css`                         |

---

## Overlay / Tint Colors

These are used inline rather than as named variables. Their roles are stable enough to document.

| Value                      | Role                                            | Where used              |
|----------------------------|-------------------------------------------------|-------------------------|
| `rgba(0, 0, 0, 0.3)`       | Drop shadow / subtle border                     | `App.css` (many places) |
| `rgba(0, 0, 0, 0.5)`       | Dialog backdrop overlay                         | `Dialog.css`            |
| `rgba(0, 0, 0, 0.25)`      | Stopwatch border (slightly lighter)             | `App.css`               |
| `rgba(0, 0, 0, 0.32)`      | Decode-guess display border                     | `App.css`               |
| `rgba(20, 33, 36, 0.12)`   | Inset panel fill (dark `fg` tint, ~12% opacity) | `App.css`               |
| `rgba(255, 255, 255, 0.2)` | Ghost button / frosted surface background       | `App.css`               |

---

## Bit-State Colors (Sprite-Based)

Bit correctness is expressed through pixel-art sprite swaps (`data-correctness` attribute), not CSS color values. The
visual colors of those sprites are:

| State     | CSS value (`data-correctness`) | Approximate color | Sprite files                              |
|-----------|--------------------------------|-------------------|-------------------------------------------|
| Default   | *(none / DoorLock)*            | Dark / black      | `Bit_off.png`, `Bit_on.png`               |
| Unguessed | `unguessed`                    | Yellow            | `Bit_off_Yellow.png`, `Bit_on_Yellow.png` |
| Correct   | `correct`                      | Teal              | `Bit_off_Teal.png`, `Bit_on_Teal.png`     |
| Incorrect | `incorrect`                    | Purple            | `Bit_off_Purple.png`, `Bit_on_Purple.png` |

Sprite files live in `src/assets/`. The switching is handled entirely by CSS attribute selectors in `App.css`.

---

## Notes

- No CSS custom properties (`--color-*` variables) are currently used for color — values are hardcoded per-rule.
- The `fg` dark-teal (`#1e272a`) and the `bg` light-grey (`#d0d4d4`) are derived from the same teal family, giving the
  UI its muted, LCD-screen feel.
- `focus-ring` (`#dfed84`) intentionally contrasts against both `bg` and `panel-bg` for accessibility.
- If CSS variables are introduced later, the natural groupings above make good candidates for the initial set.
