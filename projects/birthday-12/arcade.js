const BirthdayArcade = (() => {
  const games = [
    {
      id: 'ricochet', title: '轨道弹射', history: '1972 · Pong', source: 'https://www.museumofplay.org/games/pong/',
      summary: '用反弹角度穿过靶门。三次失误之前，拿下八个信标。',
      lesson: '看球打在拍子的哪一侧。一个碰撞规则，就能让每次回球都变成一次决定。',
      controls: [['←', 'ArrowLeft'], ['→', 'ArrowRight']], create: ricochet,
    },
    {
      id: 'orbit-defense', title: '橙星防线', history: '1978 · Space Invaders', source: 'https://www.museumofplay.org/games/space-invaders/',
      summary: '拦下三波来袭机群，保住橙星。飞船的脉冲炮每次充能后才能再发。',
      lesson: '街机高分榜让玩家愿意再投一次币。试试优先拦截最靠近基地的目标。',
      controls: [['←', 'ArrowLeft'], ['→', 'ArrowRight'], ['发射', ' ']], create: defense,
    },
    {
      id: 'circuit', title: '矩阵接线', history: '1984 · Tetris', source: 'https://www.museumofplay.org/blog/the-first-class-of-the-world-video-game-hall-of-fame/',
      summary: '旋转、移动并放下电路模块。在 18 块以内接通至少 5 条线路。',
      lesson: '消除一行很简单，难的是给下一块留出位置。落下前可以看预告。',
      controls: [['←', 'ArrowLeft'], ['→', 'ArrowRight'], ['↑', 'ArrowUp'], ['↓', 'ArrowDown'], ['旋转', 'r'], ['放置', ' ']], create: circuit,
    },
  ];
  const W = 640;
  const H = 360;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const block = (ctx, x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  function circle(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  function label(ctx, text, x, y, color = '#fff2e2', size = 16) {
    ctx.fillStyle = color;
    ctx.font = size + 'px ui-monospace, monospace';
    ctx.fillText(text, x, y);
  }

  function mount(host, config, onResult, onBack) {
    const root = document.createElement('section');
    root.className = 'cabinet';
    const header = document.createElement('div');
    header.className = 'cabinet-header';
    const name = document.createElement('h3');
    name.textContent = config.title;
    const reset = document.createElement('button');
    reset.textContent = '重新开局';
    header.append(name);
    const panel = document.createElement('aside');
    panel.className = 'cabinet-panel';
    panel.setAttribute('aria-label', '游戏操作');
    const actions = document.createElement('div');
    actions.className = 'cabinet-actions';
    const back = document.createElement('button');
    back.textContent = '返回';
    reset.className = 'cabinet-restart';
    actions.append(reset, back);
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', config.title + '游戏屏幕');
    const hint = document.createElement('p');
    hint.className = 'cabinet-hint';
    const feedback = document.createElement('p');
    feedback.className = 'cabinet-result';
    feedback.setAttribute('role', 'status');
    const controls = document.createElement('div');
    controls.className = 'game-controls';
    const controlKeys = config.controls.map(([, key]) => key);
    controls.dataset.layout = controlKeys.length === 2 && controlKeys.includes('ArrowLeft') && controlKeys.includes('ArrowRight')
      ? 'lr'
      : controlKeys.length === 3 && controlKeys.includes('ArrowLeft') && controlKeys.includes('ArrowRight') && controlKeys.includes(' ')
        ? 'lr-fire'
        : controlKeys.includes('ArrowUp') && controlKeys.includes('ArrowDown')
          ? 'dpad-actions'
          : 'lanes';
    const screen = document.createElement('div');
    screen.className = 'cabinet-screen';
    screen.append(canvas);
    panel.append(header, hint, controls, feedback, actions);
    root.append(screen, panel);
    host.append(root);

    const ctx = canvas.getContext('2d');
    const held = new Set();
    const activePointers = new Map();
    const activeKeyboard = new Set();
    const controlButtons = new Map();
    const listeners = new AbortController();
    const { signal } = listeners;
    let active = true;
    let animation = 0;
    let previous = 0;
    let game;

    function syncKey(key) {
      const down = active && (activeKeyboard.has(key) || (activePointers.get(key)?.size || 0) > 0);
      if (down && !held.has(key)) {
        held.add(key);
        game.press?.(key);
      } else if (!down && held.has(key)) {
        held.delete(key);
      }
      const stillDown = active && held.has(key);
      controlButtons.get(key)?.classList.toggle('is-pressed', stillDown);
    }

    function releaseAll() {
      activePointers.clear();
      activeKeyboard.clear();
      held.clear();
      for (const btn of controlButtons.values()) btn.classList.remove('is-pressed');
    }

    function finish(points, victory) {
      active = false;
      releaseAll();
      const prize = onResult(points, victory);
      feedback.textContent = (victory ? '挑战完成' : '本局结束') + ' · ' + points + ' 分' +
        (prize ? ' · 首通获得 2 星核' : '');
    }

    function paint() {
      ctx.clearRect(0, 0, W, H);
      game.draw(ctx);
    }

    const resolution = new ResizeObserver(([entry]) => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(entry.contentRect.width * ratio));
      const height = Math.max(1, Math.round(entry.contentRect.height * ratio));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
      if (game) paint();
    });

    function draw(time) {
      const delta = previous ? Math.min(.035, (time - previous) / 1000) : 0;
      previous = time;
      if (active) game.update(delta, held);
      paint();
      if (active) animation = requestAnimationFrame(draw);
    }

    function restart() {
      cancelAnimationFrame(animation);
      releaseAll();
      active = true;
      previous = 0;
      game = config.create(finish);
      hint.textContent = game.hint;
      feedback.textContent = '';
      canvas.focus({ preventScroll: true });
      animation = requestAnimationFrame(draw);
    }

    const keys = new Set(controlKeys);
    root.addEventListener('keydown', event => {
      const key = event.key.toLowerCase().startsWith('arrow') ? event.key : event.key.toLowerCase();
      if (!keys.has(key) || (event.target !== canvas && key === ' ')) return;
      event.preventDefault();
      if (!active) return;
      activeKeyboard.add(key);
      syncKey(key);
    }, { signal });
    document.addEventListener('keyup', event => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (!activeKeyboard.delete(key)) return;
      syncKey(key);
    }, { signal });
    window.addEventListener('blur', releaseAll, { signal });
    root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) releaseAll(); }, { signal });
    const padMeta = {
      ArrowLeft: ['pad-left', '向左'],
      ArrowRight: ['pad-right', '向右'],
      ArrowUp: ['pad-up', '向上'],
      ArrowDown: ['pad-down', '向下'],
      ' ': ['pad-primary', null],
      r: ['pad-secondary', null],
    };
    for (const [caption, key] of config.controls) {
      const control = document.createElement('button');
      control.type = 'button';
      const [semantic, aria] = padMeta[key] || ['pad-lane', caption];
      control.className = 'pad-btn ' + semantic;
      control.dataset.key = key;
      control.setAttribute('aria-label', aria || caption);
      const glyph = document.createElement('span');
      glyph.className = 'pad-glyph';
      glyph.textContent = caption;
      control.append(glyph);
      controlButtons.set(key, control);
      control.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        if (!active) return;
        try { control.setPointerCapture(event.pointerId); } catch {}
        let pointers = activePointers.get(key);
        if (!pointers) {
          pointers = new Set();
          activePointers.set(key, pointers);
        }
        pointers.add(event.pointerId);
        syncKey(key);
      }, { signal });
      const releasePointer = event => {
        const pointers = activePointers.get(key);
        if (!pointers || !pointers.delete(event.pointerId)) return;
        if (!pointers.size) activePointers.delete(key);
        syncKey(key);
      };
      control.addEventListener('pointerup', releasePointer, { signal });
      control.addEventListener('pointercancel', releasePointer, { signal });
      control.addEventListener('lostpointercapture', releasePointer, { signal });
      control.addEventListener('contextmenu', event => event.preventDefault(), { signal });
      control.addEventListener('click', event => {
        if (event.detail !== 0 || !active) return;
        game.press?.(key);
        control.classList.add('is-pressed');
        setTimeout(() => {
          if (!held.has(key)) control.classList.remove('is-pressed');
        }, 120);
      }, { signal });
      controls.append(control);
    }
    const aim = event => {
      if (event.pointerType !== 'mouse' && !event.buttons) return;
      const bounds = canvas.getBoundingClientRect();
      game.aim?.(clamp((event.clientX - bounds.left) / bounds.width * W, 0, W));
    };
    canvas.addEventListener('pointerdown', aim, { signal });
    canvas.addEventListener('pointermove', aim, { signal });
    reset.addEventListener('click', restart, { signal });
    back.addEventListener('click', onBack, { signal });
    restart();
    resolution.observe(canvas);
    return () => {
      resolution.disconnect();
      listeners.abort();
      cancelAnimationFrame(animation);
      releaseAll();
    };
  }

  function ricochet(end) {
    const paddleWidth = 106;
    let paddle = W / 2;
    let points = 0;
    let lives = 3;
    let time = 0;
    let ball;
    let trail = [];
    function serve() {
      ball = { x: paddle, y: 290, vx: lives % 2 ? 47 : -47, vy: -236 };
      trail = [];
    }
    serve();
    return {
      hint: '← → 或拖动画面控制球拍。球拍边缘能打出更斜的球。',
      aim: x => { paddle = clamp(x, paddleWidth / 2, W - paddleWidth / 2); },
      update(dt, keys) {
        time += dt;
        paddle = clamp(paddle + (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))) * 460 * dt,
          paddleWidth / 2, W - paddleWidth / 2);
        const gate = 320 + Math.sin(time * 1.35) * (110 + points * 10);
        const previousY = ball.y;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (trail.length === 8) trail.shift();
        trail.push({ x: ball.x, y: ball.y });
        if (ball.x < 10 || ball.x > W - 10) {
          ball.x = clamp(ball.x, 10, W - 10);
          ball.vx *= -1;
        }
        if (ball.y <= 47 && ball.vy < 0) {
          if (Math.abs(ball.x - gate) <= 72) {
            points++;
            if (points === 8) return end(points * 100, true);
          }
          ball.vy = 236 + points * 28;
          ball.y = 47;
        }
        if (ball.vy > 0 && previousY < 307 && ball.y >= 307 && Math.abs(ball.x - paddle) <= paddleWidth / 2 + 7) {
          ball.y = 306;
          ball.vy = -(236 + points * 28);
          ball.vx = clamp((ball.x - paddle) / (paddleWidth / 2), -1, 1) * (300 + points * 18);
        }
        if (ball.y > H + 10) {
          if (--lives === 0) return end(points * 100, false);
          serve();
        }
      },
      draw(ctx) {
        block(ctx, 0, 0, W, H, '#181026');
        for (let x = 0; x < W; x += 32) block(ctx, x, 48, 1, H - 48, '#3a254b');
        for (let y = 48; y < H; y += 32) block(ctx, 0, y, W, 1, '#3a254b');
        const gate = 320 + Math.sin(time * 1.35) * (110 + points * 10);
        block(ctx, gate - 72, 42, 144, 7, '#ff8f78');
        label(ctx, '信标 ' + points + '/8', 18, 27);
        label(ctx, '剩余 ' + lives, W - 96, 27);
        trail.forEach((point, i) => circle(ctx, point.x, point.y, 3 + i * .5, 'rgba(255,156,108,' + (i / 16) + ')'));
        circle(ctx, ball.x, ball.y, 8, '#fff1bd');
        block(ctx, paddle - paddleWidth / 2, 315, paddleWidth, 9, '#ffc364');
        block(ctx, paddle - 15, 318, 30, 3, '#fff1bd');
      },
    };
  }

  function defense(end) {
    let x = W / 2;
    let time = 0;
    let wave = 1;
    let health = 5;
    let score = 0;
    let nextSpawn = .4;
    let cooldown = 0;
    let remaining = 8;
    let lastSpawn = -1;
    const shots = [];
    const enemies = [];
    function fire() {
      if (cooldown > 0) return;
      shots.push({ x, y: 307 });
      cooldown = .25;
    }
    return {
      hint: '← → 移动，按住空格发射脉冲。越过防线的来袭机将伤到基地。',
      aim: target => { x = clamp(target, 20, W - 20); },
      press: key => { if (key === ' ') fire(); },
      update(dt, keys) {
        time += dt;
        x = clamp(x + (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))) * 360 * dt, 20, W - 20);
        cooldown -= dt;
        if (keys.has(' ')) fire();
        if (remaining > 0 && time >= nextSpawn) {
          const lanes = [90, 205, 320, 435, 550];
          const lane = lastSpawn < 0 ? 2 : (lastSpawn + 1 + Math.floor(Math.random() * 4)) % lanes.length;
          lastSpawn = lane;
          enemies.push({ lane: lanes[lane], x: lanes[lane], y: 44, phase: time * 2 });
          remaining--;
          nextSpawn = time + 1.13 - wave * .17;
        }
        for (let i = shots.length - 1; i >= 0; i--) {
          const shot = shots[i];
          shot.y -= 440 * dt;
          const target = enemies.findIndex(enemy => Math.abs(enemy.x - shot.x) < 23 && Math.abs(enemy.y - shot.y) < 17);
          if (target >= 0) {
            enemies.splice(target, 1);
            score += 100;
          }
          if (shot.y < 42 || target >= 0) shots.splice(i, 1);
        }
        for (let i = enemies.length - 1; i >= 0; i--) {
          const enemy = enemies[i];
          enemy.y += (53 + wave * 19) * dt;
          enemy.x = enemy.lane + Math.sin(time * 3 + enemy.phase) * (15 + wave * 6);
          if (enemy.y >= 333) {
            enemies.splice(i, 1);
            if (--health === 0) return end(score, false);
          }
        }
        if (!remaining && !enemies.length) {
          if (wave === 3) return end(score, true);
          remaining = 8 + ++wave * 2;
          nextSpawn = time + 1.4;
        }
      },
      draw(ctx) {
        block(ctx, 0, 0, W, H, '#10142e');
        for (let i = 0; i < 64; i++) {
          const sy = 40 + ((i * 47 + time * (14 + i % 3 * 11)) % 292);
          circle(ctx, (i * 125.37) % W, sy, i % 7 === 0 ? 1.8 : 1, '#6972ac');
        }
        block(ctx, 0, 333, W, 2, '#6de2e6');
        label(ctx, '波次 ' + wave + '/3', 18, 28);
        label(ctx, '得分 ' + score, W / 2 - 50, 28);
        label(ctx, '护盾 ' + health, W - 94, 28);
        for (const shot of shots) block(ctx, shot.x - 3, shot.y - 11, 6, 20, '#a8fbff');
        for (const enemy of enemies) {
          ctx.save();
          ctx.translate(enemy.x, enemy.y);
          ctx.rotate(Math.PI / 4);
          block(ctx, -12, -12, 24, 24, '#f38ab1');
          block(ctx, -4, -4, 8, 8, '#3d2153');
          ctx.restore();
        }
        ctx.fillStyle = '#6de2e6';
        ctx.beginPath();
        ctx.moveTo(x, 303);
        ctx.lineTo(x + 22, 329);
        ctx.lineTo(x, 322);
        ctx.lineTo(x - 22, 329);
        ctx.fill();
      },
    };
  }

  function circuit(end) {
    const cols = 6;
    const rows = 8;
    const cell = 35;
    const left = 198;
    const top = 64;
    const colors = ['#ff9dd6', '#aea4ff', '#ffc364', '#6de2e6'];
    const shapes = [[[0,0],[1,0],[1,1]], [[0,0],[1,0],[2,0]], [[0,0],[1,0]], [[0,0],[0,1],[1,1],[2,1]]];
    const deck = [1,1,0,3,2,3,0,2,1,3,2,1,0,2,3,1,2,3];
    const board = Array.from({ length: rows }, () => Array(cols).fill(null));
    let index = 0;
    let lines = 0;
    let x = 0;
    let y = 0;
    let cells = shapes[deck[0]];
    function fits(px, py, piece = cells) {
      return piece.every(([dx, dy]) => px + dx >= 0 && px + dx < cols && py + dy >= 0 &&
        py + dy < rows && board[py + dy][px + dx] === null);
    }
    function ghost() {
      let landing = y;
      while (fits(x, landing + 1)) landing++;
      return landing;
    }
    return {
      hint: '方向键移动，R 旋转，空格落到预览位置。填满一横排就接通一条线路。',
      press(key) {
        const dx = Number(key === 'ArrowRight') - Number(key === 'ArrowLeft');
        const dy = Number(key === 'ArrowDown') - Number(key === 'ArrowUp');
        if ((dx || dy) && fits(x + dx, y + dy)) { x += dx; y += dy; }
        if (key === 'r') {
          const maxY = Math.max(...cells.map(([, dy]) => dy));
          const rotated = cells.map(([dx, dy]) => [maxY - dy, dx]);
          const offset = [0, -1, 1, -2, 2].find(shift => fits(x + shift, y, rotated));
          if (offset != null) { x += offset; cells = rotated; }
        }
        if (key !== ' ') return;
        y = ghost();
        for (const [dx, dy] of cells) board[y + dy][x + dx] = deck[index];
        for (let row = rows - 1; row >= 0; row--) {
          if (board[row].includes(null)) continue;
          board.splice(row, 1);
          board.unshift(Array(cols).fill(null));
          lines++;
          row++;
        }
        index++;
        if (lines >= 5) return end(lines * 250 + 18 - index, true);
        if (index === deck.length) return end(lines * 250, false);
        cells = shapes[deck[index]];
        x = 0;
        y = 0;
        if (!fits(x, y)) {
          const candidate = Array.from({ length: cols }, (_, column) => column).find(column => fits(column, 0));
          if (candidate === undefined) return end(lines * 250, false);
          x = candidate;
        }
      },
      update() {},
      draw(ctx) {
        block(ctx, 0, 0, W, H, '#17112f');
        label(ctx, '接通 ' + lines + '/5', left, 34);
        label(ctx, '已用 ' + index + '/18', left + 138, 34);
        board.forEach((row, y) => row.forEach((value, x) => {
          block(ctx, left + x * cell, top + y * cell, cell - 2, cell - 2, value == null ? '#32244b' : colors[value]);
        }));
        if (fits(x, y) && index < deck.length && lines < 5) {
          const landing = ghost();
          for (const [dx, dy] of cells) {
            block(ctx, left + (x + dx) * cell, top + (landing + dy) * cell, cell - 2, cell - 2, '#6c5b82');
            block(ctx, left + (x + dx) * cell + 2, top + (y + dy) * cell + 2, cell - 6, cell - 6, colors[deck[index]]);
          }
        }
        if (index + 1 < deck.length) {
          label(ctx, '下一块', 447, 83);
          for (const [dx, dy] of shapes[deck[index + 1]]) {
            block(ctx, 447 + dx * 23, 101 + dy * 23, 21, 21, colors[deck[index + 1]]);
          }
        }
      },
    };
  }
  return { games, mount };
})();
