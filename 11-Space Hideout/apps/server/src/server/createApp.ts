import cors from "cors";
import express from "express";
import type { RoundState } from "../round/roundState.js";
import { createHealthResponse } from "./createHealth.js";

export function createApp(roundState: RoundState) {
  const app = express();

  app.use(cors());
  app.get("/health", (_request, response) => {
    response.json(createHealthResponse(roundState.phase));
  });

  return app;
}
