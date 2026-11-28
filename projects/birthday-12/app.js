const get = selector => document.querySelector(selector);
const stage = get('#stage');
const worldCanvas = get('#world-3d');
worldCanvas.hidden = true;
const fullscreenControl = get('#page-fullscreen');
fullscreenControl.hidden = !document.fullscreenEnabled;
function syncFullscreenControl() {
  const active = document.fullscreenElement === document.documentElement;
  const label = active ? '退出全屏' : '全屏';
  fullscreenControl.setAttribute('aria-pressed', String(active));
  fullscreenControl.setAttribute('aria-label', label);
  fullscreenControl.firstElementChild.textContent = active ? '×' : '';
}
document.addEventListener('fullscreenchange', syncFullscreenControl);
fullscreenControl.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    syncFullscreenControl();
  }
});

const nav = get('#chapters');
const storageKey = 'orange-birthday-12-v1';
const emptySave = { chapter: 'intro', stars: 0, songs: [], pianoLevels: [], purchases: [], wishes: [], crew: [], gift: false };
let save = structuredClone(emptySave);
try {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  if (stored && typeof stored === 'object') Object.assign(save, stored);
} catch {}
let data;
let audio;
let stopChapter = () => {};
const chapters = { history: '游戏史', arcade: '街机试玩', logs: '成长日志', piano: '钢琴', cake: '切蛋糕', wishes: '许愿', crew: '船员', shop: '商店', finale: '谢幕' };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function element(tag, text, classes) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (classes) node.className = classes;
  return node;
}

function button(text, action, classes) {
  const node = element('button', text, classes);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function persist() {
  let stored = false;
  try { localStorage.setItem(storageKey, JSON.stringify(save)); stored = true; } catch {}
  get('#balance').textContent = '星核 ' + save.stars;
  return stored;
}

function playNote(note, delay = 0, length = .65) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  audio ||= new Audio();
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  const start = audio.currentTime + delay;
  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(.001, start);
  envelope.gain.exponentialRampToValueAtTime(.18, start + .015);
  envelope.gain.exponentialRampToValueAtTime(.001, start + length);
  envelope.connect(audio.destination);
  const tone = audio.createOscillator();
  tone.type = 'triangle';
  tone.frequency.value = 440 * 2 ** ((note - 69) / 12);
  tone.connect(envelope);
  tone.start(start);
  tone.stop(start + length + .03);
  tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
}

function celebrate() {
  if (!PartyEffects.allowsFireworks() || !Element.prototype.animate) return;
  const layer = element('div', null, 'celebration');
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const bursts = [[72, 38, 0], [24, 32, 220], [55, 18, 440]];
  for (const [x, y, delay] of bursts) {
    for (let i = 0; i < 30; i++) {
      const piece = element('i', null, 'confetti');
      piece.style.left = x + '%';
      piece.style.top = y + '%';
      layer.append(piece);
      const angle = i * Math.PI / 15;
      const spread = 85 + Math.random() * 160;
      const dx = Math.cos(angle) * spread;
      const dy = Math.sin(angle) * spread;
      piece.animate([
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: 'translate(0,0) scale(1.3)', opacity: 1, offset: .08 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(220deg)', opacity: 1, offset: .47 },
        { transform: 'translate(' + dx * 1.12 + 'px,' + (dy + 130) + 'px) rotate(480deg)', opacity: 0 },
      ], { delay, duration: 1420, easing: 'ease-out', fill: 'both' });
    }
  }
  setTimeout(() => layer.remove(), 1910);
}

function chapter(label, heading, description) {
  const panel = element('div', null, 'chapter');
  panel.append(element('p', label, 'mono'), element('h2', heading));
  if (description) panel.append(element('p', description, 'lead'));
  stage.append(panel);
  return panel;
}

function next(panel, key, text = chapters[key]) {
  const control = button(text, () => go(key), 'primary scene-next');
  panel.append(control);
  return control;
}

let sceneTarget;
let sceneTimer;
let guideDeadline = 0;
let guideTimeout = 0;
let guideFrame = 0;
let guideBaseText = '';
const GUIDE_DURATION = 3000;
let turning = null;
const guide = get('#scene-guide');
const cinemaRequested = new URLSearchParams(location.search).get('cinema') !== '0';
let world3d = null;
let warmingWorld = null;
let worldRendered = false;
let worldGeneration = 0;
let cinemaState = 'idle';
let cinemaTurn = null;
let cabinetOpen = false;

function syncWorldPlayback() {
  if (!world3d) {
    if (document.hidden) warmingWorld?.pause();
    else warmingWorld?.resume();
    return;
  }
  if (document.hidden || cabinetOpen || save.chapter === 'cake') world3d.pause();
  else world3d.resume();
}

function setCabinetOpen(value) {
  if (cabinetOpen === value) return;
  cabinetOpen = value;
  queueAssistant();
  syncWorldPlayback();
}

function activateCinema() {
  if (!worldRendered || !warmingWorld || turning || (guide.open && !sceneTarget)) return;
  world3d = warmingWorld;
  warmingWorld = null;
  worldRendered = false;
  world3d.snapTo(save.chapter);
  PartyEffects.onFireworksChange(value => world3d?.setFireworksEnabled(value));
  world3d.setFireworksEnabled(PartyEffects.allowsFireworks());
  worldCanvas.hidden = false;
  document.body.classList.add('cinema-ready');
  PartyEffects.setExternalSky(true);
  syncWorldPlayback();
  if (sceneTarget) {
    cinemaState = 'reading';
    world3d.preview(save.chapter, sceneTarget);
  }
}

function finishTravel() {
  cinemaState = 'idle';
  cinemaTurn = null;
  queueAssistant();
  stage.classList.remove('stage-exiting');
  const focus = document.activeElement;
  if ((!focus || focus === document.body) && !get('dialog[open]')) stage.focus({ preventScroll: true });
}

function fallbackTo2D() {
  worldGeneration++;
  const pending = cinemaTurn;
  world3d?.destroy();
  warmingWorld?.destroy();
  world3d = warmingWorld = null;
  worldRendered = false;
  worldCanvas.hidden = true;
  document.body.classList.remove('cinema-ready');
  stage.classList.remove('cake-daybreak');
  PartyEffects.onFireworksChange(null);
  PartyEffects.setExternalSky(false);
  finishTravel();
  if (pending && !pending.committed) turnTo(pending.key);
}

async function startWorld() {
  if (!cinemaRequested || reduceMotion.matches || !data || world3d || warmingWorld) return;
  const generation = ++worldGeneration;
  try {
    const { mountWorld3D } = await import('/birthday/stage-3d.js');
    if (generation !== worldGeneration) return;
    warmingWorld = mountWorld3D(worldCanvas, {
      initialChapter: save.chapter,
      fireworksAllowed: PartyEffects.allowsFireworks(),
      onReady() {
        worldRendered = true;
        activateCinema();
      },
      onFallback: fallbackTo2D,
    });
  } catch {
    if (generation === worldGeneration) fallbackTo2D();
  }
}

reduceMotion.addEventListener('change', event => {
  if (event.matches) fallbackTo2D();
  else startWorld();
});
document.addEventListener('visibilitychange', syncWorldPlayback);

function travelTo(key) {
  const world = world3d;
  const from = save.chapter;
  const turn = { key, committed: false };
  cinemaTurn = turn;
  cinemaState = 'travelling';
  queueAssistant();
  stage.classList.remove('cake-daybreak');
  stage.classList.add('stage-exiting');
  PartyEffects.playTurnSfx?.(key === 'cake' || key === 'finale' ? 'daybreak' : 'book');
  world.travel({
    from,
    to: key,
    onCommit() {
      if (turn.committed) return;
      turn.committed = true;
      if (key === 'cake') world.pause();
      show(key, false);
      stage.classList.remove('stage-exiting');
      stage.firstElementChild?.classList.add('copy-entrance');
      if (from === 'piano' && key === 'cake') stage.classList.add('cake-daybreak');
      world.setAct(key);
      if (from === 'cake') {
        requestAnimationFrame(() => {
          if (world3d === world) syncWorldPlayback();
        });
        setTimeout(() => {
          if (world3d === world && world.isContextLost()) fallbackTo2D();
        }, 500);
      }
    },
    onDone: finishTravel,
  });
}

document.addEventListener('click', () => {
  if (cinemaState === 'travelling') world3d?.accelerate();
}, true);
document.addEventListener('keydown', event => {
  if (cinemaState !== 'travelling' || !['Enter', ' ', 'Escape'].includes(event.key) || get('dialog[open]')) return;
  world3d?.accelerate();
}, true);
const guideLook = get('#guide-look');
const assistant = get('#hachi-assistant');
const assistantMessage = assistant.querySelector('.hachi-message');
const assistantAction = assistant.querySelector('.hachi-action');
const assistantClose = assistant.querySelector('.hachi-close');
const assistantPortrait = assistant.querySelector('.hachi-portrait');
const actHints = {
  history: ['cheer', '看完游戏史啦！去试试手吧！', '点一个年代可以回看，也可以让时间轴自己走。'],
  arcade: ['cheer', '一起玩真开心！去看看你做过的作品吧？', '选一台游戏舱试试，玩完可以回到这里。'],
  logs: ['star', '送你一颗星！接下来，我想听你弹琴。', '可以给作品鼓掌，也可以翻翻作品档案。'],
  piano: ['cheer', '好听！还想弹就再选一首。想吹蜡烛了，我也陪你去！', '选一首喜欢的曲子，先试听也可以。'],
  cake: ['star', '第一块切好啦！该把愿望悄悄想好咯。', '先吹灭蜡烛，再切下第一块蛋糕。'],
  wishes: ['guide', '有能玩的点子啦！还有几封信等着你呢。', '想个游戏规则，或者先打开一个示例。'],
  crew: ['star', '信都读完啦！带上星核，一起去看看吧。', '按顺序拆信吧。每封都是写给你的。'],
  shop: ['star', '收好这份惊喜！还有最后一幕等着我们。', '看看想兑换什么，旁边还有爸爸的礼物。'],
  finale: ['wave', '生日快乐！下方也能送上祝福。还想一起走一遍吗？', '慢慢看祝福吧。你也可以在下方留一句话。'],
};
let actReady = null;
let assistantDismissed = false;
let assistantRequested = false;
let assistantFrame = 0;
let assistantTarget = null;
let assistantKey = '';

function hachiAppearance(container, pose) {
  const image = element('img', null, 'hachi-sprite');
  image.src = '/birthday/hachi/' + pose + '.webp';
  image.alt = '向导小八';
  container.replaceChildren(image);
  const look = { '🎩 魔法帽': '🎩', '🎧 耳机': '🎧', '🧢 船员帽': '🧢' }[save.outfit];
  if (look) {
    const accessory = element('span', look, 'guide-accessory');
    accessory.setAttribute('aria-hidden', 'true');
    container.append(accessory);
  }
}

function guideAppearance(pose = 'guide') {
  hachiAppearance(guideLook, 'guide');
  hachiAppearance(get('#scene-avatar'), pose);
  assistantKey = '';
  queueAssistant();
}

function hideAssistant() {
  if (assistant.contains(document.activeElement) && !get('dialog[open]') && !cabinetOpen) {
    guideLook.focus({ preventScroll: true });
  }
  assistant.hidden = true;
  guideLook.setAttribute('aria-expanded', 'false');
}

function positionAssistant(targetEl) {
  const left = visualViewport?.offsetLeft || 0;
  const top = visualViewport?.offsetTop || 0;
  const width = visualViewport?.width || document.documentElement.clientWidth;
  const height = visualViewport?.height || document.documentElement.clientHeight;
  const bounds = targetEl?.getBoundingClientRect();
  const bottomEdge = top + height;
  const rightEdge = left + width;
  assistant.style.right = 'max(env(safe-area-inset-right), ' + Math.max(12, innerWidth - rightEdge + 12) + 'px)';
  assistant.style.maxWidth = Math.max(0, width - 24) + 'px';
  const ceiling = bounds && bounds.width > 0 ? Math.min(bottomEdge - 8, bounds.top - 8) : bottomEdge - 14;
  assistant.style.bottom = (innerHeight - ceiling) + 'px';
  return ceiling - assistant.offsetHeight >= top + 8 && (!bounds || bounds.bottom > top && bounds.top < bottomEdge);
}

function syncAssistant() {
  const hint = actHints[save.chapter];
  const keyboardOpen = document.body.classList.contains('compact-editor') ||
    Boolean(document.body.style.getPropertyValue('--immersive-height') &&
      document.documentElement.clientHeight - (visualViewport?.height ?? innerHeight) > 100);
  if (!hint || cinemaState === 'travelling' || cabinetOpen || get('dialog[open]') || keyboardOpen ||
      assistantDismissed || (!actReady && !assistantRequested)) {
    hideAssistant();
    return;
  }
  const ready = actReady?.button;
  if (ready && (!ready.isConnected || ready.disabled || !ready.getClientRects().length)) {
    hideAssistant();
    return;
  }
  assistantTarget = ready || null;
  const [pose, finished, prompt] = hint;
  const key = save.chapter + ':' + Boolean(ready);
  if (assistantKey !== key) {
    assistantKey = key;
    assistantMessage.textContent = ready ? actReady.message || finished : prompt;
    assistantAction.hidden = !ready;
    assistantAction.textContent = ready ? '点这里 → ' + ready.textContent : '';
    hachiAppearance(assistantPortrait, ready ? actReady.pose || pose : 'guide');
  }
  assistant.hidden = false;
  if (!positionAssistant(ready || stage.querySelector('.immersive-actions, .cake-controls > .row:not(.cake-flavors)'))) {
    hideAssistant();
    return;
  }
  guideLook.setAttribute('aria-expanded', 'true');
}

function queueAssistant() {
  if (assistantFrame) return;
  assistantFrame = requestAnimationFrame(() => {
    assistantFrame = 0;
    syncAssistant();
  });
}

function markActReady(targetBtn, options = {}) {
  if (!targetBtn?.isConnected) return;
  if (actReady?.button === targetBtn) return;
  actReady?.button.classList.remove('is-ready-next');
  actReady = { ...options, button: targetBtn };
  targetBtn.classList.add('is-ready-next');
  assistantKey = '';
  queueAssistant();
}

function clearActReady() {
  actReady?.button.classList.remove('is-ready-next');
  actReady = null;
  assistantTarget = null;
  assistantRequested = assistantDismissed = false;
  assistantKey = '';
  hideAssistant();
}

guideLook.addEventListener('click', () => {
  assistantDismissed = false;
  assistantRequested = true;
  syncAssistant();
});
assistantClose.addEventListener('click', () => {
  assistantDismissed = true;
  hideAssistant();
});
assistantAction.addEventListener('click', () => {
  if (assistantTarget?.isConnected && !assistantTarget.disabled) assistantTarget.click();
});
new MutationObserver(queueAssistant).observe(document.body, {
  subtree: true, attributes: true, attributeFilter: ['open'],
});
window.addEventListener('resize', queueAssistant);
document.addEventListener('scroll', queueAssistant, { capture: true, passive: true });

function turnTo(key) {
  if (turning) turning.skipTransition();
  const turnKind = (key === 'cake' || key === 'finale') ? 'daybreak' : 'book';
  if (reduceMotion.matches || !document.startViewTransition) {
    if (!reduceMotion.matches) PartyEffects.playTurnSfx?.(turnKind);
    show(key, true);
    activateCinema();
    return;
  }
  const root = document.documentElement;
  const order = ['intro', ...Object.keys(chapters)];
  root.dataset.turn = turnKind;
  root.dataset.turnDir = order.indexOf(key) < order.indexOf(save.chapter) ? 'back' : 'next';
  PartyEffects.playTurnSfx?.(turnKind);
  const current = document.startViewTransition(() => show(key, false));
  turning = current;
  current.ready.catch(() => {});
  current.updateCallbackDone.catch(() => {});
  current.finished.catch(() => {}).finally(() => {
    if (turning === current) {
      turning = null;
      delete root.dataset.turn;
      delete root.dataset.turnDir;
      activateCinema();
    }
  });
}

function clearGuideCountdown() {
  clearTimeout(guideTimeout);
  guideTimeout = 0;
  cancelAnimationFrame(guideFrame);
  guideFrame = 0;
}

function renderGuideContinue(secs, progress) {
  const control = get('#scene-continue');
  let label = control.querySelector('.guide-btn-label');
  let bar = control.querySelector('.guide-btn-progress');
  if (!label || !bar) {
    label = element('span', '', 'guide-btn-label');
    bar = element('span', '', 'guide-btn-progress');
    bar.setAttribute('aria-hidden', 'true');
    control.replaceChildren(label, bar);
  }
  const nextText = secs > 0 ? guideBaseText + ' · ' + secs + 's' : guideBaseText;
  if (label.textContent !== nextText) label.textContent = nextText;
  control.style.setProperty('--guide-progress', String(Math.max(0, Math.min(1, progress))));
}

function startGuideCountdown() {
  clearGuideCountdown();
  guideDeadline = performance.now() + GUIDE_DURATION;
  let lastSecs = 3;
  renderGuideContinue(3, 0);
  guideTimeout = setTimeout(() => {
    clearGuideCountdown();
    finishGuide();
  }, GUIDE_DURATION);
  function tick() {
    if (!guide.open || !sceneTarget) {
      clearGuideCountdown();
      return;
    }
    const remainingMs = Math.max(0, guideDeadline - performance.now());
    const secs = Math.max(1, Math.ceil(remainingMs / 1000));
    const progress = Math.min(1, (GUIDE_DURATION - remainingMs) / GUIDE_DURATION);
    if (secs !== lastSecs) lastSecs = secs;
    renderGuideContinue(secs, progress);
    if (remainingMs > 0) guideFrame = requestAnimationFrame(tick);
  }
  guideFrame = requestAnimationFrame(tick);
}

function go(key) {
  if (cinemaState === 'travelling') {
    if (!cinemaTurn?.committed) {
      world3d?.accelerate();
      return;
    }
    world3d?.cancel();
    finishTravel();
  }
  if (guide.open || key === save.chapter) return;
  if (turning) turning.skipTransition();
  if (key === 'cake') import('/birthday/cake-3d.js').catch(() => {});
  if (save.chapter === 'cake' || save.chapter === 'piano') stopChapter.suspend?.();
  const cue = data.copy.scenes[key];
  if (!cue) {
    if (world3d) travelTo(key);
    else turnTo(key);
    return;
  }
  clearGuideCountdown();
  clearTimeout(sceneTimer);
  if (world3d) {
    cinemaState = 'reading';
    world3d.preview(save.chapter, key);
  }
  sceneTarget = key;
  document.body.classList.add('guide-active');
  guide.dataset.actKey = key;
  guide.classList.toggle('scene-premiere', Boolean(stage.querySelector('.premiere.party-live')));
  const idx = Object.keys(chapters).indexOf(key) + 1;
  const card = guide.querySelector('.scene-card');
  if (card) {
    if (idx > 0) card.dataset.act = 'ACT ' + String(idx).padStart(2, '0');
    else delete card.dataset.act;
  }
  guideAppearance(({ history: 'wave', arcade: 'cheer', logs: 'star', crew: 'star', shop: 'star', finale: 'wave' })[key]);
  get('#scene-title').textContent = cue[0];
  get('#scene-narration').textContent = cue[1];
  guideBaseText = cue[2];
  guide.showModal();
  startGuideCountdown();
  get('#scene-continue').focus();
}

function finishGuide() {
  clearGuideCountdown();
  if (!sceneTarget) return;
  const key = sceneTarget;
  sceneTarget = null;
  const turn = () => {
    if (guide.open) guide.close();
    delete guide.dataset.actKey;
    guide.classList.remove('scene-leaving', 'scene-premiere');
    const card = guide.querySelector('.scene-card');
    if (card) delete card.dataset.act;
    document.body.classList.remove('guide-active');
    if (world3d && !reduceMotion.matches) travelTo(key);
    else turnTo(key);
  };
  if (world3d || reduceMotion.matches) { turn(); return; }
  guide.classList.add('scene-leaving');
  sceneTimer = setTimeout(turn, 230);
}

get('#scene-continue').addEventListener('click', finishGuide);
function onGuideBackdrop(event) {
  if (event.target !== guide) return false;
  const bounds = guide.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX >= bounds.right ||
    event.clientY < bounds.top || event.clientY >= bounds.bottom;
}

let pressedBackdrop = false;
guide.addEventListener('pointerdown', event => { pressedBackdrop = onGuideBackdrop(event); });
guide.addEventListener('click', event => {
  if (pressedBackdrop && onGuideBackdrop(event)) finishGuide();
  pressedBackdrop = false;
});
guide.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target !== get('#scene-continue')) {
    event.preventDefault();
    finishGuide();
  }
});
guide.addEventListener('cancel', event => { event.preventDefault(); finishGuide(); });

function show(key, animate = false) {
  if (!Object.hasOwn(renderers, key)) key = 'intro';
  clearGuideCountdown();
  clearTimeout(sceneTimer);
  sceneTarget = null;
  if (guide.open) guide.close();
  delete guide.dataset.actKey;
  guide.classList.remove('scene-leaving', 'scene-premiere');
  document.body.classList.remove('guide-active');
  stopChapter();
  clearActReady();
  stopChapter = () => {};
  save.chapter = key;
  document.body.dataset.chapter = key;
  warmingWorld?.snapTo(key);
  PartyEffects.setChapter?.(key);
  persist();
  stage.replaceChildren();
  nav.hidden = key === 'intro';
  get('#journey-top').hidden = key === 'intro';
  const scene = Object.keys(chapters).indexOf(key) + 1;
  const progress = get('#scene-progress');
  progress.textContent = scene ? '第 ' + scene + ' 幕 / ' + Object.keys(chapters).length + ' 幕' : '';
  progress.classList.remove('progress-bump');
  if (!reduceMotion.matches && scene) {
    void progress.offsetWidth;
    progress.classList.add('progress-bump');
  }
  guideAppearance();
  nav.replaceChildren(...Object.entries(chapters).map(([id, title]) => {
    const tab = button(title, () => go(id));
    if (id === key) tab.setAttribute('aria-current', 'step');
    if (Object.keys(chapters)[scene] === id) tab.classList.add('next-scene');
    if (id === 'shop' && save.crew.length < data.family.length) tab.disabled = true;
    return tab;
  }));
  document.body.classList.toggle('piano-mode', key === 'piano');
  document.body.classList.toggle('history-mode', key === 'history');
  document.body.classList.add('immersive-stage');
  document.body.classList.toggle('intro-mode', key === 'intro');
  const activeTab = nav.querySelector('[aria-current]');
  if (activeTab) {
    const tab = activeTab.getBoundingClientRect();
    const rail = nav.getBoundingClientRect();
    nav.scrollLeft += Math.max(tab.right - rail.right, 0) + Math.min(tab.left - rail.left, 0);
  }
  document.body.classList.remove('compact-editor');
  syncImmersiveHeight();
  PartyEffects.pauseSky(false);
  PartyEffects.focus(key === 'piano');
  renderers[key]();
  stage.classList.remove('page-turn');
  if (animate && !reduceMotion.matches) {
    void stage.offsetWidth;
    stage.classList.add('page-turn');
  }
  if (animate) window.scrollTo({ top: 0, behavior: 'instant' });
  if (cinemaState !== 'travelling') stage.focus({ preventScroll: true });
}

const visualViewport = window.visualViewport;
function syncImmersiveHeight() {
  const editor = stage.querySelector('textarea:focus, input:focus, [contenteditable="true"]:focus');
  const typing = editor || document.body.classList.contains('compact-editor');
  const reducedViewport = document.body.classList.contains('immersive-stage') && typing &&
    visualViewport?.scale === 1 && visualViewport.height < document.documentElement.clientHeight;
  const keyboardTakesSpace = reducedViewport && visualViewport.height < 400 &&
    document.documentElement.clientHeight - visualViewport.height > 100;
  document.body.classList.toggle('compact-editor', Boolean(keyboardTakesSpace));
  queueAssistant();
  if (reducedViewport) {
    document.body.style.setProperty('--immersive-height', visualViewport.height + 'px');
  } else {
    document.body.style.removeProperty('--immersive-height');
  }
}
visualViewport?.addEventListener('resize', syncImmersiveHeight);
visualViewport?.addEventListener('scroll', syncImmersiveHeight);
stage.addEventListener('focusin', syncImmersiveHeight);
stage.addEventListener('focusout', () => queueMicrotask(syncImmersiveHeight));

function intro() {
  stage.append(get('#intro').content.cloneNode(true));
  const start = get('#start');
  const briefing = get('#briefing');
  get('#skip-intro').addEventListener('click', () => { PartyEffects.startMusic(); go('history'); });
  start.addEventListener('click', () => {
    PartyEffects.startMusic();
    if (world3d) world3d.triggerPartyLight();
    else celebrate();
    stage.querySelector('.premiere').classList.add('party-live');
    briefing.hidden = false;
    briefing.textContent = data.copy.intro[0] + '。生日灯光已点亮。';
    go('history');
  }, { once: true });
}

function timeline(eras, view, onComplete, onResume) {
  const SLIDE_INTERVAL = 3000;
  const listeners = new AbortController();
  const { signal } = listeners;

  function eraSpan(era) {
    const years = era.machines.flatMap(item => String(item.year).match(/\d{4}/g) || []).map(Number);
    if (!years.length) return era.era;
    const min = Math.min(...years);
    const max = Math.max(...years);
    return min === max ? String(min) : min + '–' + max;
  }

  const axis = element('div', null, 'history-timeline-axis');
  const nodesWrap = element('div', null, 'history-nodes');
  nodesWrap.setAttribute('role', 'group');
  nodesWrap.setAttribute('aria-label', '游戏史年代时间轴');
  const trackLine = element('div', null, 'history-track-line');
  trackLine.setAttribute('aria-hidden', 'true');
  const trackFill = element('span', null, 'history-track-fill');
  trackLine.append(trackFill);
  nodesWrap.append(trackLine);

  const dwellBar = element('div', null, 'history-dwell-bar');
  dwellBar.setAttribute('aria-hidden', 'true');
  const dwellFill = element('span', null, 'history-dwell-fill');
  dwellBar.append(dwellFill);

  const controls = element('div', null, 'history-controls');
  const counter = element('span', '1 / ' + eras.length, 'history-counter mono');
  const prevBtn = button('‹ 上一年代', () => { goToSlide(activeIndex - 1); }, 'history-prev');
  const toggleBtn = button('暂停滚动', () => {
    if (finished) goToSlide(0);
    else setPaused(!paused);
  }, 'history-toggle');
  toggleBtn.setAttribute('aria-pressed', 'false');
  const nextEraBtn = button('下一年代 ›', () => { goToSlide(activeIndex + 1); }, 'history-next');
  controls.append(counter, prevBtn, toggleBtn, nextEraBtn);

  axis.append(nodesWrap, dwellBar, controls);

  const viewport = element('div', null, 'history-track-viewport');
  viewport.tabIndex = 0;
  viewport.setAttribute('aria-label', '游戏史年代展品滑轨');
  const track = element('div', null, 'history-track');
  viewport.append(track);

  const nodeButtons = [];
  const slides = [];
  let activeIndex = 0;
  let finished = false;
  let paused = false;
  let elapsed = 0;
  let cycleStartedAt = 0;
  let slideTimer = 0;
  let rafId = 0;
  let alive = true;

  function clearTimers() {
    clearTimeout(slideTimer);
    slideTimer = 0;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function currentElapsed() {
    if (!cycleStartedAt) return elapsed;
    return Math.min(SLIDE_INTERVAL, elapsed + Math.max(0, performance.now() - cycleStartedAt));
  }

  function paintProgress() {
    if (!alive) return;
    const progress = Math.min(1, currentElapsed() / SLIDE_INTERVAL);
    dwellFill.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    if (!paused && !document.hidden && eras.length > 1 && cycleStartedAt) {
      rafId = requestAnimationFrame(paintProgress);
    } else {
      rafId = 0;
    }
  }

  function scheduleCycle() {
    clearTimers();
    if (!alive || finished || paused || document.hidden || eras.length <= 1) {
      cycleStartedAt = 0;
      dwellFill.style.transform = 'scaleX(' + Math.min(1, elapsed / SLIDE_INTERVAL).toFixed(4) + ')';
      return;
    }
    const remaining = Math.max(16, SLIDE_INTERVAL - elapsed);
    cycleStartedAt = performance.now();
    slideTimer = setTimeout(() => {
      slideTimer = 0;
      cycleStartedAt = 0;
      elapsed = 0;
      if (!alive || paused || document.hidden) return;
      goToSlide(activeIndex + 1, true);
    }, remaining);
    rafId = requestAnimationFrame(paintProgress);
  }

  function setPaused(nextPaused) {
    if (paused === nextPaused) return;
    if (nextPaused) {
      elapsed = currentElapsed();
      cycleStartedAt = 0;
      clearTimers();
    }
    paused = nextPaused;
    toggleBtn.textContent = paused ? '继续滚动' : '暂停滚动';
    toggleBtn.setAttribute('aria-pressed', String(paused));
    axis.classList.toggle('is-paused', paused);
    if (!paused) scheduleCycle();
  }

  eras.forEach((era, index) => {
    const span = eraSpan(era);
    const node = element('button', null, 'history-node');
    node.type = 'button';
    const dot = element('span', null, 'history-node-dot');
    dot.setAttribute('aria-hidden', 'true');
    node.append(dot, element('strong', era.era, 'history-node-era'), element('span', span, 'history-node-span'));
    node.setAttribute('aria-label', era.era + '（' + span + '）：' + era.title);
    node.addEventListener('click', () => goToSlide(index), { signal });
    nodesWrap.append(node);
    nodeButtons.push(node);

    const slide = element('article', null, 'history-slide');
    slide.dataset.era = era.era;
    const banner = element('div', null, 'era-banner');
    const story = element('div', null, 'era-story');
    story.append(element('h4', era.title), element('p', era.summary, 'era-summary-text'));
    const eraMeta = element('div', null, 'era-heading');
    eraMeta.append(element('strong', era.era), element('span', span, 'era-span-tag mono'));
    banner.append(eraMeta, story);

    const machines = element('div', null, 'history-machines');
    for (const item of era.machines) {
      const machine = element('article', null, 'history-machine');
      const citation = element('a', item.company);
      citation.href = item.source;
      citation.target = '_blank';
      citation.rel = 'noopener noreferrer';
      const picture = element('img', null, 'machine-art');
      picture.src = '/birthday/machines/' + item.art + '.webp';
      picture.alt = '插图：' + item.model;
      picture.width = 120;
      picture.height = 96;
      const identity = element('div', null, 'machine-identity');
      identity.append(element('time', item.year), element('h4', item.model), citation);
      const masthead = element('div', null, 'machine-masthead');
      masthead.append(picture, identity);
      machine.append(masthead, element('p', item.note));
      machines.append(machine);
    }

    slide.append(banner, machines);
    track.append(slide);
    slides.push(slide);
  });

  function goToSlide(index, resetCycle = true) {
    if (!eras.length) return;
    const wasFinished = finished;
    activeIndex = Math.max(0, Math.min(eras.length - 1, index));
    finished = activeIndex === eras.length - 1;
    prevBtn.disabled = activeIndex <= 0;
    nextEraBtn.disabled = finished;
    axis.classList.toggle('is-finished', finished);
    if (finished || wasFinished) {
      paused = false;
      axis.classList.remove('is-paused');
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.textContent = finished ? '重播时间轴' : '暂停滚动';
    }
    track.style.transform = 'translateX(-' + (activeIndex * 100) + '%)';
    trackFill.style.width = (eras.length > 1 ? (activeIndex / (eras.length - 1)) * 100 : 100) + '%';
    counter.textContent = (activeIndex + 1) + ' / ' + eras.length;

    nodeButtons.forEach((btn, i) => {
      const current = i === activeIndex;
      btn.classList.toggle('is-active', current);
      btn.classList.toggle('is-passed', i < activeIndex);
      btn.setAttribute('aria-pressed', String(current));
      if (current) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
    });

    slides.forEach((slide, i) => {
      const current = i === activeIndex;
      slide.classList.toggle('is-active', current);
      slide.setAttribute('aria-hidden', String(!current));
      slide.inert = !current;
      if (current) slide.scrollTop = 0;
    });

    if (finished) {
      clearTimers();
      cycleStartedAt = 0;
      elapsed = SLIDE_INTERVAL;
      dwellFill.style.transform = 'scaleX(1)';
      if (!wasFinished) onComplete?.();
      return;
    }
    if (wasFinished) onResume?.();
    if (resetCycle) {
      elapsed = 0;
      cycleStartedAt = 0;
      dwellFill.style.transform = 'scaleX(0)';
      scheduleCycle();
    }
  }

  let swipeStart = null;
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return;
    swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, { signal });
  viewport.addEventListener('pointerup', event => {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      goToSlide(dx < 0 ? activeIndex + 1 : activeIndex - 1);
    }
  }, { signal });
  viewport.addEventListener('pointercancel', () => { swipeStart = null; }, { signal });

  axis.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToSlide(activeIndex - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); goToSlide(activeIndex + 1); }
  }, { signal });
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToSlide(activeIndex - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); goToSlide(activeIndex + 1); }
  }, { signal });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      elapsed = currentElapsed();
      cycleStartedAt = 0;
      clearTimers();
    } else if (!paused) {
      scheduleCycle();
    }
  }, { signal });

  view.append(viewport);
  goToSlide(0, true);

  return {
    axis,
    stop() {
      alive = false;
      clearTimers();
      listeners.abort();
    },
  };
}

function history() {
  const panel = chapter('GAME HISTORY', '游戏是怎样走到今天的');
  panel.classList.add('history-chapter');
  const views = immersiveViews(panel);
  const view = views.add(element('section', null, 'history-stage-view'));
  views.show(view, [], null);
  const nextBtn = next(views.actions, 'arcade', '试玩一下经典游戏');
  const exhibit = timeline(data.history, view, () => markActReady(nextBtn), clearActReady);
  view.before(exhibit.axis);
  stopChapter = exhibit.stop;
}

function immersiveViews(panel) {
  const actions = element('div', null, 'row immersive-actions');
  panel.append(actions);
  const views = [];
  return {
    actions,
    add(view = element('section')) {
      view.classList.add('immersive-view');
      view.tabIndex = view.classList.contains('cabinet-host') ? -1 : 0;
      view.hidden = true;
      views.push(view);
      actions.before(view);
      return view;
    },
    show(view, controls, focus = view) {
      for (const other of views) other.hidden = other !== view;
      actions.replaceChildren(...controls);
      if (focus) (focus.isConnected ? focus : view).focus({ preventScroll: true });
    },
  };
}

function immersiveCabinet(views) {
  const cabinet = views.add(element('section', null, 'cabinet-host'));
  let dispose = () => {};
  function stop() {
    dispose();
    dispose = () => {};
    cabinet.replaceChildren();
  }
  return {
    open(game, onResult, onBack) {
      const back = () => {
        stop();
        onBack();
      };
      views.show(cabinet, [], null);
      dispose = BirthdayArcade.mount(cabinet, game, onResult, back);
    },
    stop,
  };
}

function arcade() {
  const panel = chapter('ARCADE', '轮到你试玩', '带着一个问题来玩：什么让你想再来一次？');
  panel.classList.add('arcade-chapter');
  const views = immersiveViews(panel);
  const localView = views.add(element('section', null, 'showcase-stage'));
  const classicsView = views.add(element('section', null, 'showcase-stage'));
  const cabinet = immersiveCabinet(views);
  const highs = save.arcade ||= {};
  const cards = element('div', null, 'showcase game-cards');
  const continueStory = button('看看你的成长日志', () => go('logs'), 'primary scene-next');
  const classicsButton = button('别人的经典', () => showClassics());
  const localButton = button('在这里试玩', () => showLocal(classicsButton));
  function showLocal(focus) {
    views.show(localView, [classicsButton, continueStory], focus);
  }
  function showClassics() {
    views.show(classicsView, [localButton, continueStory]);
  }
  for (const game of BirthdayArcade.games) {
    const tile = element('article', null, 'arcade-card ' + game.id);
    const history = element('a', game.history);
    history.href = game.source;
    history.target = '_blank';
    history.rel = 'noopener noreferrer';
    const best = element('span', '最高分 ' + (highs[game.id] || 0), 'arcade-best');
    const launch = button('开始挑战', () => {
      let playedRound = false;
      PartyEffects.pauseSky(true);
      setCabinetOpen(true);
      cabinet.open(game, (score, victory) => {
        playedRound = true;
        highs[game.id] = Math.max(highs[game.id] || 0, score);
        best.textContent = '最高分 ' + highs[game.id];
        const wins = save.arcadeWins ||= [];
        const firstWin = victory && !wins.includes(game.id);
        if (firstWin) {
          wins.push(game.id);
          save.stars += 2;
          celebrate();
        }
        persist();
        return firstWin;
      }, () => {
        PartyEffects.pauseSky(false);
        setCabinetOpen(false);
        showLocal(launch);
        if (playedRound) markActReady(continueStory);
      });
    }, 'primary');
    const artwork = element('div', null, 'arcade-art');
    artwork.setAttribute('aria-hidden', 'true');
    tile.append(artwork, history, element('h3', game.title), element('p', game.summary),
      element('p', game.lesson, 'history-lesson'), best, launch);
    cards.append(tile);
  }
  localView.append(cards);
  const classics = element('div', null, 'showcase classic-grid');
  for (const [title, prompt, href] of [
    ['PAC-MAN', '试试只靠转弯和预判，就让自己再玩一局。', 'https://doodles.google/doodle/30th-anniversary-of-pac-man/'],
    ['贝多芬音乐拼图', '把旋律拼回去。留意一小句音乐怎样变成一道谜题。', 'https://doodles.google/doodle/celebrating-ludwig-van-beethovens-245th-year/'],
  ]) {
    const tile = element('article', null, 'tile classic-game');
    const launch = element('a', '打开游戏（新标签页）');
    launch.href = href;
    launch.target = '_blank';
    launch.rel = 'noopener noreferrer';
    launch.addEventListener('click', () => markActReady(continueStory));
    tile.append(element('h3', title), element('p', prompt), launch);
    classics.append(tile);
  }
  classicsView.append(classics);
  showLocal(null);
  if (Object.keys(highs).length || save.arcadeWins?.length) markActReady(continueStory);
  stopChapter = () => {
    cabinet.stop();
    setCabinetOpen(false);
    PartyEffects.pauseSky(false);
  };
}

function logs() {
  const { entries, works = [], awards = [] } = data.logs;
  const panel = chapter('成长日志', '橙子的十二岁作品颁奖礼',
    '给你做过的作品和试过的点子鼓掌。');
  panel.classList.add('growth-log');
  const views = immersiveViews(panel);
  const categories = element('div', null, 'row reading-controls growth-categories');
  categories.setAttribute('role', 'group');
  categories.setAttribute('aria-label', '成长日志内容');
  views.actions.before(categories);
  const continueStory = button('听听你的钢琴', () => go('piano'), 'primary scene-next');

  function addCategory(label, view, extra = [], onView) {
    const control = button(label, () => {
      for (const tab of categories.children) tab.setAttribute('aria-pressed', String(tab === control));
      views.show(view, [...extra, continueStory], null);
      onView?.();
    });
    categories.append(control);
  }

  const ceremony = element('section', null, 'growth-ceremony');
  const medals = element('ul', null, 'growth-medals showcase');
  const awardPages = awards.map(award => {
    const medal = element('li');
    const icon = element('span', award.icon, 'growth-medal-icon');
    icon.setAttribute('aria-hidden', 'true');
    medal.append(icon, element('h4', award.title), element('p', award.work, 'growth-award-work'),
      element('p', award.reason));
    return medal;
  });
  const applause = button('为你的作品鼓掌', () => {
    celebrate();
    markActReady(continueStory);
    applause.textContent = '再鼓一次掌';
    ovation.textContent = '掌声送给你，也送给每一次愿意动手试试的你。';
  }, 'primary');
  const ovation = element('p', null, 'growth-ovation');
  ovation.setAttribute('role', 'status');
  if (awardPages.length) {
    const awardView = views.add(element('section', null, 'showcase-stage'));
    medals.append(...awardPages);
    medals.setAttribute('aria-label', '颁给你的 ' + awards.length + ' 枚奖章');
    ceremony.append(medals, ovation);
    awardView.append(ceremony);
    addCategory('奖章', awardView, [applause]);
  }

  function addWorkLink(card, href) {
    if (typeof href !== 'string' || !/^\/(?![\\/])/.test(href)) return;
    const link = element('a', '打开作品');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    card.append(link);
  }

  if (works.length) {
    const archiveView = views.add();
    const archive = element('section', null, 'growth-archive');
    const controls = element('div', null, 'row');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', '作品浏览方式');
    const groups = element('div', null, 'growth-groups');
    const byTime = button('按时间', () => renderWorks(false));
    const bySkill = button('按创作技能', () => renderWorks(true));
    controls.append(byTime, bySkill);

    function renderWorks(groupBySkill) {
      byTime.setAttribute('aria-pressed', String(!groupBySkill));
      bySkill.setAttribute('aria-pressed', String(groupBySkill));
      const sorted = [...works].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
      const sections = new Map();
      for (const work of sorted) {
        const label = groupBySkill ? work.skill
          : work.date ? work.date.slice(0, 4) + ' 年 ' + Number(work.date.slice(5, 7)) + ' 月' : '其他作品';
        if (!sections.has(label)) sections.set(label, []);
        sections.get(label).push(work);
      }
      const workGroups = [];
      for (const [label, items] of sections) {
        const section = element('section', null, 'growth-group');
        const cards = element('div', null, 'showcase');
        for (const work of items) {
          const tile = element('article', null, 'tile growth-work');
          const meta = element('p', null, 'growth-meta');
          if (work.date) {
            const time = element('time', work.date);
            time.dateTime = work.date;
            meta.append(time, ' · ' + work.record);
          }
          tile.append(element('h5', work.title), element('p', work.skill, 'growth-skill'));
          if (work.date) tile.append(meta);
          tile.append(element('p', work.highlight));
          const details = element('details');
          details.append(element('summary', '成长点和下一个小实验'),
            element('p', work.growth), element('p', '如果你想试试：' + work.experiment));
          tile.append(details);
          addWorkLink(tile, work.link);
          cards.append(tile);
        }
        section.append(element('h4', label), cards);
        workGroups.push(section);
      }
      groups.replaceChildren(...workGroups);
      archiveView.scrollTop = 0;
    }

    renderWorks(false);
    archive.append(controls, groups);
    archiveView.append(archive);
    const logListeners = new AbortController();
    archiveView.addEventListener('scroll', () => {
      if (!archiveView.isConnected || archiveView.hidden || archiveView.scrollHeight <= 0) return;
      if (archiveView.scrollTop + archiveView.clientHeight >= archiveView.scrollHeight - 2) {
        markActReady(continueStory);
      }
    }, { signal: logListeners.signal });
    addCategory('作品档案', archiveView, [], () => {
      if (archiveView.isConnected && archiveView.scrollHeight > 0 &&
          archiveView.scrollHeight <= archiveView.clientHeight + 2) {
        markActReady(continueStory);
      }
    });
    stopChapter = () => logListeners.abort();
  }

  const memoryView = views.add();
  const memories = element('div', null, 'growth-memories showcase');
  const memoryPages = entries.map(entry => {
    const tile = element('article', null, 'tile');
    tile.append(element('p', entry.date, 'mono'), element('h4', entry.title));
    if (entry.chat && !/^【待/.test(entry.chat)) tile.append(element('blockquote', entry.chat));
    if (entry.note) tile.append(element('p', entry.note));
    addWorkLink(tile, entry.link);
    return tile;
  });
  memories.append(...memoryPages);
  if (memoryPages.length) memoryView.append(memories);
  memoryView.append(element('p', '还记得哪个点子是你最想试的吗？有空就挑一个，做个小版本，看看会发生什么。生日快乐，橙子。', 'growth-sendoff'));
  addCategory(entries.length ? '对话回忆' : '寄语', memoryView, [], () => markActReady(continueStory));
  categories.firstElementChild.click();
}

const leftKeyOffsets = {
  KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6,
  KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11,
};
const leftKeyLabels = {
  0: 'Z', 1: 'S', 2: 'X', 3: 'D', 4: 'C', 5: 'V', 6: 'G',
  7: 'B', 8: 'H', 9: 'N', 10: 'J', 11: 'M',
};
const rightKeyOffsets = {
  KeyQ: 0, Digit2: 1, KeyW: 2, Digit3: 3, KeyE: 4, KeyR: 5, Digit5: 6,
  KeyT: 7, Digit6: 8, KeyY: 9, Digit7: 10, KeyU: 11,
  KeyI: 12, Digit9: 13, KeyO: 14, Digit0: 15, KeyP: 16,
};
const rightKeyLabels = {
  0: 'Q', 1: '2', 2: 'W', 3: '3', 4: 'E', 5: 'R', 6: '5',
  7: 'T', 8: '6', 9: 'Y', 10: '7', 11: 'U',
  12: 'I', 13: '9', 14: 'O', 15: '0', 16: 'P',
};

function piano() {
  const birthday = {
    name: '生日快乐 · 双手华尔兹', tempo: 76, meter: 3, description: '入门 · 3/4 拍全曲双手华尔兹',
    right: [
      [[2, 'G4', .5], [2.5, 'G4', .5]],
      [[0, 'A4', 1], [1, 'G4', 1], [2, 'C5', 1]],
      [[0, 'B4', 2], [2, 'G4', .5], [2.5, 'G4', .5]],
      [[0, 'A4', 1], [1, 'G4', 1], [2, 'D5', 1]],
      [[0, 'C5', 2], [2, 'G4', .5], [2.5, 'G4', .5]],
      [[0, 'G5', 1], [1, 'E5', 1], [2, 'C5', 1]],
      [[0, 'B4', 1], [1, 'A4', 1], [2, 'F5', .5], [2.5, 'F5', .5]],
      [[0, 'E5', 1], [1, 'C5', 1], [2, 'D5', 1]],
      [[0, 'C5', 2.8]],
    ],
    left: [
      [[0, 'C3', .8, .56], [1, 'E3', .8, .48], [2, 'G3', .8, .52]],
      [[0, 'C3', .9, .62], [1, 'E3', .8, .48], [2, 'G3', .8, .48]],
      [[0, 'G3', .9, .62], [1, 'D3', .8, .48], [2, 'B3', .8, .48]],
      [[0, 'G3', .9, .62], [1, 'F3', .8, .48], [2, 'B3', .8, .48]],
      [[0, 'C3', .9, .62], [1, 'E3', .8, .48], [2, 'G3', .8, .48]],
      [[0, 'C3', .9, .62], [1, 'G3', .8, .48], [2, 'E3', .8, .48]],
      [[0, 'F3', .9, .64], [1, 'A3', .8, .5], [2, 'C3', .8, .5]],
      [[0, 'G3', .9, .64], [1, 'E3', .8, .5], [2, 'D3', .8, .5]],
      [[0, ['C3', 'E3', 'G3'], 2.8, .66]],
    ],
  };
  const boss = {
    name: '星核终章 · 双手狂想', tempo: 118, meter: 4, description: 'Boss · 双手和弦切分、交错跑动与高能合奏',
    right: [
      [[0, ['D4', 'A4'], .45, .86], [.75, 'F4', .35, .74], [1.25, 'A4', .4, .88], [1.75, ['G4', 'D5'], .65, .94], [2.75, 'C5', .4, .82], [3.5, 'A4', .4, .78]],
      [[0, ['F4', 'Bb4'], .45, .86], [.75, 'D5', .4, .9], [1.5, ['E4', 'C5'], .55, .88], [2.25, 'G4', .35, .76], [2.75, ['E4', 'A4', 'C#5'], .85, .95]],
      [[0, 'D5', .35, .88], [.5, 'E5', .35, .92], [1, 'D5', .35, .86], [1.5, ['A4', 'D5'], .55, .92], [2.25, 'C5', .4, .83], [2.75, 'Bb4', .4, .8], [3.25, ['F4', 'A4'], .55, .86]],
      [[0, ['E4', 'G4', 'C5'], .6, .9], [1, 'Bb4', .35, .8], [1.5, 'A4', .35, .78], [2, ['E4', 'A4', 'C#5'], .55, .92], [2.75, 'E5', .45, .94], [3.5, 'D5', .42, .96]],
      [[0, ['F4', 'A4', 'D5'], .55, .96], [1, 'C5', .35, .84], [1.5, 'D5', .4, .92], [2, ['G4', 'D5'], .65, .98], [3, 'E5', .35, .88], [3.5, 'C5', .4, .85]],
      [[0, ['G4', 'D5'], .45, .88], [.75, 'Bb4', .35, .79], [1.25, 'G4', .35, .76], [1.75, ['F4', 'A4', 'C5'], .6, .9], [2.75, 'E5', .45, .9], [3.5, 'C5', .4, .82]],
      [[0, ['E4', 'A4'], .35, .84], [.5, 'C#5', .35, .88], [1, 'E5', .35, .92], [1.5, 'D5', .4, .96], [2, ['F4', 'A4', 'D5'], .55, .98], [2.75, ['E4', 'A4', 'C#5'], .9, .95]],
      [[0, ['D4', 'F4', 'A4', 'D5'], 3.5, 1]],
    ],
    left: [
      [[0, ['D3', 'A3'], .5, .92], [.75, 'F3', .35, .72], [1.5, 'D3', .4, .8], [1.75, 'G3', .4, .78], [2.5, 'A3', .4, .78], [3.25, 'F3', .45, .82]],
      [[0, ['F3', 'Bb3'], .5, .9], [.75, 'F3', .35, .72], [1.5, ['C3', 'G3'], .5, .88], [2.25, 'E3', .35, .72], [2.75, ['E3', 'A3'], .8, .9]],
      [[0, 'D3', .45, .9], [.5, 'A3', .35, .74], [1, 'F3', .35, .8], [1.5, 'F3', .45, .82], [2.25, 'G3', .35, .76], [2.75, 'D3', .4, .78], [3.25, 'A3', .5, .82]],
      [[0, ['C3', 'G3'], .55, .88], [1, 'G3', .35, .72], [1.5, 'E3', .35, .76], [2, ['E3', 'A3'], .55, .9], [2.75, 'A3', .4, .78], [3.5, 'G3', .4, .84]],
      [[0, ['D3', 'A3'], .5, .95], [.75, 'F3', .35, .75], [1.5, 'D3', .4, .82], [2, ['G3', 'Bb3'], .55, .92], [2.75, 'D3', .35, .78], [3.5, 'G3', .4, .8]],
      [[0, ['G3', 'Bb3'], .45, .88], [.75, 'D3', .35, .74], [1.25, 'G3', .35, .76], [1.75, ['F3', 'A3'], .55, .88], [2.75, 'A3', .4, .78], [3.5, 'F3', .4, .8]],
      [[0, ['E3', 'A3'], .35, .9], [.5, 'A3', .35, .78], [1, 'A3', .35, .84], [1.5, 'G3', .4, .86], [2, ['D3', 'F3'], .55, .94], [2.75, ['E3', 'G3', 'A3'], .9, .92]],
      [[0, ['D3', 'F3', 'A3'], 3.5, .95]],
    ],
  };
  const asMidi = note => {
    try {
      const midi = typeof note === 'number' ? note : midiFor(note);
      return Number.isInteger(midi) && midi >= 36 && midi <= 84 ? midi : null;
    } catch { return null; }
  };
  const hasLeftHand = song => Boolean(song?.events?.some(event => event.hand === 'left'));
  function arrange(song, description = song.description) {
    const meter = Number.isFinite(song.meter) && song.meter > 0 ? song.meter : 4;
    const events = ['left', 'right'].flatMap(hand => song[hand].flatMap((bar, i) =>
      bar.flatMap(([offset, chord, length, velocity = hand === 'left' ? .58 : .79]) => {
        if (!Number.isFinite(offset) || offset < 0 || !Number.isFinite(length) || length <= 0) return [];
        return [chord].flat().flatMap(note => {
          const midi = asMidi(note);
          return midi == null ? [] : [{ note: midi, at: i * meter + offset, length, velocity, hand }];
        });
      })));
    const bars = Math.max(song.left.length, song.right.length);
    const duration = events.reduce((end, event) => Math.max(end, event.at + event.length), bars * meter);
    return { ...song, title: song.title || song.name, bpm: song.tempo ?? song.bpm, meter, description, events, duration };
  }
  const tracks = [
    arrange(birthday),
    arrange(repertoire.moon, '初级 · 左手分解和弦，右手连奏'),
    arrange(repertoire.engine, '进阶 · 双手切分与和弦'),
    arrange(repertoire.chase, '挑战 · 半音跑动与密集错位'),
    arrange(boss),
  ];
  const encores = data.songs.map(song => {
    if (Array.isArray(song.left) && Array.isArray(song.right)) return arrange(song);
    const phrases = Array.isArray(song.phrases) && song.phrases.length
      ? song.phrases
      : [{ notes: Array.isArray(song.notes) ? song.notes : [], beats: [] }];
    let at = 0;
    const events = phrases.flatMap(phrase => (Array.isArray(phrase.notes) ? phrase.notes : []).flatMap((note, index) => {
      const rawBeat = Number(phrase.beats?.[index]);
      const beats = Number.isFinite(rawBeat) && rawBeat > 0 ? rawBeat : 1;
      const midi = asMidi(note);
      const event = midi == null ? null : { note: midi, at, length: beats * .89, velocity: index % 4 ? .67 : .86, hand: 'right' };
      at += beats;
      return event ? [event] : [];
    }));
    return {...song, title: song.title || song.name, bpm: song.bpm ?? song.tempo, meter: song.meter || 4, description: song.description || '加演 · 单手旋律', events, duration: at};
  });
  const completed = new Set(Array.isArray(save.pianoLevels) ? save.pianoLevels : []);
  const extraCompleted = new Set(Array.isArray(save.pianoExtraCompleted) ? save.pianoExtraCompleted : []);
  const library = Array.isArray(window.BirthdayPianoLibrary) ? window.BirthdayPianoLibrary : [];
  const songGroups = [
    { id: 'main', label: '生日主线 · 收集星核（5 首双手）',
      entries: tracks.map((song, index) => [String(index), song]) },
    ...library.map(group => ({ id: 'lib-' + group.id, label: group.label,
      entries: group.songs.map(song => ['lib-' + group.id + '-' + song.id, arrange(song)]) })),
    { id: 'encore', label: '加演 · 特选曲目',
      entries: encores.map((song, index) => ['extra-' + index, song]) },
  ].filter(group => group.entries.length);
  const allSongs = new Map(songGroups.flatMap(group => group.entries));
  const mainLevels = ['入门', '初级', '进阶', '挑战', 'Boss'];
  const isMain = id => /^[0-4]$/.test(id);
  const panel = element('div', null, 'piano-studio');
  stage.append(panel);
  const top = element('div', null, 'piano-toolbar');
  const title = element('h2', '橙子的生日琴台');
  const dedication = element('p', '致敬你做的《Brainiac Maniac · Boss 钢琴训练营》', 'piano-dedication');
  const heading = element('div');
  heading.append(dedication, title);
  const sampler = createPianoAudio(pianoContext, new URL('samples/', document.querySelector('script[src$="/studio.js"]').src));
  function pianoContext() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    return audio ||= new Audio();
  }
  const tempo = element('input');
  Object.assign(tempo, {type: 'range', min: '40', max: '144', step: '1', value: '64'});
  tempo.setAttribute('aria-label', '速度 BPM');
  const speed = element('label', null, 'piano-tempo');
  const speedValue = element('span', '64 BPM');
  speed.append(speedValue, tempo);
  const hands = element('select');
  hands.setAttribute('aria-label', '演奏声部');
  for (const [value, label] of [['both', '双手'], ['right', '右手'], ['left', '左手']]) {
    const option = element('option', label);
    option.value = value;
    hands.append(option);
  }
  const modeSelect = element('select');
  modeSelect.setAttribute('aria-label', '挑战模式');
  for (const [value, label] of [
    ['follow', '标准 · 逐步跟弹'],
    ['sync', '进阶 · 双手合奏'],
    ['rhythm', '大师 · 实时落键'],
  ]) {
    const option = element('option', label);
    option.value = value;
    modeSelect.append(option);
  }
  modeSelect.value = 'sync';
  const legend = element('span', null, 'birthday-hand-legend');
  legend.append(element('span', '左手', 'roll-left'), element('span', '右手', 'roll-right'));
  let metroTimer, metroEnabled = false;
  const metronome = button('节拍器', () => {
    metroEnabled = !metroEnabled;
    metronome.setAttribute('aria-pressed', String(metroEnabled));
    restartMetronome(demo?.start);
  }, 'birthday-metronome');
  metronome.setAttribute('aria-pressed', 'false');
  function stopMetronome() {
    clearInterval(metroTimer);
    metronome.classList.remove('beat-on', 'downbeat');
  }
  function restartMetronome(zero) {
    stopMetronome();
    if (!metroEnabled) return;
    let context;
    try { context = pianoContext(); } catch { return; }
    if (context.state === 'suspended') context.resume().catch(() => {});
    const interval = 60 / Number(tempo.value);
    const meter = selectedSong()?.meter || 4;
    const origin = zero ?? context.currentTime + .03;
    let lastBeat = -1;
    metroTimer = setInterval(() => {
      const now = context.currentTime;
      if (now < origin) return;
      const elapsed = (now - origin) / interval;
      const beat = Math.floor(elapsed);
      const accent = beat % meter === 0;
      metronome.classList.toggle('beat-on', elapsed - beat < .2);
      metronome.classList.toggle('downbeat', accent);
      if (lastBeat === beat) return;
      lastBeat = beat;
      if (mic || now - (origin + beat * interval) > .07) return;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.value = accent ? 1320 : 880;
      gain.gain.setValueAtTime(accent ? .095 : .055, now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .045);
      osc.connect(gain).connect(context.destination);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(now);
      osc.stop(now + .05);
    }, 20);
  }
  function setSpeed(bpm) {
    tempo.value = bpm;
    speedValue.textContent = tempo.value + ' BPM';
    restartMetronome();
  }
  tempo.addEventListener('input', () => setSpeed(tempo.value));
  const attribution = element('a', 'Yamaha C5 · Alexander Holm · CC BY 3.0', 'piano-attribution');
  attribution.href = 'https://creativecommons.org/licenses/by/3.0/';
  const picker = element('select');
  picker.setAttribute('aria-label', '选择曲目');
  picker.append(element('option', '自由弹奏'));
  picker.options[0].value = '';
  for (const { label, entries } of songGroups) {
    const group = element('optgroup');
    group.label = label;
    for (const [id, song] of entries) {
      const prefix = isMain(id) ? (Number(id) + 1) + ' · ' : '';
      const option = element('option', prefix + song.title + (song.draft ? ' · 样谱' : ''));
      option.value = id;
      group.append(option);
    }
    picker.append(group);
  }
  const status = element('p', null, 'piano-status');
  const source = element('a', '曲谱来源', 'piano-source');
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  status.setAttribute('role', 'status');
  const sequence = element('div', null, 'note-queue');
  const syncBadge = element('span', '双手合奏', 'piano-sync-badge');
  syncBadge.hidden = true;
  const metricsBadge = element('span', '连击 0 · 准度 100%', 'piano-metrics mono');
  const rain = element('div', null, 'note-rain');
  const phrases = element('div', null, 'phrase-meter');
  phrases.setAttribute('aria-label', '乐句进度');
  const stand = element('div', null, 'piano-stand');
  const scoreHeader = element('div', null, 'score-header');
  const queueBar = element('div', null, 'piano-queue-bar');
  const detail = element('span', '', 'score-detail');
  let demo = null;
  let rhythmRun = null;
  let rhythmToken = 0;
  let rhythmLoading = false;
  let rhythmStartTimer = 0;
  let rhythmCueTimer = 0;
  let syncTimer = 0;
  let combo = 0;
  let bestCombo = 0;
  let syncHits = 0;
  let syncTotal = 0;
  const preview = button('▶ 试听本曲', () => {
    if (demo) { stopPreview(); return; }
    const song = selectedSong();
    if (song) playDemo(song);
  });
  const rhythmButton = button('▶ 开始实时挑战', () => {
    if (rhythmRun || rhythmLoading) stopRhythm();
    else startRhythm();
  }, 'primary piano-rhythm-btn');
  rhythmButton.hidden = true;
  function playBeatClick(accent = false) {
    try {
      const context = pianoContext();
      if (context.state === 'suspended') context.resume().catch(() => {});
      const now = context.currentTime;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.value = accent ? 1320 : 880;
      gain.gain.setValueAtTime(accent ? .11 : .06, now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .05);
      osc.connect(gain).connect(context.destination);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(now);
      osc.stop(now + .055);
    } catch {}
  }
  function clearSyncTimer() {
    clearTimeout(syncTimer);
    syncTimer = 0;
  }
  function updateMetricsBadge() {
    if (rhythmRun) {
      const judged = rhythmRun.perfect + rhythmRun.good + rhythmRun.miss;
      const acc = judged ? Math.round((rhythmRun.perfect + rhythmRun.good) / judged * 100) : 100;
      metricsBadge.hidden = false;
      metricsBadge.textContent = '连击 ' + rhythmRun.combo + ' · 准度 ' + acc + '% · ' + rhythmRun.score + ' 分';
      return;
    }
    if (modeSelect.value === 'sync' && selectedSong()) {
      const acc = syncTotal ? Math.round(syncHits / syncTotal * 100) : 100;
      metricsBadge.hidden = false;
      metricsBadge.textContent = '连击 ' + combo + ' · 同步准度 ' + acc + '%';
      return;
    }
    if (modeSelect.value === 'rhythm' && selectedSong()) {
      metricsBadge.hidden = false;
      metricsBadge.textContent = '实时落键挑战 · 准备就绪';
      return;
    }
    metricsBadge.hidden = true;
  }
  function showRhythmCue(text, kind = '') {
    clearTimeout(rhythmCueTimer);
    rhythmCue.textContent = text;
    rhythmCue.className = 'piano-judge-cue' + (kind ? ' is-' + kind : '');
    rhythmCue.hidden = !text;
    if (text && !['3', '2', '1'].includes(text)) {
      rhythmCueTimer = setTimeout(() => {
        rhythmCue.hidden = true;
      }, 550);
    }
  }
  function stopRhythm(keepGrade = false) {
    rhythmToken++;
    rhythmLoading = false;
    clearTimeout(rhythmStartTimer);
    rhythmStartTimer = 0;
    clearTimeout(rhythmCueTimer);
    rhythmButton.textContent = '▶ 开始实时挑战';
    if (!rhythmRun) return;
    cancelAnimationFrame(rhythmRun.frame);
    rhythmRun = null;
    roll.classList.remove('rhythm-live');
    tempo.disabled = false;
    for (const key of controls.values()) key.classList.remove('next-note', 'next-left');
    if (!keepGrade) {
      rhythmCue.hidden = true;
      if (active) refresh();
    } else {
      updateMetricsBadge();
    }
  }
  async function startRhythm() {
    const song = selectedSong();
    if (!song || modeSelect.value !== 'rhythm') return;
    stopPreview();
    stopMic();
    stopMetronome();
    clearTimeout(advance);
    clearSyncTimer();
    stopRhythm();
    transitioning = false;
    const token = ++rhythmToken;
    rhythmLoading = true;
    rhythmButton.textContent = '■ 取消加载';
    await sampler.ready().catch(() => null);
    if (!active || token !== rhythmToken || modeSelect.value !== 'rhythm' || selectedSong() !== song) {
      if (token === rhythmToken) {
        rhythmLoading = false;
        rhythmButton.textContent = '▶ 开始实时挑战';
      }
      return;
    }
    rhythmLoading = false;
    const events = selectedEvents(song).map(event => ({ ...event, hit: false, missed: false }));
    if (!events.length) {
      rhythmButton.textContent = '▶ 开始实时挑战';
      return;
    }
    const bpm = Number(tempo.value);
    const msPerBeat = 60000 / bpm;
    const countdownBeats = 3;
    const run = {
      song,
      events,
      bpm,
      msPerBeat,
      startMs: performance.now() + countdownBeats * msPerBeat,
      score: 0,
      combo: 0,
      bestCombo: 0,
      perfect: 0,
      good: 0,
      miss: 0,
      lastCount: 4,
      lastBeatClick: -1,
      finished: false,
      frame: 0,
    };
    rhythmRun = run;
    tempo.disabled = true;
    rhythmButton.textContent = '■ 停止挑战';
    roll.classList.add('rhythm-live');
    targetVisibleRange(events.slice(0, 8).map(e => e.note));
    keyboardWindow.focus({ preventScroll: true });

    function finishRun() {
      if (rhythmRun !== run || run.finished) return;
      run.finished = true;
      cancelAnimationFrame(run.frame);
      roll.classList.remove('rhythm-live');
      tempo.disabled = false;
      for (const key of controls.values()) key.classList.remove('next-note', 'next-left');
      const total = run.perfect + run.good + run.miss;
      const hitRate = total ? Math.round((run.perfect + run.good) / total * 100) : 100;
      const weighted = total ? (run.perfect + run.good * .7) / total : 1;
      const grade = weighted >= .88 && run.miss <= 2 ? 'S' : hitRate >= 72 ? 'A' : hitRate >= 50 ? 'B' : 'C';
      const passed = grade !== 'C';
      const rewardNote = passed && completeSong() ? ' · 获得 3 星核' : '';
      candles.textContent = Math.min(12, completed.size * 3) + ' / 12 根蜡烛';
      rhythmCue.textContent = '评级 ' + grade + ' · ' + run.score + ' 分';
      rhythmCue.className = 'piano-judge-cue is-grade';
      rhythmCue.hidden = false;
      status.textContent = song.title + ' · 评级 ' + grade + (passed ? '（已通关' + rewardNote + '）' : '（未达 50%，再挑战一次）') +
        ' · PERFECT ' + run.perfect + ' / GOOD ' + run.good + ' / MISS ' + run.miss + ' · 最大连击 ' + run.bestCombo;
      rhythmRun = null;
      rhythmButton.textContent = '▶ 再挑战一次';
      updateMetricsBadge();
    }

    function tick(now) {
      if (rhythmRun !== run || !active) return;
      const currentBeat = (now - run.startMs) / run.msPerBeat;
      if (currentBeat < 0) {
        const count = Math.min(3, Math.max(1, Math.ceil(-currentBeat)));
        if (count !== run.lastCount) {
          run.lastCount = count;
          playBeatClick(count === 3);
          showRhythmCue(String(count), 'count');
          status.textContent = song.title + ' · 准备倒数 ' + count + '…';
        }
      } else {
        if (run.lastCount <= 3) {
          run.lastCount = 99;
          showRhythmCue('开始！', 'perfect');
        }
        const beatIndex = Math.floor(currentBeat);
        if (metroEnabled && beatIndex !== run.lastBeatClick) {
          run.lastBeatClick = beatIndex;
          playBeatClick(beatIndex % (song.meter || 4) === 0);
        }
      }
      for (const ev of run.events) {
        if (!ev.hit && !ev.missed && (currentBeat - ev.at) * run.msPerBeat > 360) {
          ev.missed = true;
          run.miss++;
          run.combo = 0;
          showRhythmCue('MISS', 'miss');
        }
      }
      for (const key of controls.values()) key.classList.remove('next-note', 'next-left');
      const visible = [];
      for (const ev of run.events) {
        if (ev.hit || ev.missed) continue;
        const deltaBeat = ev.at - currentBeat;
        if (deltaBeat > 4 || deltaBeat < -.45) continue;
        visible.push({ ...ev, when: Math.max(0, deltaBeat) / 4 });
        if (Math.abs(deltaBeat * run.msPerBeat) <= 220) {
          controls.get(ev.note)?.classList.add(ev.hand === 'left' ? 'next-left' : 'next-note');
        }
      }
      drawRoll(visible);
      progress.max = Math.max(1, song.duration);
      progress.value = Math.max(0, Math.min(song.duration, currentBeat));
      const meter = song.meter || 4;
      const barCount = Math.ceil(song.duration / meter);
      phrases.textContent = currentBeat < 0
        ? '倒数预备 · ' + meter + '/4 拍'
        : '第 ' + Math.min(barCount, Math.floor(currentBeat / meter) + 1) + ' / ' + barCount + ' 小节 · ' + meter + '/4 拍';
      updateMetricsBadge();
      if (currentBeat > song.duration + .55 && run.events.every(ev => ev.hit || ev.missed)) {
        finishRun();
        return;
      }
      run.frame = requestAnimationFrame(tick);
    }
    run.frame = requestAnimationFrame(tick);
  }
  async function playDemo(song) {
    stopMic();
    stopRhythm();
    stopPreview();
    const playback = { voices: [] };
    demo = playback;
    preview.textContent = '■ 停止试听';
    let context;
    try { context = await sampler.ready(); }
    catch {
      if (demo === playback) {
        stopPreview();
        status.textContent = '琴声加载失败，请重新打开生日页。';
      }
      return;
    }
    if (demo !== playback || !active) return;
    const scale = 60 / Number(tempo.value);
    tempo.disabled = true;
    const start = context.currentTime + .08;
    playback.start = start;
    restartMetronome(start);
    const events = selectedEvents(song);
    status.textContent = song.title + ' · ' + hands.selectedOptions[0].textContent + '示范';
    playback.voices = events.map(event => sampler.play(event.note, start + event.at * scale, event.length * scale, event.velocity));
    function animate() {
      const now = (context.currentTime - start) / scale;
      if (now > song.duration + .8) {
        stopPreview();
        markActReady(cakeButton);
        return;
      }
      for (const key of controls.values()) key.classList.remove('demo-key', 'demo-left');
      const visible = [];
      for (const event of events) {
        const delta = event.at - now;
        if (delta > 4 || delta < -event.length) continue;
        visible.push({ ...event, when: Math.max(0, delta) / 4 });
        if (delta <= 0) controls.get(event.note)?.classList.add(event.hand === 'left' ? 'demo-left' : 'demo-key');
      }
      drawRoll(visible);
      playback.frame = requestAnimationFrame(animate);
    }
    animate();
  }
  function stopPreview() {
    if (!demo) return;
    cancelAnimationFrame(demo.frame);
    demo.voices.forEach(voice => voice.release(undefined, .04));
    preview.textContent = '▶ 试听本曲';
    tempo.disabled = false;
    demo = null;
    for (const key of controls.values()) key.classList.remove('demo-key', 'demo-left');
    refresh();
  }
  const progress = element('progress');
  progress.setAttribute('aria-label', '本曲进度');
  const candles = element('p', null, 'piano-candles');
  const keyboard = element('div', null, 'concert-keys');
  const controls = new Map();
  const listeners = new AbortController();
  const { signal } = listeners;
  const flashes = new Map();
  let position = 0;
  let groups = [];
  let leftBase = 48;
  let rightBase = 60;
  const playedNotes = new Set();
  let advance;
  let transitioning = false;
  let active = true;
  let mic = null;
  const micStatus = element('p', '松开延音踏板，一次弹一个音。麦克风音频只在本机分析。', 'piano-mic-status');
  micStatus.setAttribute('role', 'status');
  const micButton = button('用真实钢琴跟弹', toggleMic, 'piano-mic-button');
  micButton.setAttribute('aria-pressed', 'false');
  const keyboardWindow = element('div', null, 'birthday-keyboard-window');
  const instrument = element('div', null, 'birthday-instrument');
  const roll = element('div', null, 'birthday-roll');
  roll.setAttribute('aria-hidden', 'true');
  const rhythmCue = element('div', null, 'piano-judge-cue');
  rhythmCue.hidden = true;
  const selectedSong = () => allSongs.get(picker.value);
  function completeSong() {
    const id = picker.value;
    markActReady(cakeButton);
    if (!isMain(id)) {
      if (!extraCompleted.has(id)) {
        extraCompleted.add(id);
        save.pianoExtraCompleted = [...extraCompleted];
        persist();
        celebrate();
      }
      return false;
    }
    const index = Number(id);
    if (completed.has(index)) return false;
    completed.add(index);
    save.pianoLevels = [...completed];
    const earnsStars = !save.songs.includes(index);
    if (earnsStars) {
      save.songs.push(index);
      save.stars += 3;
    }
    persist();
    celebrate();
    return earnsStars;
  }
  const selectedEvents = song => song.events.filter(event => hands.value === 'both' || event.hand === hands.value);
  function autoAlignKeyboard(song) {
    if (!song) {
      leftBase = 48;
      rightBase = 60;
      updateKeyLabels();
      return;
    }
    const leftNotes = song.events.filter(e => e.hand === 'left').map(e => e.note);
    if (leftNotes.length) {
      const c2Hits = leftNotes.filter(n => n >= 36 && n <= 47).length;
      const c3Hits = leftNotes.filter(n => n >= 48 && n <= 59).length;
      leftBase = c2Hits >= 3 && c2Hits >= c3Hits * .45 ? 36 : 48;
    } else {
      leftBase = 48;
    }
    const rightNotes = song.events.filter(e => e.hand === 'right').map(e => e.note);
    if (rightNotes.length) {
      const c4Hits = rightNotes.filter(n => n >= 60 && n <= 76).length;
      const c5Hits = rightNotes.filter(n => n >= 72 && n <= 84).length;
      rightBase = c5Hits > c4Hits ? 72 : 60;
    } else {
      rightBase = 60;
    }
    updateKeyLabels();
  }
  function prepareSong(resetSpeed) {
    clearSyncTimer();
    stopRhythm();
    rhythmCue.hidden = true;
    const song = selectedSong();
    const wasSingle = hands.options[0].disabled;
    const hasLeft = hasLeftHand(song);
    hands.options[0].disabled = hands.options[2].disabled = !hasLeft;
    if (!hasLeft) hands.value = 'right';
    else if (wasSingle) hands.value = 'both';
    const byBeat = new Map();
    for (const event of song ? selectedEvents(song) : []) {
      if (!byBeat.has(event.at)) byBeat.set(event.at, []);
      byBeat.get(event.at).push(event);
    }
    groups = [...byBeat.values()].sort((a, b) => a[0].at - b[0].at);
    position = 0;
    combo = 0;
    bestCombo = 0;
    syncHits = 0;
    syncTotal = 0;
    playedNotes.clear();
    autoAlignKeyboard(song);
    if (resetSpeed) setSpeed(song?.bpm ?? 72);
    rhythmButton.hidden = modeSelect.value !== 'rhythm';
    rhythmButton.disabled = !song;
    rhythmButton.textContent = '▶ 开始实时挑战';
    refresh();
  }
  const expectedEvents = () => groups[position]?.filter(event => !playedNotes.has(event.note)) || [];
  function targetVisible(note) {
    targetVisibleRange([note]);
  }
  function targetVisibleRange(notes) {
    const keysFound = notes.map(n => controls.get(n)).filter(Boolean);
    if (!keysFound.length) return;
    const area = keyboardWindow.getBoundingClientRect();
    if (!area.width) return;
    const minLeft = Math.min(...keysFound.map(k => k.offsetLeft));
    const maxRight = Math.max(...keysFound.map(k => k.offsetLeft + k.offsetWidth));
    const mid = (minLeft + maxRight) / 2;
    const viewLeft = keyboardWindow.scrollLeft;
    const viewRight = viewLeft + area.width;
    if (minLeft < viewLeft + 8 || maxRight > viewRight - 8) {
      keyboardWindow.scrollLeft = Math.max(0, mid - area.width / 2);
    }
  }
  function drawRoll(notes) {
    roll.replaceChildren(...notes.flatMap(({ note, when, hand }) => {
      const key = controls.get(note);
      if (!key) return [];
      const pill = element('i', null, 'birthday-roll-note' + (hand === 'left' ? ' roll-left' : ''));
      pill.style.left = (key.offsetLeft + key.offsetWidth / 2) / keyboard.clientWidth * 100 + '%';
      pill.style.bottom = when * 84 + '%';
      return [pill];
    }));
  }
  function refresh(message) {
    if (rhythmRun) return;
    const song = selectedSong();
    const expected = expectedEvents();
    const currentGroup = groups[position] || [];
    const hasLeft = currentGroup.some(event => event.hand === 'left');
    const hasRight = currentGroup.some(event => event.hand === 'right');
    syncBadge.hidden = !(song && hands.value === 'both' && hasLeft && hasRight);
    for (const [note, key] of controls) {
      key.classList.toggle('next-note', expected.some(event => event.note === note && event.hand === 'right'));
      key.classList.toggle('next-left', expected.some(event => event.note === note && event.hand === 'left'));
    }
    micButton.disabled = !song;
    rhythmButton.hidden = modeSelect.value !== 'rhythm';
    rhythmButton.disabled = !song;
    source.hidden = !song?.source;
    if (song?.source) {
      source.href = song.source;
      source.title = song.credit || '曲谱来源';
    }
    const meter = song?.meter || 4;
    const barCount = song ? Math.ceil(song.duration / meter) : 0;
    const barIndex = expected.length ? Math.floor(expected[0].at / meter) : barCount;
    phrases.textContent = song ? '第 ' + Math.min(barCount, barIndex + 1) + ' / ' + barCount + ' 小节 · ' + meter + '/4 拍' : '';
    detail.textContent = song?.description || '自由弹奏 · Yamaha C5';
    preview.disabled = !song;
    progress.max = groups.length || 1;
    progress.value = position;
    sequence.replaceChildren(...expected.map(({note, hand}) => {
      const badge = element('kbd', null, hand === 'left' ? 'queued-left' : 'queued-current');
      badge.append(element('span', hand === 'left' ? '左' : '右', 'hand-tag'), nameFor(note).replace('#', '♯'));
      return badge;
    }));
    if (!demo) {
      const origin = groups[position]?.[0].at ?? 0;
      const upcoming = groups.slice(position).flatMap((group, index) => index ? group : expected);
      drawRoll(upcoming.filter(event => event.at - origin <= 4)
        .map(event => ({...event, when: (event.at - origin) / 4})));
      if (expected.length) targetVisibleRange(expected.map(event => event.note));
    }
    updateMetricsBadge();
    status.textContent = message || (song ? song.title + ' · ' + position + ' / ' + groups.length : '自由弹奏');
    candles.textContent = Math.min(12, completed.size * 3) + ' / 12 根蜡烛';
  }
  function flash(note, hand) {
    const key = controls.get(note);
    if (!key) return;
    clearTimeout(flashes.get(note));
    key.classList.add('key-down');
    key.classList.toggle('key-down-left', hand === 'left');
    flashes.set(note, setTimeout(() => {
      key.classList.remove('key-down', 'key-down-left');
      flashes.delete(note);
    }, 160));
  }
  function noteOn(note, fromMic = false) {
    if (!fromMic && mic) return;
    const song = selectedSong();
    const expected = expectedEvents();
    if (demo) stopPreview();
    const judged = note;
    if (!fromMic) {
      sampler.ready().then(context => {
        if (active && !mic) sampler.play(note, context.currentTime, .6, .78);
      }).catch(() => { if (active) micStatus.textContent = '网页琴声暂未加载，可以继续用真实钢琴。'; });
    }
    const landing = controls.get(judged);
    if (landing) {
      const rect = landing.getBoundingClientRect();
      const parent = rain.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - parent.left;
      const flare = element('span', '', 'note-ember');
      flare.style.left = x + 'px';
      rain.append(flare);
      const ash = Array.from({ length: 8 }, (_, index) => {
        const particle = element('i', '', 'note-ash');
        particle.style.left = x + 'px';
        particle.style.setProperty('--ash-angle', (index * 45 + Math.random() * 18) + 'deg');
        particle.style.setProperty('--ash-distance', (22 + Math.random() * 25) + 'px');
        particle.style.setProperty('--ash-delay', (Math.random() * 100) + 'ms');
        return particle;
      });
      rain.append(...ash);
      setTimeout(() => { flare.remove(); ash.forEach(particle => particle.remove()); }, 950);
    }

    if (rhythmRun && !rhythmRun.finished) {
      const currentBeat = (performance.now() - rhythmRun.startMs) / rhythmRun.msPerBeat;
      let bestEvent = null;
      let bestAbs = Infinity;
      for (const ev of rhythmRun.events) {
        if (ev.note !== judged || ev.hit || ev.missed) continue;
        const abs = Math.abs((ev.at - currentBeat) * rhythmRun.msPerBeat);
        if (abs <= 360 && abs < bestAbs) {
          bestAbs = abs;
          bestEvent = ev;
        }
      }
      flash(judged, bestEvent?.hand || (judged < 60 ? 'left' : 'right'));
      if (bestEvent) {
        bestEvent.hit = true;
        if (bestAbs <= 190) {
          rhythmRun.perfect++;
          rhythmRun.combo++;
          rhythmRun.score += 100 + Math.min(50, rhythmRun.combo * 2);
          showRhythmCue('PERFECT!', 'perfect');
        } else {
          rhythmRun.good++;
          rhythmRun.combo++;
          rhythmRun.score += 60 + Math.min(30, rhythmRun.combo);
          showRhythmCue('GOOD', 'good');
        }
        rhythmRun.bestCombo = Math.max(rhythmRun.bestCombo, rhythmRun.combo);
        updateMetricsBadge();
      }
      return;
    }

    flash(judged, expected.find(event => event.note === judged)?.hand || (judged < 60 ? 'left' : 'right'));
    if (!song || transitioning || !expected.length || modeSelect.value === 'rhythm') return;
    const currentGroup = groups[position] || [];
    if (!expected.some(event => event.note === judged)) {
      if (currentGroup.some(event => event.note === judged) && playedNotes.has(judged)) return;
      if (modeSelect.value === 'sync') {
        combo = 0;
        syncTotal++;
      }
      refresh(fromMic ? '听到 ' + nameFor(note) + ' · 请弹亮起的音' : '跟着亮起的键继续。');
      return;
    }
    const needsSync = modeSelect.value === 'sync' &&
      hands.value === 'both' &&
      currentGroup.some(e => e.hand === 'left') &&
      currentGroup.some(e => e.hand === 'right');

    playedNotes.add(note);
    if (expectedEvents().length) {
      if (needsSync && !syncTimer) {
        const windowMs = (fromMic || mic) ? 1600 : 750;
        syncTimer = setTimeout(() => {
          syncTimer = 0;
          if (!active || transitioning) return;
          playedNotes.clear();
          combo = 0;
          syncTotal++;
          refresh('左右手需同时配合按下！');
        }, windowMs);
      }
      refresh();
      return;
    }
    clearSyncTimer();
    if (modeSelect.value === 'sync') {
      syncHits++;
      syncTotal++;
      combo++;
      bestCombo = Math.max(bestCombo, combo);
    }
    playedNotes.clear();
    position++;
    if (position < groups.length) { refresh(); return; }
    completeSong();
    const following = isMain(picker.value) ? tracks[Number(picker.value) + 1] : null;
    refresh(song.title + ' 完成' + (following ? ' · 下一首 ' + following.title : ''));
    if (!following) return;
    transitioning = true;
    advance = setTimeout(() => {
      picker.value = String(Number(picker.value) + 1);
      transitioning = false;
      prepareSong(true);
    }, 850);
  }
  function stopMic() {
    const capture = mic;
    if (!capture) return;
    mic = null;
    clearInterval(capture.timer);
    capture.stream?.getTracks().forEach(track => track.stop());
    capture.source?.disconnect();
    capture.analyser?.disconnect();
    capture.silent?.disconnect();
    micButton.textContent = '用真实钢琴跟弹';
    micButton.setAttribute('aria-pressed', 'false');
    micStatus.textContent = '松开延音踏板，一次弹一个音。麦克风音频只在本机分析。';
    if (active) refresh();
  }
  async function toggleMic() {
    if (mic) { stopMic(); return; }
    if (!navigator.mediaDevices?.getUserMedia) {
      micStatus.textContent = '请用支持麦克风的浏览器打开生日页，或用下方网页琴键。';
      return;
    }
    stopPreview();
    stopRhythm();
    if (modeSelect.value === 'rhythm') {
      modeSelect.value = 'sync';
      rhythmButton.hidden = true;
    }
    sampler.silence();
    const capture = {};
    mic = capture;
    micButton.textContent = '取消开启麦克风';
    micStatus.textContent = '请在浏览器提示里允许使用麦克风。';
    try {
      const context = pianoContext();
      await context.resume();
      if (mic !== capture) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false }
      });
      if (mic !== capture) { stream.getTracks().forEach(track => track.stop()); return; }
      capture.stream = stream;
      const analyser = capture.analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      capture.source = context.createMediaStreamSource(stream);
      capture.silent = context.createGain();
      capture.silent.gain.value = 0;
      capture.source.connect(analyser).connect(capture.silent).connect(context.destination);
      stream.getAudioTracks()[0]?.addEventListener('ended', () => {
        if (mic === capture) { stopMic(); micStatus.textContent = '麦克风已断开，可以重新开启。'; }
      });
      micButton.textContent = '停止麦克风';
      micButton.setAttribute('aria-pressed', 'true');
      micStatus.textContent = '麦克风已开启 · 同时亮起多个键时，逐个弹完本组。节拍器以闪光提示。';
      capture.timer = trackPianoPitch(context, analyser, note => {
        if (transitioning) return false;
        noteOn(note, true);
      });
      refresh();
    } catch (error) {
      if (mic !== capture) return;
      stopMic();
      micStatus.textContent = error.name === 'NotAllowedError'
        ? '麦克风权限未开启，可在地址栏授权，或用网页琴键。'
        : '无法使用麦克风，可用网页琴键继续。';
    }
  }
  function updateKeyLabels() {
    const leftMap = new Map(Object.entries(leftKeyLabels).map(([offset, letter]) => [leftBase + Number(offset), letter]));
    const rightMap = new Map(Object.entries(rightKeyLabels).map(([offset, letter]) => [rightBase + Number(offset), letter]));
    for (const [note, key] of controls) {
      const label = nameFor(note).replace('#', '♯');
      const rightLetter = rightMap.get(note);
      const leftLetter = leftMap.get(note);
      const letter = rightLetter ?? leftLetter ?? '';
      const kbd = key.querySelector('kbd');
      kbd.textContent = letter;
      kbd.classList.toggle('kbd-right', Boolean(rightLetter));
      kbd.classList.toggle('kbd-left', !rightLetter && Boolean(leftLetter));
      key.setAttribute('aria-label', label + (letter ? ' ' + letter : ''));
    }
  }
  let lowest = 36;
  let highest = 88;
  for (const song of allSongs.values()) {
    for (const { note } of song.events) {
      lowest = Math.min(lowest, note);
      highest = Math.max(highest, note);
    }
  }
  lowest = Math.floor(lowest / 12) * 12;
  let white = 0;
  for (let note = lowest; note <= highest; note++) {
    const label = nameFor(note).replace('#', '♯');
    const black = label.includes('♯');
    const key = element('button', null, (black ? 'concert-key black-key' : 'concert-key white-key') + (note === 60 ? ' middle-c' : ''));
    key.type = 'button';
    key.dataset.midi = String(note);
    key.append(element('span', label), element('kbd'));
    if (black) key.style.setProperty('--after', white);
    else white++;
    controls.set(note, key);
    keyboard.append(key);
  }
  keyboard.style.setProperty('--white-keys', white);
  keyboard.addEventListener('pointerdown', event => {
    const key = event.target.closest('.concert-key');
    if (!key || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    keyboardWindow.focus({ preventScroll: true });
    noteOn(Number(key.dataset.midi));
  }, { signal });
  keyboard.addEventListener('click', event => {
    if (event.detail !== 0) return;
    const key = event.target.closest('.concert-key');
    if (key) noteOn(Number(key.dataset.midi));
  }, { signal });
  keyboard.addEventListener('contextmenu', event => event.preventDefault(), { signal });
  updateKeyLabels();
  keyboardWindow.tabIndex = 0;
  keyboardWindow.setAttribute('role', 'group');
  keyboardWindow.setAttribute('aria-label', '网页琴键');
  keyboardWindow.setAttribute('aria-describedby', 'piano-keyboard-help');
  keyboardWindow.addEventListener('keydown', event => {
    if (event.repeat || event.isComposing || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.code === 'Comma' || event.code === 'Period') {
      event.preventDefault();
      leftBase = Math.max(36, Math.min(60, leftBase + (event.code === 'Comma' ? -12 : 12)));
      updateKeyLabels();
      targetVisible(leftBase + 5);
      return;
    }
    if (event.code === 'BracketLeft' || event.code === 'BracketRight') {
      event.preventDefault();
      rightBase = Math.max(48, Math.min(72, rightBase + (event.code === 'BracketLeft' ? -12 : 12)));
      updateKeyLabels();
      targetVisible(rightBase + 5);
      return;
    }
    const leftOffset = leftKeyOffsets[event.code];
    if (leftOffset !== undefined) {
      const note = leftBase + leftOffset;
      if (controls.has(note)) { event.preventDefault(); noteOn(note); }
      return;
    }
    const rightOffset = rightKeyOffsets[event.code];
    if (rightOffset !== undefined) {
      const note = rightBase + rightOffset;
      if (controls.has(note)) { event.preventDefault(); noteOn(note); }
    }
  }, { signal });
  window.addEventListener('pagehide', () => { stopRhythm(); clearSyncTimer(); stopMic(); stopPreview(); stopMetronome(); sampler.silence(); }, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMic(); }, { signal });
  const resize = new ResizeObserver(() => { if (!demo && !rhythmRun) refresh(status.textContent); });
  resize.observe(keyboard);
  stopChapter = () => {
    listeners.abort();
    active = false;
    clearTimeout(advance);
    clearSyncTimer();
    stopRhythm();
    resize.disconnect();
    stopMetronome();
    stopPreview();
    stopMic();
    sampler.silence();
    for (const timer of flashes.values()) clearTimeout(timer);
  };
  stopChapter.suspend = () => {
    clearTimeout(advance);
    clearSyncTimer();
    stopRhythm();
    stopMetronome();
    stopPreview();
    stopMic();
  };
  function changeSong() {
    clearTimeout(advance);
    stopPreview();
    if (picker.value === '') stopMic();
    transitioning = false;
    prepareSong(true);
  }
  picker.addEventListener('change', changeSong);
  hands.addEventListener('change', () => {
    clearTimeout(advance);
    transitioning = false;
    stopPreview();
    prepareSong(false);
  });
  modeSelect.addEventListener('change', () => {
    clearTimeout(advance);
    transitioning = false;
    stopPreview();
    prepareSong(false);
  });
  const first = tracks.findIndex((_, index) => !completed.has(index));
  picker.value = String(Math.max(first, 0));
  top.append(heading, candles);
  const transport = element('div', null, 'birthday-piano-transport');
  const browser = element('dialog', null, 'piano-library-dialog');
  const libraryTitle = element('h3', '双手曲库');
  libraryTitle.id = 'piano-library-title';
  browser.setAttribute('aria-labelledby', libraryTitle.id);
  const libraryTop = element('div', null, 'panel-top');
  const closeLibrary = button('关闭', () => browser.close());
  libraryTop.append(libraryTitle, closeLibrary);
  const filters = element('div', null, 'row piano-library-filters');
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', '曲目分类');
  const songCount = element('p', null, 'piano-library-count');
  songCount.setAttribute('aria-live', 'polite');
  const songCards = element('div', null, 'piano-library-grid');
  let filter = '';
  for (const [id, label] of [['', '全部'], ...songGroups.map(group => [group.id, group.label])]) {
    const filterButton = button(label, () => {
      filter = id;
      renderLibrary();
    });
    filterButton.dataset.category = id;
    filters.append(filterButton);
  }
  function chooseLibrarySong(id, listen) {
    picker.value = id;
    if (listen && hasLeftHand(selectedSong())) hands.value = 'both';
    changeSong();
    browser.close();
    keyboardWindow.focus({ preventScroll: true });
    if (listen) playDemo(selectedSong());
  }
  function renderLibrary() {
    const entries = filter ? songGroups.find(group => group.id === filter).entries : [...allSongs];
    for (const control of filters.children) {
      control.setAttribute('aria-pressed', String(control.dataset.category === filter));
    }
    songCount.textContent = '显示 ' + entries.length + ' 首 · 共 ' + allSongs.size + ' 首';
    songCards.replaceChildren(...entries.map(([id, song]) => {
      const card = element('article', null, 'tile piano-library-card');
      const main = isMain(id);
      const selected = id === picker.value;
      const cleared = main ? completed.has(Number(id)) : extraCompleted.has(id);
      card.classList.toggle('is-selected', selected);
      const tags = element('div', null, 'row piano-library-tags');
      const level = song.level || (main ? mainLevels[Number(id)] : '初级');
      for (const label of [level, hasLeftHand(song) ? '双手 L+R' : '单手',
        (song.meter || 4) + '/4 · ' + song.bpm + ' BPM',
        selected && '当前曲目', cleared && '已通关'].filter(Boolean)) {
        tags.append(element('span', label));
      }
      const controls = element('div', null, 'row');
      controls.append(button('选择练习', () => chooseLibrarySong(id, false), 'primary'),
        button('试听', () => chooseLibrarySong(id, true)));
      card.append(element('h4', song.title), tags);
      if (song.description) card.append(element('p', song.description));
      card.append(controls);
      return card;
    }));
  }
  browser.append(libraryTop, filters, songCount, songCards);
  const openLibrary = button('双手曲库（' + allSongs.size + ' 首）', () => {
    renderLibrary();
    browser.showModal();
  });
  openLibrary.setAttribute('aria-haspopup', 'dialog');
  transport.append(picker, openLibrary, hands, modeSelect, rhythmButton, preview, micButton);
  scoreHeader.append(status, detail, legend);
  queueBar.append(syncBadge, sequence, metricsBadge);
  stand.append(scoreHeader, phrases, progress, queueBar);
  const zoneGuide = element('div', null, 'piano-zone-guide');
  zoneGuide.append(
    element('span', '左手低音 · 紫 (, / . 移调)', 'zone-left'),
    element('span', '中央 C4 分界', 'zone-split'),
    element('span', '右手旋律 · 金 ([ / ] 移调)', 'zone-right')
  );
  keyboardWindow.append(instrument);
  instrument.append(roll, rain, keyboard);
  roll.after(rhythmCue);
  const fallback = element('div', null, 'birthday-piano-footer');
  const keyboardHelp = element('span', '点击或双手多点触摸琴键。电脑键盘：左手 Z–M / S–J（,/. 移调），右手 Q–P / 2–0（[/] 移调）。');
  keyboardHelp.id = 'piano-keyboard-help';
  fallback.append(keyboardHelp, attribution);
  const settings = element('dialog', null, 'piano-settings');
  const settingsHeading = element('h3', '演奏设置');
  settingsHeading.id = 'piano-settings-title';
  settings.setAttribute('aria-labelledby', settingsHeading.id);
  const settingsControls = element('div', null, 'row piano-settings-controls');
  settingsControls.append(speed, metronome, source);
  const closeSettings = button('关闭', () => settings.close());
  const settingsTop = element('div', null, 'panel-top');
  settingsTop.append(settingsHeading, closeSettings);
  settings.append(settingsTop, settingsControls, fallback);
  const actions = element('div', null, 'row immersive-actions piano-actions');
  actions.append(button('演奏设置', () => settings.showModal()));
  const cakeButton = next(actions, 'cake', '去吹蜡烛');
  const pianoMain = element('div', null, 'piano-play-area');
  pianoMain.append(stand, zoneGuide, keyboardWindow);
  const pianoControls = element('div', null, 'piano-control-panel');
  pianoControls.append(transport, micStatus);
  const workspace = element('div', null, 'piano-workspace');
  workspace.append(pianoControls, pianoMain);
  panel.append(top, workspace, actions, settings, browser);
  prepareSong(true);
  if (completed.size) markActReady(cakeButton);
}

function cake() {
  const panel = chapter('BIRTHDAY CAKE', '吹蜡烛，切蛋糕', '橙子，吹灭十二根蜡烛，切下十二岁的第一块蛋糕。');
  panel.classList.add('cake-chapter');
  const board = element('div', null, 'cake-board');
  board.setAttribute('role', 'img');
  board.setAttribute('aria-label', '点着十二根蜡烛的橙瓣巧克力蛋糕');
  const rest = element('div', null, 'cake-rest');
  const slice = element('div', null, 'cake-slice');
  const surface = element('div', null, 'cake-surface');
  surface.append(rest, slice);
  board.append(surface);
  const status = element('p', '还有 12 根蜡烛亮着', 'cake-status');
  status.setAttribute('role', 'status');
  const flavors = element('div', null, 'row cake-flavors');
  flavors.setAttribute('role', 'group');
  flavors.setAttribute('aria-label', '选择蛋糕款式');
  const flavorButtons = Object.entries({
    orange: '橙瓣巧克力', strawberry: '草莓鲜奶油', vanilla: '经典香草', chocolate: '浓巧克力',
  }).map(([key, label]) => {
    const control = element('button', label);
    control.type = 'button';
    control.dataset.flavor = key;
    flavors.append(control);
    return control;
  });
  const actions = element('div', null, 'row');
  const mic = element('button', '开启麦克风吹蜡烛', 'primary');
  mic.type = 'button';
  mic.setAttribute('aria-pressed', 'false');
  const breeze = element('button', '按住这里吹气');
  breeze.type = 'button';
  const fallback = element('button', '用按钮切一块');
  fallback.type = 'button';
  fallback.hidden = true;
  const candles = element('button', '拔下一根蜡烛');
  candles.type = 'button';
  candles.hidden = true;
  const clearCandles = element('button', '收起剩余蜡烛');
  clearCandles.type = 'button';
  clearCandles.hidden = true;
  actions.append(mic, breeze, candles, clearCandles, fallback);
  const wishLink = next(actions, 'wishes', '去许愿');
  wishLink.hidden = true;
  const notice = element('dialog', null, 'scene-guide');
  notice.setAttribute('aria-labelledby', 'cake-notice-title');
  const card = element('div', null, 'scene-card');
  const title = element('h2', '我们一起来切蛋糕吧');
  title.id = 'cake-notice-title';
  const cut = element('button', '拿起蛋糕刀', 'primary');
  cut.type = 'button';
  card.append(title, element('p', '从蛋糕中心的光圈向外缘划一刀，再从中心换个方向划一刀，切出第一块蛋糕。'), cut);
  notice.append(card);
  const cakeStage = element('div', null, 'cake-stage');
  cakeStage.append(board);
  const controls = element('div', null, 'cake-controls');
  controls.append(flavors, status, actions, element('p', '吹气检测在设备上完成，无需上传声音。', 'cake-privacy'));
  const workspace = element('div', null, 'cake-workspace');
  workspace.append(cakeStage, controls);
  panel.append(workspace, notice);
  let celebrationTimer;
  const stopCake = PartyCake.attach({
    board, rest, slice, status, mic, breeze, cut, fallback, candles, clearCandles, notice, flavorButtons,
    initialFlavor: save.cakeFlavor,
    rememberFlavor: key => { save.cakeFlavor = key; persist(); },
    soundFocus: value => PartyEffects.focus(value),
    finish: () => {
      status.textContent = '第一块切好了。橙子，生日快乐！';
      status.classList.add('cake-served');
      playNote(72);
      playNote(79, .12);
      if (PartyEffects.allowsFireworks()) celebrationTimer = setTimeout(celebrate, 750);
      save.cakeCut = true;
      persist();
      wishLink.hidden = false;
      markActReady(wishLink);
      wishLink.focus({ preventScroll: true });
    },
  });
  stopChapter = () => {
    clearTimeout(celebrationTimer);
    stopCake();
  };
  stopChapter.suspend = stopCake.suspend;
}

const wishExample = {
  title: '夜航补给', template: 'star-courier', difficulty: 2, goal: 8, palette: 'nebula',
  pitch: '开船穿过五条航道，躲开暗礁，把 8 颗星核带回基地。',
  choice: '同一条航道既可能有补给，也可能有暗礁。',
  reason: '玩家要提前判断什么时候换道，不能只待在中间。',
  nextPrompt: '保留五条航道，飞船慢一点，捡到 5 颗星核就算过关，换成极光配色。',
};
const wishRevision = {
  ...wishExample, title: '极光练习航线', difficulty: 1, goal: 5, palette: 'aurora',
  pitch: '在极光下练习换道，避开暗礁，带回 5 颗星核。',
  choice: '保留换道和避障，把速度降一级，目标从 8 降到 5。',
  reason: '提前看见的障碍没变，玩家有更多反应时间，第一次更容易成功。',
  nextPrompt: '把速度调回中档，但保留 5 颗星核的目标，看看难度差在哪。',
};

function wishStudio(view, results, showEditor, showResults, playPrototype) {
  const studio = element('section', null, 'wish-studio');
  const aiReady = data.wishAiConfigured === true;
  const aiBadge = element('p', null, 'wish-ai-badge' + (aiReady ? ' is-ready' : ''));
  aiBadge.setAttribute('aria-live', 'polite');
  const aiDot = element('span', null, 'wish-ai-dot');
  aiDot.setAttribute('aria-hidden', 'true');
  const aiBadgeText = element('span');
  aiBadge.append(aiDot, aiBadgeText);
  const form = element('form');
  const label = element('label', '你想做一个什么游戏？');
  label.htmlFor = 'wish-idea';
  const prompt = element('textarea');
  prompt.id = 'wish-idea';
  prompt.rows = 3;
  prompt.maxLength = 240;
  prompt.required = true;
  prompt.placeholder = '例如：飞船穿过星云，避开碎片，带回至少五颗星核。';
  const send = element('button', '用 AI 做一版', 'primary');
  send.type = 'submit';
  const status = element('p', null, 'wish-status');
  status.setAttribute('role', 'status');
  const actions = element('div', null, 'row');
  const output = element('div', null, 'wish-output');
  const historyBox = element('div', null, 'wish-history');
  let current;
  let last;
  let cancel;
  let refreshing = false;
  let submitLabel = send.textContent;
  const settings = ['轻松', '标准', '进阶'];
  const prototypeFields = ['title', 'template', 'palette', 'difficulty', 'goal', 'pitch', 'choice', 'reason', 'nextPrompt'];
  function cleanPrototype(item) {
    if (!item || typeof item !== 'object') return null;
    const clean = {};
    for (const key of prototypeFields) {
      if (Object.hasOwn(item, key)) clean[key] = item[key];
    }
    return clean;
  }
  const refreshQuota = button('刷新余量', async () => {
    if (refreshing) return;
    refreshing = true;
    renderQuota();
    status.textContent = '正在核对当前网络剩余次数…';
    try {
      const response = await fetch('/birthday/data', { cache: 'no-store' });
      const fresh = response.ok ? await response.json().catch(() => null) : null;
      if (fresh && Object.hasOwn(fresh, 'wishQuota')) {
        data.wishQuota = fresh.wishQuota;
        const { limit = 3, remaining } = data.wishQuota || {};
        status.textContent = remaining === 0
          ? `当前网络 ${limit} 次 AI 许愿仍已用完，可以打开示例或试玩历史原型。`
          : remaining == null
            ? '暂未查到精确余量，可以直接重新提交试试。'
            : `已更新：当前网络剩余 ${remaining} / ${limit} 次，可以继续生成。`;
      } else {
        status.textContent = '暂时无法刷新余量，请稍后再试。';
      }
    } catch {
      status.textContent = '暂时无法刷新余量，请稍后再试。';
    } finally {
      refreshing = false;
      renderQuota();
    }
  });
  function renderQuota() {
    const { limit = 3, remaining } = data.wishQuota || {};
    const exhausted = aiReady && remaining === 0;
    aiBadge.classList.toggle('is-ready', aiReady && !exhausted);
    aiBadge.classList.toggle('is-exhausted', exhausted);
    if (!aiReady) {
      aiBadgeText.textContent = '本地示例模式（配置 Vercel 环境变量 AI_API_BASE / AI_API_KEY 后启用实时 AI）';
    } else if (exhausted) {
      aiBadgeText.textContent = `当前网络 ${limit} 次 AI 许愿已用完 · 可继续回看原型或打开示例`;
    } else {
      aiBadgeText.textContent = '✨ AI 许愿接口已就绪 · 当前网络' +
        (remaining == null ? `最多可生成 ${limit} 次` : `剩余 ${remaining} / ${limit} 次`);
    }
    send.textContent = exhausted ? `本网络 ${limit} 次机会已用完` : submitLabel;
    send.disabled = !aiReady || exhausted || Boolean(cancel);
    refreshQuota.hidden = !exhausted;
    refreshQuota.disabled = refreshing;
  }
  const examples = button('打开示例', () => {
    cancel?.abort();
    if (!prompt.value.trim()) prompt.value = '做一个要躲暗礁、收集星核的太空运输游戏。';
    present(wishExample, '示例 · 第一版', true);
    status.textContent = '先试玩第一版，再查看放慢速度后的区别。';
  });
  function renderHistory() {
    const items = Array.isArray(save.wishes) ? save.wishes : [];
    if (!items.length) {
      historyBox.hidden = true;
      historyBox.replaceChildren();
      return;
    }
    historyBox.hidden = false;
    const list = element('ul', null, 'wish-history-list');
    for (const item of items) {
      const li = element('li', null, 'wish-history-item');
      const info = element('div', null, 'wish-history-meta');
      const diffText = settings[(item.difficulty || 2) - 1] || '标准';
      info.append(element('strong', item.title), element('span', diffText + ' · 目标 ' + item.goal, 'mono'));
      const row = element('div', null, 'row wish-history-actions');
      const review = button('回看', () => {
        if (item.idea) prompt.value = item.idea;
        present({
          ...item,
          pitch: item.pitch || item.idea || ('目标：' + item.goal),
          choice: item.choice || '已保存的 AI 原型配置。',
          reason: item.reason || '可随时回看或继续在此基础上微调。',
          nextPrompt: item.nextPrompt || item.idea || '',
        }, '历史原型', false);
      });
      const playBtn = button('试玩', () => playPrototype(item, playBtn), 'primary');
      row.append(review, playBtn);
      li.append(info, row);
      list.append(li);
    }
    historyBox.replaceChildren(element('h4', '最近生成的原型'), list);
  }
  function present(result, badge, example) {
    last = current;
    current = result;
    const entries = [
      ['规则', result.pitch],
      ['设计选择', result.choice],
      ['对玩家的影响', result.reason],
      ['下一轮可以这样问', result.nextPrompt],
    ];
    const info = element('dl', null, 'wish-design');
    for (const [key, detail] of entries) {
      const entry = element('div');
      entry.append(element('dt', key), element('dd', detail));
      info.append(entry);
    }
    const details = element('details', null, 'wish-details');
    details.open = true;
    details.append(element('summary', '规则与设计说明'), info);
    const tools = element('div', null, 'row');
    const usable = button('试玩这一版', () => playPrototype(result, usable), 'primary');
    tools.append(usable, button('把改法填进输入框', () => {
      prompt.value = result.nextPrompt;
      submitLabel = '用这句反馈再做一版';
      renderQuota();
      showEditor(prompt);
    }));
    if (example && result === wishExample) tools.append(button('查看示例第二版', () => {
      prompt.value = wishExample.nextPrompt;
      present(wishRevision, '示例 · 第二版', true);
    }));
    if (last && last !== result) {
      const previous = last;
      const replay = button('回玩上一版', () => playPrototype(previous, replay));
      tools.append(replay);
    }
    output.replaceChildren(element('p', badge, 'mono'), element('h3', result.title), tools,
      element('p', '难度 ' + settings[(result.difficulty || 2) - 1] + ' · 过关目标 ' + result.goal), details);
    results.scrollTop = 0;
    submitLabel = '用这句反馈再做一版';
    renderQuota();
    if (!view.hidden || !results.hidden) showResults();
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (send.disabled) return;
    const idea = prompt.value.trim();
    if (!idea) return;
    const controller = new AbortController();
    cancel = controller;
    renderQuota();
    status.textContent = '正在把你的想法变成玩法…';
    try {
      const response = await fetch('/birthday/wish', {
        method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, original: cleanPrototype(current) }),
      });
      const { quota, ...result } = (await response.json().catch(() => ({}))) || {};
      if (controller.signal.aborted) return;
      if (quota) {
        data.wishQuota = quota;
        renderQuota();
      }
      if (!response.ok || !result.title) {
        status.textContent = result.message || '这一版还没生成，可以打开示例。';
        return;
      }
      const cleanResult = cleanPrototype(result);
      const entry = { ...cleanResult, idea };
      const existing = Array.isArray(save.wishes) ? save.wishes : [];
      save.wishes = [entry, ...existing.filter(item => !(item.title === entry.title && item.idea === entry.idea))].slice(0, 8);
      persist();
      renderHistory();
      present(cleanResult, 'AI 原型', false);
      status.textContent = '这一版已经可以试玩。';
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = '暂时连不上 AI，可以打开示例。';
    } finally {
      if (cancel === controller) cancel = null;
      renderQuota();
    }
  });
  actions.append(send, refreshQuota, examples);
  form.append(label, prompt, actions, status);
  studio.append(element('h3', '一句话，做出第一版'), aiBadge, form, historyBox);
  renderQuota();
  renderHistory();
  view.append(studio);
  results.append(output);
  return {
    stop: () => cancel?.abort(),
    hasResult: () => Boolean(current),
  };
}

function wishes() {
  const panel = chapter('WISH STUDIO', '生日愿望关', '橙子，这一关是你的游戏工作台。你定规则，AI 帮你做出一个能玩的原型。');
  panel.classList.add('wish-chapter');
  const views = immersiveViews(panel);
  const editor = views.add(element('section', null, 'showcase-stage'));
  const results = views.add(element('section', null, 'showcase-stage'));
  const premade = views.add(element('section', null, 'showcase-stage'));
  const cabinet = immersiveCabinet(views);
  const cards = element('div', null, 'showcase game-cards');
  const records = save.wishScores ||= {};
  const continueStory = button('打开船员来信', () => go('crew'), 'primary scene-next');
  const openEditor = button('回愿望工作台', () => showEditor());
  const openResults = button('查看原型', () => showResults());
  const openPremade = button('试玩现成游戏', () => showPremade());
  function showEditor(focus) {
    const controls = studio.hasResult() ? [openResults, openPremade] : [openPremade];
    views.show(editor, [...controls, continueStory], focus);
  }
  function showResults(focus) {
    views.show(results, [openEditor, openPremade, continueStory], focus);
    markActReady(continueStory);
  }
  function showPremade(focus) {
    views.show(premade, [openEditor, continueStory], focus);
  }
  function play(game, onResult, onBack, readyOptions = {}) {
    let completedRound = false;
    setCabinetOpen(true);
    if (game.id === 'fireflies') PartyEffects.focus(true);
    else PartyEffects.pauseSky(true);
    cabinet.open(game, (score, victory) => {
      completedRound = true;
      return onResult(score, victory);
    }, () => {
      PartyEffects.focus(false);
      PartyEffects.pauseSky(false);
      setCabinetOpen(false);
      onBack();
      if (completedRound) markActReady(continueStory, readyOptions);
    });
  }
  const studio = wishStudio(editor, results, showEditor, showResults, (result, opener) => {
    const template = BirthdayWishes.find(game => game.id === result.template);
    if (!template) return;
    play({ ...template, title: result.title, create: finish => template.create(finish, result) },
      () => false, () => showResults(opener));
  });
  for (const game of BirthdayWishes) {
    const card = element('article', null, 'wish-card');
    const best = element('span', '最高分 ' + (records[game.id] || 0), 'arcade-best');
    const open = button('开始挑战', () => {
      play(game, (score, victory) => {
        records[game.id] = Math.max(records[game.id] || 0, score);
        best.textContent = '最高分 ' + records[game.id];
        const wins = save.wishWins ||= [];
        const first = victory && !wins.includes(game.id);
        if (first) { wins.push(game.id); save.stars += 2; celebrate(); }
        persist();
        return first;
      }, () => showPremade(open), save.wishes?.length || studio.hasResult() ? {} : { message: '这局玩得真不错！还有几封信等着你呢。' });
    }, 'primary');
    card.append(element('div', game.icon, 'wish-mark ' + game.id), element('h3', game.title),
      element('p', game.summary), element('p', game.lesson, 'history-lesson'), best, open);
    cards.append(card);
  }
  premade.append(cards);
  showEditor(null);
  if (save.wishes?.length) markActReady(continueStory);
  else if (Object.keys(records).length || save.wishWins?.length) {
    markActReady(continueStory, { message: '玩过一轮啦！还有几封信等着你呢。' });
  }
  stopChapter = () => {
    cabinet.stop();
    setCabinetOpen(false);
    studio.stop();
    PartyEffects.focus(false);
    PartyEffects.pauseSky(false);
  };
}

function familyForm(panel) {
  const form = element('form');
  const label = element('label', '家庭口令');
  label.htmlFor = 'family-code';
  const input = element('input');
  input.type = 'password';
  input.id = 'family-code';
  input.required = true;
  input.autocomplete = 'off';
  const submit = element('button', '查看家庭留言');
  const status = element('p');
  status.setAttribute('role', 'status');
  form.append(label, input, submit, status);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    submit.disabled = true;
    try {
      const response = await fetch('/birthday/family-session', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: input.value }) });
      if (!response.ok) { status.textContent = '家庭口令不正确。'; return; }
      data = await fetchData();
      if (panel.isConnected) show('crew');
    } catch {
      status.textContent = '暂时连不上，可以稍后再试。';
    } finally { submit.disabled = false; }
  });
  panel.append(form);
}

function crew() {
  const panel = chapter('CHARACTER BAY', '全家入队', '船员们各留了一段话。按顺序点开，爸爸最后。');
  panel.classList.add('crew-chapter');
  const views = immersiveViews(panel);
  const crewView = views.add(element('section', null, 'showcase-stage crew-display'));
  const optionsView = views.add();
  const portrait = element('img', null, 'guide-art');
  portrait.alt = '向导小八';
  portrait.src = data.guideArt && /^[\w.-]+\.webp$/.test(data.guideArt)
    ? '/birthday/media/' + encodeURIComponent(data.guideArt)
    : '/birthday/hachi/wave.webp';
  crewView.append(portrait);
  const roster = element('div', null, 'letter-roster showcase');
  const dialog = element('dialog', null, 'letter-dialog');
  dialog.setAttribute('aria-labelledby', 'letter-title');
  let opener;
  let closeTimer;
  function closeLetter() {
    if (!dialog.open || dialog.classList.contains('letter-closing')) return;
    dialog.querySelector('audio, video')?.pause();
    const finish = () => {
      dialog.close();
      dialog.replaceChildren();
      dialog.classList.remove('letter-closing');
      PartyEffects.focus(false);
      if (!opener?.disabled) opener?.focus();
    };
    if (reduceMotion.matches) { finish(); return; }
    dialog.classList.add('letter-closing');
    closeTimer = setTimeout(finish, 290);
  }
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeLetter(); });
  stopChapter = () => {
    clearTimeout(closeTimer);
    dialog.querySelector('audio, video')?.pause();
    if (dialog.open) dialog.close();
  };
  function letter(member) {
    const shell = element('div', null, 'letter-shell');
    const heading = element('h3', member.name + '的来信');
    heading.id = 'letter-title';
    const close = button('收回信封', closeLetter);
    const bar = element('div', null, 'row letter-top');
    bar.append(heading, close);
    const note = element('article', null, 'letter-paper');
    const content = element('div', null, 'letter-content');
    content.tabIndex = 0;
    content.setAttribute('role', 'region');
    content.setAttribute('aria-label', '来信内容');
    content.append(element('p', member.text));
    if (data.privateAccess && typeof member.photo === 'string' && /^[\w.-]+\.(webp|jpg|png)$/.test(member.photo)) {
      const picture = element('img', null, 'letter-photo');
      picture.alt = member.photoAlt || member.name + '的随信照片';
      picture.src = '/birthday/media/' + encodeURIComponent(member.photo);
      content.append(picture);
    }
    if (data.privateAccess && typeof member.media === 'string' && /^[\w.-]+\.(mp3|m4a|mp4)$/.test(member.media)) {
      const player = element(member.media.endsWith('.mp4') ? 'video' : 'audio');
      player.controls = true;
      player.preload = 'none';
      player.src = '/birthday/media/' + encodeURIComponent(member.media);
      content.append(player);
    }
    note.append(bar, content);
    const flap = element('div', null, 'letter-flap');
    flap.setAttribute('aria-hidden', 'true');
    shell.append(note, flap);
    dialog.replaceChildren(shell);
    dialog.showModal();
    PartyEffects.focus(true);
  }
  const outfit = element('div', null, 'row');
  const outfitText = element('span', save.outfit ? '向导装扮 · ' + save.outfit : '给向导换装备，下一幕会戴上');
  for (const choice of ['🎩 魔法帽', '🎧 耳机', '🧢 船员帽']) {
    const control = button(choice, () => {
      save.outfit = choice;
      persist();
      outfitText.textContent = '向导装扮 · ' + choice;
      guideAppearance();
      for (const option of outfit.querySelectorAll('button')) {
        option.setAttribute('aria-pressed', String(option.textContent === choice));
      }
    });
    control.setAttribute('aria-pressed', String(save.outfit === choice));
    outfit.append(control);
  }
  outfit.prepend(outfitText);
  const openShop = button('进入星核商店', () => go('shop'), 'primary scene-next');
  dialog.addEventListener('close', () => {
    if (openShop.isConnected && !openShop.disabled && !dialog.open) markActReady(openShop);
  });
  function rosterState() {
    let nextIndex = data.family.findIndex(member => !save.crew.includes(member.id));
    if (nextIndex < 0) nextIndex = data.family.length;
    [...roster.children].forEach((control, index) => {
      control.disabled = index > nextIndex;
      const hint = control.querySelector('.envelope-hint');
      hint.textContent = control.disabled ? '等前一封打开' : control.classList.contains('has-read') ? '再读一次' : '打开信封';
    });
    openShop.disabled = nextIndex !== data.family.length;
    const shopTab = [...nav.children].find(tab => tab.textContent === chapters.shop);
    shopTab.disabled = openShop.disabled;
  }
  for (const member of data.family) {
    const control = button('', () => {
      opener = control;
      letter(member);
      if (!save.crew.includes(member.id)) save.crew.push(member.id);
      control.classList.add('has-read');
      persist();
      rosterState();
    }, 'envelope');
    control.setAttribute('aria-label', member.name + '来信');
    control.classList.toggle('has-read', save.crew.includes(member.id));
    control.append(element('span', member.name, 'envelope-name'), element('span', '打开信封', 'envelope-hint'));
    roster.append(control);
  }
  crewView.append(roster);
  if (!data.privateAccess) familyForm(optionsView);
  optionsView.append(outfit);
  views.actions.after(dialog);
  const options = button('家庭选项', () => views.show(optionsView, [back, openShop]));
  const back = button('回到来信', () => views.show(crewView, [options, openShop], options));
  views.show(crewView, [options, openShop], null);
  rosterState();
  if (!openShop.disabled) markActReady(openShop);
}

function receipt(item) {
  const dialog = element('dialog', null, 'receipt-dialog');
  const heading = element('h2', item.name);
  heading.id = 'receipt-title';
  dialog.setAttribute('aria-labelledby', heading.id);
  const banner = element('p', '橙子 · 12 岁生日体验券', 'mono');
  const value = save.receipts?.[item.id];
  const redeemedAt = value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(value)) : '';
  const detail = redeemedAt ? '已兑换 · ' + redeemedAt + ' · ' + item.price + ' 星核' : '已兑换 · ' + item.price + ' 星核';
  const close = button('收好', () => dialog.close());
  const download = button('下载兑换券', () => {
    const body = ['橙子 · 12 岁生日体验券', item.name, detail, item.detail, '拿这张券和爸爸约时间。'].join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const link = element('a');
    link.href = url;
    link.download = '橙子生日券-' + item.id + '.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, 'primary');
  const actions = element('div', null, 'row');
  actions.append(download, close);
  dialog.append(banner, heading, element('p', detail), element('p', item.detail),
    element('p', '兑换券保存在这个浏览器里，也可以下载带走。', 'store-note'), actions);
  stage.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.showModal();
}

function shop() {
  const ready = data.family.every(member => save.crew.includes(member.id));
  const panel = chapter('STAR SHOP', '生日体验商店', '用星核兑换你想和家人一起做的事。');
  panel.classList.add('shop-chapter');
  const views = immersiveViews(panel);
  const rewards = views.add(element('section', null, 'showcase-stage'));
  const giftView = views.add(element('section', null, 'showcase-stage gift-display'));
  const cards = element('div', null, 'showcase reward-cards');
  const status = element('p', '', 'shop-status');
  status.setAttribute('role', 'status');
  for (const item of data.copy.shop) {
    const image = element('img', null, 'reward-art');
    image.src = '/birthday/' + item.id + '.webp';
    image.alt = '';
    image.loading = 'lazy';
    const tile = element('article', null, 'tile reward-card');
    const owned = save.purchases.includes(item.id);
    const ticket = button('查看兑换券', () => receipt(item));
    ticket.hidden = !owned;
    const purchase = button(owned ? '已兑换' : '兑换 · ' + item.price + ' 星核', () => {
      if (save.purchases.includes(item.id)) return;
      if (save.stars < item.price) { status.textContent = '星核还不够。首通街机挑战或完成新曲目都能拿星核。'; return; }
      save.stars -= item.price;
      save.purchases.push(item.id);
      (save.receipts ||= {})[item.id] = new Date().toISOString();
      const stored = persist();
      purchase.disabled = true;
      purchase.textContent = '已兑换';
      ticket.hidden = false;
      tile.classList.add('reward-redeemed', 'reward-just-redeemed');
      status.textContent = stored ? '兑换成功。刷新或重播后还可以查看这张券。' : '这次兑换还在当前页面，请打开兑换券下载留存。';
      ticket.focus({ preventScroll: true });
      markActReady(advance);
    });
    purchase.disabled = owned;
    tile.classList.toggle('reward-redeemed', owned);
    const details = element('div', null, 'reward-details');
    const actions = element('div', null, 'row');
    actions.append(purchase, ticket);
    details.append(element('span', item.label, 'mono'), element('h3', item.name), element('p', item.detail), actions);
    tile.append(image, details);
    cards.append(tile);
  }
  const shopTimers = [];
  const gift = element('div', null, 'tile gift-card');
  const reveal = () => {
    gift.replaceChildren(element('p', '已拥有', 'mono'), element('h3', data.copy.gift.name, 'gift'),
      element('p', data.copy.gift.message));
    gift.classList.add('gift-revealed');
    gift.tabIndex = -1;
  };
  if (save.gift && ready) reveal();
  else {
    const unlock = button('打开爸爸的礼物', () => {
      save.gift = true;
      persist();
      reveal();
      gift.classList.add('gift-ceremony');
      gift.focus();
      if (world3d) world3d.triggerGiftBurst();
      else {
        celebrate();
        shopTimers.push(setTimeout(celebrate, 620));
      }
      if (PartyEffects.isMusicEnabled?.()) {
        [72, 76, 79, 83, 86].forEach((note, index) => playNote(note, index * .09, .85));
      }
      PartyEffects.playGiftSfx?.();
      markActReady(advance);
    }, 'primary');
    unlock.disabled = !ready;
    gift.append(element('p', '已拥有', 'mono'), element('h3', '爸爸的礼物'), unlock);
    if (!ready) gift.append(element('p', '先召集全部家庭船员。'));
  }
  rewards.append(cards, status);
  giftView.append(gift);
  const advance = button('走向最后一幕', () => go('finale'), 'primary scene-next');
  const showGift = button('生日礼物', () => {
    views.show(giftView, [back, advance]);
    if (ready && save.gift) markActReady(advance);
  });
  const back = button('回到兑换', () => views.show(rewards, [showGift, advance], showGift));
  views.show(rewards, [showGift, advance], null);
  if ((ready && save.gift) || save.purchases?.length) markActReady(advance);
  stopChapter = () => shopTimers.forEach(clearTimeout);
}

function finale() {
  const panel = chapter('THE END', '生日快乐，橙子', '你的十二岁，从这里开始。');
  panel.classList.add('finale');
  const views = immersiveViews(panel);
  const view = views.add();
  const notes = element('ul', null, 'finale-notes');
  const wishes = data.copy.finale.map(line => ['', line]);
  if (data.privateAccess) {
    for (const member of data.family) {
      if (typeof member.text === 'string' && !member.text.startsWith('【待替换')) wishes.push([member.name, member.text]);
    }
  }
  for (const [from, line] of wishes) {
    const entry = element('li', null, 'finale-note');
    entry.append(element('p', line));
    if (from) entry.append(element('span', from, 'mono'));
    notes.append(entry);
  }
  view.setAttribute('aria-label', '谢幕祝福');
  view.append(notes);
  let stopRoll;
  let tiltTimer;
  function clearTilt(reset = false) {
    clearTimeout(tiltTimer);
    tiltTimer = undefined;
    if (reset) panel.classList.remove('finale-tilted');
  }
  function scheduleTilt() {
    clearTilt();
    if (reduceMotion.matches) return;
    tiltTimer = setTimeout(() => {
      if (!reduceMotion.matches && !stopRoll) panel.classList.add('finale-tilted');
    }, 3000);
  }
  const playback = button('播放祝福', () => {
    if (stopRoll) {
      pause();
      scheduleTilt();
    } else {
      play();
    }
  });
  function pause() {
    stopRoll?.();
    stopRoll = null;
    playback.textContent = '播放祝福';
  }
  function play() {
    clearTilt(true);
    if (view.scrollTop >= view.scrollHeight - view.clientHeight - 1) view.scrollTop = 0;
    playback.textContent = '暂停滚动';
    stopRoll = startTextScroll(view, () => {
      pause();
      scheduleTilt();
      markActReady(again);
    });
  }
  function interact() {
    pause();
    clearTilt(true);
    scheduleTilt();
  }
  const finaleListeners = new AbortController();
  const { signal } = finaleListeners;
  for (const event of ['wheel', 'pointerdown', 'keydown']) view.addEventListener(event, interact, { signal });
  const motion = event => {
    if (event.matches) {
      pause();
      clearTilt(true);
    }
  };
  reduceMotion.addEventListener('change', motion);
  const again = button('重新播放', () => go('intro'), 'primary scene-next');
  views.actions.classList.add('finale-actions');
  views.show(view, [playback, again, button('回看兑换券', () => go('shop'))], null);
  const fits = view.scrollHeight <= view.clientHeight + 2;
  let readyTimer;
  if (fits) {
    scheduleTilt();
    readyTimer = setTimeout(() => markActReady(again), 3000);
  } else if (!reduceMotion.matches) play();
  view.addEventListener('scroll', () => {
    if (!view.isConnected || view.scrollHeight <= 0) return;
    if (!fits && view.scrollTop + view.clientHeight >= view.scrollHeight - 1) markActReady(again);
  }, { signal });
  celebrate();
  const bursts = [setTimeout(celebrate, 950), setTimeout(celebrate, 2100)];
  stopChapter = () => {
    finaleListeners.abort();
    pause();
    clearTilt(true);
    clearTimeout(readyTimer);
    reduceMotion.removeEventListener('change', motion);
    bursts.forEach(timer => clearTimeout(timer));
  };
}

const renderers = { intro, history, arcade, logs, piano, cake, wishes, crew, shop, finale };

async function fetchData() {
  const response = await fetch('/birthday/data', { cache: 'no-store' });
  if (!response.ok) throw Error('data');
  const value = await response.json();
  if (!Array.isArray(value.logs?.entries) || !Array.isArray(value.family)) throw Error('data');
  return value;
}

const creditsPanel = get('#panel');
const creditsViewport = get('#credits');
const creditsToggle = get('#credits-toggle');
let stopCredits;

function startTextScroll(viewport, onEnd) {
  let frame;
  let position = viewport.scrollTop;
  let previous;
  function advance(now) {
    const end = viewport.scrollHeight - viewport.clientHeight;
    position += Math.min(now - (previous ?? now), 50) * .034;
    previous = now;
    viewport.scrollTop = Math.min(end, position);
    if (position < end) frame = requestAnimationFrame(advance);
    else onEnd();
  }
  frame = requestAnimationFrame(advance);
  return () => cancelAnimationFrame(frame);
}

function pauseCredits() {
  stopCredits?.();
  stopCredits = null;
  creditsToggle.textContent = '播放字幕';
}

function playCredits() {
  pauseCredits();
  creditsToggle.textContent = '暂停字幕';
  stopCredits = startTextScroll(creditsViewport, pauseCredits);
}

function replayCredits() {
  creditsViewport.scrollTop = 0;
  playCredits();
}

function systems() {
  if (!data || creditsPanel.open) return;
  const { credits, creditsReleases, creditsThanks } = data.copy;
  const reel = element('div', null, 'credits-reel');
  const opening = element('section', null, 'credits-opening');
  opening.append(element('p', '生日特别场'), element('h3', '橙子的十二岁'),
    element('p', '版本 ' + creditsReleases[0].version, 'mono'));
  reel.append(opening);
  const versions = element('section');
  versions.append(element('h3', '版本记录'));
  for (const release of creditsReleases) {
    const entry = element('article', null, 'credits-release');
    const date = element('time', release.date);
    date.dateTime = release.date;
    const changes = element('ul');
    for (const change of release.changes) changes.append(element('li', change));
    entry.append(element('h4', release.version + ' · ' + release.title), date, changes);
    versions.append(entry);
  }
  reel.append(versions);
  const thanks = element('section');
  thanks.append(element('h3', '特别致谢'));
  const people = element('dl', null, 'credits-names');
  for (const [name, message] of creditsThanks) {
    const item = element('div');
    item.append(element('dt', name), element('dd', message));
    people.append(item);
  }
  const production = element('dl', null, 'credits-names');
  for (const [label, value] of Object.entries(credits)) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim() || /^【待/.test(value))) continue;
    const item = element('div');
    item.append(element('dt', label), element('dd', value));
    production.append(item);
  }
  thanks.append(people, element('h3', '制作名单'), production);
  reel.append(thanks, element('p', '生日快乐，橙子。', 'credits-end'));
  creditsViewport.replaceChildren(reel);
  creditsPanel.showModal();
  creditsViewport.scrollTop = 0;
  if (reduceMotion.matches) pauseCredits();
  else playCredits();
}

get('#systems').addEventListener('click', systems);
creditsPanel.addEventListener('close', pauseCredits);
creditsToggle.addEventListener('click', () => {
  if (stopCredits) pauseCredits();
  else if (creditsViewport.scrollTop >= creditsViewport.scrollHeight - creditsViewport.clientHeight - 1) replayCredits();
  else playCredits();
});
get('#credits-replay').addEventListener('click', replayCredits);
for (const event of ['wheel', 'pointerdown', 'keydown']) creditsViewport.addEventListener(event, pauseCredits);
reduceMotion.addEventListener('change', event => { if (event.matches) pauseCredits(); });

fetchData().then(value => {
  data = value;
  show(save.chapter);
  get('#loading').hidden = true;
  startWorld();
}).catch(() => {
  const status = get('#loading');
  status.textContent = '存档暂时读不到。';
  status.after(button('重新加载', () => location.reload()));
});
