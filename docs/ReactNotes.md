# React Notes

## Various React Hooks
(Summary by ChatGPT)

| # | Hook             | What It Does                                                                                           | When It Runs / What Triggers It                            | Use Case / Analogy                                                                |
|---|------------------|--------------------------------------------------------------------------------------------------------|------------------------------------------------------------|-----------------------------------------------------------------------------------|
| 1 | useState         | Stores “reactive” state (when it changes, the UI updates)                                              | Whenever you call its setter; persists per component       | For UI-driven data you want to change & react to (“React reacts!”)                |
| 2 | use\[Custom]Hook | A logic bundle—composes related hooks (state, effects, etc.); each usage creates its own state/effects | Follows whatever hooks are used inside; per usage instance | Like a recipe or macro: each time you use it, a new, independent batch is created |
| 3 | useMemo          | Caches a *derived* value (avoids re-calculating unless needed); does **not** cause re-render by itself | On mount and when dependencies change                      | For computed values (not stored or user-driven), only recalculated as needed      |
| 4 | useCallback      | Caches a function/closure so its reference stays stable unless dependencies change                     | On mount and when dependencies change                      | Use when passing functions to memoized children to avoid unnecessary re-renders   |
