'use client';

import { useCallback, useEffect, useState } from 'react';
import { GameShell } from './components/GameShell';
import { DIFFICULTIES, OPERATORS, WEAPON_LOADOUTS } from './game/config';
import { SaveManager, type SaveData } from './game/SaveManager';
import type { Difficulty, OperatorId, WeaponMode } from './game/types';

type Screen = 'menu' | 'instructions' | 'armory' | 'operators' | 'game';

const EMPTY_SAVE: SaveData = { highestDay: 0, bestKills: 0, runs: 0, tutorialSeen: false, equippedWeapon: 'rifle', selectedOperator: 'vanguard' };

export default function Home() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameKey, setGameKey] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [save, setSave] = useState<SaveData>(EMPTY_SAVE);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionDifficulty, setSessionDifficulty] = useState<Difficulty>('normal');
  const [sessionWeapon, setSessionWeapon] = useState<WeaponMode>('rifle');
  const [sessionOperator, setSessionOperator] = useState<OperatorId>('vanguard');

  useEffect(() => {
    // LocalStorage only exists after hydration; this is the save-system synchronization point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSave(SaveManager.load());
  }, []);

  const startNewGame = useCallback(() => {
    setSessionDifficulty(difficulty);
    setSessionWeapon(save.equippedWeapon);
    setSessionOperator(save.selectedOperator);
    setGameKey(key => key + 1);
    setSessionActive(true);
    setScreen('game');
  }, [difficulty, save.equippedWeapon, save.selectedOperator]);

  const continueGame = useCallback(() => setScreen('game'), []);
  const restart = useCallback(() => { setGameKey(key => key + 1); setSessionActive(true); setScreen('game'); }, []);
  const exit = useCallback((finished = false) => {
    if (finished) setSessionActive(false);
    setScreen('menu');
    setSave(SaveManager.load());
  }, []);

  useEffect(() => {
    const startOnEnter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || screen !== 'menu') return;
      if (sessionActive) continueGame(); else startNewGame();
    };
    window.addEventListener('keydown', startOnEnter);
    return () => window.removeEventListener('keydown', startOnEnter);
  }, [continueGame, screen, sessionActive, startNewGame]);

  const equipWeapon = (weapon: WeaponMode) => setSave(SaveManager.equipWeapon(weapon));
  const selectOperator = (operator: OperatorId) => setSave(SaveManager.selectOperator(operator));

  return (
    <>
      {sessionActive && (
        <div className={`game-host ${screen === 'game' ? '' : 'is-hidden'}`}>
          <GameShell key={gameKey} difficulty={sessionDifficulty} loadout={sessionWeapon} operator={sessionOperator} active={screen === 'game'} onExit={exit} onRestart={restart} onRecord={setSave} />
        </div>
      )}

      {screen !== 'game' && (
        <main className="site-shell">
          <div className="menu-sky" aria-hidden="true"><span className="sun" /><span className="horizon horizon-one" /><span className="horizon horizon-two" /><span className="scanlines" /></div>
          <section className="main-menu" aria-label="游戏主菜单">
            <p className="eyebrow">{'基地网络 // 最后信号'}</p><h1>LAST BASE</h1><p className="chinese-title">最后一座基地</p><p className="tagline">探索荒地。筑起防线。迎战每一个夜晚的首领。</p>
            <div className="menu-actions">
              <button type="button" className="primary-action" onClick={sessionActive ? continueGame : startNewGame}><span>{sessionActive ? '继续游戏' : '开始游戏'}</span><kbd>ENTER</kbd></button>
              {sessionActive && <button type="button" onClick={startNewGame}>开始新战局 <strong>RESET RUN</strong></button>}
              <button type="button" onClick={() => setScreen('armory')}>军械库 <strong>{WEAPON_LOADOUTS[save.equippedWeapon].name}</strong></button>
              <button type="button" onClick={() => setScreen('operators')}>干员档案 <strong>{OPERATORS[save.selectedOperator].callsign}</strong></button>
              <button type="button" onClick={() => setScreen('instructions')}>游戏说明 <strong>HOW TO PLAY</strong></button>
              <button type="button" onClick={() => setScreen('instructions')}>最高纪录 <strong>DAY {save.highestDay}</strong></button>
            </div>
            <div className="difficulty-picker" aria-label="选择游戏难度">
              <span>新战局威胁等级</span>
              {(Object.entries(DIFFICULTIES) as [Difficulty, (typeof DIFFICULTIES)[Difficulty]][]).map(([id, item]) => <button key={id} type="button" className={difficulty === id ? 'active' : ''} onClick={() => setDifficulty(id)}><b>{item.label}</b><small>{item.hint}</small></button>)}
            </div>
            <div className="loadout-summary"><span style={{ '--loadout': WEAPON_LOADOUTS[save.equippedWeapon].color } as React.CSSProperties}>{WEAPON_LOADOUTS[save.equippedWeapon].icon} {WEAPON_LOADOUTS[save.equippedWeapon].name}</span><span style={{ '--loadout': OPERATORS[save.selectedOperator].color } as React.CSSProperties}>{OPERATORS[save.selectedOperator].icon} {OPERATORS[save.selectedOperator].callsign}</span></div>
            <div className="controls-strip" aria-label="主要操作"><span><kbd>WASD</kbd> 移动</span><span><kbd>鼠标</kbd> 瞄准射击</span><span><kbd>按住 V</kbd> 近战连击</span><span><kbd>K</kbd> 干员技能</span><span><kbd>B</kbd> 建造</span></div>
          </section>
          <footer><span className="signal"><i /> SIGNAL STABLE</span><span>{`RUNS ${String(save.runs).padStart(2, '0')} // BEST KILLS ${save.bestKills}`}</span></footer>

          {screen === 'instructions' && (
            <div className="instructions-layer" role="dialog" aria-modal="true" aria-label="游戏说明">
              <section className="instructions-card">
                <button type="button" className="instructions-close" onClick={() => setScreen('menu')}>×</button>
                <p className="modal-kicker">{'作战手册 // 01'}</p><h2>活过每一个夜晚</h2>
                <div className="day-cycle"><span><b>01</b> 白天探索<small>零星敌人，越靠外围资源越丰富</small></span><i>→</i><span><b>02</b> 建造升级<small>组合炮塔、墙体与发电机</small></span><i>→</i><span><b>03</b> 夜晚守城<small>大批怪潮与逐夜变强的 Boss</small></span></div>
                <div className="instruction-grid"><div><kbd>WASD</kbd><span>移动</span></div><div><kbd>鼠标左键</kbd><span>瞄准 / 射击</span></div><div><kbd>按住 V</kbd><span>无冷却近战连击</span></div><div><kbd>K</kbd><span>发动干员专属技能</span></div><div><kbd>鼠标右键</kbd><span>取消建造 / 管理炮塔</span></div><div><kbd>空格</kbd><span>冲刺 / 短暂无敌</span></div><div><kbd>长按 R</kbd><span>归航信标</span></div><div><kbd>E</kbd><span>开启宝箱和空投</span></div><div><kbd>B · 1—7</kbd><span>基地范围内建造</span></div><div><kbd>F1</kbd><span>指挥守望者 AI</span></div></div>
                <div className="instruction-note"><b>基地一旦被摧毁，本局结束。</b><span>每晚结束三选一；招募 AI 后，每轮保证出现一项 AI 改装。</span></div>
                <button type="button" className="primary-action start-from-help" onClick={startNewGame}>开始第一天 →</button>
              </section>
            </div>
          )}

          {screen === 'armory' && (
            <LoadoutModal title="军械库" kicker="BASE ARMORY // PRIMARY WEAPON" onClose={() => setScreen('menu')}>
              <div className="loadout-grid weapon-loadout-grid">
                {(Object.entries(WEAPON_LOADOUTS) as [WeaponMode, (typeof WEAPON_LOADOUTS)[WeaponMode]][]).map(([id, weapon]) => <button key={id} type="button" className={save.equippedWeapon === id ? 'selected' : ''} style={{ '--loadout': weapon.color } as React.CSSProperties} onClick={() => equipWeapon(id)}><i>{weapon.icon}</i><small>{weapon.role}</small><h3>{weapon.name}</h3><p>{weapon.description}</p><div>{weapon.stats.map(stat => <span key={stat}>{stat}</span>)}</div><b>{save.equippedWeapon === id ? '已装备' : '装备武器'}</b></button>)}
              </div>
            </LoadoutModal>
          )}

          {screen === 'operators' && (
            <LoadoutModal title="选择干员" kicker="OPERATOR ROSTER // ACTIVE UNIT" onClose={() => setScreen('menu')}>
              <div className="loadout-grid operator-grid">
                {(Object.entries(OPERATORS) as [OperatorId, (typeof OPERATORS)[OperatorId]][]).map(([id, operator]) => <button key={id} type="button" className={save.selectedOperator === id ? 'selected' : ''} style={{ '--loadout': operator.color } as React.CSSProperties} onClick={() => selectOperator(id)}><div className={`operator-figure operator-${id}`}><i>{operator.icon}</i></div><small>{operator.callsign}</small><h3>{operator.name}</h3><p>{operator.passive}</p><div className="operator-skill"><span>K · {operator.skill}</span><b>{operator.skillDescription}</b></div><strong>{save.selectedOperator === id ? '已部署' : '选择干员'}</strong></button>)}
              </div>
            </LoadoutModal>
          )}
        </main>
      )}
    </>
  );
}

function LoadoutModal({ title, kicker, onClose, children }: { title: string; kicker: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="instructions-layer loadout-layer" role="dialog" aria-modal="true" aria-label={title}><section className="loadout-card"><button type="button" className="instructions-close" onClick={onClose}>×</button><p className="modal-kicker">{kicker}</p><h2>{title}</h2>{children}<button type="button" className="loadout-done" onClick={onClose}>确认配置</button></section></div>;
}
