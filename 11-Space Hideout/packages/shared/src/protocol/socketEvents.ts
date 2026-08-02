import type { HealthResponse } from "./health.js";

export interface ServerHelloEvent {
  message: string;
  health: HealthResponse;
}

export interface ClientToServerEvents {
  "client:hello": (payload: { clientVersion: string }) => void;
}

export interface ServerToClientEvents {
  "server:hello": (payload: ServerHelloEvent) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  connectedAt: number;
}
