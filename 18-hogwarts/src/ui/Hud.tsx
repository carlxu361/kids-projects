import { useState } from "react";
import type { MoonwellQuestStage, MoonwellTargetId } from "../quests/quest-machine";
import { useGameStore } from "../core/state/game-store";
import { isSoundscapeEnabled, playMagicCue, toggleSoundscape } from "../core/audio/soundscape";

const objectives: Record<MoonwellQuestStage, string> = {
  arrival: "先与石井旁的教授交谈。",
  lesson: "按 1 举起魔杖，点亮 Lumos。",
  revealRunes: "循着微光，点亮庭院里的三枚月纹石。",
  openStudy: "石门已经开启。走过拱门，看看里面藏着什么。",
  insideStudy: "走近漂浮的徽记，取回失落的月之徽记。",
  complete: "月之徽记已收入收藏。庭院的古老秘密回应了你。",
};

const targetLabels: Record<MoonwellTargetId, string> = {
  mentor: "与弗立维教授交谈",
  "rune-dawn": "点亮「晨星」刻印",
  "rune-tide": "点亮「潮汐」刻印",
  "rune-dusk": "点亮「暮光」刻印",
  relic: "拾取月之徽记",
};

export function Hud() {
  const [soundEnabled, setSoundEnabled] = useState(isSoundscapeEnabled);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const quest = useGameStore((state) => state.quest);
  const nearbyTargetId = useGameStore((state) => state.nearbyTargetId);
  const toggleCameraMode = useGameStore((state) => state.toggleCameraMode);
  const toggleLumos = useGameStore((state) => state.toggleLumos);
  const interact = useGameStore((state) => state.interact);
  const runeCount = quest.activatedRunes.length;
  const currentObjective = objectives[quest.stage];

  const handleLumos = () => {
    const wasEnabled = useGameStore.getState().quest.lumosEnabled;
    toggleLumos();
    playMagicCue(wasEnabled ? "dim" : "lumos");
  };

  const handleInteract = () => {
    const before = useGameStore.getState().quest;
    interact();
    const after = useGameStore.getState().quest;
    if (before.stage !== after.stage) {
      playMagicCue(after.stage === "complete" ? "reward" : "discovery");
    } else if (before.activatedRunes.length !== after.activatedRunes.length) {
      playMagicCue("rune");
    }
  };

  return (
    <div className="hud">
      <div className="topline">
        <div className="location-mark"><span className="location-dot" />HOGWARTS&nbsp; / &nbsp;南庭回廊</div>
        <div className="topline-actions">
          <button
            className="sound-toggle"
            type="button"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled(toggleSoundscape())}
          >
            <span aria-hidden="true">{soundEnabled ? "♫" : "♪"}</span>
            {soundEnabled ? "声音开启" : "声音关闭"}
          </button>
          <span className="placeholder-mark">SPIKE · PLACEHOLDER ART</span>
        </div>
      </div>

      <section className="quest-card" aria-live="polite">
        <p className="eyebrow">第一章&nbsp; · &nbsp;月井回声</p>
        <h1>月庭的回声</h1>
        <p className="quest-description">{currentObjective}</p>
        {quest.stage === "revealRunes" && (
          <div className="rune-progress" aria-label={`已点亮 ${runeCount} 枚月纹石，共三枚`}>
            {[0, 1, 2].map((index) => (
              <span key={index} className={index < runeCount ? "rune-pip lit" : "rune-pip"} />
            ))}
            <span className="rune-count">{runeCount} / 3</span>
          </div>
        )}
        <div className="quest-divider" />
        <div className="spell-status">
          <span className={`lumos-orb ${quest.lumosEnabled ? "is-lit" : ""}`} />
          <span><strong>Lumos</strong><small>{quest.lumosEnabled ? "魔杖光照正在照亮石刻" : "魔杖光照已熄灭"}</small></span>
          <button className="spell-quick-action" type="button" aria-label="施放 Lumos" onClick={handleLumos}>1</button>
        </div>
      </section>

      <aside className="controls-card" aria-label="操作说明">
        <div className="control-line"><kbd>W A S D</kbd><span>移动</span></div>
        <div className="control-line"><kbd>SHIFT</kbd><span>奔跑</span></div>
        <div className="control-line"><kbd>MOUSE</kbd><span>转动视线</span></div>
        <div className="control-line"><kbd>V</kbd><span>切换视角</span></div>
        <div className="control-line"><kbd>F3</kbd><span>性能信息</span></div>
      </aside>

      {cameraMode === "first" && <div className="crosshair" aria-hidden="true" />}

      <div className="lower-left">
        <button className="spell-card spell-action" type="button" aria-label="切换 Lumos" onClick={handleLumos}>
          <span className="spell-key">1</span>
          <div><strong>荧光闪烁 · Lumos</strong><span>{quest.lumosEnabled ? "光芒在杖尖静静流动" : "按 1 点亮魔杖"}</span></div>
        </button>
      </div>

      <div className="lower-right">
        <button className="view-toggle" type="button" onClick={toggleCameraMode} aria-label="切换第一人称和第三人称视角">
          <span className="view-icon">{cameraMode === "third" ? "◉" : "◎"}</span>
          <span>{cameraMode === "third" ? "第三人称" : "第一人称"}<small>按 V 切换</small></span>
        </button>
      </div>

      {nearbyTargetId && targetLabels[nearbyTargetId] && (
        <button className="interaction-prompt" type="button" aria-label={`互动：${targetLabels[nearbyTargetId]}`} onClick={handleInteract}>
          <span className="interaction-key">E</span>
          <span>{targetLabels[nearbyTargetId]}</span>
        </button>
      )}

      {quest.stage === "complete" && (
        <div className="completion-card" role="status">
          <span className="completion-sigil">✦</span>
          <p className="eyebrow">探索完成</p>
          <h2>秘密属于你了</h2>
          <p>你在月光下找到了第一枚遗物。</p>
        </div>
      )}
    </div>
  );
}
