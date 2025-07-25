# React Notes

## Various React Hooks
(Summary by ChatGPT)

| Hook        | What It Does                              | When It Runs             | When To Use                       |
| ----------- | ----------------------------------------- | ------------------------ | --------------------------------- |
| useState    | Persists value, causes rerender on change | Every time value changes | Component-local state             |
| use\[Hook]  | Composes hooks, returns values            | Follows internal hooks   | Share/compose logic               |
| useMemo     | Remembers computation result              | On mount & dep change    | Expensive calculations            |
| useCallback | Remembers function instance               | On mount & dep change    | Stable function refs for children |
