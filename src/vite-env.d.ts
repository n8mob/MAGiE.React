/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAGIE_PUZZLE_API: string;
  readonly VITE_GA_DEBUG?: string;
  /** Comma-separated feature flags for one developer's machine. See useFeatureFlags. */
  readonly VITE_EXTRA_FEATURES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
