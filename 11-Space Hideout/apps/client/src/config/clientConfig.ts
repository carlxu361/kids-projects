export const CLIENT_CONFIG = {
  serverUrl: import.meta.env.VITE_SERVER_URL ?? "http://127.0.0.1:3001",
  clientVersion: "hns-rebuild-client-0.1.0",
  canvasWidth: 960,
  canvasHeight: 540
} as const;
