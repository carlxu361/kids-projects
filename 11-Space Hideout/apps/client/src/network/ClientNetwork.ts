import type {
  HealthResponse,
  ServerToClientEvents,
  ClientToServerEvents
} from "@space-hideout/shared";
import { PROTOCOL_VERSION } from "@space-hideout/shared";
import { io, type Socket } from "socket.io-client";
import { CLIENT_CONFIG } from "../config/clientConfig";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class ClientNetwork {
  private socket?: GameSocket;

  constructor(
    private readonly serverUrl: string,
    private readonly staticDemo: boolean
  ) {}

  async fetchHealth(): Promise<HealthResponse> {
    if (this.staticDemo) {
      return createStaticDemoHealth();
    }

    const response = await fetch(`${this.serverUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with ${response.status}`);
    }

    return (await response.json()) as HealthResponse;
  }

  connect(onHello: (message: string, health: HealthResponse) => void): void {
    if (this.staticDemo) {
      window.setTimeout(() => {
        onHello("在线演示已载入：当前展示外观、AI 状态和动画预览", createStaticDemoHealth());
      }, 120);
      return;
    }

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

function createStaticDemoHealth(): HealthResponse {
  return {
    ok: true,
    service: "space-hideout-server",
    protocolVersion: `${PROTOCOL_VERSION}-static-demo`,
    phase: "lobby",
    uptimeSeconds: 0
  };
}
