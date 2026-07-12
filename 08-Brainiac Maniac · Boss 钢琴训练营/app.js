const STORAGE_KEY = "roof-piano-camp-progress-v1";

const lessons = [
  {
    week: "第 1 周", stage: "切分", title: "先抓住 Boss 战重音", difficulty: "节奏",
    goal: "不从认中央 C 开始。先把 Brainiac Maniac 风格里最容易乱的切分和突然重音练稳。",
    exercise: "切分重音模型", notes: ["D4", "D4", "F4", "D4", "G4", "F4", "D4", "A3"],
    numbers: ["2", "2", "4", "2", "5", "4", "2", "6·"],
    hint: "先拍手念：一 和 二 和｜三 和 四 和。重音落在“和”上，但速度不能被重音撞歪。",
    prompt: "弹 D4，让网页听你有没有找对", target: "D4",
    plan: [["2 分钟", "拍切分", "脚打正拍，手拍反拍"], ["5 分钟", "单音重音", "只用 D，强音后立刻放松"], ["3 分钟", "加入音高", "连续稳定三次"]],
    coach: "重音不是更快，也不是砸琴。它只是这个音更突出，下一拍仍要准时到。"
  },
  {
    week: "第 2 周", stage: "半音", title: "黑键路线提前规划", difficulty: "识谱",
    goal: "集中练升号和半音移动。看到临时升降号时，手要提前知道下一颗黑键在哪里。",
    exercise: "半音警报", notes: ["D4", "D#4", "E4", "G4", "F#4", "F4", "E4", "D#4"],
    numbers: ["2", "♯2", "3", "5", "♯4", "4", "3", "♯2"],
    hint: "先不弹，指着琴键说白—黑—白。眼睛确认路线后，再用 2–3–1 指慢慢走。",
    prompt: "弹 D#4，注意它在两颗黑键的右边", target: "D#4",
    plan: [["2 分钟", "圈升号", "先在谱上找所有变化音"], ["4 分钟", "三音小组", "D–D♯–E 循环"], ["4 分钟", "整句连接", "黑键前不临时刹车"]],
    coach: "黑键不是额外难度，它只是路线的一部分。真正的问题通常是眼睛看到得太晚。"
  },
  {
    week: "第 3 周", stage: "右手", title: "快速重复音别变僵", difficulty: "右手",
    goal: "练重复音、短跳进和突然转向。速度来自手指轮换和放松，不来自一直用力。",
    exercise: "重复音与跳进", notes: ["F4", "F4", "F4", "A4", "G#4", "F4", "D4", "F4"],
    numbers: ["4", "4", "4", "6", "♯5", "4", "2", "4"],
    hint: "三个 F 可试 3–2–1 轮指。每次触键后马上松开力量，手腕不要上下乱跳。",
    prompt: "弹 F4，试着用不同手指重复", target: "F4",
    plan: [["2 分钟", "桌面轮指", "3–2–1 均匀敲击"], ["5 分钟", "三音一组", "每组三次正确才连接"], ["3 分钟", "加入跳进", "眼睛提前看 A"]],
    coach: "重复音越来越慢，通常不是手指不够快，而是前一个音的力量没有及时放掉。"
  },
  {
    week: "第 4 周", stage: "低音", title: "左手变成机械发动机", difficulty: "左手",
    goal: "用稳定的低音脉冲制造 Boss 机甲的推进感，同时练习快速移动和轻重层次。",
    exercise: "机械低音骨架", notes: ["D3", "A3", "D3", "F3", "C3", "G3", "C3", "E3"],
    numbers: ["2··", "6·", "2··", "4··", "1··", "5·", "1··", "3··"],
    hint: "每组第一个低音稍重，后面的回答音轻。移动时带动小臂，不要用小指硬够。",
    prompt: "弹 A3，检查左手跳进落点", target: "A3",
    plan: [["3 分钟", "只弹低音", "节拍器 52 BPM"], ["4 分钟", "加入回答音", "重—轻层次清楚"], ["3 分钟", "不看手位", "先看落点再移动"]],
    coach: "左手不是越响越有力量。真正的机械感来自每一拍间隔一样，而不是砸得一样重。"
  },
  {
    week: "第 5 周", stage: "错位", title: "两只手不同时落下", difficulty: "双手",
    goal: "Boss 战的紧张感来自双手错位。先找到共同重拍，再把右手反拍塞进空隙。",
    exercise: "重拍—反拍装配", notes: ["D4", "F4", "D4", "G4", "F#4", "A4", "G4", "D4"],
    numbers: ["2", "4", "2", "5", "♯4", "6", "5", "2"],
    hint: "先只弹双手共同落下的位置，像搭柱子；柱子稳了，再加入夹在中间的反拍音。",
    prompt: "弹 F#4，这是合手时容易迟到的音", target: "F#4",
    plan: [["3 分钟", "桌面错位", "左手正拍，右手反拍"], ["4 分钟", "两拍一停", "每次停下检查放松"], ["3 分钟", "四小节连接", "50 BPM 不抢拍"]],
    coach: "合手错位时，不要把两只手都重练。先查哪只手没有独立稳定，再单独修它。"
  },
  {
    week: "第 6 周", stage: "加速", title: "速度只升一小档", difficulty: "速度",
    goal: "建立 52→56→60 BPM 的速度阶梯。每档连续三次稳定，才能继续加速。",
    exercise: "四音速度阶梯", notes: ["E4", "G4", "A#4", "A4", "G4", "F#4", "E4", "D4"],
    numbers: ["3", "5", "♭7", "6", "5", "♯4", "3", "2"],
    hint: "弹错就退回上一档，不惩罚自己。速度训练的单位是 4 BPM，不是一下跳到原速。",
    prompt: "弹 A#4，确认黑键后再开始加速", target: "A#4",
    plan: [["3 分钟", "52 BPM", "连续正确三次"], ["4 分钟", "56 BPM", "肩膀和手腕保持松"], ["3 分钟", "60 BPM", "不稳定就退一档"]],
    coach: "快弹时一错再错，说明速度超过了当前控制力。退 4 BPM 不是失败，是找到真正能训练的速度。"
  },
  {
    week: "第 7 周", stage: "装配", title: "把正版谱切成 Boss 阶段", difficulty: "曲谱",
    goal: "拿出合法获得的完整曲谱，按场景和难点分段；今天只修最难的一个动作，不从头硬刷。",
    exercise: "Boss 阶段装配", notes: ["D4", "A3", "D4", "F4", "G#4", "G4", "F4", "D4"],
    numbers: ["2", "6·", "2", "4", "♯5", "5", "4", "2"],
    hint: "圈出 3 个最难位置。选 1 个，分手各三次，再合手；成功后向前后各接两拍。",
    prompt: "弹 G#4，检查曲谱中的临时变化音", target: "G#4",
    plan: [["2 分钟", "扫描曲谱", "圈出最难的三个位置"], ["5 分钟", "修一个难点", "分手各 3 次，再合手"], ["3 分钟", "向外拼接", "前后各增加两拍"]],
    coach: "如果你还没有授权曲谱，先继续复习前 6 周，不要随便下载来路不明的扫描版。"
  },
  {
    week: "第 8 周", stage: "决战", title: "录下完整 Boss 战", difficulty: "演奏",
    goal: "把曲子分成几个阶段分别稳定，最后录制一次完整演奏。小错继续走，不中断 Boss 战。",
    exercise: "决战前热身句", notes: ["D4", "D#4", "E4", "G4", "F#4", "D4", "A3", "D4"],
    numbers: ["2", "♯2", "3", "5", "♯4", "2", "6·", "2 —"],
    hint: "正式弹之前只热身两个难点，不要耗尽注意力。录制时出小错继续走，结束后再复盘。",
    prompt: "弹 E4，完成最后一次听琴校准", target: "E4",
    plan: [["2 分钟", "慢速热身", "只碰最难的两处"], ["5 分钟", "分段演奏", "每段只弹一次"], ["3 分钟", "完整录制", "不中断，结束后再复盘"]],
    coach: "完整演奏中出现小错，继续走，不要停。表演能力包含“出错后还能回到节拍里”。"
  }
];

const noteToMidi = { C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45, B2: 47, C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72 };
const keyboardNotes = ["C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5"];

let state = loadState();
let currentLesson = Math.min(state.completed, lessons.length - 1);
let soundOn = true;
let audioContext;
let timerSeconds = 600;
let timerId = null;
let metronomeId = null;
let micStream = null;
let micSource = null;
let micAnalyser = null;
let micFrame = null;
let micBuffer = null;
let lastDetectedMidi = null;

const els = Object.fromEntries([
  "week-list", "lesson-kicker", "lesson-title", "lesson-difficulty", "lesson-goal", "ten-minute-plan",
  "exercise-name", "staff-wrap", "number-score", "score-hint", "coach-note", "keyboard-prompt",
  "piano", "practice-check", "complete-lesson", "tempo", "tempo-value", "listen-button", "metronome",
  "timer-display", "timer-button", "timer-reset", "distance-number", "distance-fill", "hero-zombie",
  "label-toggle", "sound-toggle", "toast", "score-card", "mic-toggle", "mic-target",
  "detected-note", "detected-cents", "tuner-needle", "mic-status", "pitch-display"
].map(id => [id, document.getElementById(id)]));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { completed: Math.max(0, Math.min(8, Number(saved?.completed) || 0)) };
  } catch { return { completed: 0 }; }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function renderSidebar() {
  els["week-list"].innerHTML = lessons.map((lesson, index) => {
    const done = index < state.completed;
    const locked = index > state.completed;
    return `<button class="week-button ${index === currentLesson ? "active" : ""} ${locked ? "locked" : ""}"
      data-index="${index}" type="button" ${locked ? "aria-disabled=\"true\"" : ""}>
      <span class="week-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="week-copy"><strong>${lesson.stage}</strong><small>${lesson.difficulty}</small></span>
      <span class="week-status" aria-label="${done ? "已完成" : locked ? "未解锁" : "进行中"}">${done ? "✓" : locked ? "·" : "→"}</span>
    </button>`;
  }).join("");
}

function renderLesson() {
  const lesson = lessons[currentLesson];
  els["lesson-kicker"].textContent = `${lesson.week} · ${lesson.stage}`;
  els["lesson-title"].textContent = lesson.title;
  els["lesson-difficulty"].textContent = lesson.difficulty;
  els["lesson-goal"].textContent = lesson.goal;
  els["exercise-name"].textContent = lesson.exercise;
  els["score-hint"].textContent = lesson.hint;
  els["coach-note"].textContent = lesson.coach;
  els["keyboard-prompt"].textContent = lesson.prompt;
  els["mic-target"].textContent = lesson.target;
  els["ten-minute-plan"].innerHTML = lesson.plan.map(step => `
    <article class="plan-step"><span>${step[0]}</span><strong>${step[1]}</strong><small>${step[2]}</small></article>`).join("");
  renderStaff(lesson.notes);
  els["number-score"].innerHTML = lesson.numbers.map((note, i) => `<span class="number-note"><small>${i + 1}</small>${note}</span>`).join("");
  document.querySelectorAll(".piano-key").forEach(key => key.classList.toggle("target", key.dataset.note === lesson.target));
  els["practice-check"].checked = false;
  els["complete-lesson"].disabled = true;
  els["complete-lesson"].textContent = currentLesson < state.completed ? "这关已经完成" : currentLesson === 7 ? "完成演奏，击败 Boss" : "完成训练，削弱 Boss";
  renderSidebar();
  updateProgressScene();
}

function renderStaff(notes) {
  const yForNote = note => {
    const order = ["C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5"];
    return 130 - order.indexOf(note.replace("#", "")) * 6.5;
  };
  const lines = [52, 65, 78, 91, 104].map(y => `<line class="staff-line" x1="42" x2="658" y1="${y}" y2="${y}"/>`).join("");
  const noteShapes = notes.map((note, i) => {
    const x = 86 + i * 70;
    const y = yForNote(note);
    const ledger = y > 112 ? `<line class="staff-line" x1="${x - 13}" x2="${x + 13}" y1="${y}" y2="${y}"/>` : "";
    const accidental = note.includes("#") ? `<text x="${x - 19}" y="${y + 5}" font-size="18">♯</text>` : "";
    return `${ledger}${accidental}<ellipse class="note-head" cx="${x}" cy="${y}" rx="9" ry="6" transform="rotate(-18 ${x} ${y})"/>
      <line class="note-stem" x1="${x + 8}" x2="${x + 8}" y1="${y}" y2="${y - 34}"/>
      <text class="note-label" x="${x}" y="145" text-anchor="middle">${note}</text>`;
  }).join("");
  els["staff-wrap"].innerHTML = `<svg class="staff-svg" viewBox="0 0 700 155" role="img" aria-label="练习音符：${notes.join("、")}">
    <text x="12" y="91" font-size="42" font-family="serif">𝄞</text>${lines}${noteShapes}</svg>`;
}

function renderPiano() {
  const whites = keyboardNotes.filter(n => !n.includes("#"));
  let html = whites.map(note => `<button class="piano-key white-key" data-note="${note}" type="button" aria-label="${note}"><span>${note}</span></button>`).join("");
  const whiteIndex = { "C#": 1, "D#": 2, "F#": 4, "G#": 5, "A#": 6 };
  keyboardNotes.filter(n => n.includes("#")).forEach(note => {
    const octave = Number(note.slice(-1));
    const pitch = note.slice(0, -1);
    const index = (octave - 3) * 7 + whiteIndex[pitch];
    const left = index / whites.length * 100;
    html += `<button class="piano-key black-key" style="left:${left}%" data-note="${note}" type="button" aria-label="${note}"><span>${note}</span></button>`;
  });
  els.piano.innerHTML = html;
}

function midiFor(note) {
  if (noteToMidi[note]) return noteToMidi[note];
  const match = note.match(/^([A-G])#(\d)$/);
  if (!match) return 60;
  const natural = noteToMidi[`${match[1]}${match[2]}`];
  return natural + 1;
}

function playTone(note, duration = .38, when = 0, volume = .16) {
  if (!soundOn) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const start = audioContext.currentTime + when;
  const freq = 440 * 2 ** ((midiFor(note) - 69) / 12);
  const gain = audioContext.createGain();
  const osc = audioContext.createOscillator();
  const overtone = audioContext.createOscillator();
  osc.type = "triangle";
  overtone.type = "sine";
  osc.frequency.value = freq;
  overtone.frequency.value = freq * 2;
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .015);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  osc.connect(gain); overtone.connect(gain); gain.connect(audioContext.destination);
  osc.start(start); overtone.start(start);
  osc.stop(start + duration + .03); overtone.stop(start + duration + .03);
}

function playSequence() {
  const beat = 60 / Number(els.tempo.value);
  const notes = lessons[currentLesson].notes;
  els["listen-button"].disabled = true;
  notes.forEach((note, i) => {
    playTone(note, beat * .72, i * beat, .12);
    setTimeout(() => flashKey(note), i * beat * 1000);
  });
  setTimeout(() => { els["listen-button"].disabled = false; }, notes.length * beat * 1000 + 200);
}

function flashKey(note) {
  const key = document.querySelector(`[data-note="${note}"]`);
  if (!key) return;
  key.classList.add("active");
  setTimeout(() => key.classList.remove("active"), 260);
}

function toggleMetronome() {
  if (metronomeId) {
    clearInterval(metronomeId); metronomeId = null;
    els.metronome.textContent = "节拍器：关";
    els.metronome.setAttribute("aria-pressed", "false");
    return;
  }
  const tick = () => playTone("C5", .07, 0, .07);
  tick();
  metronomeId = setInterval(tick, 60000 / Number(els.tempo.value));
  els.metronome.textContent = "节拍器：开";
  els.metronome.setAttribute("aria-pressed", "true");
}

function updateTimer() {
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");
  els["timer-display"].textContent = `${minutes}:${seconds}`;
}

function toggleTimer() {
  if (timerId) {
    clearInterval(timerId); timerId = null; els["timer-button"].textContent = "继续计时"; return;
  }
  if (timerSeconds === 0) timerSeconds = 600;
  els["timer-button"].textContent = "暂停";
  timerId = setInterval(() => {
    timerSeconds -= 1; updateTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerId); timerId = null; els["timer-button"].textContent = "再练 10 分钟";
      showToast("十分钟到！先休息一下，再决定要不要继续。");
      playTone("C5", .8, 0, .1);
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerId); timerId = null; timerSeconds = 600; updateTimer(); els["timer-button"].textContent = "开始计时";
}

function updateProgressScene() {
  const percent = state.completed / lessons.length * 100;
  els["distance-fill"].style.width = `${percent}%`;
  els["distance-number"].textContent = `${100 - Math.round(percent)}%`;
  els["hero-zombie"].style.right = `${18 - state.completed * 1.2}%`;
}

function completeLesson() {
  if (currentLesson < state.completed) { showToast("这一关已经完成，可以继续复习。 "); return; }
  if (currentLesson !== state.completed) return;
  state.completed = Math.min(8, state.completed + 1); saveState();
  showToast(state.completed === 8 ? "Boss 能量清零！现在录下你的完整演奏吧。" : `Boss 被削弱！已解锁第 ${state.completed + 1} 周。`);
  playTone("C4", .35, 0, .1); playTone("E4", .35, .18, .1); playTone("G4", .7, .36, .1);
  if (state.completed < 8) currentLesson = state.completed;
  renderLesson();
}

function stopMic() {
  if (micFrame) cancelAnimationFrame(micFrame);
  micFrame = null;
  if (micSource) micSource.disconnect();
  micSource = null;
  if (micStream) micStream.getTracks().forEach(track => track.stop());
  micStream = null;
  micAnalyser = null;
  micBuffer = null;
  lastDetectedMidi = null;
  els["mic-toggle"].textContent = "开启听琴模式";
  els["mic-toggle"].setAttribute("aria-pressed", "false");
  els["pitch-display"].classList.remove("listening", "matched");
  els["mic-status"].textContent = "麦克风只在你开启后使用，声音不会上传。";
  els["detected-note"].textContent = "—";
  els["detected-cents"].textContent = "等待开始";
  els["tuner-needle"].style.left = "50%";
}

async function toggleMic() {
  if (micStream) { stopMic(); return; }
  if (!navigator.mediaDevices?.getUserMedia) {
    els["mic-status"].textContent = "这个浏览器无法使用麦克风识别，请换最新版 Chrome 或 Safari。";
    return;
  }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    micSource = audioContext.createMediaStreamSource(micStream);
    micAnalyser = audioContext.createAnalyser();
    micAnalyser.fftSize = 2048;
    micAnalyser.smoothingTimeConstant = 0;
    micBuffer = new Float32Array(micAnalyser.fftSize);
    micSource.connect(micAnalyser);
    els["mic-toggle"].textContent = "停止听琴";
    els["mic-toggle"].setAttribute("aria-pressed", "true");
    els["pitch-display"].classList.add("listening");
    els["mic-status"].textContent = "正在听：一次弹一个音，让它自然响 1 秒。";
    listenForPitch();
  } catch (error) {
    stopMic();
    if (error?.name === "NotAllowedError") {
      els["mic-status"].textContent = "麦克风没有开启。请在浏览器地址栏旁允许麦克风后重试。";
    } else {
      els["mic-status"].textContent = "没有收到麦克风声音，请检查输入设备后重试。";
    }
  }
}

function detectPitch(buffer, sampleRate) {
  let power = 0;
  let mean = 0;
  for (const sample of buffer) mean += sample;
  mean /= buffer.length;
  for (const sample of buffer) power += (sample - mean) ** 2;
  const rms = Math.sqrt(power / buffer.length);
  if (rms < 0.012) return null;

  const minLag = Math.floor(sampleRate / 1000);
  const maxLag = Math.min(Math.floor(sampleRate / 65), buffer.length - 2);
  const correlations = new Float32Array(maxLag + 1);
  for (let lag = 0; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - lag; i += 1) {
      correlation += (buffer[i] - mean) * (buffer[i + lag] - mean);
    }
    correlations[lag] = correlation;
  }

  let valley = minLag;
  while (valley < maxLag - 1 && correlations[valley] > correlations[valley + 1]) valley += 1;
  let bestLag = valley;
  for (let lag = valley + 1; lag <= maxLag; lag += 1) {
    if (correlations[lag] > correlations[bestLag]) bestLag = lag;
  }
  if (bestLag <= minLag || correlations[bestLag] < correlations[0] * 0.25) return null;

  const left = correlations[bestLag - 1];
  const center = correlations[bestLag];
  const right = correlations[bestLag + 1];
  const divisor = 2 * (2 * center - left - right);
  const refinedLag = divisor ? bestLag + (right - left) / divisor : bestLag;
  return sampleRate / refinedLag;
}

function pitchDetails(frequency) {
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const name = `${names[(midi % 12 + 12) % 12]}${Math.floor(midi / 12) - 1}`;
  const exactFrequency = 440 * 2 ** ((midi - 69) / 12);
  const cents = Math.round(1200 * Math.log2(frequency / exactFrequency));
  return { midi, name, cents };
}

let lastPitchCheck = 0;
function listenForPitch(time = 0) {
  if (!micAnalyser) return;
  micFrame = requestAnimationFrame(listenForPitch);
  if (time - lastPitchCheck < 90) return;
  lastPitchCheck = time;
  micAnalyser.getFloatTimeDomainData(micBuffer);
  const frequency = detectPitch(micBuffer, audioContext.sampleRate);
  if (!frequency) {
    els["detected-cents"].textContent = "请弹一个清楚的单音";
    return;
  }

  const result = pitchDetails(frequency);
  const targetMidi = midiFor(lessons[currentLesson].target);
  els["detected-note"].textContent = result.name;
  els["detected-cents"].textContent = Math.abs(result.cents) <= 5 ? "音准很稳" : result.cents < 0 ? `偏低 ${Math.abs(result.cents)} 音分` : `偏高 ${result.cents} 音分`;
  els["tuner-needle"].style.left = `${50 + Math.max(-45, Math.min(45, result.cents))}%`;
  const matched = result.midi === targetMidi;
  els["pitch-display"].classList.toggle("matched", matched);
  if (matched && lastDetectedMidi !== result.midi) {
    els["mic-status"].textContent = `音高正确：${result.name}。现在再连续弹对两次。`;
    flashKey(lessons[currentLesson].target);
  } else if (!matched) {
    els["mic-status"].textContent = `目标是 ${lessons[currentLesson].target}，现在听到 ${result.name}。`;
  }
  lastDetectedMidi = result.midi;
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3200);
}

function bindEvents() {
  els["week-list"].addEventListener("click", event => {
    const button = event.target.closest(".week-button");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (index > state.completed) { showToast(`先完成第 ${state.completed + 1} 周，再进入下一阶段 Boss 战。`); return; }
    currentLesson = index; renderLesson();
  });
  els.piano.addEventListener("pointerdown", event => {
    const key = event.target.closest(".piano-key"); if (!key) return;
    playTone(key.dataset.note); key.classList.add("active");
    if (key.dataset.note === lessons[currentLesson].target) showToast("找对了。记住它和黑键的位置关系。 ");
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(type => els.piano.addEventListener(type, () => document.querySelectorAll(".piano-key.active").forEach(k => k.classList.remove("active"))));
  els["practice-check"].addEventListener("change", () => els["complete-lesson"].disabled = !els["practice-check"].checked);
  els["complete-lesson"].addEventListener("click", completeLesson);
  els["listen-button"].addEventListener("click", playSequence);
  els.tempo.addEventListener("input", () => {
    els["tempo-value"].textContent = els.tempo.value;
    if (metronomeId) { toggleMetronome(); toggleMetronome(); }
  });
  els.metronome.addEventListener("click", toggleMetronome);
  els["mic-toggle"].addEventListener("click", toggleMic);
  els["timer-button"].addEventListener("click", toggleTimer);
  els["timer-reset"].addEventListener("click", resetTimer);
  els["label-toggle"].addEventListener("click", () => {
    const hidden = els.piano.classList.toggle("hide-labels");
    els["label-toggle"].textContent = `音名提示：${hidden ? "关" : "开"}`;
    els["label-toggle"].setAttribute("aria-pressed", String(!hidden));
  });
  els["sound-toggle"].addEventListener("click", () => {
    soundOn = !soundOn;
    els["sound-toggle"].innerHTML = `<span aria-hidden="true">♪</span> 练习音效：${soundOn ? "开" : "关"}`;
    els["sound-toggle"].setAttribute("aria-pressed", String(soundOn));
    if (!soundOn && metronomeId) toggleMetronome();
  });
  document.querySelectorAll(".mode-tab").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach(t => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", String(t === tab)); });
    els["score-card"].classList.toggle("staff-only", tab.dataset.mode === "staff");
    els["score-card"].classList.toggle("number-only", tab.dataset.mode === "number");
  }));
  document.getElementById("start-today").addEventListener("click", () => { document.getElementById("lesson-panel").scrollIntoView(); setTimeout(() => document.getElementById("lesson-panel").focus(), 500); });
  document.getElementById("jump-route").addEventListener("click", () => document.getElementById("route").scrollIntoView());
  document.getElementById("reset-progress").addEventListener("click", () => {
    const phrase = window.prompt("这是有风险的操作。输入“重新开始”才会清除 8 周进度：");
    if (phrase !== "重新开始") return;
    state.completed = 0; currentLesson = 0; saveState(); renderLesson(); showToast("进度已清除，从第 1 周重新开始。 ");
  });
  window.addEventListener("pagehide", stopMic);
}

renderPiano();
bindEvents();
renderLesson();
