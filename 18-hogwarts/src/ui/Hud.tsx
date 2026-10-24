import { SPELLS } from "../spells/registry";
import { useGameStore } from "../core/state/game-store";

export function Hud() {
  const cameraMode = useGameStore((state) => state.cameraMode);
  const lumosEnabled = useGameStore((state) => state.lumosEnabled);
  const spell = SPELLS.lumos;

  return (
    <div className="hud">
      <section className="hud-card">
        <p className="eyebrow">P1 / Courtyard Study</p>
        <h1>魔法学院庭院</h1>
        <p className="hud-subtitle">夜色中的程序化灰盒场景。这里先验证空间、碰撞与双视角手感。</p>
        <div className="status-row">
          <span className="status-pill active">{cameraMode === "third" ? "第三人称" : "第一人称"}</span>
          <span className={`status-pill ${lumosEnabled ? "active" : ""}`}>Lumos {lumosEnabled ? "ON" : "OFF"}</span>
          <span className="status-pill placeholder">PLACEHOLDER ART</span>
        </div>
        <dl className="control-hints">
          <dt>WASD</dt><dd>移动</dd>
          <dt>Shift</dt><dd>奔跑</dd>
          <dt>Space</dt><dd>跳跃</dd>
          <dt>V</dt><dd>切换视角</dd>
          <dt>1</dt><dd>{spell.name}：动态照明</dd>
          <dt>F3</dt><dd>调试信息</dd>
        </dl>
      </section>
      {cameraMode === "first" && <div className="crosshair" aria-hidden="true" />}
      <div className="hud-footer">
        <div className="spell-card">
          <span className="spell-key">1</span>
          <div>
            <strong>{spell.name}</strong>
            <span>{lumosEnabled ? "魔杖正在照亮附近空间" : "按 1 点亮魔杖"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
