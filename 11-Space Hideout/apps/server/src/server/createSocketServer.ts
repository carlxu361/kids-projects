import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from "@space-hideout/shared";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { RoundState } from "../round/roundState.js";
import { createHealthResponse } from "./createHealth.js";

export function createSocketServer(httpServer: HttpServer, roundState: RoundState) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    }
  );

  io.on("connection", (socket) => {
    socket.data.connectedAt = Date.now();
    socket.emit("server:hello", {
      message: "Connected to rebuilt Hide n Seek server.",
      health: createHealthResponse(roundState.phase)
    });

    socket.on("client:hello", () => {
      socket.emit("server:hello", {
        message: "Client handshake accepted.",
        health: createHealthResponse(roundState.phase)
      });
    });
  });

  return io;
}
