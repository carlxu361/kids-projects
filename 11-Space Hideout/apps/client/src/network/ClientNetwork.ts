import type {
  HealthResponse,
  ServerToClientEvents,
  ClientToServerEvents
} from "@space-hideout/shared";
import { io, type Socket } from "socket.io-client";
import { CLIENT_CONFIG } from "../config/clientConfig";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class ClientNetwork {
  private socket?: GameSocket;

  constructor(private readonly serverUrl: string) {}

  async fetchHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.serverUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with ${response.status}`);
    }

    return (await response.json()) as HealthResponse;
  }

  connect(onHello: (message: string, health: HealthResponse) => void): void {
    this.socket?.disconnect();
    this.socket = io(this.serverUrl);
    this.socket.on("server:hello", (payload) => {
      onHello(payload.message, payload.health);
    });
    this.socket.on("connect", () => {
      this.socket?.emit("client:hello", { clientVersion: CLIENT_CONFIG.clientVersion });
    });
  }
}
