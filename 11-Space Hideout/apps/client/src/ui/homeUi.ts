import type { HealthResponse } from "@space-hideout/shared";
import { CLIENT_CONFIG } from "../config/clientConfig";
import { ThreatPulseAudio } from "../audio/ThreatPulseAudio";
import type { ClientNetwork } from "../network/ClientNetwork";
import { readableHealth } from "./statusText";

type AppearanceKey = "color" | "hat" | "mask" | "pack" | "expression";
type AppearanceState = Record<AppearanceKey, string>;

const appearance: AppearanceState = {
  color: "#31d8c8",
  hat: "cap",
  mask: "clear",
  pack: "utility",
  expression: "calm"
};
const threatPulseAudio = new ThreatPulseAudio();

export function bindHomeUi(network: ClientNetwork): void {
  const connectButton = document.querySelector<HTMLButtonElement>("#connect-button");
  const trainingButton = document.querySelector<HTMLButtonElement>("#training-button");
  const overviewButton = document.querySelector<HTMLButtonElement>("#overview-button");
  const startRoundButton = document.querySelector<HTMLButtonElement>("#start-round-button");
  const matchButton = document.querySelector<HTMLButtonElement>("#match-button");
  const launcherForm = document.querySelector<HTMLFormElement>("#launcher-form");

  bindPlaytestTelemetry();
  bindAppearanceControls();
  void refreshHealth(network);

  const onConnected = (message: string, health: HealthResponse): void => {
    setText("#socket-status", message);
    renderHealth(health);
    setText("#launcher-message", "服务器已连接。快速匹配会在阶段 2 接入房间和移动。");
    if (matchButton && !CLIENT_CONFIG.staticDemo) {
      matchButton.disabled = false;
      matchButton.textContent = "匹配即将开放";
    }
  };

  if (CLIENT_CONFIG.staticDemo) {
    document.body.dataset.staticDemo = "true";
    if (connectButton) connectButton.textContent = "在线试玩已载入";
    if (matchButton) matchButton.textContent = "多人联机筹备中";
    network.connect(onConnected);
  } else {
    bindLauncher(launcherForm);
    connectButton?.addEventListener("click", () => {
      setText("#socket-status", "连接中");
      network.connect(onConnected);
    });
  }

  trainingButton?.addEventListener("click", () => {
    window.dispatchEvent(new Event("space-hideout:reset"));
  });
  overviewButton?.addEventListener("click", () => {
    window.dispatchEvent(new Event("space-hideout:overview"));
  });
  startRoundButton?.addEventListener("click", () => {
    window.dispatchEvent(new Event("space-hideout:start"));
  });
  window.addEventListener("space-hideout:round-started", () => {
    document.querySelector<HTMLElement>("#mission-briefing")?.setAttribute("hidden", "");
  });
  window.addEventListener("space-hideout:round-reset", () => {
    document.querySelector<HTMLElement>("#mission-briefing")?.removeAttribute("hidden");
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

function bindPlaytestTelemetry(): void {
  document.addEventListener("pointerdown", () => threatPulseAudio.enable(), { once: true });

  window.addEventListener("space-hideout:telemetry", (event) => {
    const detail = (
      event as CustomEvent<{
        x: number;
        y: number;
        danger: number;
        remainingSeconds: number;
        phase: "hide" | "final_hide" | "ended";
      }>
    ).detail;
    if (!detail) return;
    setText("#position-readout", `坐标 ${detail.x} · ${detail.y}`);
    renderDanger(detail.danger);
    threatPulseAudio.update(detail.danger);
    setText("#danger-status", dangerCopy(detail.danger));
    setText("#round-clock", formatRoundTime(detail.remainingSeconds));
    setText("#round-phase", roundPhaseCopy(detail.phase));
  });

  window.addEventListener("space-hideout:task", (event) => {
    const detail = (event as CustomEvent<{ completed: number }>).detail;
    if (detail) setText("#task-status", `${detail.completed} / 3`);
  });

  window.addEventListener("space-hideout:vent", (event) => {
    const detail = (event as CustomEvent<{ uses: number }>).detail;
    if (detail) setText("#vent-status", `${detail.uses} 次`);
  });

  window.addEventListener("space-hideout:status", (event) => {
    const detail = (event as CustomEvent<{ message: string }>).detail;
    if (detail) setText("#game-status", detail.message);
  });
}

function formatRoundTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function roundPhaseCopy(phase: "hide" | "final_hide" | "ended"): string {
  if (phase === "final_hide") return "最终躲藏";
  if (phase === "ended") return "回合结束";
  return "普通躲藏";
}

function renderDanger(value: number): void {
  const normalized = Math.max(0, Math.min(1, value));
  const activeSegments = Math.ceil(normalized * 6);
  const console = document.querySelector<HTMLElement>("#danger-console");
  if (!console) return;

  const state = dangerState(normalized);
  console.dataset.dangerState = state;
  console.setAttribute("aria-valuenow", String(activeSegments));
  document.querySelectorAll<HTMLElement>("[data-danger-segment]").forEach((segment) => {
    const index = Number(segment.dataset.dangerSegment);
    segment.classList.toggle("is-active", index <= activeSegments);
  });
  setText("#danger-index", dangerIndex(state));
}

function dangerState(value: number): "silent" | "watch" | "alert" | "critical" {
  if (value > 0.78) return "critical";
  if (value > 0.52) return "alert";
  if (value > 0.25) return "watch";
  return "silent";
}

function dangerIndex(state: ReturnType<typeof dangerState>): string {
  if (state === "critical") return "临界";
  if (state === "alert") return "警报";
  if (state === "watch") return "侦测";
  return "静默";
}

function dangerCopy(value: number): string {
  if (value > 0.78) return "极度危险：立刻离开";
  if (value > 0.52) return "猎手正在接近";
  if (value > 0.25) return "侦测到远处扫描";
  return "扫描范围外";
}

function setText(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value;
}

function bindLauncher(launcherForm: HTMLFormElement | null): void {
  launcherForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>("#launch-url");
    const url = input?.value.trim();
    if (!url) {
      setText("#launcher-message", "先输入要打开的游戏网址。");
      return;
    }
    try {
      const parsedUrl = new URL(url);
      window.open(parsedUrl.toString(), "_blank", "noopener,noreferrer");
      setText("#launcher-message", `已尝试打开 ${parsedUrl.toString()}`);
    } catch {
      setText("#launcher-message", "网址格式不对，可以试试 http://127.0.0.1:5173");
    }
  });
}

function bindAppearanceControls(): void {
  const avatar = document.querySelector<HTMLElement>("#avatar-preview");
  const options = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-appearance-kind]")
  );

  for (const option of options) {
    option.addEventListener("click", () => {
      const key = option.dataset.appearanceKind as AppearanceKey | undefined;
      const value = option.dataset.appearanceValue;
      if (!key || !value || !avatar) return;

      appearance[key] = value;
      if (key === "color") avatar.style.setProperty("--avatar-color", value);
      else avatar.dataset[key] = value;

      for (const item of options) {
        if (item.dataset.appearanceKind === key)
          item.classList.toggle("is-active", item === option);
      }
      window.dispatchEvent(
        new CustomEvent("space-hideout:appearance", { detail: { [key]: value } })
      );
    });
  }
}
