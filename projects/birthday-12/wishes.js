const BirthdayWishes = (() => {
  const arrows = [['←','ArrowLeft'], ['→','ArrowRight'], ['↑','ArrowUp'], ['↓','ArrowDown']];
  const W = 640;
  const H = 360;
  const amber = '#ffc767';
  const violet = '#c3a8ff';
  const aqua = '#89f4e9';
  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function dot(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function text(ctx, value, x, y, color = '#fff0df') {
    ctx.fillStyle = color;
    ctx.font = 'bold 16px ui-monospace, monospace';
    ctx.fillText(value, x, y);
  }
  function backdrop(ctx, title, score, theme) {
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    const palettes = { aurora: ['#164158', '#0b1c26'], gold: ['#553443', '#271724'], nebula: ['#272044', '#110b22'] };
    const [light, dark] = palettes[theme] || palettes.nebula;
    gradient.addColorStop(0, light);
    gradient.addColorStop(1, dark);
    rect(ctx, 0, 0, W, H, gradient);
    for (let x = 0; x < W; x += 32) rect(ctx, x, 49, 1, H - 49, '#b19bea18');
    for (let y = 49; y < H; y += 32) rect(ctx, 0, y, W, 1, '#b19bea18');
    text(ctx, title, 16, 30, amber);
    text(ctx, score, W - ctx.measureText(score).width - 18, 30);
  }

  function fireflies(end, variant = {}) {
    const goal = variant.goal ?? 18;
    const gap = [.7, .55, .44][(variant.difficulty ?? 2) - 1];
    const lanes = [140, 260, 380, 500];
    const letters = ['d','f','j','k'];
    const chart = [0,1,2,3,1,2,0,3,0,2,1,3,2,0,1,2,3,0,3,1,0,2,1,3]
      .map((lane, i) => ({ lane, beat: 1.35 + i * gap, hit: false, missed: false }));
    let time = 0;
    let combo = 0;
    let best = 0;
    let points = 0;
    let hits = 0;
    let cue = '';
    let cueUntil = 0;
    return {
      hint: '萤火虫接近金线时，按对应的 D F J K。连续命中得分更高，命中 ' + goal + ' 个通关。',
      press(key) {
        const lane = letters.indexOf(key);
        if (lane < 0) return;
        const note = chart.find(note => !note.hit && !note.missed && note.lane === lane && Math.abs(note.beat - time) <= .22);
        if (note) {
          note.hit = true;
          hits++;
          best = Math.max(best, ++combo);
          const perfect = Math.abs(note.beat - time) <= .105;
          points += (perfect ? 100 : 70) + combo * 5;
          playNote([67, 69, 72, 74][lane]);
          cue = perfect ? '精准！' : '命中';
        } else { combo = 0; cue = '再等一下'; }
        cueUntil = time + .35;
      },
      update(dt) {
        time += dt;
        for (const note of chart) {
          if (!note.hit && !note.missed && time - note.beat > .22) { note.missed = true; combo = 0; }
        }
        if (time > chart.at(-1).beat + .65) end(points, hits >= goal);
      },
      draw(ctx) {
        backdrop(ctx, variant.title || '萤火虫演奏会', '命中 ' + hits + '/' + goal + ' · ' + points + ' 分', variant.palette);
        for (const [i, lane] of lanes.entries()) {
          rect(ctx, lane - 22, 64, 44, 232, '#ede6ff12');
          text(ctx, letters[i].toUpperCase(), lane - 5, 322, violet);
        }
        rect(ctx, 94, 285, 450, 3, amber);
        for (const note of chart) {
          const y = 286 + (time - note.beat) * 175;
          if (note.hit || note.missed || y < 63 || y > 310) continue;
          const x = lanes[note.lane];
          dot(ctx, x, y, 17, '#ffe58b35');
          dot(ctx, x, y, 9, '#ffe58b');
        }
        text(ctx, '最佳连击 ' + best, 16, 340);
        if (time < cueUntil) text(ctx, cue, 288, 343, amber);
      },
    };
  }

  function starCourier(end, variant = {}) {
    const goal = variant.goal ?? 8;
    const speed = [109, 136, 166][(variant.difficulty ?? 2) - 1];
    const tracks = [152, 238, 324, 410, 496];
    const obstacles = Array.from({ length: 21 }, (_, index) => ({
      lane: (index * 3 + Math.floor(index / 3)) % 5,
      y: -82 * index - 55,
      core: index % 3 !== 2,
      checked: false,
    }));
    let lane = 2;
    let lives = 3;
    let cores = 0;
    let frames = 0;
    return {
      hint: '← → 切换航道，捡金色星核、躲紫色暗礁。带回 ' + goal + ' 个星核并活着抵达。',
      press(key) {
        const change = Number(key === 'ArrowRight') - Number(key === 'ArrowLeft');
        lane = Math.max(0, Math.min(4, lane + change));
      },
      update(dt) {
        frames += dt;
        for (const object of obstacles) {
          const oldY = object.y;
          object.y += dt * (speed + Math.min(42, frames * 3));
          if (object.checked || oldY >= 296 || object.y < 296) continue;
          object.checked = true;
          if (object.lane !== lane) continue;
          if (object.core) cores++;
          else if (--lives === 0) { end(cores * 100, false); return; }
        }
        if (obstacles.at(-1).checked) end(cores * 100 + lives * 50, cores >= goal);
      },
      draw(ctx) {
        backdrop(ctx, variant.title || '星核运输线', '货物 ' + cores + '/' + goal + ' · 护盾 ' + lives, variant.palette);
        for (const [i, x] of tracks.entries()) rect(ctx, x - 1, 53, 2, 252, i === lane ? '#89f4e980' : '#b8a4fc50');
        for (const object of obstacles) {
          if (object.checked || object.y < 53) continue;
          const x = tracks[object.lane];
          ctx.save();
          ctx.translate(x, object.y);
          ctx.rotate(Math.PI / 4);
          rect(ctx, -9, -9, 18, 18, object.core ? amber : '#ed81bc');
          rect(ctx, -3, -3, 6, 6, '#181029');
          ctx.restore();
        }
        const x = tracks[lane];
        ctx.fillStyle = aqua;
        ctx.beginPath();
        ctx.moveTo(x, 280);
        ctx.lineTo(x + 18, 311);
        ctx.lineTo(x - 18, 311);
        ctx.closePath();
        ctx.fill();
        text(ctx, '橙星基地', 283, 341, aqua);
      },
    };
  }

  function vault(end, variant = {}) {
    const rounds = [4, 5, 6, 7, 8].slice(0, variant.goal ?? 5);
    const exposure = [.68, .54, .42][(variant.difficulty ?? 2) - 1];
    const direction = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
    let round = 0;
    let misses = 2;
    let points = 0;
    let sequence = [];
    let cursor = 0;
    let index = 0;
    let time = 0;
    let displayUntil = .6;
    let feedback = '';
    let active = true;
    function newSequence() {
      sequence = [];
      for (let i = 0; i < rounds[round]; i++) {
        const cell = Math.floor(Math.random() * 9);
        sequence.push(sequence.at(-1) === cell ? (cell + 4) % 9 : cell);
      }
      index = 0;
      time = 0;
      displayUntil = .75 + sequence.length * exposure;
    }
    newSequence();
    return {
      hint: '记住亮起的格子顺序。方向键选位置，空格确认。完成 ' + rounds.length + ' 轮即解锁。',
      press(key) {
        if (!active || time < displayUntil) return;
        if (Object.hasOwn(direction, key)) {
          const [x,y] = direction[key];
          const nx = Math.min(2, Math.max(0, cursor % 3 + x));
          const ny = Math.min(2, Math.max(0, Math.floor(cursor / 3) + y));
          cursor = ny * 3 + nx;
          return;
        }
        if (key !== ' ') return;
        if (sequence[index] !== cursor) {
          if (--misses < 0) { active = false; end(points, false); return; }
          feedback = '顺序有误 · 重播本轮';
          index = 0;
          time = 0;
          return;
        }
        index++;
        points += 100;
        feedback = '';
        if (index !== sequence.length) return;
        if (++round === rounds.length) { active = false; end(points, true); return; }
        feedback = '下一轮';
        newSequence();
      },
      update(dt) { time += dt; },
      draw(ctx) {
        backdrop(ctx, variant.title || '星图解码', '轮次 ' + Math.min(rounds.length, round + 1) + '/' + rounds.length + ' · ' + points + ' 分', variant.palette);
        const preview = Math.floor((time - .75) / exposure);
        const visible = preview >= 0 && (time - .75) % exposure < exposure * .61 && time < displayUntil;
        for (let cell = 0; cell < 9; cell++) {
          const x = 224 + cell % 3 * 66;
          const y = 62 + Math.floor(cell / 3) * 66;
          const lit = visible && sequence[preview] === cell;
          rect(ctx, x, y, 56, 56, lit ? amber : '#50406d');
          if (cursor === cell && time >= displayUntil) {
            ctx.strokeStyle = aqua;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, 52, 52);
          }
          text(ctx, String(cell + 1), x + 22, y + 34, lit ? '#251437' : '#e6d6ff');
        }
        text(ctx, time < displayUntil ? '观察星图' : '输入 ' + index + '/' + sequence.length, 266, 292, aqua);
        text(ctx, feedback || '可重试 ' + Math.max(0, misses) + ' 次', 231, 326, violet);
      },
    };
  }

  return [
    { id: 'fireflies', icon: '♪', title: '萤火虫演奏会', summary: '四轨节奏挑战。抓住拍点，把萤火虫连成一串。', lesson: '做游戏时，这一关可以用来试「命中窗口」多宽才好玩。',
      controls: [['D','d'], ['F','f'], ['J','j'], ['K','k']], create: fireflies },
    { id: 'star-courier', icon: '◇', title: '星核运输线', summary: '五航道反应挑战。避开暗礁，把星核带回基地。', lesson: '这台原型适合比较速度和目标数量怎样影响难度。',
      controls: arrows.slice(0, 2), create: starCourier },
    { id: 'vault', icon: '▦', title: '星图解码', summary: '五轮逐步加长的记忆挑战。记住星图顺序，解开锁。', lesson: '这里可以试出提示停留多久，玩家才有机会记住。',
      controls: [...arrows, ['确认',' ']], create: vault },
  ];
})();
