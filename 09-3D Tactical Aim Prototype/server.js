const http = require("http");
const fs = require("fs");
const path = require("path");

const preferredPort = Number(process.env.PORT || 5173);
const root = __dirname;
const startedAt = Date.now();
const room = {
  id: "local-room-01",
  name: "裂界训练房",
  mode: "本地战术房间",
  map: "裂界工地",
  phase: "local-simulation",
  tickRate: 20,
  players: 10,
  slots: { attackers: 5, defenders: 5 },
  scoreLimit: 13,
  objective: "attackers-pick-and-plant-core",
  features: ["buy-phase", "5v5-bots", "spike-objective", "tactical-pings"],
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const filePath = path.normalize(path.join(root, clean === "/" ? "index.html" : clean));
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith("/api/status")) {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify({
      ok: true,
      ...room,
      uptime: Date.now() - startedAt,
      time: Date.now(),
    }));
    return;
  }

  const filePath = safePath(req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
});

function listen(port, attempts = 0) {
  server.removeAllListeners("error");
  server.removeAllListeners("listening");
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempts < 20 && !process.env.PORT) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, trying ${nextPort}...`);
      listen(nextPort, attempts + 1);
      return;
    }
    throw error;
  });
  server.once("listening", () => {
    const address = server.address();
    const actualPort = address && typeof address === "object" ? address.port : port;
    console.log(`Local server: http://127.0.0.1:${actualPort}/`);
  });

  server.listen(port, "127.0.0.1");
}

listen(preferredPort);
