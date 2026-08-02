import type { HealthResponse } from "@space-hideout/shared";
import type { ClientNetwork } from "../network/ClientNetwork";
import { readableHealth } from "./statusText";

export function bindHomeUi(network: ClientNetwork): void {
  const connectButton = document.querySelector<HTMLButtonElement>("#connect-button");

  void refreshHealth(network);
  connectButton?.addEventListener("click", () => {
    setText("#socket-status", "连接中");
    network.connect((message, health) => {
      setText("#socket-status", message);
      renderHealth(health);
    });
  });
}

async function refreshHealth(network: ClientNetwork): Promise<void> {
  try {
    renderHealth(await network.fetchHealth());
  } catch {
    setText("#http-status", readableHealth(false));
  }
}

function renderHealth(health: HealthResponse): void {
  setText("#http-status", readableHealth(health.ok));
  setText("#phase-status", health.phase);
  setText("#protocol-status", health.protocolVersion);
}

function setText(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.textContent = value;
  }
}
