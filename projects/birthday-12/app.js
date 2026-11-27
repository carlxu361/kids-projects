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
      stage.querySelector('.chapter')?.classList.add('copy-entrance');
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
function guideAppearance() {
  const looks = { '🎩 魔法帽': '🎩', '🎧 耳机': '🎧', '🧢 船员帽': '🧢' };
  const look = looks[save.outfit];
  for (const avatar of [get('#guide-look'), get('#scene-avatar')]) {
    avatar.replaceChildren(element('span', '🍊', 'guide-orange'));
    if (look) avatar.append(element('span', look, 'guide-accessory'));
  }
}

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

function go(key) {
  if (cinemaState === 'travelling') {
    world3d?.accelerate();
    return;
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
  if (world3d) {
    cinemaState = 'reading';
    world3d.preview(save.chapter, key);
  }
  sceneTarget = key;
  document.body.classList.add('guide-active');
  guide.classList.toggle('scene-premiere', Boolean(stage.querySelector('.premiere.party-live')));
  guide.classList.toggle('scene-history', key === 'history');
  const idx = Object.keys(chapters).indexOf(key) + 1;
  const card = guide.querySelector('.scene-card');
  if (card) {
    if (idx > 0) card.dataset.act = 'ACT ' + String(idx).padStart(2, '0');
    else delete card.dataset.act;
  }
  guideAppearance();
  get('#scene-title').textContent = cue[0];
  get('#scene-narration').textContent = cue[1];
  get('#scene-continue').textContent = cue[2];
  guide.showModal();
  get('#scene-continue').focus();
}

function finishGuide() {
  if (!sceneTarget) return;
  const key = sceneTarget;
  sceneTarget = null;
  const turn = () => {
    guide.close();
    guide.classList.remove('scene-leaving', 'scene-premiere', 'scene-history');
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
guide.addEventListener('cancel', event => { event.preventDefault(); finishGuide(); });

function show(key, animate = false) {
  if (!Object.hasOwn(renderers, key)) key = 'intro';
  clearTimeout(sceneTimer);
  stopChapter();
  stopChapter = () => {};
  save.chapter = key;
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

function timeline(eras, view) {
  const section = element('section', null, 'history');
  const rail = element('div', null, 'history-rail reading-controls');
  rail.setAttribute('role', 'group');
  rail.setAttribute('aria-label', '年代');
  const exhibit = element('div', null, 'history-exhibit');
  exhibit.id = 'history-exhibit';
  const machines = element('div', null, 'history-machines showcase');
  function select(era) {
    [...rail.children].forEach(tab => tab.setAttribute('aria-expanded', String(tab.textContent === era.era)));
    const cards = [];
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
      cards.push(machine);
    }
    const banner = element('div', null, 'era-banner');
    const story = element('div', null, 'era-story');
    const details = element('details', null, 'era-summary');
    details.append(element('summary', '年代导览'), element('p', era.summary));
    story.append(element('h4', era.title), details);
    banner.append(element('strong', era.era), story);
    exhibit.replaceChildren(banner, machines);
    machines.replaceChildren(...cards);
    view.scrollTop = 0;
    exhibit.classList.remove('history-in');
    requestAnimationFrame(() => exhibit.classList.add('history-in'));
  }
  for (const era of eras) {
    const control = button(era.era, () => select(era));
    control.setAttribute('aria-controls', exhibit.id);
    rail.append(control);
  }
  section.append(exhibit);
  if (eras[0]) select(eras[0]);
  view.append(section);
  return rail;
}

function history() {
  const panel = chapter('GAME HISTORY', '游戏是怎样走到今天的');
  panel.classList.add('history-chapter');
  const views = immersiveViews(panel);
  const view = views.add(element('section', null, 'showcase-stage'));
  view.before(timeline(data.history, view));
  views.show(view, [], null);
  next(views.actions, 'arcade', '试玩一下经典游戏');
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
      PartyEffects.pauseSky(true);
      setCabinetOpen(true);
      cabinet.open(game, (score, victory) => {
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
    tile.append(element('h3', title), element('p', prompt), launch);
    classics.append(tile);
  }
  classicsView.append(classics);
  showLocal(null);
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

  function addCategory(label, view, extra = []) {
    const control = button(label, () => {
      for (const tab of categories.children) tab.setAttribute('aria-pressed', String(tab === control));
      views.show(view, [...extra, continueStory], null);
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
    addCategory('作品档案', archiveView);
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
  addCategory(entries.length ? '对话回忆' : '寄语', memoryView);
  categories.firstElementChild.click();
}

const whiteKeys = { a: 60, s: 62, d: 64, f: 65, g: 67, h: 69, j: 71, k: 72, l: 74, ';': 76 };
const blackKeys = { w: 61, e: 63, t: 66, y: 68, u: 70, o: 73, p: 75 };
const pianoKeys = { ...whiteKeys, ...blackKeys };

function piano() {
  const birthday = {
    name: '生日快乐', tempo: 64, meter: 3, description: '入门 · 右手旋律，后半段加入低音',
    right: [
      [[2,"G4",.5],[2.5,"G4",.5]], [[0,"A4",1],[1,"G4",1],[2,"C5",1]],
      [[0,"B4",2],[2,"G4",.5],[2.5,"G4",.5]], [[0,"A4",1],[1,"G4",1],[2,"D5",1]],
      [[0,"C5",2],[2,"G4",.5],[2.5,"G4",.5]], [[0,"G5",1],[1,"E5",1],[2,"C5",1]],
      [[0,"B4",1],[1,"A4",1],[2,"F5",.5],[2.5,"F5",.5]], [[0,"E5",1],[1,"C5",1],[2,"D5",1]],
      [[0,"C5",2.8]]
    ],
    left: [[], [], [], [], [], [[0,"C3",2.6]], [[0,"F3",2.6]], [[0,"G3",2.6]], [[0,"C3",2.8]]]
  };
  function arrange(song, description = song.description) {
    const meter = song.meter || 4;
    const events = ['left', 'right'].flatMap(hand => song[hand].flatMap((bar, i) =>
      bar.flatMap(([offset, chord, length, velocity = hand === 'left' ? .58 : .79]) =>
        [chord].flat().map(note => ({note: midiFor(note), at: i * meter + offset, length, velocity, hand})))));
    return {title: song.name, bpm: song.tempo, meter, description, events, duration: song.right.length * meter};
  }
  const tracks = [
    arrange(birthday),
    arrange(repertoire.moon, '初级 · 左手分解和弦，右手连奏'),
    arrange(repertoire.engine, '进阶 · 双手切分与和弦'),
    arrange(repertoire.chase, '挑战 · 半音跑动与密集错位')
  ];
  const encores = data.songs.map(song => {
    const phrases = song.phrases || [{notes: song.notes, beats: song.notes.map(() => 1)}];
    let at = 0;
    const events = phrases.flatMap(phrase => phrase.notes.map((note, index) => {
      const beats = phrase.beats[index];
      const event = {note, at, length: beats * .89, velocity: index % 4 ? .67 : .86, hand: 'right'};
      at += beats;
      return event;
    }));
    return {...song, meter: 4, description: '加演 · 单手旋律', events, duration: at};
  });
  const completed = new Set(Array.isArray(save.pianoLevels) ? save.pianoLevels : []);
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
  tracks.forEach((song, index) => {
    const option = element('option', (index + 1) + ' · ' + song.title);
    option.value = String(index);
    picker.append(option);
  });
  if (encores.length) {
    const extras = element('optgroup');
    extras.label = '加演 · 原生日曲目';
    encores.forEach((song, index) => {
      const option = element('option', song.title + (song.draft ? ' · 样谱' : ''));
      option.value = 'extra-' + index;
      extras.append(option);
    });
    picker.append(extras);
  }
  const status = element('p', null, 'piano-status');
  const source = element('a', '曲谱来源', 'piano-source');
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  status.setAttribute('role', 'status');
  const sequence = element('div', null, 'note-queue');
  const rain = element('div', null, 'note-rain');
  const phrases = element('div', null, 'phrase-meter');
  phrases.setAttribute('aria-label', '乐句进度');
  const stand = element('div', null, 'piano-stand');
  const scoreHeader = element('div', null, 'score-header');
  const detail = element('span', '', 'score-detail');
  let demo = null;
  const preview = button('▶ 试听本曲', () => {
    if (demo) { stopPreview(); return; }
    const song = selectedSong();
    if (song) playDemo(song);
  });
  async function playDemo(song) {
    stopMic();
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
      if (now > song.duration + .8) { stopPreview(); return; }
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
  let octaveShift = 0;
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
  const isEncore = () => picker.value.startsWith('extra-');
  const selectedSong = () => isEncore() ? encores[Number(picker.value.slice(6))] : picker.value !== '' ? tracks[Number(picker.value)] : null;
  const selectedEvents = song => song.events.filter(event => hands.value === 'both' || event.hand === hands.value);
  function prepareSong(resetSpeed) {
    const song = selectedSong();
    const wasEncore = hands.options[0].disabled;
    hands.options[0].disabled = hands.options[2].disabled = isEncore();
    if (isEncore()) hands.value = 'right';
    else if (wasEncore) hands.value = 'both';
    const byBeat = new Map();
    for (const event of song ? selectedEvents(song) : []) {
      if (!byBeat.has(event.at)) byBeat.set(event.at, []);
      byBeat.get(event.at).push(event);
    }
    groups = [...byBeat.values()].sort((a, b) => a[0].at - b[0].at);
    position = 0;
    playedNotes.clear();
    if (resetSpeed) setSpeed(song?.bpm ?? 72);
    refresh();
  }
  const expectedEvents = () => groups[position]?.filter(event => !playedNotes.has(event.note)) || [];
  function targetVisible(note) {
    const key = controls.get(note);
    if (!key) return;
    const area = keyboardWindow.getBoundingClientRect();
    const rect = key.getBoundingClientRect();
    if (rect.left < area.left || rect.right > area.right) {
      keyboardWindow.scrollLeft = key.offsetLeft + key.offsetWidth / 2 - area.width / 2;
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
    const song = selectedSong();
    const expected = expectedEvents();
    for (const [note, key] of controls) {
      key.classList.toggle('next-note', expected.some(event => event.note === note && event.hand === 'right'));
      key.classList.toggle('next-left', expected.some(event => event.note === note && event.hand === 'left'));
    }
    micButton.disabled = !song;
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
    sequence.replaceChildren(...expected.map(({note, hand}) =>
      element('kbd', nameFor(note).replace('#', '♯'), hand === 'left' ? 'queued-left' : 'queued-current')));
    if (!demo) {
      const origin = groups[position]?.[0].at;
      const upcoming = groups.slice(position).flatMap((group, index) => index ? group : expected);
      drawRoll(upcoming.filter(event => event.at - origin <= 4)
        .map(event => ({...event, when: (event.at - origin) / 4})));
      if (expected.length) targetVisible(expected.find(event => event.hand === 'right')?.note ?? expected[0].note);
    }
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
    flash(judged, expected.find(event => event.note === judged)?.hand);
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
    if (!song || transitioning || !expected.length) return;
    if (!expected.some(event => event.note === judged)) {
      refresh(fromMic ? '听到 ' + nameFor(note) + ' · 请弹亮起的音' : '跟着亮起的键继续。');
      return;
    }
    playedNotes.add(note);
    if (expectedEvents().length) { refresh(); return; }
    playedNotes.clear();
    position++;
    if (position < groups.length) { refresh(); return; }
    if (isEncore()) { refresh(song.title + ' · 加演完成'); return; }
    const index = Number(picker.value);
    if (!completed.has(index)) {
      completed.add(index);
      save.pianoLevels = [...completed];
      if (!save.songs.includes(index)) {
        save.songs.push(index);
        save.stars += 3;
      }
      persist();
    }
    transitioning = true;
    const following = tracks[index + 1];
    refresh(song.title + ' 完成 · ' + (following ? '下一首 ' + following.title : '前往切蛋糕'));
    advance = setTimeout(() => {
      if (!following) { go('cake'); return; }
      picker.value = String(index + 1);
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
    const labels = new Map(Object.entries(pianoKeys).map(([letter, note]) => [note + octaveShift, letter.toUpperCase()]));
    for (const [note, key] of controls) {
      const label = nameFor(note).replace('#', '♯');
      const letter = labels.get(note);
      key.setAttribute('aria-label', label + (letter ? ' ' + letter : ''));
      key.querySelector('kbd').textContent = letter ?? '';
    }
  }
  let white = 0;
  for (let note = 36; note <= 84; note++) {
    const label = nameFor(note).replace('#', '♯');
    const black = label.includes('♯');
    const key = button('', () => noteOn(note), black ? 'concert-key black-key' : 'concert-key white-key');
    key.append(element('span', label), element('kbd'));
    if (black) key.style.setProperty('--after', white);
    else white++;
    controls.set(note, key);
    keyboard.append(key);
  }
  updateKeyLabels();
  keyboardWindow.tabIndex = 0;
  keyboardWindow.setAttribute('role', 'group');
  keyboardWindow.setAttribute('aria-label', '网页琴键');
  keyboardWindow.setAttribute('aria-describedby', 'piano-keyboard-help');
  keyboardWindow.addEventListener('keydown', event => {
    if (event.repeat || event.isComposing || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.code === 'BracketLeft' || event.code === 'BracketRight') {
      event.preventDefault();
      octaveShift = Math.max(-24, Math.min(12, octaveShift + (event.code === 'BracketLeft' ? -12 : 12)));
      updateKeyLabels();
      targetVisible(65 + octaveShift);
      return;
    }
    const note = pianoKeys[event.key.toLowerCase()] + octaveShift;
    if (controls.has(note)) { event.preventDefault(); noteOn(note); }
  }, { signal });
  window.addEventListener('pagehide', () => { stopMic(); stopPreview(); stopMetronome(); sampler.silence(); }, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMic(); }, { signal });
  const resize = new ResizeObserver(() => { if (!demo) refresh(status.textContent); });
  resize.observe(keyboard);
  stopChapter = () => {
    listeners.abort();
    active = false;
    clearTimeout(advance);
    resize.disconnect();
    stopMetronome();
    stopPreview();
    stopMic();
    sampler.silence();
    for (const timer of flashes.values()) clearTimeout(timer);
  };
  stopChapter.suspend = () => {
    clearTimeout(advance);
    stopMetronome();
    stopPreview();
    stopMic();
  };
  picker.addEventListener('change', () => {
    clearTimeout(advance);
    stopPreview();
    if (picker.value === '') stopMic();
    transitioning = false;
    prepareSong(true);
  });
  hands.addEventListener('change', () => {
    clearTimeout(advance);
    transitioning = false;
    stopPreview();
    prepareSong(false);
  });
  const first = tracks.findIndex((_, index) => !completed.has(index));
  picker.value = String(Math.max(first, 0));
  top.append(heading, candles);
  const transport = element('div', null, 'birthday-piano-transport');
  transport.append(picker, hands, preview, micButton);
  scoreHeader.append(status, detail, legend);
  stand.append(scoreHeader, phrases, progress, sequence);
  keyboardWindow.append(instrument);
  instrument.append(roll, rain, keyboard);
  const fallback = element('div', null, 'birthday-piano-footer');
  const keyboardHelp = element('span', '点击或触摸琴键。键盘演奏时先用 Tab 聚焦琴键区，再按标注键位，[ 和 ] 换八度。');
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
  next(actions, 'cake', '去吹蜡烛');
  const pianoMain = element('div', null, 'piano-play-area');
  pianoMain.append(stand, keyboardWindow);
  const pianoControls = element('div', null, 'piano-control-panel');
  pianoControls.append(transport, micStatus);
  const workspace = element('div', null, 'piano-workspace');
  workspace.append(pianoControls, pianoMain);
  panel.append(top, workspace, actions, settings);
  prepareSong(true);
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
  let current;
  let last;
  let cancel;
  const examples = button('打开示例', () => {
    if (!prompt.value.trim()) prompt.value = '做一个要躲暗礁、收集星核的太空运输游戏。';
    present(wishExample, '示例 · 第一版', true);
    status.textContent = '先试玩第一版，再查看放慢速度后的区别。';
  });
  function present(result, badge, example) {
    last = current;
    current = result;
    const settings = ['轻松', '标准', '进阶'];
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
    details.append(element('summary', '规则与设计说明'), info);
    const tools = element('div', null, 'row');
    const usable = button('试玩这一版', () => playPrototype(result, usable), 'primary');
    tools.append(usable, button('把改法填进输入框', () => {
      prompt.value = result.nextPrompt;
      send.textContent = '用这句反馈再做一版';
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
      element('p', '难度 ' + settings[result.difficulty - 1] + ' · 过关目标 ' + result.goal), details);
    results.scrollTop = 0;
    send.textContent = '用这句反馈再做一版';
    if (!view.hidden || !results.hidden) showResults();
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (cancel) return;
    const idea = prompt.value.trim();
    if (!idea) return;
    cancel = new AbortController();
    send.disabled = true;
    examples.disabled = true;
    status.textContent = '正在把你的想法变成玩法…';
    try {
      const response = await fetch('/birthday/wish', {
        method: 'POST', signal: cancel.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, original: current || null }),
      });
      const result = await response.json();
      if (cancel.signal.aborted) return;
      if (!response.ok) { status.textContent = result.message || '这一版还没生成，可以打开示例。'; return; }
      present(result, 'AI 原型', false);
      status.textContent = '这一版已经可以试玩。';
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = '暂时连不上 AI，可以打开示例。';
    } finally {
      cancel = null;
      send.disabled = false;
      examples.disabled = false;
    }
  });
  actions.append(send, examples);
  form.append(label, prompt, actions, status);
  studio.append(element('h3', '一句话，做出第一版'), form);
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
  }
  function showPremade(focus) {
    views.show(premade, [openEditor, continueStory], focus);
  }
  function play(game, onResult, onBack) {
    setCabinetOpen(true);
    if (game.id === 'fireflies') PartyEffects.focus(true);
    else PartyEffects.pauseSky(true);
    cabinet.open(game, onResult, () => {
      PartyEffects.focus(false);
      PartyEffects.pauseSky(false);
      setCabinetOpen(false);
      onBack();
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
      }, () => showPremade(open));
    }, 'primary');
    card.append(element('div', game.icon, 'wish-mark ' + game.id), element('h3', game.title),
      element('p', game.summary), element('p', game.lesson, 'history-lesson'), best, open);
    cards.append(card);
  }
  premade.append(cards);
  showEditor(null);
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
  if (data.guideArt && /^[\w.-]+\.webp$/.test(data.guideArt)) {
    const guide = element('img', null, 'guide-art');
    guide.alt = '生日向导';
    guide.src = '/birthday/media/' + encodeURIComponent(data.guideArt);
    crewView.append(guide);
  }
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
  const openShop = button('进入星核商店', () => go('shop'), 'primary');
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
    }, 'primary');
    unlock.disabled = !ready;
    gift.append(element('p', '已拥有', 'mono'), element('h3', '爸爸的礼物'), unlock);
    if (!ready) gift.append(element('p', '先召集全部家庭船员。'));
  }
  rewards.append(cards, status);
  giftView.append(gift);
  const advance = button('走向最后一幕', () => go('finale'), 'primary scene-next');
  const showGift = button('生日礼物', () => views.show(giftView, [back, advance]));
  const back = button('回到兑换', () => views.show(rewards, [showGift, advance], showGift));
  views.show(rewards, [showGift, advance], null);
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
    });
  }
  function interact() {
    pause();
    clearTilt(true);
    scheduleTilt();
  }
  for (const event of ['wheel', 'pointerdown', 'keydown']) view.addEventListener(event, interact);
  const motion = event => {
    if (event.matches) {
      pause();
      clearTilt(true);
    }
  };
  reduceMotion.addEventListener('change', motion);
  const again = button('重新播放', () => go('intro'), 'primary');
  views.actions.classList.add('finale-actions');
  views.show(view, [playback, again, button('回看兑换券', () => go('shop'))], null);
  if (!reduceMotion.matches) play();
  if (view.scrollHeight <= view.clientHeight + 2) scheduleTilt();
  celebrate();
  const bursts = [setTimeout(celebrate, 950), setTimeout(celebrate, 2100)];
  stopChapter = () => {
    pause();
    clearTilt(true);
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
