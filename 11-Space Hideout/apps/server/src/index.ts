import { createServer } from "node:http";
import { SERVER_CONFIG } from "./config/serverConfig.js";
import { createInitialRoundState } from "./round/roundState.js";
import { createApp } from "./server/createApp.js";
import { createSocketServer } from "./server/createSocketServer.js";

const roundState = createInitialRoundState();
const app = createApp(roundState);
const httpServer = createServer(app);

createSocketServer(httpServer, roundState);

httpServer.listen(SERVER_CONFIG.port, () => {
  console.log(`Space Hideout rebuilt server listening on http://127.0.0.1:${SERVER_CONFIG.port}`);
});
