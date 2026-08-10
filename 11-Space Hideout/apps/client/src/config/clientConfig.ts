export const CLIENT_CONFIG = {
  serverUrl: import.meta.env.VITE_SERVER_URL ?? "http://127.0.0.1:3001",
  staticDemo: import.meta.env.VITE_STATIC_DEMO === "1",
  clientVersion: "hns-rebuild-client-0.1.0",
  canvasWidth: 1280,
  canvasHeight: 720
} as const;
