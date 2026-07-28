/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_PREVIEW_ROW_LIMIT?: string;
  readonly VITE_CHART_ROW_LIMIT?: string;
  readonly VITE_LARGE_FILE_WARN_MB?: string;
  readonly VITE_LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
