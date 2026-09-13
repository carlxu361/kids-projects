'use client';

import { useEffect, useRef, useState } from 'react';
import { AudioManager } from '../game/AudioManager';
import { BUILDINGS, BUILD_KEYS, DEFAULT_SETTINGS, DIFFICULTIES, OPERATORS } from '../game/config';
import { Game } from '../game/Game';
import { SaveManager, type SaveData } from '../game/SaveManager';
import type { AICommand, AIPersonality, Difficulty, GameSettings, GameSnapshot, OperatorId, WeaponMode } from '../game/types';
import { EnemyDossierImage } from './EnemyDossierImage';

const initialSnapshot: GameSnapshot = {
  phase: 'day', day: 1, phaseTime: 60, metal: 110, energy: 18, baseHp: 1000, baseMaxHp: 1000,
  playerHp: 100, playerMaxHp: 100, dashCooldown: 0, dashCooldownMax: 2.4, kills: 0, built: 0,
  recallCooldown: 0, recallCooldownMax: 32,
  recallCharge: 0, recallChargeMax: 1.2, recallCharging: false,
  companionHp: 150, companionMaxHp: 150, companionDown: false, companionReboot: 0, companionUnlocked: false, companionLevel: 0,
  warning: '', prompt: '', buildMode: false, buildKind: null, selectedBuilding: null, weapon: 'rifle', operator: 'vanguard',
  operatorSkillCooldown: 0, operatorSkillCooldownMax: 13,
  scatterUnlocked: false, arcUnlocked: false, railUnlocked: false, upgradeChoices: [], bossHp: 0, bossMaxHp: 0, gameOverReady: false, adminEnabled: false,
  debugOpen: false, easterEggs: [], enemyCount: 0, droneCount: 0, projectileCount: 0, fps: 60, difficulty: 'normal',
  paused: false, settings: DEFAULT_SETTINGS, statusEffects: [], bossName: '', enemyIntro: null,
  aiCommand: 'guard', aiCommandOpen: false, aiPersonality: 'calm', aiReply: '',
};

const aiCommands: { id: AICommand; icon: string; label: string; detail: string }[] = [
  { id: 'follow', icon: '↗', label: '跟随我', detail: '贴近玩家，优先掩护' },
  { id: 'guard', icon: '⬡', label: '守卫基地', detail: '围绕核心拦截敌人' },
  { id: 'hunt', icon: '⌖', label: '自由猎杀', detail: '扩大搜索与追击范围' },
  { id: 'focus', icon: '◎', label: '集火威胁', detail: '锁定当前最危险目标' },
];

const aiPersonalities: { id: AIPersonality; label: string; detail: string }[] = [
  { id: 'calm', label: '沉着', detail: '均衡判断' },
  { id: 'bold', label: '强攻', detail: '贴近增伤' },
  { id: 'guardian', label: '守护', detail: '基地优先' },
];

interface GameShellProps {
  onExit: (finished?: boolean) => void;
  onRestart: () => void;
  onRecord: (save: SaveData) => void;
  difficulty: Difficulty;
  loadout: WeaponMode;
  operator: OperatorId;
  active: boolean;
}

export function GameShell({ onExit, onRestart, onRecord, difficulty, loadout, operator, active }: GameShellProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const savedRef = useRef(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [settings, setSettings] = useState<GameSettings>(() => SaveManager.loadSettings());
  const initialSettingsRef = useRef(settings);

  useEffect(() => {
    if (!canvasRef.current) return;
    const audio = new AudioManager();
    const game = new Game(canvasRef.current, setSnapshot, audio, difficulty, initialSettingsRef.current, loadout, operator);
    gameRef.current = game;
    game.start();
    return () => { game.destroy(); gameRef.current = null; };
  }, [difficulty, loadout, operator]);

  useEffect(() => { gameRef.current?.setSuspended(!active); }, [active]);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(previous => {
      const next = { ...previous, [key]: value };
      SaveManager.saveSettings(next);
      gameRef.current?.updateSettings(next);
      return next;
    });
  };

  useEffect(() => {
    if (!snapshot.gameOverReady || savedRef.current) return;
    savedRef.current = true;
    onRecord(SaveManager.finishRun(snapshot.day, snapshot.kills));
  }, [snapshot.gameOverReady, snapshot.day, snapshot.kills, onRecord]);

  const phaseLabel = snapshot.paused ? '战术暂停' : snapshot.phase === 'day' ? '距离夜晚' : snapshot.phase === 'night' ? '夜晚剩余' : '防线稳定';
  const dashRatio = snapshot.dashCooldownMax ? 1 - snapshot.dashCooldown / snapshot.dashCooldownMax : 1;
  const baseRatio = snapshot.baseHp / snapshot.baseMaxHp;
  const hpRatio = snapshot.playerHp / snapshot.playerMaxHp;
  const companionRatio = snapshot.companionHp / snapshot.companionMaxHp;
  const recallRatio = snapshot.recallCooldownMax ? 1 - snapshot.recallCooldown / snapshot.recallCooldownMax : 1;
  const recallChargeRatio = snapshot.recallChargeMax ? snapshot.recallCharge / snapshot.recallChargeMax : 0;
  const activeAICommand = aiCommands.find(command => command.id === snapshot.aiCommand)?.label || '待命';
  const operatorProfile = OPERATORS[snapshot.operator];
  const skillReady = snapshot.operatorSkillCooldown <= 0;

  return (
    <main className={`game-screen phase-${snapshot.phase}`}>
      <canvas ref={canvasRef} className="game-canvas" aria-label="最后一座基地游戏区域" />

      <div className="hud" aria-live="polite">
        <button type="button" className="pause-button" onClick={() => gameRef.current?.togglePause()}>{snapshot.paused ? '▶ 继续' : 'Ⅱ 暂停'} <kbd>ESC</kbd></button>
        {snapshot.adminEnabled && <button type="button" className="admin-badge" onClick={() => gameRef.current?.toggleDebug()}>ADMIN OVERRIDE // {snapshot.debugOpen ? 'CLOSE' : 'DEBUG'}</button>}

        <section className="day-panel">
          <strong>DAY {snapshot.day}</strong>
          <span>{snapshot.phase === 'day' ? '☀' : '☾'} {phaseLabel} {snapshot.paused ? '· P 继续' : `${Math.ceil(snapshot.phaseTime)}s`}</span>
          <em>{DIFFICULTIES[snapshot.difficulty].label}</em>
        </section>

        <section className={`base-panel ${snapshot.warning.includes('基地') ? 'under-attack' : ''}`}>
          <div className="base-title"><span>LAST BASE</span><b>{Math.ceil(snapshot.baseHp)} / {snapshot.baseMaxHp}</b></div>
          <div className="bar"><i style={{ width: `${baseRatio * 100}%` }} /></div>
        </section>

        <section className="resource-panel">
          <span><i className="metal-icon">⌬</i> {snapshot.metal}</span>
          <span><i className="energy-icon">ϟ</i> {snapshot.energy}</span>
        </section>

        {snapshot.bossMaxHp > 0 && (
          <section className="boss-bar">
            <div><span>{snapshot.bossName || '未知首领'}</span><b>BOSS</b></div>
            <div className="bar"><i style={{ width: `${snapshot.bossHp / snapshot.bossMaxHp * 100}%` }} /></div>
          </section>
        )}

        {snapshot.warning && <div className={`world-warning ${snapshot.warning.length <= 2 ? 'countdown' : ''}`}>{snapshot.warning}</div>}
        {snapshot.prompt && <div className="interaction-prompt">{snapshot.prompt}</div>}

        <section className="player-panel">
          <div className="portrait" style={{ '--operator': operatorProfile.color } as React.CSSProperties}>{operatorProfile.icon}</div>
          <div><span>{operatorProfile.callsign} · {operatorProfile.name}</span><div className="bar"><i style={{ width: `${hpRatio * 100}%` }} /></div><b>{Math.ceil(snapshot.playerHp)} / {snapshot.playerMaxHp}</b></div>
        </section>

        {snapshot.companionUnlocked && <section className={`companion-panel ${snapshot.companionDown ? 'offline' : ''}`}>
          <div className="ally-mark">AI</div>
          <div><span>守望者-7 · MK-{snapshot.companionLevel + 1} · {activeAICommand}</span><div className="bar"><i style={{ width: `${companionRatio * 100}%` }} /></div><b>{snapshot.companionDown ? `重构中 ${snapshot.companionReboot.toFixed(1)}s` : `${Math.ceil(snapshot.companionHp)} / ${snapshot.companionMaxHp}`}</b></div>
          <button type="button" className="ai-command-toggle" disabled={snapshot.companionDown} onClick={() => gameRef.current?.toggleAICommand()}><kbd>F1</kbd><span>指挥</span></button>
        </section>}

        {snapshot.companionUnlocked && snapshot.aiReply && !snapshot.aiCommandOpen && <div className="ai-radio-reply"><b>守望者-7</b><span>{snapshot.aiReply}</span></div>}

        {snapshot.companionUnlocked && snapshot.aiCommandOpen && (
          <aside className="ai-command-console">
            <header><div><small>WARDEN-7 // COMMAND</small><strong>战术指挥台</strong></div><button type="button" onClick={() => gameRef.current?.toggleAICommand(false)}>×</button></header>
            <p className="ai-console-reply"><i>AI</i>{snapshot.aiReply || '频道稳定，等待指令。'}</p>
            <div className="ai-command-grid">{aiCommands.map(command => <button key={command.id} type="button" className={snapshot.aiCommand === command.id ? 'active' : ''} onClick={() => gameRef.current?.commandCompanion(command.id)}><i>{command.icon}</i><span><b>{command.label}</b><small>{command.detail}</small></span></button>)}</div>
            <div className="ai-personality"><span>战术性格</span><div>{aiPersonalities.map(personality => <button key={personality.id} type="button" className={snapshot.aiPersonality === personality.id ? 'active' : ''} title={personality.detail} onClick={() => updateSetting('aiPersonality', personality.id)}>{personality.label}</button>)}</div></div>
          </aside>
        )}

        <section className="dash-panel">
          <div className="dash-ring" style={{ '--dash': `${dashRatio * 360}deg` } as React.CSSProperties}><span>»</span></div>
          <div><strong>空格 · 冲刺</strong><span>{snapshot.dashCooldown > 0 ? `${snapshot.dashCooldown.toFixed(1)}s` : 'READY'}</span></div>
        </section>

        <section className="recall-panel">
          <button
            type="button"
            className={snapshot.recallCharging ? 'charging' : ''}
            disabled={snapshot.recallCooldown > 0}
            style={{ '--recall': `${(snapshot.recallCharging ? recallChargeRatio : recallRatio) * 100}%` } as React.CSSProperties}
            onPointerDown={() => gameRef.current?.beginRecall()}
            onPointerUp={() => gameRef.current?.cancelRecall()}
            onPointerLeave={() => gameRef.current?.cancelRecall()}
            onPointerCancel={() => gameRef.current?.cancelRecall()}
            aria-label="长按启动归航信标"
          ><kbd>R</kbd><span><strong>归航信标</strong><small>{snapshot.recallCharging ? `蓄力 ${snapshot.recallCharge.toFixed(1)} / ${snapshot.recallChargeMax.toFixed(1)}s` : snapshot.recallCooldown > 0 ? `${snapshot.recallCooldown.toFixed(0)}s` : '长按 · 返回并治疗'}</small></span></button>
        </section>

        <section className="operator-abilities">
          <button type="button" className="ready" onPointerDown={() => gameRef.current?.setMeleeHeld(true)} onPointerUp={() => gameRef.current?.setMeleeHeld(false)} onPointerLeave={() => gameRef.current?.setMeleeHeld(false)} onPointerCancel={() => gameRef.current?.setMeleeHeld(false)}><kbd>V</kbd><span><strong>近战连击</strong><small>按住连续攻击</small></span></button>
          <button type="button" className={skillReady ? 'ready skill' : 'skill'} onClick={() => gameRef.current?.useOperatorSkill()}><kbd>K</kbd><span><strong>{operatorProfile.skill}</strong><small>{skillReady ? 'READY' : `${snapshot.operatorSkillCooldown.toFixed(1)}s`}</small></span></button>
        </section>

        {snapshot.statusEffects.length > 0 && <section className="status-effects">{snapshot.statusEffects.map(effect => <span key={effect.label} style={{ '--effect': effect.color } as React.CSSProperties}><i>{effect.icon}</i>{effect.label}{effect.time > 0 ? ` ${effect.time.toFixed(1)}s` : ''}</span>)}</section>}

        <section className="combat-stats"><span>击杀 {snapshot.kills}</span><span>建造 {snapshot.built}</span>{snapshot.droneCount > 0 && <span>无人机 ×{snapshot.droneCount}</span>}</section>

        <section className={`quickbar ${snapshot.buildMode ? 'building' : ''}`}>
          {snapshot.buildMode ? BUILD_KEYS.map((kind, index) => {
            const item = BUILDINGS[kind];
            const affordable = snapshot.metal >= item.metal && snapshot.energy >= item.energy;
            return (
              <button key={kind} type="button" className={snapshot.buildKind === kind ? 'active' : ''} data-affordable={affordable} onClick={() => gameRef.current?.selectBuild(kind)}>
                <kbd>{index + 1}</kbd><b>{item.icon}</b><span>{item.name}</span><small>⌬{item.metal}{item.energy ? ` ϟ${item.energy}` : ''}</small>
              </button>
            );
          }) : (
            <>
              <WeaponButton slot={1} name="突击步枪" icon="⌁" active={snapshot.weapon === 'rifle'} unlocked />
              <WeaponButton slot={2} name="散射炮" icon="⫷" active={snapshot.weapon === 'scatter'} unlocked={snapshot.scatterUnlocked} />
              <WeaponButton slot={3} name="电弧枪" icon="ϟ" active={snapshot.weapon === 'arc'} unlocked={snapshot.arcUnlocked} />
              <WeaponButton slot={4} name="磁轨炮" icon="━" active={snapshot.weapon === 'rail'} unlocked={snapshot.railUnlocked} />
              <button type="button" className="build-toggle" onClick={() => gameRef.current?.toggleBuildMode()}><kbd>B</kbd><b>＋</b><span>建造模式</span><small>基地范围内</small></button>
            </>
          )}
          {snapshot.buildMode && <button type="button" className="cancel-build" onClick={() => gameRef.current?.cancelBuild()}><kbd>右键</kbd><span>取消</span></button>}
        </section>

        {snapshot.selectedBuilding && (
          <aside className="building-inspector">
            <button type="button" className="close-inspector" onClick={() => gameRef.current?.cancelBuild()}>×</button>
            <p>防御网络节点</p>
            <h3>{snapshot.selectedBuilding.name} <span>LV.{snapshot.selectedBuilding.level}</span></h3>
            <div className="building-hp"><span>结构完整度</span><b>{Math.ceil(snapshot.selectedBuilding.hp)} / {Math.ceil(snapshot.selectedBuilding.maxHp)}</b></div>
            <div className="bar"><i style={{ width: `${snapshot.selectedBuilding.hp / snapshot.selectedBuilding.maxHp * 100}%` }} /></div>
            <dl><div><dt>伤害</dt><dd>{snapshot.selectedBuilding.damage}</dd></div><div><dt>效率</dt><dd>{snapshot.selectedBuilding.rate}</dd></div></dl>
            <button type="button" onClick={() => gameRef.current?.upgradeSelected()} disabled={!snapshot.selectedBuilding.canUpgrade}>{snapshot.selectedBuilding.canUpgrade ? `升级 · ⌬ ${snapshot.selectedBuilding.upgradeCost}` : '已达最高等级'}</button>
            <button type="button" className="repair-button" onClick={() => gameRef.current?.repairSelected()}>修复建筑</button>
            <button type="button" className={`demolish-button ${snapshot.selectedBuilding.demolishArmed ? 'armed' : ''}`} onClick={() => gameRef.current?.demolishSelected()}>{snapshot.selectedBuilding.demolishArmed ? '确认拆除' : '拆除塔'} · 返还 ⌬{snapshot.selectedBuilding.refundMetal}{snapshot.selectedBuilding.refundEnergy ? ` ϟ${snapshot.selectedBuilding.refundEnergy}` : ''}</button>
          </aside>
        )}

        {snapshot.adminEnabled && snapshot.debugOpen && (
          <aside className="debug-console">
            <div className="debug-title"><span>HQ // DEBUG CONSOLE</span><button type="button" onClick={() => gameRef.current?.toggleDebug()}>×</button></div>
            <div className="debug-readout"><span>FPS <b>{snapshot.fps}</b></span><span>敌人 <b>{snapshot.enemyCount}</b></span><span>弹体 <b>{snapshot.projectileCount}</b></span><span>阶段 <b>{snapshot.phase.toUpperCase()}</b></span></div>
            <div className="debug-actions">
              <button type="button" onClick={() => gameRef.current?.debugAction('resources')}>资源 ×9999</button>
              <button type="button" onClick={() => gameRef.current?.debugAction('repair')}>全体修复</button>
              <button type="button" onClick={() => gameRef.current?.debugAction('clear')}>清除敌人</button>
              <button type="button" onClick={() => gameRef.current?.debugAction('swarm')}>生成怪潮</button>
              <button type="button" onClick={() => gameRef.current?.debugAction('boss')}>轮换召唤 Boss</button>
              <button type="button" onClick={() => gameRef.current?.debugAction('night')}>跳至夜晚</button>
              <button type="button" onClick={() => gameRef.current?.debugAction('upgrade')}>调试强化（三选一）</button>
            </div>
            <div className="egg-codes"><p>EASTER EGG // 不占用任何操作键</p><div>{['cog', 'ion', 'jig', 'gift', 'lux'].map(code => <span key={code} className={snapshot.easterEggs.includes(code) ? 'active' : ''}>{code}</span>)}</div></div>
            <small>按 F2 / 反引号，或点击顶部状态栏关闭</small>
          </aside>
        )}
      </div>

      {snapshot.phase === 'upgrade' && (
        <div className="modal-layer upgrade-layer">
          <section className="upgrade-modal">
            <p className="modal-kicker">战场已暂停 // 选择一项永久强化</p>
            <h2>防线已守住</h2>
            <div className="upgrade-grid">
              {snapshot.upgradeChoices.map((choice, index) => (
                <button type="button" key={choice.id} className={choice.tag === 'AI改装' ? 'ai-upgrade' : ''} onClick={() => gameRef.current?.chooseUpgrade(choice.id)}>
                  <span className="upgrade-number">0{index + 1}</span><i>{choice.icon}</i><small>{choice.tag}{choice.stacks ? ` · 已有 ${choice.stacks}` : ''}</small><h3>{choice.name}</h3><p>{choice.description}</p><b>选择强化 →</b>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {snapshot.enemyIntro && (
        <div className="modal-layer enemy-intro-layer">
          <section className="enemy-intro-modal" style={{ '--enemy': snapshot.enemyIntro.color } as React.CSSProperties}>
            <p className="modal-kicker">NEW HOSTILE // 战场自动暂停</p>
            <div className="enemy-intro-hero">
              <EnemyDossierImage enemy={snapshot.enemyIntro} />
              <div className="enemy-intro-copy">
                <div className="enemy-intro-heading"><i>{snapshot.enemyIntro.icon}</i><div><small>{snapshot.enemyIntro.role}</small><h2>{snapshot.enemyIntro.name}</h2></div></div>
                <p className="enemy-intro-description">{snapshot.enemyIntro.description}</p>
              </div>
            </div>
            <ul className="enemy-intel"><li><small>速度</small><strong>{snapshot.enemyIntro.intel.speed}</strong></li><li><small>防御</small><strong>{snapshot.enemyIntro.intel.defense}</strong></li><li><small>技能</small><strong>{snapshot.enemyIntro.intel.skill}</strong></li></ul>
            <button type="button" onClick={() => gameRef.current?.dismissEnemyIntro()}>了解 · 继续战斗 <kbd>ENTER</kbd></button>
          </section>
        </div>
      )}

      {snapshot.paused && !snapshot.enemyIntro && snapshot.phase !== 'upgrade' && snapshot.phase !== 'gameover' && (
        <div className="modal-layer pause-layer">
          <section className="pause-modal">
            <p className="modal-kicker">TACTICAL CONTROL</p>
            <h2>游戏已暂停</h2>
            <div className="pause-summary"><span>DAY {snapshot.day}</span><span>{snapshot.kills} 击杀</span><span>{DIFFICULTIES[snapshot.difficulty].label}</span></div>
            <div className="settings-panel">
              <SettingRange label="音效音量" value={settings.volume} onChange={value => updateSetting('volume', value)} />
              <SettingRange label="屏幕震动" value={settings.shake} onChange={value => updateSetting('shake', value)} />
              <SettingRange label="特效密度" value={settings.particles} onChange={value => updateSetting('particles', value)} />
              <label className="toggle-setting"><span><b>失去焦点自动暂停</b><small>切换窗口时保护当前战局</small></span><input type="checkbox" checked={settings.autoPause} onChange={event => updateSetting('autoPause', event.target.checked)} /></label>
            </div>
            <div className="loot-legend"><span><i>+</i>医疗</span><span><i>»</i>超频</span><span><i>◇</i>护盾</span><span><i>✚</i>维修</span><span><i>◎</i>EMP</span></div>
            <div className="pause-controls"><span><kbd>空格</kbd> 冲刺</span><span><kbd>按住 V</kbd> 近战连击</span><span><kbd>K</kbd> 干员技能</span><span><kbd>长按 R</kbd> 归航</span><span><kbd>B</kbd> 建造</span><span><kbd>F1</kbd> AI 指挥</span></div>
            <button type="button" className="resume-button" onClick={() => gameRef.current?.togglePause(false)}>继续游戏</button>
            <button type="button" className="pause-exit" onClick={() => onExit(false)}>返回主页</button>
          </section>
        </div>
      )}

      {snapshot.gameOverReady && (
        <div className="modal-layer gameover-layer">
          <section className="gameover-modal">
            <p>基地信号丢失</p><h2>LAST BASE LOST</h2><span>你坚持到了</span><strong>DAY {snapshot.day}</strong>
            <div className="run-stats"><div><b>{snapshot.kills}</b><span>击杀</span></div><div><b>{snapshot.built}</b><span>建造</span></div><div><b>{SaveManager.load().highestDay}</b><span>最高纪录</span></div></div>
            <button type="button" onClick={onRestart}>再来一局</button><button type="button" className="secondary" onClick={() => onExit(true)}>返回主页</button>
          </section>
        </div>
      )}
    </main>
  );
}

function WeaponButton({ slot, name, icon, active, unlocked }: { slot: number; name: string; icon: string; active: boolean; unlocked: boolean }) {
  return <div className={`${active ? 'active' : ''} ${unlocked ? '' : 'locked'} weapon-slot`}><kbd>{slot}</kbd><b>{unlocked ? icon : '×'}</b><span>{name}</span><small>{unlocked ? (active ? '装备中' : '可切换') : '强化解锁'}</small></div>;
}

function SettingRange({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="range-setting">
      <span><b>{label}</b><small>{value}%</small></span>
      <input type="range" min="0" max="100" value={value} onChange={event => onChange(Number(event.target.value))} />
    </label>
  );
}
