const $ = (id) => document.getElementById(id);
const ui = {
  cabinet: $('cabinet'), machine: $('machine'), chamber: $('chamber'), spark: $('spark'), message: $('message'),
  playerHearts: $('playerHearts'), dealerHearts: $('dealerHearts'), live: $('liveCount'), blank: $('blankCount'), ammoLedger: $('ammoLedger'),
  round: $('roundLabel'), turn: $('turnLabel'), items: $('items'), injuries: $('injuryText'), slots: $('chamberSlots'),
  machineStatus: $('machineStatus'), dealerItems: $('dealerItems'),
  playerHpNumber: $('playerHpNumber'), dealerHpNumber: $('dealerHpNumber'), itemCount: $('itemCount'), dealerItemCount: $('dealerItemCount'),
  start: $('startButton'), shootDealer: $('shootDealer'), shootSelf: $('shootSelf'), actionHint: $('actionHint'),
  rules: $('rulesDialog'), ending: $('endingDialog'), steal: $('stealDialog'), stealOptions: $('stealOptions'), admin: $('adminDialog'),
  bloodFx: $('bloodFx'), horrorRange: $('horrorRange'), horrorValue: $('horrorValue'), difficultyRange: $('difficultyRange'), difficultyValue: $('difficultyValue'),
  breaker: $('breakerDialog'), musicButton: $('musicButton'), viewButton: $('viewButton'), langButton: $('langButton')
};

const itemInfo = {
  lamp: ['检修灯', '查看下一格'],
  wrench: ['增压扳手', '下次高压伤害+1'],
  ticket: ['废票', '弃掉下一格'],
  bell: ['停站铃', '跳过对手回合'],
  tea: ['热茶', '恢复1点生命'],
  glove: ['扒手手套', '选择夺取对方道具'],
  inverter: ['换向器', '反转下一格'],
  vial: ['命运药剂', '随机恢复2血或扣除1血'],
  breaker: ['断路钳', '触发时选择是否抵消停站铃'],
  seal: ['封锁条', '封住对方一次道具阶段'],
  charm: ['旧护符', '抵消下一次1点伤害']
};

const itemIcons = {
  lamp: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 4h13v5h4v15h-4v4H7v-4H4V9h3zm4 5v10h5V9z"/></svg>',
  wrench: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20 3v7l-4 4-4-4V3C5 5 4 12 8 16L3 26l4 3 8-10c6 2 12-3 11-9l-4 4-4-2 4-5z"/></svg>',
  ticket: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 7h26v7c-4 0-4 4 0 4v7H3v-7c4 0 4-4 0-4zm9 4v10h3V11zm6 0v10h2V11z"/></svg>',
  bell: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M14 3h4v4c6 1 8 6 8 13l3 3v3H3v-3l3-3c0-7 2-12 8-13zm-3 24h10c-1 4-9 4-10 0z"/></svg>',
  tea: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 10h19v4h5v10h-5v4H8l-3-6zm19 7v5h2v-5zM10 3h3v5h-3zm7 0h3v5h-3z"/></svg>',
  glove: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 13h4V4h4v8h2V3h4v9h2V6h4v15l-7 8H9L4 20v-5h4l4 5v-2z"/></svg>',
  inverter: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 7h16V3l7 7-7 7v-4H9v5H3V10zm20 18H10v4l-7-7 7-7v4h13v-5h6v8z"/></svg>',
  vial: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 3h10v4h-2v5l7 11v6H6v-6l7-11V7h-2zm2 18h6l-3-5z"/></svg>',
  breaker: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 4h7v9h8V4h7v12h-7v5h7v7h-9v-7h-4v7H5v-7h7v-5H5z"/></svg>',
  seal: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 7h24v6H4zm3 9h18v9H7zm5 2v5h3v-5zm6 0v5h3v-5z"/></svg>',
  charm: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2l4 7 8 2-5 6 1 9-8-4-8 4 1-9-5-6 8-2zm0 8l-3 5 3 5 3-5z"/></svg>'
};

const itemInfoEn = {
  lamp: ['Inspection Lamp', 'Reveal the next chamber'], wrench: ['Pressure Wrench', 'Next live hit deals +1 damage'], ticket: ['Void Ticket', 'Discard the next chamber'],
  bell: ['Stop Bell', 'Skip the opponent turn'], tea: ['Hot Tea', 'Restore 1 health'], glove: ['Pickpocket Glove', 'Choose and steal an enemy item'],
  inverter: ['Inverter', 'Reverse the next chamber'], vial: ['Fate Vial', 'Restore 2 health or lose 1'], breaker: ['Circuit Cutter', 'Optionally cancel an enemy Stop Bell'],
  seal: ['Lock Strip', 'Block one enemy item phase'], charm: ['Old Charm', 'Reduce the next damage by 1']
};

const UI_TEXT = {
  kicker: ['TERMINAL 09 · 最后一班', 'TERMINAL 09 · LAST TRAIN'], title: ['末班轮盘', 'LAST TRAIN ROULETTE'], horror: ['恐怖指数', 'HORROR'], difficulty: ['难度', 'DIFFICULTY'],
  dealer: ['恶魔检票员', 'DEMON CONDUCTOR'], dealerItems: ['恶魔道具', 'DEMON ITEMS'], player: ['无票乘客', 'TICKETLESS PASSENGER'], injuries: ['永久伤势', 'PERMANENT INJURIES'],
  start: ['投入车票', 'INSERT TICKET'], fireDealer: ['开火：恶魔', 'FIRE: DEMON'], fireDealerHelp: ['命中则造成伤害', 'A live chamber deals damage'],
  fireSelf: ['试探：自己', 'TEST: YOURSELF'], fireSelfHelp: ['空响可继续行动', 'A blank keeps your turn'], yourItems: ['你的道具', 'YOUR ITEMS'],
  live: ['高压','LIVE'], blank: ['空响','BLANK'], gate: ['弹格闸机','CHAMBER GATE'], current: ['当前格','CURRENT'],
  breakerAsk: ['使用断路钳抵消恶魔的停站铃？', 'Use the Circuit Cutter to cancel the demon’s Stop Bell?'], breakerExplain: ['使用后断路钳会被消耗；拒绝则失去下一回合。', 'Using it consumes the cutter. Refusing costs your next turn.'],
  use: ['使用', 'USE'], keep: ['保留', 'KEEP']
};

const PACE = { aim: 3000, result: 3000, reload: 3000, dealer: 3000, item: 3000, round: 3000 };

const injuries = [
  { name: '耳鸣', text: '每局开始时，第一格无法被检修灯查看。', key: 'tinnitus' },
  { name: '灼痕', text: '最大生命值减少 1。', key: 'burn' },
  { name: '颤手', text: '每次装填少获得 1 件道具。', key: 'tremor' },
  { name: '失眠', text: '每局开始时损失 1 点生命。', key: 'insomnia' },
  { name: '恶兆', text: '每次装填会多出现 1 格高压。', key: 'badluck' },
  { name: '僵指', text: '每夜第一次扣动前无法使用道具。', key: 'stiff' },
  { name: '欠债', text: '恶魔每夜增加 1 点最大生命。', key: 'debt' },
  { name: '破口袋', text: '你的道具栏上限减少到 4。', key: 'pockets' },
  { name: '冻伤', text: '每夜第一次扣动不能对准自己。', key: 'frostbite' }
];

const injuryInfoEn = {
  tinnitus: ['Tinnitus', 'The first Inspection Lamp each run fails.'], burn: ['Burn Scar', 'Maximum health is reduced by 1.'], tremor: ['Tremor', 'Receive 1 fewer item per load.'],
  insomnia: ['Insomnia', 'Lose 1 health at the start of a run.'], badluck: ['Bad Omen', 'Each load contains 1 extra live chamber.'], stiff: ['Stiff Fingers', 'Items are locked until your first trigger each night.'],
  debt: ['Debt', 'The demon gains 1 maximum health each night.'], pockets: ['Torn Pocket', 'Your item limit is reduced to 4.'], frostbite: ['Frostbite', 'The first trigger each night cannot target yourself.']
};

let savedInjuries = JSON.parse(localStorage.getItem('lastTrainInjuries') || '[]');
let soundOn = true;
let audio;
let game;
let invincible = false;
let adminUnlocked = false;
let pendingStealIndex = null;
let maintenancePeek = false;
let music = null;
let supplyMode = false;
let horrorLevel = Math.max(1, Math.min(10, Number(localStorage.getItem('lastTrainHorror') || 3)));
let difficulty = Math.max(1, Math.min(5, Number(localStorage.getItem('lastTrainDifficulty') || 3)));
let language = localStorage.getItem('lastTrainLanguage') === 'en' ? 'en' : 'zh';
let musicOn = true;
let firstPerson = localStorage.getItem('lastTrainView') === 'first';
let breakerResolver = null;

function freshGame() {
  const maxHp = Math.max(2, 6 - (savedInjuries.includes('burn') ? 1 : 0));
  const dealerMax = dealerMaxForRound(1);
  return { round: 1, playerHp: invincible ? maxHp : Math.max(1, maxHp - (savedInjuries.includes('insomnia') ? 1 : 0)), playerMax: maxHp,
    dealerHp: dealerMax, dealerMax, shells: [], turn: 'player', busy: false,
    items: [], dealerItems: [], powered: false, dealerPowered: false, bell: false, dealerBell: false, dealerKnown: null,
    playerItemsSealed: false, dealerItemsSealed: false, playerShield: false, dealerShield: false,
    itemsLocked: savedInjuries.includes('stiff'), selfLocked: savedInjuries.includes('frostbite'), chamberTotal: 0, chamberStep: 0,
    countsVisible: false, publicCounts: { live: 0, blank: 0 },
    firstLampBlocked: savedInjuries.includes('tinnitus'), started: false };
}

function dealerMaxForRound(round) { return Math.min(6, 2 + round + Math.floor(difficulty / 2) + (savedInjuries.includes('debt') ? 1 : 0)); }

function beep(type = 'click') {
  if (!soundOn) return;
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  const osc = audio.createOscillator(), gain = audio.createGain();
  const tones = horrorLevel >= 8
    ? { click: [72, .08, 'square'], blank: [42, .25, 'sawtooth'], live: [31, .62, 'sawtooth'], item: [190, .16, 'square'], win: [112, .8, 'triangle'] }
    : horrorLevel >= 5
      ? { click: [90, .07, 'square'], blank: [55, .2, 'triangle'], live: [39, .48, 'sawtooth'], item: [250, .13, 'square'], win: [145, .65, 'triangle'] }
      : { click: [110, .05, 'square'], blank: [70, .12, 'triangle'], live: [48, .32, 'sawtooth'], item: [310, .09, 'square'], win: [180, .55, 'triangle'] };
  const [freq, length, wave] = tones[type];
  osc.type = wave; osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (type === 'live') osc.frequency.exponentialRampToValueAtTime(26, audio.currentTime + length);
  gain.gain.setValueAtTime(horrorLevel >= 8 ? .085 : .06, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
  osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + length);
}

function startMusic() {
  if (!musicOn || music) return;
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
  const master = audio.createGain(), filter = audio.createBiquadFilter();
  master.gain.setValueAtTime(.042, audio.currentTime); filter.type = 'lowpass'; filter.frequency.value = 150 + horrorLevel * 8;
  filter.connect(master).connect(audio.destination);
  const root = horrorLevel >= 8 ? 32.7 : horrorLevel >= 5 ? 36.71 : 43.65;
  const oscillators = [root, root * 1.5, root * 2].map((frequency, index) => {
    const osc = audio.createOscillator(), gain = audio.createGain(); osc.type = index === 1 ? 'sawtooth' : 'triangle'; osc.frequency.value = frequency;
    gain.gain.value = index === 1 ? .16 : .3; osc.connect(gain).connect(filter); osc.start(); return osc;
  });
  const lfo = audio.createOscillator(), lfoGain = audio.createGain(); lfo.frequency.value = .11; lfoGain.gain.value = .008;
  lfo.connect(lfoGain).connect(master.gain); lfo.start();
  const timer = setInterval(() => {
    if (!music) return;
    const bell = audio.createOscillator(), bellGain = audio.createGain(); bell.type = 'sine'; bell.frequency.value = root * (horrorLevel >= 8 ? 2.05 : 2.5);
    bellGain.gain.setValueAtTime(.035, audio.currentTime); bellGain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + 2.2); bell.connect(bellGain).connect(master); bell.start(); bell.stop(audio.currentTime + 2.2);
  }, Math.max(3600, 6500 - horrorLevel * 250));
  music = { oscillators, lfo, master, timer };
}

function stopMusic() {
  if (!music) return;
  clearInterval(music.timer); [...music.oscillators, music.lfo].forEach(node => { try { node.stop(); } catch {} }); music.master.disconnect(); music = null;
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

function tr(zh, en) { return language === 'en' ? (en || zh) : zh; }
function setMessage(text) { if (ui.message.textContent !== text) ui.message.textContent = text; }
function say(zh, en) { setMessage(tr(zh, en)); }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function notice(zh, en) { game.busy = true; say(zh, en); render(); await wait(PACE.item); game.busy = false; render(); }
function counts() { return { live: game.shells.filter(Boolean).length, blank: game.shells.filter(x => !x).length }; }
function itemLimit() { return savedInjuries.includes('pockets') ? 4 : 8; }
function updateHTML(element, html) { if (element.innerHTML !== html) element.innerHTML = html; }
function itemName(key) { return (language === 'en' ? itemInfoEn[key] : itemInfo[key])[0]; }
function itemDescription(key) { return (language === 'en' ? itemInfoEn[key] : itemInfo[key])[1]; }
function tone(low, medium, high, lowEn, mediumEn, highEn) {
  if (language === 'en') return horrorLevel >= 8 ? (highEn || high) : horrorLevel >= 5 ? (mediumEn || medium) : (lowEn || low);
  return horrorLevel >= 8 ? high : horrorLevel >= 5 ? medium : low;
}

function applyLanguage(nextLanguage = language) {
  language = nextLanguage === 'en' ? 'en' : 'zh'; localStorage.setItem('lastTrainLanguage', language);
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'; document.title = tr('末班轮盘', 'Last Train Roulette');
  document.body.style.setProperty('--sealed-label', language === 'en' ? '"TOTALS SEALED"' : '"数量已封存"');
  document.body.style.setProperty('--hud-label', language === 'en' ? '"PLAYER HUD"' : '"乘客状态"');
  document.querySelectorAll('[data-i18n]').forEach(element => { const pair = UI_TEXT[element.dataset.i18n]; if (pair) element.textContent = language === 'en' ? pair[1] : pair[0]; });
  const rulesZh = ['每次装填会公开高压与空响数量，打出第一发后封存为问号。','高压命中造成 1 点伤害；空响对准自己可继续行动。','使用道具窥探或操控下一格。三夜后击败检票员即获胜。','失败会新增一项永久伤势；完整通关只能治愈其中一项。','普通道具上限为 8；无限全套会无视上限并补齐所有道具。','双方生命上限为 6；难度会改变恶魔生命、道具与进攻倾向。','恐怖指数 5 以上启用轻微像素溅射，音效与音乐也会变化。','断路钳触发时可选择是否抵消停站铃。'];
  const rulesEn = ['Live and blank totals are shown after loading, then hidden after the first trigger.','A live chamber deals 1 damage. A blank aimed at yourself keeps your turn.','Use items to inspect or alter the next chamber. Defeat the demon across three nights.','A loss adds a permanent injury. A full victory heals only one.','The normal limit is 8. Endless Full Set ignores it and restores every item.','Maximum health is 6. Difficulty changes demon health, items, and aggression.','Horror level 5+ enables mild pixel splatter and changes music and effects.','When a Circuit Cutter triggers, you choose whether to cancel the Stop Bell.'];
  const ruleNodes = document.querySelectorAll('#rulesDialog li'); (language === 'en' ? rulesEn : rulesZh).forEach((text, index) => { if (ruleNodes[index]) ruleNodes[index].textContent = text; });
  document.querySelector('#rulesDialog .kicker').textContent = tr('乘车须知','PASSENGER NOTICE'); document.querySelector('#rulesDialog h2').textContent = tr('听响，下注，活到终点。','LISTEN. WAGER. REACH THE END.');
  $('closeRules').textContent = tr('我已知晓','UNDERSTOOD'); $('rulesButton').textContent = tr('规则','RULES'); $('adminButton').textContent = tr('维修口','SERVICE');
  $('soundButton').textContent = tr(`声音：${soundOn ? '开' : '关'}`, `SFX: ${soundOn ? 'ON' : 'OFF'}`); $('musicButton').textContent = tr(`音乐：${musicOn ? '开' : '关'}`, `MUSIC: ${musicOn ? 'ON' : 'OFF'}`);
  ui.viewButton.textContent = tr(`视角：${firstPerson ? '第一人称' : '桌面'}`, `VIEW: ${firstPerson ? 'FIRST PERSON' : 'TABLE'}`); ui.langButton.textContent = language === 'zh' ? 'EN' : '中文';
  document.querySelector('#stealDialog h2').textContent = tr('选择要夺取的道具','CHOOSE AN ITEM TO STEAL'); document.querySelector('#stealDialog .kicker').textContent = itemName('glove'); $('cancelSteal').textContent = tr('取消，不消耗手套','CANCEL — KEEP THE GLOVE');
  $('againButton').textContent = tr('再次乘车','RIDE AGAIN');
  document.querySelector('#adminDialog h2').textContent = tr('九号机组维修面板','UNIT 09 SERVICE PANEL'); document.querySelector('.password-label').textContent = tr('输入维修密钥','ENTER SERVICE KEY');
  $('adminLoginButton').textContent = tr('开启维护面板','OPEN SERVICE PANEL'); $('closeAdmin').textContent = tr('关闭维修口','CLOSE SERVICE PANEL');
  const cheatLabels = {
    heal: tr('生命全满','FULL HEALTH'), invincible: tr(`防护屏障：${invincible ? '开' : '关'}`,`ABSOLUTE BARRIER: ${invincible ? 'ON' : 'OFF'}`),
    peek: tr(`弹格监视：${maintenancePeek ? '开' : '关'}`,`CHAMBER MONITOR: ${maintenancePeek ? 'ON' : 'OFF'}`), items: tr(`无限全套：${supplyMode ? '开' : '关'}`,`ENDLESS FULL SET: ${supplyMode ? 'ON' : 'OFF'}`),
    weaken: tr('恶魔剩1血','DEMON TO 1 HEALTH'), cure: tr('治愈所有伤势','CURE ALL INJURIES')
  };
  document.querySelectorAll('[data-cheat]').forEach(button => { button.textContent = cheatLabels[button.dataset.cheat]; });
  applyDifficulty(difficulty); render();
}

function applyDifficulty(value) {
  difficulty = Math.max(1, Math.min(5, Number(value))); localStorage.setItem('lastTrainDifficulty', difficulty);
  ui.difficultyRange.value = difficulty; ui.difficultyValue.textContent = difficulty;
}

function applyView() {
  document.body.classList.toggle('first-person', firstPerson); localStorage.setItem('lastTrainView', firstPerson ? 'first' : 'table');
  ui.viewButton.textContent = tr(`视角：${firstPerson ? '第一人称' : '桌面'}`, `VIEW: ${firstPerson ? 'FIRST PERSON' : 'TABLE'}`);
}

function askBreaker() {
  return new Promise(resolve => { breakerResolver = resolve; ui.breaker.showModal(); });
}

function applyHorrorLevel(value) {
  horrorLevel = Math.max(1, Math.min(10, Number(value))); localStorage.setItem('lastTrainHorror', horrorLevel);
  ui.horrorRange.value = horrorLevel; ui.horrorValue.textContent = horrorLevel;
  document.body.classList.toggle('horror-mid', horrorLevel >= 5);
  document.body.classList.toggle('horror-high', horrorLevel >= 8);
  document.body.classList.toggle('horror-max', horrorLevel === 10);
  if (!game?.started) setMessage(tone('末班车不载活人。你确定要上车吗？', '隧道深处传来刮擦声。末班车正在等你。', '闸门后有人用你的声音说：上车。','The last train carries no living passengers. Will you board?','Something scrapes deep in the tunnel. The last train is waiting.','Behind the gate, something uses your voice: Board.'));
}

function triggerBlood(target) {
  if (horrorLevel < 5) return;
  ui.bloodFx.dataset.target = target; ui.bloodFx.classList.remove('splash'); void ui.bloodFx.offsetWidth; ui.bloodFx.classList.add('splash');
}

function refillSupply() {
  if (!supplyMode || !game.started) return;
  game.items = Object.keys(itemInfo);
}

function render() {
  const hearts = (hp, max) => Array.from({ length: max }, (_, i) => `<i class="heart ${i >= hp ? 'empty' : ''}"></i>`).join('');
  updateHTML(ui.playerHearts, hearts(game.playerHp, game.playerMax));
  updateHTML(ui.dealerHearts, hearts(game.dealerHp, game.dealerMax));
  ui.playerHpNumber.textContent = tr(`生命 ${Math.max(0, game.playerHp)} / ${game.playerMax}`, `HEALTH ${Math.max(0, game.playerHp)} / ${game.playerMax}`);
  ui.dealerHpNumber.textContent = tr(`生命 ${Math.max(0, game.dealerHp)} / ${game.dealerMax}`, `HEALTH ${Math.max(0, game.dealerHp)} / ${game.dealerMax}`);
  ui.live.textContent = game.started ? game.countsVisible ? game.publicCounts.live : '?' : '—';
  ui.blank.textContent = game.started ? game.countsVisible ? game.publicCounts.blank : '?' : '—';
  ui.ammoLedger.classList.toggle('sealed', game.started && !game.countsVisible);
  ui.round.textContent = tr(`第 ${game.round} 夜`, `NIGHT ${game.round}`);
  ui.turn.textContent = !game.started ? tr('等待入座','WAITING') : game.busy ? tr('机器运转中','MACHINE ACTIVE') : game.turn === 'player' ? tr('你的回合','YOUR TURN') : tr('检票员回合','DEMON TURN');
  ui.cabinet.dataset.turn = game.started ? game.turn : 'none';
  ui.cabinet.dataset.busy = game.busy ? 'true' : 'false';
  const canAct = game.started && game.turn === 'player' && !game.busy;
  document.querySelector('.player-card').classList.toggle('shielded', game.playerShield);
  document.querySelector('.dealer-card').classList.toggle('shielded', game.dealerShield);
  ui.shootDealer.disabled = !canAct; ui.shootSelf.disabled = !canAct || game.selfLocked;
  const baseStatus = game.powered ? tr('⚡ 你的增压已就绪','⚡ YOUR PRESSURE IS READY') : game.dealerPowered ? tr('⚡ 恶魔的增压已就绪','⚡ DEMON PRESSURE READY') : game.started ? tr(`弹仓剩余 ${game.shells.length} 格`, `${game.shells.length} CHAMBERS REMAIN`) : tr('机器未通电','MACHINE OFFLINE');
  const peekStatus = maintenancePeek && game.started && game.shells.length ? tr(` ｜ 监视：${game.shells[0] ? '高压' : '空响'}`, ` | MONITOR: ${game.shells[0] ? 'LIVE' : 'BLANK'}`) : '';
  ui.machineStatus.textContent = baseStatus + peekStatus;
  ui.machineStatus.classList.toggle('powered', game.powered || game.dealerPowered); ui.machineStatus.classList.toggle('peek-active', maintenancePeek);
  ui.chamber.style.setProperty('--slot-count', game.chamberTotal || 6);
  updateHTML(ui.slots, Array.from({ length: game.chamberTotal || 6 }, (_, i) => {
    const used = i < game.chamberStep;
    return `<span class="chamber-hole ${used ? 'used' : ''} ${i === game.chamberStep ? 'next' : ''}"><i>${i + 1}</i></span>`;
  }).join(''));
  updateHTML(ui.items, game.items.length ? game.items.map((key, i) => {
    const blocked = !canAct || game.itemsLocked || game.playerItemsSealed || key === 'breaker' || (key === 'wrench' && game.powered) || (key === 'tea' && game.playerHp >= game.playerMax) || (key === 'bell' && game.bell) || (key === 'glove' && !game.dealerItems.length) || (key === 'charm' && game.playerShield);
    const reason = game.playerItemsSealed ? tr('本回合道具已被封锁','ITEMS LOCKED THIS TURN') : key === 'breaker' ? tr('触发时由你选择是否使用','CHOOSE WHEN IT TRIGGERS') : game.itemsLocked ? tr('首次扣动后解锁','UNLOCKS AFTER FIRST TRIGGER') : key === 'wrench' && game.powered ? tr('增压已经启用','PRESSURE ALREADY ACTIVE') : key === 'tea' && game.playerHp >= game.playerMax ? tr('生命值已满','HEALTH IS FULL') : key === 'bell' && game.bell ? tr('停站铃已经启用','STOP BELL ACTIVE') : key === 'glove' && !game.dealerItems.length ? tr('对方没有道具','ENEMY HAS NO ITEMS') : key === 'charm' && game.playerShield ? tr('护符已经生效','CHARM ALREADY ACTIVE') : itemDescription(key);
    return `<button class="item" data-index="${i}" ${blocked ? 'disabled' : ''} aria-label="${itemName(key)}: ${reason}"><span class="item-image">${itemIcons[key]}</span><span class="item-copy"><b>${itemName(key)}</b><small>${reason}</small></span></button>`;
  }).join('') : `<span class="kicker">${tr('道具栏为空','ITEM TRAY EMPTY')}</span>`);
  updateHTML(ui.dealerItems, game.dealerItems.length ? game.dealerItems.map(key => `<span class="dealer-item" title="${itemName(key)}">${itemIcons[key]}</span>`).join('') : `<small>${tr('无道具','NO ITEMS')}</small>`);
  ui.itemCount.textContent = supplyMode ? `${game.items.length} / ∞` : `${game.items.length} / ${Math.max(itemLimit(), game.items.length)}`;
  ui.dealerItemCount.textContent = `${game.dealerItems.length} / 8`;
  ui.injuries.textContent = savedInjuries.length ? savedInjuries.map(k => language === 'en' ? injuryInfoEn[k]?.[0] : injuries.find(x => x.key === k)?.name).join(' / ') : tr('无','NONE');
  ui.injuries.title = savedInjuries.map(k => { const x = language === 'en' ? injuryInfoEn[k] : [injuries.find(i => i.key === k)?.name, injuries.find(i => i.key === k)?.text]; return `${x[0]}: ${x[1]}`; }).join('\n');
  ui.actionHint.textContent = !game.started ? tone('投入车票，开始第一夜', '投入车票，让闸机记住你', '把车票交给黑暗，它已经知道你的名字','Insert a ticket to begin the first night.','Insert a ticket. Let the gate remember you.','Feed your ticket to the dark. It already knows your name.') : game.busy ? tr('机器正在执行操作，请观察结果…','THE MACHINE IS ACTING. WATCH THE RESULT…') : game.turn === 'dealer' ? tone('恶魔正在判断…', '恶魔正隔着闸机打量你…', '它在计算你还能尖叫几次…','The demon is deciding…','The demon studies you through the gate…','It is counting how many screams you have left…') : game.playerItemsSealed ? tr('道具被封锁：本回合只能选择触点朝向','ITEMS LOCKED: CHOOSE A TARGET') : tr('选择一件道具，或决定触点朝向','CHOOSE AN ITEM OR A TARGET');
  ui.actionHint.classList.toggle('ready', canAct);
}

function dealItems() {
  if (supplyMode) { refillSupply(); return; }
  const pool = Object.keys(itemInfo), amount = Math.max(1, 3 - (savedInjuries.includes('tremor') ? 1 : 0));
  const limit = itemLimit();
  for (let i = 0; i < amount && game.items.length < limit; i++) game.items.push(pool[Math.floor(Math.random() * pool.length)]);
}

function dealDealerItems() {
  const pool = Object.keys(itemInfo), amount = 1 + Math.ceil(difficulty / 2);
  for (let i = 0; i < amount && game.dealerItems.length < 8; i++) game.dealerItems.push(pool[Math.floor(Math.random() * pool.length)]);
}

async function loadChamber() {
  const total = 4 + game.round;
  const difficultyLive = difficulty >= 4 ? 1 : 0;
  const live = Math.min(total - 1, Math.max(1, Math.floor(total / 2) + difficultyLive + (savedInjuries.includes('badluck') ? 1 : 0)));
  game.shells = shuffle([...Array(live).fill(true), ...Array(total - live).fill(false)]);
  game.chamberTotal = total; game.chamberStep = 0;
  game.publicCounts = { live, blank: total - live }; game.countsVisible = true;
  game.powered = false; game.dealerPowered = false; game.dealerKnown = null; dealItems(); dealDealerItems();
  ui.chamber.classList.remove('spin'); void ui.chamber.offsetWidth; ui.chamber.classList.add('spin');
  ui.cabinet.classList.remove('load-surge'); void ui.cabinet.offsetWidth; ui.cabinet.classList.add('load-surge');
  setMessage(tone(`机器装入 ${live} 格高压、${total - live} 格空响。顺序已打乱。`, `闸机吞入 ${live} 格高压、${total - live} 格空响。红灯开始呼吸。`, `它咽下 ${live} 格高压、${total - live} 格空响，然后把顺序藏进牙齿里。`,`Loaded: ${live} live, ${total - live} blank. Order shuffled.`,`The gate swallows ${live} live and ${total - live} blank. The red light breathes.`,`It devours ${live} live and ${total - live} blank, hiding the order behind its teeth.`));
  game.busy = true; beep('click'); render(); await wait(PACE.reload); game.busy = false; render();
}

async function startGame() {
  game = freshGame(); game.started = true;
  ui.start.hidden = true; ui.shootDealer.hidden = false; ui.shootSelf.hidden = false;
  startMusic(); await loadChamber();
}

async function fire(target, actor = 'player') {
  if (game.busy || !game.shells.length) return;
  game.busy = true; render(); beep('click');
  setMessage(actor === 'player'
    ? target === 'self' ? tone('你把触点按向自己的胸口……', '冰冷触点贴住你的心口……', '闸机贴住你的心脏，像认出了回家的路……','You press the contact to your chest…','The cold contact rests over your heart…','The gate finds your heart as if it remembers the way home…') : tone('你把触点推向检票员……', '你把高压触点推向恶魔的脸……', '你想让那张脸彻底熄灭……','You aim the contact at the conductor…','You push the live contact toward the demon’s face…','You want that face to go dark forever…')
    : target === 'self' ? tone('检票员把触点按向自己。', '恶魔笑着把触点按向自己。', '它把触点塞进胸腔，里面传来另一阵笑声。','The conductor aims at itself.','The demon smiles and presses the contact to itself.','It pushes the contact into its chest. Something inside laughs back.') : tone('检票员选择了你。', '恶魔把红灯转向你。', '它轻声念出你的名字，然后按下触点。','The conductor chooses you.','The demon turns the red light toward you.','It whispers your name, then pulls the trigger.'));
  await wait(PACE.aim);
  const boosted = actor === 'player' ? game.powered : game.dealerPowered;
  if (actor === 'player') { game.powered = false; game.itemsLocked = false; game.selfLocked = false; game.playerItemsSealed = false; }
  else { game.dealerPowered = false; game.dealerKnown = null; }
  const live = game.shells.shift(); game.chamberStep++; game.countsVisible = false;
  ui.chamber.style.setProperty('--step', game.chamberStep);
  ui.chamber.classList.remove('advance'); void ui.chamber.offsetWidth; ui.chamber.classList.add('advance');
  ui.spark.classList.remove('fire'); void ui.spark.offsetWidth;
  if (live) {
    ui.spark.classList.add('fire'); beep('live');
    ui.cabinet.classList.remove('impact'); void ui.cabinet.offsetWidth; ui.cabinet.classList.add('impact');
    let damage = boosted ? 2 : 1;
    const hitsPlayer = target === 'self' ? actor === 'player' : actor === 'dealer';
    const hitsDealer = !hitsPlayer;
    let shielded = false;
    if (!invincible && hitsPlayer && game.playerShield) { damage = Math.max(0, damage - 1); game.playerShield = false; shielded = true; }
    if (hitsDealer && game.dealerShield) { damage = Math.max(0, damage - 1); game.dealerShield = false; shielded = true; }
    if (hitsPlayer && invincible) say('高压命中，但维护屏障绝对阻挡了全部伤害。','Live hit. The service barrier blocks all damage completely.');
    else if (target === 'self') actor === 'player' ? game.playerHp -= damage : game.dealerHp -= damage;
    else actor === 'player' ? game.dealerHp -= damage : game.playerHp -= damage;
    const hitCard = target === 'self' ? (actor === 'player' ? document.querySelector('.player-card') : document.querySelector('.dealer-card')) : (actor === 'player' ? document.querySelector('.dealer-card') : document.querySelector('.player-card'));
    hitCard.classList.add('hit'); setTimeout(() => hitCard.classList.remove('hit'), 500);
    if (!(hitsPlayer && invincible) && damage > 0) triggerBlood(hitsPlayer ? 'player' : 'dealer');
    if (!(hitsPlayer && invincible)) setMessage(shielded ? tr(`旧护符碎裂，抵消了 1 点伤害。${damage ? `仍受到 ${damage} 点伤害。` : '这次没有受到伤害。'}`, `The Old Charm breaks and blocks 1 damage. ${damage ? `${damage} damage still gets through.` : 'No damage gets through.'}`) : tone(`高压命中。${damage > 1 ? '增压造成了 2 点伤害。' : '车厢的灯灭了一盏。'}`, `高压命中，暗红像素溅上闸机。${damage > 1 ? '伤害为 2。' : ''}`, `高压撕开寂静。闸机深处传来满足的咀嚼声。${damage > 1 ? '两盏生命灯同时熄灭。' : ''}`,`Live hit. ${damage > 1 ? 'Pressure deals 2 damage.' : 'One carriage light goes dark.'}`,`Live hit. Dark pixels strike the gate. ${damage > 1 ? 'Damage: 2.' : ''}`,`The live chamber tears the silence apart. Something inside the gate chews with satisfaction.`));
  } else {
    beep('blank'); ui.machine.classList.add('blank-kick'); setTimeout(() => ui.machine.classList.remove('blank-kick'), 350);
    ui.cabinet.classList.remove('blank-wave'); void ui.cabinet.offsetWidth; ui.cabinet.classList.add('blank-wave');
    setMessage(boosted ? tone('只有一声空响。增压在这次扣动中耗尽了。', '空响。增压火花在黑暗里死去。', '空响。它失望地松开了你的喉咙。','Only a blank. The pressure charge is spent.','Blank. The pressure spark dies in the dark.','Blank. It releases your throat in disappointment.') : tone('只有一声空响。机器还在等。', '空响。隧道把声音原样送了回来。', '空响。你身后的东西又靠近了一步。','Only a blank. The machine is still waiting.','Blank. The tunnel sends the sound back unchanged.','Blank. The thing behind you takes another step closer.'));
  }
  render(); await wait(PACE.result);
  if (game.playerHp <= 0 || game.dealerHp <= 0) return resolveRound();
  if (!game.shells.length) await loadChamber();
  if (!live && target === 'self') game.turn = actor;
  else game.turn = actor === 'player' ? 'dealer' : 'player';
  game.busy = false; render();
  if (game.turn === 'player' && game.dealerBell) {
    game.dealerBell = false; game.turn = 'dealer'; game.busy = true; say('恶魔的停站铃响起。你的回合被列车吞掉了。','The demon’s Stop Bell rings. The train swallows your turn.'); render(); await wait(PACE.item); return dealerMove();
  }
  if (game.turn === 'dealer') dealerMove();
}

async function dealerMove() {
  game.busy = true; render();
  setMessage(game.dealerItems.length ? tone('恶魔检查自己的道具。', '恶魔的指甲划过道具边缘……', '它挑选工具，像在决定从哪里拆开你。','The demon checks its items.','Its claws scrape across the item tray…','It chooses a tool as if deciding where to open you.') : tone('恶魔盯着弹仓判断下一步。', '恶魔空着手，安静地盯着你。', '它没有道具，只剩牙齿。','The demon studies the chamber.','Empty-handed, the demon stares at you.','It has no items. Only teeth.'));
  await wait(PACE.dealer);
  if (game.bell) { game.bell = false; game.turn = 'player'; say('停站铃响了。检票员错过了这一回合。','The Stop Bell rings. The demon loses this turn.'); beep('item'); render(); await wait(PACE.item); game.busy = false; return render(); }
  if (game.dealerItemsSealed) { game.dealerItemsSealed = false; say('封锁条压住了恶魔的道具栏。它只能直接扣动。','The Lock Strip seals the demon’s items. It must fire directly.'); await wait(PACE.item); }
  else await dealerUseItems(Math.min(3, Math.ceil(difficulty / 2)));
  if (game.dealerHp <= 0) return resolveRound();
  const c = counts();
  const aggression = .5 + difficulty * .08;
  const target = game.dealerKnown === false ? 'self' : game.dealerKnown === true ? 'player' : c.blank > c.live ? 'self' : (Math.random() < aggression ? 'player' : 'self');
  game.busy = false; fire(target, 'dealer');
}

async function dealerUseItems(limit) {
  for (let i = 0; i < limit; i++) {
    const used = await dealerUseItem();
    if (!used || game.dealerHp <= 0) break;
  }
}

async function dealerUseItem() {
  if (!game.dealerItems.length) return false;
  let key;
  if (game.dealerHp < game.dealerMax && game.dealerItems.includes('tea')) key = 'tea';
  else if (!game.dealerShield && game.dealerItems.includes('charm')) key = 'charm';
  else if (!game.playerItemsSealed && game.dealerItems.includes('seal')) key = 'seal';
  else if (game.dealerKnown === null && game.dealerItems.includes('lamp')) key = 'lamp';
  else if (!game.dealerPowered && game.dealerKnown !== false && game.dealerItems.includes('wrench') && counts().live >= counts().blank) key = 'wrench';
  else if (!game.dealerBell && game.dealerItems.includes('bell') && Math.random() < .65) key = 'bell';
  else if (game.dealerItems.includes('glove') && game.items.length) key = 'glove';
  else if (game.dealerKnown !== null && game.dealerItems.includes('inverter')) key = 'inverter';
  else if (game.dealerHp <= 2 && game.dealerItems.includes('vial')) key = 'vial';
  else if (game.dealerItems.includes('ticket') && counts().blank > counts().live) key = 'ticket';
  if (!key) return false;
  game.dealerItems.splice(game.dealerItems.indexOf(key), 1); beep('item');
  ui.machine.classList.remove('item-surge'); void ui.machine.offsetWidth; ui.machine.classList.add('item-surge');
  if (key === 'tea') { game.dealerHp++; say('恶魔喝下热茶，恢复了 1 点生命。','The demon drinks Hot Tea and restores 1 health.'); }
  if (key === 'lamp') {
    game.dealerKnown = game.shells[0];
    const taunts = language === 'en' ? ['The demon covers the lamp. “Guess.”','The demon checks the chamber, then slowly looks up.','The demon laughs. “Now you may be afraid.”','It closes the inspection hatch. “I know.”'] : ['恶魔遮住检修灯，低声说：“猜吧。”', '恶魔看完弹仓，慢慢抬起头。', '恶魔笑了一声：“现在轮到你害怕了。”', '恶魔合上检修盖：“我已经知道答案。”'];
    setMessage(taunts[Math.floor(Math.random() * taunts.length)]);
  }
  if (key === 'wrench') { game.dealerPowered = true; say('恶魔拧紧增压扳手。下一次扣动会更危险。','The demon tightens a Pressure Wrench. Its next trigger is stronger.'); }
  if (key === 'bell') {
    const breakerIndex = game.items.indexOf('breaker');
    if (breakerIndex >= 0) {
      const useBreaker = await askBreaker();
      if (useBreaker) { game.items.splice(breakerIndex, 1); refillSupply(); say('你用断路钳咬断线路，恶魔的停站铃失效了。','You cut the circuit. The demon’s Stop Bell fails.'); }
      else { game.dealerBell = true; say('你保留了断路钳。停站铃将夺走你的下一回合。','You kept the cutter. The Stop Bell will take your next turn.'); }
    } else { game.dealerBell = true; say('恶魔接通停站铃，准备夺走你的下个回合。','The demon connects a Stop Bell to steal your next turn.'); }
  }
  if (key === 'seal') { game.playerItemsSealed = true; say('恶魔贴下封锁条。你的下个道具阶段被封住了。','The demon applies a Lock Strip. Your next item phase is sealed.'); }
  if (key === 'charm') { game.dealerShield = true; say('恶魔挂起旧护符。下一次伤害将减少 1 点。','The demon hangs an Old Charm. Its next damage is reduced by 1.'); }
  if (key === 'glove') {
    const stolenIndex = Math.floor(Math.random() * game.items.length); const stolen = game.items.splice(stolenIndex, 1)[0];
    game.dealerItems.push(stolen); refillSupply(); say(`恶魔夺走了你的「${itemInfo[stolen][0]}」。`,`The demon steals your ${itemInfoEn[stolen][0]}.`);
  }
  if (key === 'inverter') {
    game.shells[0] = !game.shells[0]; if (game.dealerKnown !== null) game.dealerKnown = !game.dealerKnown;
    ui.chamber.classList.remove('invert-spin'); void ui.chamber.offsetWidth; ui.chamber.classList.add('invert-spin');
    say('恶魔启动换向器。下一格的性质已经反转。','The demon activates an Inverter. The next chamber is reversed.');
  }
  if (key === 'vial') {
    const delta = Math.random() < .5 ? -1 : 2; game.dealerHp = Math.max(0, Math.min(game.dealerMax, game.dealerHp + delta));
    say(delta > 0 ? '命运药剂：恶魔恢复 2 点生命。' : '命运药剂：恶魔失去 1 点生命。', delta > 0 ? 'Fate Vial: the demon restores 2 health.' : 'Fate Vial: the demon loses 1 health.');
  }
  if (key === 'ticket') {
    const removed = game.shells.shift(); game.chamberStep++; say(`恶魔用废票弃掉一格：${removed ? '高压' : '空响'}。`,`The demon discards a ${removed ? 'live' : 'blank'} chamber with a Void Ticket.`);
    if (!game.shells.length) await loadChamber();
  }
  render(); await wait(PACE.item); return true;
}

async function resolveRound() {
  game.busy = true; render();
  if (game.playerHp <= 0) return endGame(false);
  if (game.round >= 3) return endGame(true);
  game.round++; game.dealerMax = dealerMaxForRound(game.round); game.dealerHp = game.dealerMax;
  game.playerHp = Math.min(game.playerMax, game.playerHp + 1); game.turn = 'player'; game.busy = false;
  game.itemsLocked = savedInjuries.includes('stiff'); game.selfLocked = savedInjuries.includes('frostbite');
  setMessage(tone('检票员倒下，又从下一节车厢站起。机器变得更重了。', '恶魔倒下。下一节车厢里，另一双红眼缓缓睁开。', '那具身体倒下了。下一节车厢却传来骨头重新拼好的声音。','The conductor falls, then rises in the next carriage. The machine grows heavier.','The demon falls. Another pair of red eyes opens in the next carriage.','The body drops. From the next carriage comes the sound of bones rebuilding themselves.'));
  await wait(PACE.round); await loadChamber();
}

async function useItem(index) {
  if (game.busy || game.turn !== 'player') return;
  const key = game.items[index]; if (!key) return;
  if (game.playerItemsSealed) return notice('封锁条压住道具栏。本回合只能直接扣动。','Your items are sealed. You must fire this turn.');
  if (key === 'breaker') return notice('断路钳会在对方使用停站铃时询问你是否使用。','The Circuit Cutter asks for your choice when the enemy uses a Stop Bell.');
  if (game.itemsLocked) return notice('僵硬的手指不听使唤。先扣动一次，才能使用道具。','Your stiff fingers will not move. Trigger once to unlock items.');
  if (key === 'wrench' && game.powered) return notice('机器已经增压，必须先扣动一次。','Pressure is already active. Trigger once first.');
  if (key === 'tea' && game.playerHp >= game.playerMax) return notice('生命值已满，热茶留到受伤后再喝。','Health is full. Save the tea for later.');
  if (key === 'bell' && game.bell) return notice('停站铃已经接通，不能重复接线。','A Stop Bell is already connected.');
  if (key === 'glove') {
    if (!game.dealerItems.length) return notice('恶魔没有可夺取的道具。','The demon has no item to steal.');
    pendingStealIndex = index;
    ui.stealOptions.innerHTML = game.dealerItems.map((item, i) => `<button class="steal-choice" data-steal-index="${i}" type="button"><span>${itemIcons[item]}</span><b>${itemName(item)}</b><small>${itemDescription(item)}</small></button>`).join('');
    ui.steal.showModal(); return;
  }
  if (key === 'lamp') {
    if (game.firstLampBlocked) { game.firstLampBlocked = false; say('耳鸣盖过了机器声。你什么也没看清。','Tinnitus drowns out the machine. You see nothing.'); }
    else say(game.shells[0] ? '检修灯映出红色线圈：下一格是高压。' : '检修灯下空空如也：下一格是空响。', game.shells[0] ? 'The lamp reveals a red coil: next is LIVE.' : 'The lamp reveals an empty slot: next is BLANK.');
  }
  if (key === 'wrench') { game.powered = true; say('线圈被拧紧。你的下一次高压命中造成 2 点伤害。','The coil is tightened. Your next live hit deals 2 damage.'); }
  if (key === 'ticket') { const removed = game.shells.shift(); game.chamberStep++; say(`废票卷走了一格：${removed ? '高压' : '空响'}。`, `The Void Ticket discards a ${removed ? 'live' : 'blank'} chamber.`); if (!game.shells.length) await loadChamber(); }
  if (key === 'bell') {
    const breakerIndex = game.dealerItems.indexOf('breaker');
    if (breakerIndex >= 0) { game.dealerItems.splice(breakerIndex, 1); say('恶魔的断路钳咬断线路，你的停站铃失效了。','The demon cuts the circuit. Your Stop Bell fails.'); }
    else { game.bell = true; say('停站铃已经接通。检票员的下个回合将被跳过。','Stop Bell connected. The demon loses its next turn.'); }
  }
  if (key === 'seal') { game.dealerItemsSealed = true; say('封锁条压住恶魔的道具栏。它下次只能直接扣动。','The Lock Strip seals the demon’s items. It must fire next turn.'); }
  if (key === 'charm') { game.playerShield = true; say('旧护符贴上胸口。下一次伤害减少 1 点。','The Old Charm rests on your chest. Reduce the next damage by 1.'); }
  if (key === 'tea') { game.playerHp = Math.min(game.playerMax, game.playerHp + 1); say('热茶让手不再发抖。恢复 1 点生命。','Hot Tea steadies your hands. Restore 1 health.'); }
  if (key === 'inverter') {
    game.shells[0] = !game.shells[0]; ui.chamber.classList.remove('invert-spin'); void ui.chamber.offsetWidth; ui.chamber.classList.add('invert-spin');
    say('换向器发出刺耳蜂鸣。下一格已经反转。','The Inverter screams. The next chamber is reversed.');
  }
  if (key === 'vial') {
    const delta = Math.random() < .5 ? -1 : 2;
    if (delta > 0) game.playerHp = Math.min(game.playerMax, game.playerHp + 2);
    else if (!invincible) game.playerHp = Math.max(0, game.playerHp - 1);
    say(delta > 0 ? '命运药剂：恢复 2 点生命。' : invincible ? '命运药剂试图扣血，但防护屏障完全阻挡了它。' : '命运药剂：失去 1 点生命。', delta > 0 ? 'Fate Vial: restored 2 health.' : invincible ? 'The Fate Vial tried to harm you, but the barrier blocked everything.' : 'Fate Vial: lost 1 health.');
  }
  game.items.splice(index, 1); refillSupply(); beep('item');
  ui.machine.classList.remove('item-surge'); void ui.machine.offsetWidth; ui.machine.classList.add('item-surge');
  ui.items.classList.remove('item-used'); void ui.items.offsetWidth; ui.items.classList.add('item-used');
  game.busy = true; render();
  if (game.playerHp <= 0) { setTimeout(() => resolveRound(), PACE.result); return; }
  await wait(PACE.item); game.busy = false; render();
}

async function completeSteal(dealerIndex) {
  if (pendingStealIndex === null || !game.items[pendingStealIndex] || !game.dealerItems[dealerIndex]) return;
  const stolen = game.dealerItems.splice(dealerIndex, 1)[0];
  game.items.splice(pendingStealIndex, 1); game.items.push(stolen); pendingStealIndex = null;
  refillSupply();
  ui.steal.close(); beep('item'); say(`你从恶魔手中夺走了「${itemInfo[stolen][0]}」。`,`You steal the demon’s ${itemInfoEn[stolen][0]}.`);
  ui.cabinet.classList.remove('steal-flash'); void ui.cabinet.offsetWidth; ui.cabinet.classList.add('steal-flash');
  game.busy = true; render(); await wait(PACE.item); game.busy = false; render();
}

function applyCheat(name, button) {
  if (name === 'cure') {
    savedInjuries = []; localStorage.removeItem('lastTrainInjuries');
    if (game.started) { game.playerMax = 6; game.playerHp = 6; game.itemsLocked = false; game.selfLocked = false; game.firstLampBlocked = false; } else game = freshGame();
    say('维护指令：全部永久伤势已清除，生命上限恢复为 6。','Service command: all permanent injuries cleared. Maximum health restored to 6.'); render(); return;
  }
  if (!game.started) { $('adminError').textContent = tr('请先投入车票，再启用对局功能。','Insert a ticket before using match controls.'); return; }
  $('adminError').textContent = '';
  if (name === 'heal') { game.playerHp = game.playerMax; say('维护指令：生命值已恢复。','Service command: health restored.'); }
  if (name === 'invincible') { invincible = !invincible; if (invincible) game.playerHp = game.playerMax; say(`绝对防护屏障已${invincible ? '开启' : '关闭'}。`,`Absolute barrier ${invincible ? 'enabled' : 'disabled'}.`); }
  if (name === 'peek') { maintenancePeek = !maintenancePeek; say(`弹格持续监视已${maintenancePeek ? '开启' : '关闭'}。`,`Chamber monitor ${maintenancePeek ? 'enabled' : 'disabled'}.`); }
  if (name === 'items') { supplyMode = !supplyMode; refillSupply(); say(`无限全套道具已${supplyMode ? '开启' : '关闭'}。`,`Endless full item set ${supplyMode ? 'enabled' : 'disabled'}.`); }
  if (name === 'weaken') { game.dealerHp = 1; say('维护指令：恶魔生命值已设为 1。','Service command: demon health set to 1.'); }
  applyLanguage(language);
  ui.cabinet.classList.remove('admin-flash'); void ui.cabinet.offsetWidth; ui.cabinet.classList.add('admin-flash'); beep('item'); render();
}

function endGame(won) {
  if (!won) {
    const available = injuries.filter(x => !savedInjuries.includes(x.key));
    if (available.length) { const injury = available[Math.floor(Math.random() * available.length)]; savedInjuries.push(injury.key); localStorage.setItem('lastTrainInjuries', JSON.stringify(savedInjuries)); $('endingCopy').textContent = tr(`你在站台醒来，留下了「${injury.name}」：${injury.text}`,`You wake on the platform with ${injuryInfoEn[injury.key][0]}: ${injuryInfoEn[injury.key][1]}`); }
    else $('endingCopy').textContent = tr('你再次在站台醒来。旧伤没有增加，但列车仍记得你。','You wake on the platform again. No new injury, but the train remembers.');
    $('endingKicker').textContent = tr('列车拒载','PASSAGE DENIED'); $('endingTitle').textContent = tone('你被留在了隧道里。', '车门关上，你的影子没有跟出来。', '天亮了。隧道里却多了一个用你声音说话的人。','You are left in the tunnel.','The doors close. Your shadow never comes back.','Morning arrives. Something in the tunnel now speaks with your voice.');
  } else {
    $('endingKicker').textContent = tr('终点 · 05:40','TERMINUS · 05:40'); $('endingTitle').textContent = tr('天亮之前，门开了。','BEFORE DAWN, THE DOOR OPENS.');
    let cure = '';
    if (savedInjuries.length) { const healed = savedInjuries.splice(Math.floor(Math.random() * savedInjuries.length), 1)[0]; const injury = injuries.find(x => x.key === healed); localStorage.setItem('lastTrainInjuries', JSON.stringify(savedInjuries)); cure = tr(` 晨光治愈了「${injury.name}」。`,` Dawn heals ${injuryInfoEn[healed][0]}.`); }
    $('endingCopy').textContent = tr(`检票员把最后一张车票推给你。上面写着：债已付清。${cure}`,`The conductor slides you the final ticket. It reads: DEBT PAID.${cure}`); beep('win');
  }
  render(); ui.ending.showModal();
}

ui.start.addEventListener('click', startGame);
ui.shootDealer.addEventListener('click', () => fire('dealer'));
ui.shootSelf.addEventListener('click', () => fire('self'));
ui.items.addEventListener('click', e => { const button = e.target.closest('.item'); if (button) useItem(Number(button.dataset.index)); });
ui.stealOptions.addEventListener('click', e => { const button = e.target.closest('.steal-choice'); if (button) completeSteal(Number(button.dataset.stealIndex)); });
$('cancelSteal').addEventListener('click', () => { pendingStealIndex = null; ui.steal.close(); });
$('rulesButton').addEventListener('click', () => ui.rules.showModal());
$('closeRules').addEventListener('click', () => ui.rules.close());
$('adminButton').addEventListener('click', () => {
  $('adminLogin').hidden = adminUnlocked; $('adminCheats').hidden = !adminUnlocked; $('adminError').textContent = ''; ui.admin.showModal();
});
$('adminLoginButton').addEventListener('click', () => {
  if ($('adminPassword').value === 'XxbY141128') {
    adminUnlocked = true; $('adminLogin').hidden = true; $('adminCheats').hidden = false; $('adminPassword').value = ''; beep('win');
  } else { $('adminError').textContent = tr('密钥错误。维修口保持锁定。','Invalid key. Service panel remains locked.'); $('adminPassword').select(); }
});
$('adminPassword').addEventListener('keydown', e => { if (e.key === 'Enter') $('adminLoginButton').click(); });
$('adminCheats').addEventListener('click', e => { const button = e.target.closest('[data-cheat]'); if (button) applyCheat(button.dataset.cheat, button); });
$('closeAdmin').addEventListener('click', () => ui.admin.close());
$('useBreaker').addEventListener('click', () => { ui.breaker.close(); const resolve = breakerResolver; breakerResolver = null; resolve?.(true); });
$('keepBreaker').addEventListener('click', () => { ui.breaker.close(); const resolve = breakerResolver; breakerResolver = null; resolve?.(false); });
ui.breaker.addEventListener('cancel', event => event.preventDefault());
$('soundButton').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', soundOn); if (soundOn) beep('click'); applyLanguage(language); });
$('musicButton').addEventListener('click', e => { musicOn = !musicOn; e.currentTarget.setAttribute('aria-pressed', musicOn); if (musicOn && game.started) startMusic(); else stopMusic(); applyLanguage(language); });
$('horrorRange').addEventListener('input', e => applyHorrorLevel(e.currentTarget.value));
$('horrorRange').addEventListener('change', () => { if (music) { stopMusic(); startMusic(); } });
$('difficultyRange').addEventListener('input', e => { applyDifficulty(e.currentTarget.value); render(); });
$('viewButton').addEventListener('click', () => { firstPerson = !firstPerson; applyView(); });
$('langButton').addEventListener('click', () => applyLanguage(language === 'zh' ? 'en' : 'zh'));
$('againButton').addEventListener('click', () => { ui.ending.close(); startGame(); });

game = freshGame(); applyHorrorLevel(horrorLevel); applyDifficulty(difficulty); applyView(); applyLanguage(language);
