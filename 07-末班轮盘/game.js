const $ = (id) => document.getElementById(id);
const ui = {
  cabinet: $('cabinet'), machine: $('machine'), chamber: $('chamber'), spark: $('spark'), message: $('message'),
  playerHearts: $('playerHearts'), dealerHearts: $('dealerHearts'), live: $('liveCount'), blank: $('blankCount'),
  round: $('roundLabel'), turn: $('turnLabel'), items: $('items'), injuries: $('injuryText'), slots: $('chamberSlots'),
  machineStatus: $('machineStatus'), dealerItems: $('dealerItems'),
  start: $('startButton'), shootDealer: $('shootDealer'), shootSelf: $('shootSelf'),
  rules: $('rulesDialog'), ending: $('endingDialog')
};

const itemInfo = {
  lamp: ['检修灯', '查看下一格'],
  wrench: ['增压扳手', '下次高压伤害+1'],
  ticket: ['废票', '弃掉下一格'],
  bell: ['停站铃', '跳过对手回合'],
  tea: ['热茶', '恢复1点生命']
};

const itemIcons = {
  lamp: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 4h13v5h4v15h-4v4H7v-4H4V9h3zm4 5v10h5V9z"/></svg>',
  wrench: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20 3v7l-4 4-4-4V3C5 5 4 12 8 16L3 26l4 3 8-10c6 2 12-3 11-9l-4 4-4-2 4-5z"/></svg>',
  ticket: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 7h26v7c-4 0-4 4 0 4v7H3v-7c4 0 4-4 0-4zm9 4v10h3V11zm6 0v10h2V11z"/></svg>',
  bell: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M14 3h4v4c6 1 8 6 8 13l3 3v3H3v-3l3-3c0-7 2-12 8-13zm-3 24h10c-1 4-9 4-10 0z"/></svg>',
  tea: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 10h19v4h5v10h-5v4H8l-3-6zm19 7v5h2v-5zM10 3h3v5h-3zm7 0h3v5h-3z"/></svg>'
};

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

let savedInjuries = JSON.parse(localStorage.getItem('lastTrainInjuries') || '[]');
let soundOn = true;
let audio;
let game;

function freshGame() {
  const maxHp = Math.max(2, 4 - (savedInjuries.includes('burn') ? 1 : 0));
  const dealerMax = 3 + (savedInjuries.includes('debt') ? 1 : 0);
  return { round: 1, playerHp: Math.max(1, maxHp - (savedInjuries.includes('insomnia') ? 1 : 0)), playerMax: maxHp,
    dealerHp: dealerMax, dealerMax, shells: [], turn: 'player', busy: false,
    items: [], dealerItems: [], powered: false, dealerPowered: false, bell: false, dealerBell: false, dealerKnown: null,
    itemsLocked: savedInjuries.includes('stiff'), selfLocked: savedInjuries.includes('frostbite'), chamberTotal: 0, chamberStep: 0,
    firstLampBlocked: savedInjuries.includes('tinnitus'), started: false };
}

function beep(type = 'click') {
  if (!soundOn) return;
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  const osc = audio.createOscillator(), gain = audio.createGain();
  const tones = { click: [110, .05, 'square'], blank: [70, .12, 'triangle'], live: [48, .32, 'sawtooth'], item: [310, .09, 'square'], win: [180, .55, 'triangle'] };
  const [freq, length, wave] = tones[type];
  osc.type = wave; osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (type === 'live') osc.frequency.exponentialRampToValueAtTime(26, audio.currentTime + length);
  gain.gain.setValueAtTime(.055, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
  osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + length);
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

function setMessage(text) { ui.message.textContent = text; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function counts() { return { live: game.shells.filter(Boolean).length, blank: game.shells.filter(x => !x).length }; }

function render() {
  const hearts = (hp, max) => Array.from({ length: max }, (_, i) => `<i class="heart ${i >= hp ? 'empty' : ''}"></i>`).join('');
  ui.playerHearts.innerHTML = hearts(game.playerHp, game.playerMax);
  ui.dealerHearts.innerHTML = hearts(game.dealerHp, game.dealerMax);
  const c = counts(); ui.live.textContent = game.started ? c.live : '—'; ui.blank.textContent = game.started ? c.blank : '—';
  ui.round.textContent = `第 ${game.round} 夜`;
  ui.turn.textContent = !game.started ? '等待入座' : game.busy ? '机器运转中' : game.turn === 'player' ? '你的回合' : '检票员回合';
  ui.cabinet.dataset.turn = game.started ? game.turn : 'none';
  const canAct = game.started && game.turn === 'player' && !game.busy;
  ui.shootDealer.disabled = !canAct; ui.shootSelf.disabled = !canAct || game.selfLocked;
  ui.machineStatus.textContent = game.powered ? '⚡ 你的增压已就绪' : game.dealerPowered ? '⚡ 恶魔的增压已就绪' : game.started ? `弹仓剩余 ${game.shells.length} 格` : '机器未通电';
  ui.machineStatus.classList.toggle('powered', game.powered || game.dealerPowered);
  ui.slots.innerHTML = Array.from({ length: game.chamberTotal || 6 }, (_, i) => {
    const angle = -90 + (360 / (game.chamberTotal || 6)) * i;
    const left = 50 + 34 * Math.cos(angle * Math.PI / 180), top = 50 + 34 * Math.sin(angle * Math.PI / 180);
    const used = i < game.chamberStep;
    return `<span class="chamber-hole ${used ? 'used' : ''} ${i === game.chamberStep ? 'next' : ''}" style="left:${left}%;top:${top}%"></span>`;
  }).join('');
  ui.items.innerHTML = game.items.length ? game.items.map((key, i) => {
    const blocked = !canAct || game.itemsLocked || (key === 'wrench' && game.powered) || (key === 'tea' && game.playerHp >= game.playerMax) || (key === 'bell' && game.bell);
    const reason = game.itemsLocked ? '首次扣动后解锁' : key === 'wrench' && game.powered ? '增压已经启用' : key === 'tea' && game.playerHp >= game.playerMax ? '生命值已满' : key === 'bell' && game.bell ? '停站铃已经启用' : itemInfo[key][1];
    return `<button class="item" data-index="${i}" ${blocked ? 'disabled' : ''} aria-label="${itemInfo[key][0]}：${reason}"><span class="item-image">${itemIcons[key]}</span><span class="item-copy"><b>${itemInfo[key][0]}</b><small>${reason}</small></span></button>`;
  }).join('') : '<span class="kicker">道具栏为空</span>';
  ui.dealerItems.innerHTML = game.dealerItems.length ? game.dealerItems.map(key => `<span class="dealer-item" title="${itemInfo[key][0]}">${itemIcons[key]}</span>`).join('') : '<small>无道具</small>';
  ui.injuries.textContent = savedInjuries.length ? savedInjuries.map(k => injuries.find(x => x.key === k)?.name).join(' / ') : '无';
  ui.injuries.title = savedInjuries.map(k => { const x = injuries.find(i => i.key === k); return `${x.name}：${x.text}`; }).join('\n');
}

function dealItems() {
  const pool = Object.keys(itemInfo), amount = Math.max(1, 3 - (savedInjuries.includes('tremor') ? 1 : 0));
  const limit = savedInjuries.includes('pockets') ? 4 : 6;
  for (let i = 0; i < amount && game.items.length < limit; i++) game.items.push(pool[Math.floor(Math.random() * pool.length)]);
}

function dealDealerItems() {
  const pool = Object.keys(itemInfo), amount = game.round === 1 ? 1 : 2;
  for (let i = 0; i < amount && game.dealerItems.length < 4; i++) game.dealerItems.push(pool[Math.floor(Math.random() * pool.length)]);
}

function loadChamber() {
  const total = 4 + game.round;
  const live = Math.min(total - 1, Math.max(1, Math.floor(total / 2) + (savedInjuries.includes('badluck') ? 1 : 0)));
  game.shells = shuffle([...Array(live).fill(true), ...Array(total - live).fill(false)]);
  game.chamberTotal = total; game.chamberStep = 0;
  game.powered = false; game.dealerPowered = false; game.dealerKnown = null; dealItems(); dealDealerItems();
  ui.chamber.classList.remove('spin'); void ui.chamber.offsetWidth; ui.chamber.classList.add('spin');
  setMessage(`机器装入 ${live} 格高压、${total - live} 格空响。顺序已打乱。`);
  beep('click'); render();
}

async function startGame() {
  game = freshGame(); game.started = true;
  ui.start.hidden = true; ui.shootDealer.hidden = false; ui.shootSelf.hidden = false;
  loadChamber();
}

async function fire(target, actor = 'player') {
  if (game.busy || !game.shells.length) return;
  game.busy = true; render(); beep('click');
  setMessage(actor === 'player' ? (target === 'self' ? '你把触点按向自己的胸口……' : '你把触点推向检票员……') : (target === 'self' ? '检票员把触点按向自己。' : '检票员选择了你。'));
  await wait(650);
  const boosted = actor === 'player' ? game.powered : game.dealerPowered;
  if (actor === 'player') { game.powered = false; game.itemsLocked = false; game.selfLocked = false; }
  else { game.dealerPowered = false; game.dealerKnown = null; }
  const live = game.shells.shift(); game.chamberStep++;
  ui.chamber.style.setProperty('--step', game.chamberStep);
  ui.chamber.classList.remove('advance'); void ui.chamber.offsetWidth; ui.chamber.classList.add('advance');
  ui.spark.classList.remove('fire'); void ui.spark.offsetWidth;
  if (live) {
    ui.spark.classList.add('fire'); beep('live');
    const damage = boosted ? 2 : 1;
    if (target === 'self') actor === 'player' ? game.playerHp -= damage : game.dealerHp -= damage;
    else actor === 'player' ? game.dealerHp -= damage : game.playerHp -= damage;
    const hitCard = target === 'self' ? (actor === 'player' ? document.querySelector('.player-card') : document.querySelector('.dealer-card')) : (actor === 'player' ? document.querySelector('.dealer-card') : document.querySelector('.player-card'));
    hitCard.classList.add('hit'); setTimeout(() => hitCard.classList.remove('hit'), 500);
    setMessage(`高压命中。${damage > 1 ? '增压造成了 2 点伤害。' : '车厢的灯灭了一盏。'}`);
  } else {
    beep('blank'); ui.machine.classList.add('blank-kick'); setTimeout(() => ui.machine.classList.remove('blank-kick'), 350);
    setMessage(boosted ? '只有一声空响。增压在这次扣动中耗尽了。' : '只有一声空响。机器还在等。');
  }
  render(); await wait(700);
  if (game.playerHp <= 0 || game.dealerHp <= 0) return resolveRound();
  if (!game.shells.length) { loadChamber(); await wait(450); }
  if (!live && target === 'self') game.turn = actor;
  else game.turn = actor === 'player' ? 'dealer' : 'player';
  game.busy = false; render();
  if (game.turn === 'player' && game.dealerBell) {
    game.dealerBell = false; game.turn = 'dealer'; setMessage('恶魔的停站铃响起。你的回合被列车吞掉了。'); render(); return dealerMove();
  }
  if (game.turn === 'dealer') dealerMove();
}

async function dealerMove() {
  game.busy = true; render(); await wait(800);
  if (game.bell) { game.bell = false; game.turn = 'player'; game.busy = false; setMessage('停站铃响了。检票员错过了这一回合。'); beep('item'); return render(); }
  await dealerUseItem();
  const c = counts();
  const target = game.dealerKnown === false ? 'self' : game.dealerKnown === true ? 'player' : c.blank > c.live ? 'self' : (Math.random() < .72 ? 'player' : 'self');
  game.busy = false; fire(target, 'dealer');
}

async function dealerUseItem() {
  if (!game.dealerItems.length) return;
  let key;
  if (game.dealerHp < game.dealerMax && game.dealerItems.includes('tea')) key = 'tea';
  else if (game.dealerItems.includes('lamp')) key = 'lamp';
  else if (!game.dealerPowered && game.dealerItems.includes('wrench') && counts().live >= counts().blank) key = 'wrench';
  else if (!game.dealerBell && game.dealerItems.includes('bell') && Math.random() < .65) key = 'bell';
  else if (game.dealerItems.includes('ticket') && counts().blank > counts().live) key = 'ticket';
  if (!key) return;
  game.dealerItems.splice(game.dealerItems.indexOf(key), 1); beep('item');
  if (key === 'tea') { game.dealerHp++; setMessage('恶魔喝下热茶，恢复了 1 点生命。'); }
  if (key === 'lamp') { game.dealerKnown = game.shells[0]; setMessage(`恶魔用检修灯看见：下一格是${game.dealerKnown ? '高压' : '空响'}。`); }
  if (key === 'wrench') { game.dealerPowered = true; setMessage('恶魔拧紧增压扳手。下一次扣动会更危险。'); }
  if (key === 'bell') { game.dealerBell = true; setMessage('恶魔接通停站铃，准备夺走你的下个回合。'); }
  if (key === 'ticket') {
    const removed = game.shells.shift(); game.chamberStep++; setMessage(`恶魔用废票弃掉一格：${removed ? '高压' : '空响'}。`);
    if (!game.shells.length) loadChamber();
  }
  render(); await wait(700);
}

async function resolveRound() {
  game.busy = true; render();
  if (game.playerHp <= 0) return endGame(false);
  if (game.round >= 3) return endGame(true);
  game.round++; game.dealerMax = 2 + game.round + (savedInjuries.includes('debt') ? 1 : 0); game.dealerHp = game.dealerMax;
  game.playerHp = Math.min(game.playerMax, game.playerHp + 1); game.turn = 'player'; game.busy = false;
  game.itemsLocked = savedInjuries.includes('stiff'); game.selfLocked = savedInjuries.includes('frostbite');
  setMessage('检票员倒下，又从下一节车厢站起。机器变得更重了。');
  await wait(900); loadChamber();
}

function useItem(index) {
  if (game.busy || game.turn !== 'player') return;
  const key = game.items[index]; if (!key) return;
  if (game.itemsLocked) { setMessage('僵硬的手指不听使唤。先扣动一次，才能使用道具。'); return; }
  if (key === 'wrench' && game.powered) { setMessage('机器已经增压，必须先扣动一次。'); return; }
  if (key === 'tea' && game.playerHp >= game.playerMax) { setMessage('生命值已满，热茶留到受伤后再喝。'); return; }
  if (key === 'bell' && game.bell) { setMessage('停站铃已经接通，不能重复接线。'); return; }
  if (key === 'lamp') {
    if (game.firstLampBlocked) { game.firstLampBlocked = false; setMessage('耳鸣盖过了机器声。你什么也没看清。'); }
    else setMessage(game.shells[0] ? '检修灯映出红色线圈：下一格是高压。' : '检修灯下空空如也：下一格是空响。');
  }
  if (key === 'wrench') { game.powered = true; setMessage('线圈被拧紧。你的下一次高压命中造成 2 点伤害。'); }
  if (key === 'ticket') { const removed = game.shells.shift(); game.chamberStep++; setMessage(`废票卷走了一格：${removed ? '高压' : '空响'}。`); if (!game.shells.length) loadChamber(); }
  if (key === 'bell') { game.bell = true; setMessage('停站铃已经接通。检票员的下个回合将被跳过。'); }
  if (key === 'tea') { game.playerHp = Math.min(game.playerMax, game.playerHp + 1); setMessage('热茶让手不再发抖。恢复 1 点生命。'); }
  game.items.splice(index, 1); beep('item');
  ui.items.classList.remove('item-used'); void ui.items.offsetWidth; ui.items.classList.add('item-used'); render();
}

function endGame(won) {
  if (!won) {
    const available = injuries.filter(x => !savedInjuries.includes(x.key));
    if (available.length) { const injury = available[Math.floor(Math.random() * available.length)]; savedInjuries.push(injury.key); localStorage.setItem('lastTrainInjuries', JSON.stringify(savedInjuries)); $('endingCopy').textContent = `你在站台醒来，留下了「${injury.name}」：${injury.text}`; }
    else $('endingCopy').textContent = '你再次在站台醒来。旧伤没有增加，但列车仍记得你。';
    $('endingKicker').textContent = '列车拒载'; $('endingTitle').textContent = '你被留在了隧道里。';
  } else {
    $('endingKicker').textContent = '终点 · 05:40'; $('endingTitle').textContent = '天亮之前，门开了。';
    let cure = '';
    if (savedInjuries.length) { const healed = savedInjuries.splice(Math.floor(Math.random() * savedInjuries.length), 1)[0]; const injury = injuries.find(x => x.key === healed); localStorage.setItem('lastTrainInjuries', JSON.stringify(savedInjuries)); cure = ` 晨光治愈了「${injury.name}」。`; }
    $('endingCopy').textContent = `检票员把最后一张车票推给你。上面写着：债已付清。${cure}`; beep('win');
  }
  render(); ui.ending.showModal();
}

ui.start.addEventListener('click', startGame);
ui.shootDealer.addEventListener('click', () => fire('dealer'));
ui.shootSelf.addEventListener('click', () => fire('self'));
ui.items.addEventListener('click', e => { const button = e.target.closest('.item'); if (button) useItem(Number(button.dataset.index)); });
$('rulesButton').addEventListener('click', () => ui.rules.showModal());
$('closeRules').addEventListener('click', () => ui.rules.close());
$('soundButton').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.textContent = `音效：${soundOn ? '开' : '关'}`; e.currentTarget.setAttribute('aria-pressed', soundOn); if (soundOn) beep('click'); });
$('againButton').addEventListener('click', () => { ui.ending.close(); startGame(); });

game = freshGame(); render();
