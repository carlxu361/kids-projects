export const SERVER_CONFIG = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://127.0.0.1:5173"
} as const;
