/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_USER_POOL_ID: string;
  readonly VITE_APP_USER_POOL_CLIENT_ID: string;
  readonly VITE_APP_CHAT_API_ENDPOINT: string;
  readonly VITE_APP_CHAT_WS_ENDPOINT: string;
  readonly VITE_APP_ALERTS_API_ENDPOINT: string;
  readonly VITE_APP_CHIME_BACKEND: string;
  readonly VITE_APP_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
