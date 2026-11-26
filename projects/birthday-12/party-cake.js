const PartyCake = (() => {
  const fullTurn = Math.PI * 2;
  const center = [50, 50];
  const pointAt = (angle, radius) => [
    50 + radius * Math.cos(angle),
    50 + radius * Math.sin(angle),
  ];

  function splitCake(from, to) {
    const rim = Array.from({ length: 97 }, (_, i) => pointAt((i % 96 + .3) * fullTurn / 96, 50));
    const cake = { type: 'Polygon', coordinates: [rim] };
    const knife = { type: 'LineString', coordinates: [pointAt(from, 62), center, pointAt(to, 62)] };
    const { geometry } = CakeGeometry.split(cake, knife);
    return geometry.type === 'MultiPolygon' ? geometry.coordinates
      .map(([ring]) => ring)
      .sort((a, b) => a.length - b.length) : [];
  }

  const clip = points => 'polygon(' + points.map(([x, y]) => x + '% ' + y + '%').join(',') + ')';

  function attach({ board, rest, slice, status, mic, breeze, cut, fallback, candles: removeButton, clearCandles, notice, finish, soundFocus, flavorButtons, initialFlavor, rememberFlavor }) {
    const controller = new AbortController();
    const { signal } = controller;
    const candles = [];
    const marks = [];
    const surface = rest.parentElement;
    const trace = document.createElement('i');
    trace.className = 'knife-trace';
    trace.hidden = true;
    const plate = document.createElement('i');
    plate.className = 'cake-plate';
    const base = document.createElement('i');
    base.className = 'cake-base';
    const pieceBase = document.createElement('i');
    pieceBase.className = 'cake-base cake-piece-base';
    board.prepend(plate);
    surface.prepend(base, pieceBase);
    surface.append(trace);
    const knife = document.createElement('i');
    knife.className = 'cake-knife';
    knife.textContent = '🔪';
    knife.setAttribute('aria-hidden', 'true');
    knife.hidden = true;
    board.append(knife);
    let remaining = 12;
    let stream;
    let context;
    let animation;
    let hold;
    let gesture;
    let pending;
    let served = false;
    let canCut = false;
    let removed = 0;
    let model;
    let flavor;

    function name() {
      return flavorButtons.find(button => button.dataset.flavor === flavor).textContent + '蛋糕';
    }

    function label() {
      const state = served ? '第一块已切好'
        : remaining ? '还亮着 ' + remaining + ' 根蜡烛' : '蜡烛已熄灭';
      board.setAttribute('aria-label', name() + '，' + state);
    }

    function selectFlavor(key) {
      flavor = key;
      board.dataset.flavor = key;
      for (const control of flavorButtons) control.setAttribute('aria-pressed', String(control.dataset.flavor === key));
      model?.change(key);
      label();
    }

    const knownFlavor = flavorButtons.some(button => button.dataset.flavor === initialFlavor);
    selectFlavor(knownFlavor ? initialFlavor : 'orange');
    for (const control of flavorButtons) {
      control.addEventListener('click', () => {
        if (marks.length || served) return;
        selectFlavor(control.dataset.flavor);
        rememberFlavor(flavor);
      }, { signal });
    }

    for (let i = 0; i < remaining; i++) {
      const angle = (i - 3) * Math.PI / 6;
      const candle = document.createElement('i');
      candle.className = 'cake-candle';
      candle.setAttribute('aria-hidden', 'true');
      candle.dataset.angle = angle;
      board.append(candle);
      candles.push(candle);
    }

    const target = document.createElement('i');
    target.className = 'cake-cut-target';
    surface.append(target);

    function surfacePoint(x, y) {
      if (!model) return { x: x / 2, y: y / 2 };
      const projected = model.project(x, y);
      return { x: projected.x, y: (projected.y + .5) / .84 - .5 };
    }

    function layout() {
      for (const candle of candles) {
        const angle = Number(candle.dataset.angle);
        const point = surfacePoint(.58 * Math.cos(angle), .58 * Math.sin(angle));
        candle.style.left = (point.x + .5) * 100 + '%';
        candle.style.top = (point.y + .5) * 84 + '%';
        candle.style.zIndex = String(20 + Math.round(10 * Math.sin(angle)));
      }
      const origin = surfacePoint(0, 0);
      target.style.left = (origin.x + .5) * 100 + '%';
      target.style.top = (origin.y + .5) * 100 + '%';
      for (const mark of marks) {
        const angle = Number(mark.dataset.angle);
        showLine(mark, origin, surfacePoint(Math.cos(angle), Math.sin(angle)));
      }
    }

    layout();
    import('./cake-3d.js').then(({ mountCake }) => {
      if (signal.aborted || canCut) return;
      model = mountCake(board, layout, () => {
        const lost = model;
        model = undefined;
        board.classList.remove('has-cake-3d');
        lost?.destroy();
        layout();
      });
      model.change(flavor);
      board.classList.add('has-cake-3d');
      layout();
    }).catch(() => {
      model?.destroy();
      model = undefined;
      board.classList.remove('has-cake-3d');
      layout();
    });

    function stopMic() {
      pending = undefined;
      cancelAnimationFrame(animation);
      board.style.removeProperty('--mic-wind');
      const wasCapturing = Boolean(stream);
      stream?.getTracks().forEach(track => track.stop());
      stream = undefined;
      if (context && context.state !== 'closed') context.close().catch(() => {});
      context = undefined;
      mic.setAttribute('aria-pressed', 'false');
      if (remaining) mic.textContent = '开启麦克风吹蜡烛';
      if (wasCapturing) soundFocus(false);
    }

    function stopHold() {
      clearInterval(hold);
      board.classList.remove('cake-breeze');
      hold = undefined;
    }

    function extinguish() {
      if (!remaining) return;
      const candle = candles[--remaining];
      label();
      candle.classList.add('candle-out');
      status.textContent = remaining ? '还有 ' + remaining + ' 根蜡烛亮着' : '十二根蜡烛都吹灭了。';
      if (remaining) return;
      stopHold();
      stopMic();
      mic.hidden = true;
      breeze.hidden = true;
      status.textContent = '十二根烛火都熄灭了。把蜡烛一根根拔下来吧。';
      removeButton.hidden = false;
      clearCandles.hidden = false;
      removeButton.textContent = '拔下一根蜡烛（12）';
      removeButton.focus();
    }

    function startHold() {
      if (!remaining || hold) return;
      board.classList.add('cake-breeze');
      extinguish();
      if (remaining) hold = setInterval(extinguish, 115);
    }
    breeze.addEventListener('pointerdown', event => {
      event.preventDefault();
      breeze.setPointerCapture(event.pointerId);
      startHold();
    }, { signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      breeze.addEventListener(type, stopHold, { signal });
    }
    breeze.addEventListener('keydown', event => {
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); startHold(); }
    }, { signal });
    breeze.addEventListener('keyup', stopHold, { signal });
    breeze.addEventListener('blur', stopHold, { signal });
    breeze.addEventListener('click', event => { if (event.detail === 0) extinguish(); }, { signal });

    mic.addEventListener('click', async () => {
      if (stream || pending) {
        stopMic();
        status.textContent = '还有 ' + remaining + ' 根蜡烛亮着';
        return;
      }
      if (!remaining) return;
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!navigator.mediaDevices?.getUserMedia || !Audio) {
        status.textContent = '这里无法使用麦克风，可以按住「吹气」。';
        return;
      }
      const request = {};
      pending = request;
      mic.textContent = '取消开启麦克风';
      status.textContent = '请在浏览器提示里允许使用麦克风，也可以按住「吹气」继续。';
      try {
        const input = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
          video: false,
        });
        if (pending !== request) { input.getTracks().forEach(track => track.stop()); return; }
        stream = input;
        soundFocus(true);
        context = new Audio();
        await context.resume();
        if (pending !== request) return;
        const sample = createBlowDetector(context, stream);
        stream.getAudioTracks().forEach(track => track.addEventListener('ended', () => {
          if (stream !== input) return;
          stopMic();
          if (remaining) status.textContent = '麦克风已断开，可以按住「吹气」。';
        }, { signal }));
        mic.textContent = '关闭麦克风';
        mic.setAttribute('aria-pressed', 'true');
        status.textContent = '先安静两秒，让麦克风听一下周围的声音。';
        let previous = performance.now();
        let calibrated = false;
        let next = 0;
        function check(time) {
          if (!stream || !remaining) return;
          const breath = sample(Math.max(0, Math.min(.05, (time - previous) / 1000)));
          previous = time;
          if (!calibrated && breath.ready) {
            calibrated = true;
            status.textContent = '可以吹了。对着麦克风轻轻吹一口气。';
          }
          board.style.setProperty('--mic-wind', (breath.wind * 29).toFixed(1) + 'deg');
          if (breath.blowing && time >= next) {
            extinguish();
            next = time + Math.max(105, 245 - 85 * breath.wind);
          }
          if (stream && remaining) animation = requestAnimationFrame(check);
        }
        animation = requestAnimationFrame(check);
      } catch {
        if (pending === request) {
          stopMic();
          status.textContent = '麦克风未开启，可以按住「吹气」。';
        }
      } finally {
        if (pending === request) pending = undefined;
      }
    }, { signal });

    function prepare() {
      if (notice.open) notice.close();
      canCut = true;
      board.classList.add('knife-ready');
      fallback.hidden = false;
      status.textContent = '从蛋糕中心的光圈向外缘划一刀，再换个方向划一刀。';
      fallback.focus();
    }
    cut.addEventListener('click', prepare, { signal });
    notice.addEventListener('cancel', event => { event.preventDefault(); prepare(); }, { signal });
    fallback.addEventListener('click', () => serve(-.38, .38), { signal });
    function removeCandles(count) {
      if (remaining || removed >= candles.length) return;
      const end = Math.min(removed + count, candles.length);
      while (removed < end) candles[removed++].classList.add('candle-removed');
      const left = candles.length - removed;
      if (left) {
        removeButton.textContent = '拔下一根蜡烛（' + left + '）';
        status.textContent = '再拔下 ' + left + ' 根蜡烛。';
        return;
      }
      removeButton.hidden = true;
      clearCandles.hidden = true;
      status.textContent = '蜡烛收好了。现在一起切蛋糕吧。';
      notice.showModal();
      cut.focus();
    }
    removeButton.addEventListener('click', () => removeCandles(1), { signal });
    clearCandles.addEventListener('click', () => removeCandles(candles.length), { signal });

    function serve(from, to) {
      if (!canCut || served) return;
      const [piece, remainder] = splitCake(from, to);
      if (!piece || !remainder) {
        status.textContent = '再换个角度切一刀。';
        return;
      }
      served = true;
      board.classList.remove('knife-ready');
      knife.hidden = true;
      trace.hidden = true;
      for (const mark of marks.splice(0)) mark.remove();
      slice.style.clipPath = clip(piece);
      rest.style.clipPath = base.style.clipPath = clip(remainder);
      pieceBase.style.clipPath = clip(piece);
      const middle = (from + to) / 2;
      const [x, y] = pointAt(middle, 24);
      surface.style.setProperty('--slice-x', (x - 50) + '%');
      surface.style.setProperty('--slice-y', (y - 50) + '%');
      const [plateX, plateY] = pointAt(middle, 49);
      plate.style.left = plateX + '%';
      plate.style.top = (plateY * .84 + 17) + '%';
      for (const angle of [from, to]) {
        const [edgeX, edgeY] = pointAt(angle, 49.95);
        const face = document.createElement('i');
        face.className = 'cake-cut-face';
        face.style.setProperty('--face-top', Math.min(50, edgeY) + '%');
        face.style.clipPath = clip([center, [edgeX, edgeY], [edgeX, edgeY + 9], [50, 59]]);
        surface.insertBefore(face, slice);
      }
      board.classList.add('is-served');
      for (const control of flavorButtons) control.disabled = true;
      model?.cut(from, to);
      label();
      fallback.hidden = true;
      finish();
    }

    function locate(event) {
      const bounds = surface.getBoundingClientRect();
      return {
        x: (event.clientX - bounds.left) / bounds.width - .5,
        y: (event.clientY - bounds.top) / bounds.height - .5,
      };
    }

    function showLine(line, start, end) {
      const { width, height } = surface.getBoundingClientRect();
      const dx = (end.x - start.x) * width;
      const dy = (end.y - start.y) * height;
      line.style.left = (start.x + .5) * 100 + '%';
      line.style.top = (start.y + .5) * 100 + '%';
      line.style.width = Math.hypot(dx, dy) / width * 100 + '%';
      line.style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)';
    }

    function moveKnife(point) {
      knife.style.left = (point.x + .5) * 100 + '%';
      knife.style.top = (point.y + .5) * 84 + '%';
      knife.hidden = false;
    }

    board.addEventListener('pointermove', event => {
      if (!canCut || served || (gesture && gesture.id !== event.pointerId)) return;
      const point = locate(event);
      moveKnife(point);
      if (gesture) showLine(trace, gesture.start, point);
    }, { signal });
    board.addEventListener('pointerleave', () => { if (!gesture) knife.hidden = true; }, { signal });
    board.addEventListener('pointerdown', event => {
      if (!canCut || served || gesture || event.button !== 0) return;
      const start = locate(event);
      gesture = { start, id: event.pointerId };
      board.setPointerCapture(event.pointerId);
      board.classList.add('knife-dragging');
      moveKnife(start);
      showLine(trace, start, start);
      trace.hidden = false;
    }, { signal });

    function clearGesture(event) {
      if (!gesture || gesture.id !== event.pointerId) return;
      gesture = null;
      trace.hidden = true;
      knife.hidden = true;
      board.classList.remove('knife-dragging');
    }

    for (const type of ['pointercancel', 'lostpointercapture']) {
      board.addEventListener(type, clearGesture, { signal });
    }
    board.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId || served) return;
      const { start } = gesture;
      const end = locate(event);
      clearGesture(event);
      const toCake = point => model
        ? model.intersect(point.x, (point.y + .5) * .84 - .5)
        : point;
      const firstPoint = toCake(start);
      const lastPoint = toCake(end);
      const firstDistance = Math.hypot(firstPoint.x, firstPoint.y);
      const lastDistance = Math.hypot(lastPoint.x, lastPoint.y);
      const innerDistance = Math.min(firstDistance, lastDistance);
      const outerDistance = Math.max(firstDistance, lastDistance);
      if (innerDistance > .19 || outerDistance < .32) {
        status.textContent = '这一刀要连起中心光圈和外缘，划出外缘也可以。';
        return;
      }
      const edge = firstDistance > lastDistance ? firstPoint : lastPoint;
      const angle = Math.atan2(edge.y, edge.x);
      if (marks.length === 0) {
        const mark = document.createElement('i');
        mark.className = 'knife-mark';
        mark.dataset.angle = angle;
        surface.append(mark);
        marks.push(mark);
        for (const control of flavorButtons) control.disabled = true;
        layout();
        status.textContent = '第一刀好了。换个角度，再切一刀。';
        return;
      }
      const first = Number(marks[0].dataset.angle);
      const delta = Math.atan2(Math.sin(angle - first), Math.cos(angle - first));
      if (Math.abs(delta) < .18) {
        status.textContent = '第二刀试着切在第一刀旁边，留出一块蛋糕的宽度。';
        return;
      }
      serve(first + Math.min(0, delta), first + Math.max(0, delta));
    }, { signal });

    function suspend() {
      stopHold();
      if (stream || pending) {
        stopMic();
        if (remaining) status.textContent = '麦克风已关闭，可以重新开启或按住「吹气」。';
      }
    }
    window.addEventListener('pagehide', suspend, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) suspend();
    }, { signal });

    return () => {
      controller.abort();
      stopHold();
      stopMic();
      model?.destroy();
      if (notice.open) notice.close();
    };
  }
  return { attach };
})();
