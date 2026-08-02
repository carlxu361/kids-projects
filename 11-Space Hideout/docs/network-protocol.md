# Network Protocol

## Version

Current protocol:

```text
hns-rebuild-0.1.0
```

This protocol is not compatible with the old client or old server.

## HTTP

```http
GET /health
```

Returns:

```ts
interface HealthResponse {
  ok: true;
  service: "space-hideout-server";
  protocolVersion: string;
  phase: RoundPhase;
  uptimeSeconds: number;
}
```

## Socket.IO

Server sends:

```ts
"server:hello";
```

Client sends:

```ts
"client:hello";
```

Stage 1 has no gameplay network events.
