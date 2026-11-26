/* Adapted from Blow Candles by Miles TsungWei Chin (MIT).
 * https://github.com/mileschintw/blow-candles/tree/ae0df83f76162ff5eafad386cd7edc903f7d778c
 * See blow-candles.LICENSE.txt.
 */
function createBlowDetector(context, stream) {
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0;
  const mute = context.createGain();
  mute.gain.value = 0;
  context.createMediaStreamSource(stream).connect(analyser);
  analyser.connect(mute).connect(context.destination);
  const fbuf = new Float32Array(analyser.frequencyBinCount);
  const tbuf = new Float32Array(analyser.fftSize);
  const dec = new Float32Array(analyser.fftSize / 4);
  const det = { floor: null, eff: 0, voice: 0, dose: 0, age: 0, loudT: 0 };
  const thDb = 20;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function bandDb(lo, hi) {
    const binHz = context.sampleRate / analyser.fftSize;
    const a = Math.max(1, Math.round(lo / binHz)), b = Math.min(fbuf.length - 1, Math.round(hi / binHz));
    let p = 0;
    for (let i = a; i <= b; i++) p += Math.pow(10, fbuf[i] / 10);
    return 10 * Math.log10(p / (b - a + 1) + 1e-20);
  }
  // 0..1 periodicity of the last ~43 ms (decimated x4, pre-emphasised)
  function periodicity() {
    analyser.getFloatTimeDomainData(tbuf);
    const D = 4, n = dec.length;
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const j = i * D, v = (tbuf[j] + tbuf[j + 1] + tbuf[j + 2] + tbuf[j + 3]) / D;
      dec[i] = v - 0.97 * prev; prev = v;
    }
    const fs = context.sampleRate / D;
    const lagMin = Math.max(2, Math.floor(fs / 420)), lagMax = Math.min(Math.floor((n - 40) / 2), Math.ceil(fs / 75));
    const r = lag => {
      let xy = 0, xx = 0, yy = 0;
      for (let i = 0, m = n - lag; i < m; i++) { const x = dec[i], y = dec[i + lag]; xy += x * y; xx += x * x; yy += y * y; }
      return xx > 1e-12 && yy > 1e-12 ? xy / Math.sqrt(xx * yy) : 0;
    };
    let best = 0, rPrev = r(lagMin - 1), rCur = r(lagMin);
    for (let L = lagMin; L <= lagMax; L++) {
      const rNext = r(L + 1);
      if (rCur > 0.3 && rCur >= rPrev && rCur >= rNext) {
        const sc = Math.min(rCur, r(2 * L));        // must repeat at 2x the period
        if (sc > best) best = sc;
      }
      rPrev = rCur; rCur = rNext;
    }
    return best;
  }
  function analyseMic(dt) {
    analyser.getFloatFrequencyData(fbuf);
    const low = bandDb(40, 1000);
    if (low < -150) { det.eff = 0; det.excess = 0; return; }   // stream not running yet (digital silence)
    det.lowDb = low;
    if (det.floor == null || !isFinite(det.floor)) det.floor = low;
    const v = periodicity();
    det.voice = v > det.voice ? v : det.voice + (v - det.voice) * Math.min(1, dt * 3);
    det.excess = Math.max(0, low - det.floor);
    const veto = clamp((det.voice - 0.42) / 0.2, 0, 1);
    det.eff = det.excess * (1 - 0.9 * veto);
    // noise floor: falls quickly, creeps up slowly, frozen during loud events and calibration
    // (a loud sound that lasts longer than any blow, e.g. a fan switching on, becomes the new floor)
    det.loudT = det.excess >= thDb * 0.6 ? (det.loudT || 0) + dt : 0;
    det.age = (det.age || 0) + dt;
    if (det.age < 2) { det.floor += (low - det.floor) * Math.min(1, dt * 3); det.eff = 0; return; }   // warm-up
    if (low < det.floor) det.floor += (low - det.floor) * Math.min(1, dt * 4);
    else if (det.excess < thDb * 0.6) det.floor += (low - det.floor) * Math.min(1, dt * 0.15);
    else if (det.loudT > 5) det.floor += (low - det.floor) * Math.min(1, dt * 0.5);
  }

  return function sample(dt) {
    analyseMic(dt);
    const over = det.eff - thDb;
    if (over > 0) det.dose = Math.min(1, det.dose + dt * Math.min(2.5, 1.2 + over / 8));
    else det.dose = Math.max(0, det.dose - dt * (over > -4 ? 0.35 : 1.5));
    return {
      ready: det.age >= 2,
      wind: clamp(det.eff / thDb, 0, 1.6),
      blowing: det.dose >= 0.3 && over > -4,
    };
  };
}
