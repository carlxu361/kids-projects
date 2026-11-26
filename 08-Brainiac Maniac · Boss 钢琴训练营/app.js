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

let state = loadState();
let currentLesson = Math.min(state.completed, lessons.length - 1);
let soundOn = true;
let audioContext;
let timerSeconds = 600;
let timerId = null;
let micStream, micSource, micAnalyser, micSink, micTimer, micRequest;
let studio;

const els = Object.fromEntries([
  "week-list", "lesson-kicker", "lesson-title", "lesson-difficulty", "lesson-goal", "ten-minute-plan",
  "exercise-name", "staff-wrap", "number-score", "score-hint", "coach-note", "keyboard-prompt",
  "practice-check", "complete-lesson", "lesson-preview",
  "timer-display", "timer-button", "timer-reset", "distance-number", "distance-fill",
  "sound-toggle", "toast", "score-card", "mic-toggle", "mic-guide", "mic-heard"
].map(id => [id, document.getElementById(id)]));

function getAudioContext() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

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
  els["ten-minute-plan"].innerHTML = lesson.plan.map(step => `
    <article class="plan-step"><span>${step[0]}</span><strong>${step[1]}</strong><small>${step[2]}</small></article>`).join("");
  renderStaff(lesson.notes);
  els["number-score"].innerHTML = lesson.numbers.map((note, i) => `<span class="number-note"><small>${i + 1}</small>${note}</span>`).join("");
  studio.lessonChanged();
  els["practice-check"].checked = false;
  els["complete-lesson"].disabled = true;
  els["complete-lesson"].textContent = currentLesson < state.completed ? "这关已经完成" : currentLesson === 7 ? "完成演奏，击败 Boss" : "完成训练，削弱 Boss";
  renderSidebar();
  updateProgress();
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
      studio.cue(["C5"]);
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerId); timerId = null; timerSeconds = 600; updateTimer(); els["timer-button"].textContent = "开始计时";
}

function updateProgress() {
  const percent = 100 * (1 - state.completed / lessons.length);
  els["distance-fill"].style.width = `${percent}%`;
  els["distance-number"].textContent = `${Math.round(percent)}%`;
}

function completeLesson() {
  if (currentLesson < state.completed) { showToast("这一关已经完成，可以继续复习。 "); return; }
  if (currentLesson !== state.completed) return;
  state.completed = Math.min(8, state.completed + 1); saveState();
  showToast(state.completed === 8 ? "Boss 能量清零！现在录下你的完整演奏吧。" : `Boss 被削弱！已解锁第 ${state.completed + 1} 周。`);
  studio.cue(["C4", "E4", "G4"]);
  if (state.completed < 8) currentLesson = state.completed;
  renderLesson();
}

function stopMic(message = "用麦克风听真实钢琴，逐音跟练。建议先松开踏板，一次弹一个音。音频只在本机分析。") {
  micRequest = null;
  clearInterval(micTimer);
  micSource?.disconnect();
  micAnalyser?.disconnect();
  micSink?.disconnect();
  micStream?.getTracks().forEach(track => track.stop());
  micSource = micStream = micAnalyser = micSink = null;
  els["mic-toggle"].textContent = "用真实钢琴跟练";
  els["mic-toggle"].setAttribute("aria-pressed", "false");
  studio.stopFollow();
  els["mic-guide"].textContent = message;
  els["mic-heard"].textContent = "";
}

async function startMic() {
  if (micStream || micRequest) { stopMic(); return; }
  if (!navigator.mediaDevices?.getUserMedia) {
    els["mic-guide"].textContent = "请在 HTTPS 网页或 localhost 打开，再允许使用麦克风。";
    return;
  }
  studio.stopFollow();
  const request = {};
  micRequest = request;
  els["mic-toggle"].textContent = "取消开启麦克风";
  els["mic-guide"].textContent = "请在浏览器提示里允许使用麦克风。";
  try {
    const context = getAudioContext();
    await context.resume();
    if (micRequest !== request) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    if (micRequest !== request) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    micStream = stream;
    stream.getAudioTracks()[0]?.addEventListener("ended", () => {
      if (micStream === stream) stopMic("麦克风已断开，可以重新开启跟练。");
    });
    micSource = context.createMediaStreamSource(stream);
    micAnalyser = context.createAnalyser();
    micAnalyser.fftSize = 4096;
    // Keep the input graph rendering without feeding the microphone to the speakers.
    micSink = context.createGain();
    micSink.gain.value = 0;
    micSource.connect(micAnalyser).connect(micSink).connect(context.destination);
    els["mic-toggle"].textContent = "结束麦克风跟练";
    els["mic-toggle"].setAttribute("aria-pressed", "true");
    studio.startMicFollow();
    micTimer = trackPianoPitch(context, micAnalyser, midi => {
      if (studio.hear(midi) === "done") stopMic("本段已弹完，可以重新跟练或换一首。");
    });
  } catch (error) {
    if (micRequest !== request) return;
    stopMic(error.name === "NotAllowedError"
      ? "麦克风权限未开启。可以在浏览器地址栏授权，或使用网页琴键。"
      : "无法读取麦克风。请检查输入设备，或使用网页琴键。");
  }
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
  els["practice-check"].addEventListener("change", () => els["complete-lesson"].disabled = !els["practice-check"].checked);
  els["complete-lesson"].addEventListener("click", completeLesson);
  els["lesson-preview"].addEventListener("click", () => studio.previewLesson());
  els["mic-toggle"].addEventListener("click", startMic);
  els["timer-button"].addEventListener("click", toggleTimer);
  els["timer-reset"].addEventListener("click", resetTimer);
  els["sound-toggle"].addEventListener("click", () => {
    soundOn = !soundOn;
    els["sound-toggle"].innerHTML = `<span aria-hidden="true">♪</span> 网页声音：${soundOn ? "开" : "关"}`;
    els["sound-toggle"].setAttribute("aria-pressed", String(soundOn));
    if (!soundOn) studio.mute();
  });
  document.querySelectorAll(".mode-tab").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach(t => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", String(t === tab)); });
    els["score-card"].classList.toggle("staff-only", tab.dataset.mode === "staff");
    els["score-card"].classList.toggle("number-only", tab.dataset.mode === "number");
  }));
  document.getElementById("reset-progress").addEventListener("click", () => {
    const phrase = window.prompt("这是有风险的操作。输入“重新开始”才会清除 8 周进度：");
    if (phrase !== "重新开始") return;
    state.completed = 0; currentLesson = 0; saveState(); renderLesson(); showToast("进度已清除，从第 1 周重新开始。 ");
  });
  window.addEventListener("pagehide", () => { stopMic(); studio.mute(); });
}

studio = createStudio({
  getContext: getAudioContext,
  getLesson: () => lessons[currentLesson],
  onMic: () => { if (micRequest || micStream) stopMic(); },
  enabled: () => soundOn,
  notify: showToast
});
bindEvents();
renderLesson();
