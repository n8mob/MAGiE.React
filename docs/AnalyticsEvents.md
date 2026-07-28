[//]: # (TODO: is this a dead document? I think magie-analytics-spec is more correct and up to date.)

# Analytics Events

MAGiE uses [react-ga4](https://www.npmjs.com/package/react-ga4) (GA4 measurement ID: `G-ZL5RKDBBF6`).

Debug mode is enabled when `VITE_GA_DEBUG=true` or the `_dbg` URL parameter is present.

---

## Page Views

### `pageview`

- **Source**: `src/hooks/usePageTracking.ts`
- **Trigger**: Every route change (pathname or search string)
- **Parameters**: sent via `ReactGA4.send()`
  
  | Parameter | Value               |
  |-----------|---------------------|
  | `hitType` | `'pageview'`        |
  | `page`    | `pathname + search` |

---

## Gameplay

### `win`

Fired twice — once from `PlayPuzzle` (menu-based play) and once from `DatePlay` (daily puzzle). Both send the same
shape.

- **Sources**: `src/components/PlayPuzzle.tsx`, `src/components/DatePlay.tsx`
- **Trigger**: User solves a puzzle correctly
- **Parameters**:

  | Parameter            | Value                          |
  |----------------------|--------------------------------|
  | `puzzle_slug`        | Puzzle slug string             |
  | `winText`            | The target text for the puzzle |
  | `encoding`           | `puzzle.encoding_name`         |
  | `encoding_type`      | `puzzle.encoding.getType()`    |
  | `pagePath`           | `pathname + search`            |
  | `solve_time_seconds` | Elapsed seconds from stopwatch |

### `winning_judgment`

- **Source**: `src/components/useBasePuzzle.ts`
- **Trigger**: Judgment is evaluated and `isCorrect === true` (fires on every re-render that produces a correct
  judgment, before `win`)
- **Parameters**:

  | Parameter             | Value                             |
  |-----------------------|-----------------------------------|
  | `puzzle_slug`         | Puzzle slug string                |
  | `guess_text`          | Decoded text of the current guess |
  | `winText`             | The target text                   |
  | `encoding`            | `puzzle.encoding_name`            |
  | `encoding_type`       | `puzzle.encoding.getType()`       |
  | `judgment_is_correct` | `true`                            |
  | `pagePath`            | `pathname + search`               |

### `guess`

- **Source**: `src/components/useBasePuzzle.ts`
- **Trigger**: Judgment is evaluated and `isCorrect === false` (fires on every bit-change that doesn't yet solve the
  puzzle)
- **Parameters**: Same shape as `winning_judgment`, with `judgment_is_correct: false`

---

## Navigation

### `story_start_clicked`

Fired from two places with slightly different parameter sets.

- **Sources**: `src/components/LevelPlay.tsx`, `src/components/DatePlay.tsx`
- **Trigger**: User clicks the post-win navigation button/link
- **Parameters**:

  | Parameter        | Present in    | Value                                 |
  |------------------|---------------|---------------------------------------|
  | `source`         | both          | `'post-win-link'`                     |
  | `puzzle_slug`    | both          | Puzzle slug string                    |
  | `is_first_visit` | DatePlay only | `boolean` (from `isFirstVisit` state) |

---

## UI / Settings

### `open_settings_dialog`

- **Source**: `src/App.tsx`
- **Trigger**: User clicks the ⋮ button in the header
- **Parameters**:

  | Parameter | Value               |
  |-----------|---------------------|
  | `source`  | `'activate_dialog'` |
  | `dialog`  | `'settings'`        |

### `open_help_dialog`

- **Source**: `src/App.tsx`
- **Trigger**: User clicks the ? button in the header
- **Parameters**:

  | Parameter        | Value                                                 |
  |------------------|-------------------------------------------------------|
  | `source`         | `'activate_dialog'`                                   |
  | `dialog`         | `'help'`                                              |
  | `is_first_visit` | `boolean` (`isFirstVisit` localStorage key is absent) |

### `font_preference_change`

- **Source**: `src/components/SettingsContent.tsx`
- **Trigger**: User toggles the "Use LCD font" checkbox in the settings dialog
- **Parameters**:

  | Parameter | Value                             |
  |-----------|-----------------------------------|
  | `source`  | `'settings_dialog'`               |
  | `action`  | `'toggle_font'`                   |
  | `value`   | `'hd44780'` or `'press_start_2p'` |

---

## Debug / Initialization

### `debug_mode_enabled`

- **Source**: `src/App.tsx`
- **Trigger**: App initializes with `VITE_GA_DEBUG=true` or `?_dbg` in the URL
- **Parameters**:

  | Parameter    | Value  |
  |--------------|--------|
  | `debug_mode` | `true` |
