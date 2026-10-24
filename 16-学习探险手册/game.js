const STORAGE_KEY = "final-review-camp-progress-v3";
const DIFFICULTY_NAMES = { 1: "基础", 2: "提升", 3: "挑战" };
const TYPE_NAMES = { choice: "选择题", truefalse: "判断题", fill: "填空题", input: "输入题", correction: "改错题", matching: "连线题", multiselect: "多选题", ordering: "排序题" };
const SHOP_ITEMS = {
  hint: { cost: 40 },
  double: { cost: 80 },
  shield: { cost: 60 },
  snack: { cost: 30 },
  ocean: { cost: 160 },
  detective: { cost: 120 }
};

const GRADE_NAMES = { 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六" };
const GRADE_DESCRIPTIONS = {
  1: { chinese: "拼音、反义词、量词与完整句。", math: "20以内加减、比较与认识图形。", english: "字母、问候、数字与颜色启蒙。" },
  2: { chinese: "部首、标点、词语搭配与句子顺序。", math: "两位数计算、乘法口诀、长度与时间。", english: "自我介绍、家庭、动物与简单句。" },
  3: { chinese: "修辞、近义词、病句与阅读证据。", math: "乘除法、周长与分数初步。", english: "问候、颜色、数量与名词复数。" },
  4: { chinese: "关联词、说明方法、修辞与概括。", math: "大数、运算顺序、角与小数。", english: "进行时、星期、能力与方位。" },
  5: { chinese: "古诗、汉字、名著、人物描写与阅读方法。", math: "因数倍数、长方体、分数、图形与统计。", english: "Unit 1–12 词汇、句型、方向与过去时。" },
  6: { chinese: "修辞作用、文言词义、病句与文章主旨。", math: "分数、百分数、比与圆。", english: "过去时、比较级、将来时与情态动词。" }
};
const PET_INFO = {
  cat: { name: "墨团猫", icon: "猫", subject: "chinese", skill: "语文题答对时额外获得 1 点能量", cost: 0 },
  fox: { name: "几何狐", icon: "狐", subject: "math", skill: "数学题答对时额外获得 1 点能量", cost: 100 },
  owl: { name: "单词鸮", icon: "鸮", subject: "english", skill: "英语题答对时额外获得 1 点能量", cost: 100 }
};

const blankSubjectStats = () => ({
  chinese: { answered: 0, correct: 0, sessions: 0 },
  math: { answered: 0, correct: 0, sessions: 0 },
  english: { answered: 0, correct: 0, sessions: 0 }
});

const defaultProgress = () => ({
  points: 0,
  sessions: 0,
  answered: 0,
  correct: 0,
  bestStreak: 0,
  grade: 5,
  theme: "classroom",
  questionHistory: {},
  recentQuestions: [],
  inventory: { hint: 0, double: 0, shield: 0, snack: 0 },
  unlockedThemes: ["classroom", "forest", "space"],
  title: null,
  subjects: {
    chinese: { answered: 0, correct: 0, sessions: 0 },
    math: { answered: 0, correct: 0, sessions: 0 },
    english: { answered: 0, correct: 0, sessions: 0 }
  },
  gradeStats: {},
  pets: {
    cat: { owned: false, xp: 0 },
    fox: { owned: false, xp: 0 },
    owl: { owned: false, xp: 0 }
  },
  activePet: null,
  wrongBook: []
});

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return defaultProgress();
    const clean = defaultProgress();
    const loaded = {
      ...clean,
      ...saved,
      subjects: { ...clean.subjects, ...(saved.subjects || {}) },
      inventory: { ...clean.inventory, ...(saved.inventory || {}) },
      recentQuestions: Array.isArray(saved.recentQuestions) ? saved.recentQuestions : [],
      unlockedThemes: Array.isArray(saved.unlockedThemes) ? saved.unlockedThemes : clean.unlockedThemes,
      wrongBook: Array.isArray(saved.wrongBook) ? saved.wrongBook : []
    };
    loaded.pets = Object.fromEntries(Object.keys(PET_INFO).map((id) => [id, { ...clean.pets[id], ...(saved.pets?.[id] || {}) }]));
    loaded.grade = Number(saved.grade) >= 1 && Number(saved.grade) <= 6 ? Number(saved.grade) : 5;
    loaded.gradeStats = { ...(saved.gradeStats || {}) };
    if (!loaded.gradeStats["5"]) loaded.gradeStats["5"] = loaded.subjects;
    return loaded;
  } catch (error) {
    return defaultProgress();
  }
}

let progress = loadProgress();
let session = null;
let wrongFilter = "all";
const scratchState = { strokes: [], current: null, drawing: false };
const miniGameState = { type: null, target: null, selected: new Set(), flipped: [], matched: new Set(), locked: false, rewarded: false };
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const screens = {
  home: $("#homeScreen"),
  quiz: $("#quizScreen"),
  summary: $("#summaryScreen"),
  wrongBook: $("#wrongBookScreen"),
  shop: $("#shopScreen"),
  game: $("#gameScreen"),
  pet: $("#petScreen")
};

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function percent(correct, answered) {
  return answered ? Math.round((correct / answered) * 100) : 0;
}

function getGradeStats(grade = progress.grade) {
  const key = String(grade);
  if (!progress.gradeStats[key]) progress.gradeStats[key] = blankSubjectStats();
  return progress.gradeStats[key];
}

function getQuestionBank(grade, subject) {
  return Number(grade) === 5 ? QUESTION_BANK[subject] : (GRADE_QUESTION_BANKS[grade]?.[subject] || []);
}

function renderGradeUI() {
  const grade = Number(progress.grade);
  const gradeName = `${GRADE_NAMES[grade]}年级`;
  $("#gradeTitle").textContent = gradeName;
  $("#brandGrade").textContent = `${gradeName} · 学习训练`;
  $("#heroEyebrow").textContent = `${gradeName} · 全册能力训练`;
  $("#gradeStatus").textContent = grade === 5
    ? "完整教材题库 · 人教版语文数学、湘少版英语"
    : "基础能力题库 · 每科 4 道 · 暂不冒充完整教材单元";
  $$("[data-grade]").forEach((button) => button.classList.toggle("active", Number(button.dataset.grade) === grade));
  $("#chineseEdition").textContent = grade === 5 ? "语文 · 人教版" : "语文 · 基础题库";
  $("#mathEdition").textContent = grade === 5 ? "数学 · 人教版" : "数学 · 基础题库";
  $("#englishEdition").textContent = grade === 5 ? "英语 · 湘少版" : grade <= 2 ? "英语 · 启蒙题库" : "英语 · 基础题库";
  Object.entries(GRADE_DESCRIPTIONS[grade]).forEach(([subject, description]) => {
    $(`#${subject}Description`).textContent = description;
  });
}

function setGrade(grade) {
  progress.grade = Number(grade);
  getGradeStats(progress.grade);
  saveProgress();
  renderHome();
  showToast(`已切换到${GRADE_NAMES[progress.grade]}年级`);
}

function petLevel(xp) {
  return Math.min(10, Math.floor(xp / 50) + 1);
}

function renderPetHome() {
  const petId = progress.activePet;
  if (!petId || !progress.pets[petId]?.owned) {
    $("#homePetIcon").textContent = "◇";
    $("#homePetName").textContent = "还没有出战宠物";
    $("#homePetSummary").textContent = "领养宠物后，答对应学科可获得额外能量。";
    return;
  }
  const pet = PET_INFO[petId];
  const level = petLevel(progress.pets[petId].xp);
  $("#homePetIcon").textContent = pet.icon;
  $("#homePetName").textContent = `${pet.name} · Lv.${level}`;
  $("#homePetSummary").textContent = pet.skill;
}

function renderHome() {
  renderGradeUI();
  renderPetHome();
  $("#totalPoints").textContent = progress.points;
  $("#headerEnergy").textContent = progress.points;
  $("#sessionCount").textContent = progress.sessions;
  $("#accuracyValue").textContent = progress.answered ? `${percent(progress.correct, progress.answered)}%` : "—";
  $("#bestStreak").textContent = progress.bestStreak;

  const gradeStats = getGradeStats();
  Object.keys(SUBJECT_INFO).forEach((subject) => {
    const stats = gradeStats[subject];
    const rate = percent(stats.correct, stats.answered);
    $(`#${subject}Progress`).style.width = stats.answered ? `${rate}%` : "0%";
    const bankSize = getQuestionBank(progress.grade, subject).length;
    $(`#${subject}Stats`).textContent = stats.answered ? `已答 ${stats.answered} 题 · 正确率 ${rate}%` : `题库 ${bankSize} 道 · 还未训练`;
  });

  const activeWrong = progress.wrongBook.filter((item) => !item.mastered && Number(item.grade || 5) === Number(progress.grade)).length;
  $("#wrongCountBadge").textContent = activeWrong;
  $("#wrongBookSummary").textContent = activeWrong
    ? `目前有 ${activeWrong} 道题需要再证明一次。`
    : "答错的题会自动来到这里。";
  $("#hintCount").textContent = progress.inventory.hint;
  $("#activeTitle").hidden = !progress.title;
  $("#activeTitle").textContent = progress.title ? `当前称号：${progress.title}` : "";
}

function ensureThemeOptions() {
  const select = $("#themeSelect");
  if (progress.unlockedThemes.includes("ocean") && !select.querySelector('option[value="ocean"]')) {
    const option = document.createElement("option");
    option.value = "ocean";
    option.textContent = "深海实验室";
    select.append(option);
  }
}

function applyTheme(theme) {
  ensureThemeOptions();
  if (!progress.unlockedThemes.includes(theme)) theme = "classroom";
  progress.theme = theme;
  document.documentElement.dataset.theme = theme;
  $("#themeSelect").value = theme;
  const color = theme === "space" ? "#121d35" : theme === "forest" ? "#173e35" : theme === "ocean" ? "#08364a" : "#17324d";
  document.querySelector('meta[name="theme-color"]').setAttribute("content", color);
  saveProgress();
  redrawScratch();
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function cloneQuestion(question, subject, grade = progress.grade) {
  return JSON.parse(JSON.stringify({ ...question, subject, grade: Number(grade) }));
}

function weakestSubject() {
  const subjects = Object.keys(SUBJECT_INFO);
  const gradeStats = getGradeStats();
  const untrained = subjects.filter((key) => gradeStats[key].answered === 0);
  if (untrained.length) return randomItem(untrained);
  return subjects.sort((a, b) => {
    const aStats = gradeStats[a];
    const bStats = gradeStats[b];
    return percent(aStats.correct, aStats.answered) - percent(bStats.correct, bStats.answered);
  })[0];
}

function startSubject(subject, options = {}) {
  const wrongQueue = options.wrongQueue || [];
  const mode = wrongQueue.length ? "wrong" : "normal";
  const grade = mode === "wrong" ? Number(wrongQueue[0]?.grade || progress.grade) : Number(progress.grade);
  const bank = getQuestionBank(grade, subject);
  const coreTarget = mode === "wrong" ? Math.min(10, wrongQueue.length) : Math.min(10, bank.length);
  const energyMultiplier = mode === "normal" && progress.inventory.double > 0 ? 2 : 1;
  if (energyMultiplier === 2) {
    progress.inventory.double -= 1;
    showToast("双倍能量券已自动启用");
  }

  session = {
    subject,
    grade,
    mode,
    coreTarget,
    answeredCore: 0,
    correctCore: 0,
    totalCorrect: 0,
    totalAsked: 0,
    points: 0,
    streak: 0,
    difficulty: 1,
    energyMultiplier,
    shieldAvailable: progress.inventory.shield > 0,
    scanUsed: false,
    usedIds: new Set(),
    pendingTransfer: null,
    current: null,
    mistakes: {},
    wrongQueue: shuffled(wrongQueue)
  };

  $("#quizSubject").textContent = mode === "wrong" ? `${GRADE_NAMES[grade]}年级错题训练` : `${GRADE_NAMES[grade]}年级 · ${SUBJECT_INFO[subject].route}`;
  saveProgress();
  showScreen("quiz");
  nextQuestion();
}

function pickNormalQuestion() {
  const bank = getQuestionBank(session.grade, session.subject);
  const unusedAll = bank.filter((question) => !session.usedIds.has(question.id));
  const unseenRecently = unusedAll.filter((question) => !progress.recentQuestions.includes(`${session.grade}-${session.subject}-${question.id}`));
  const unused = unseenRecently.length >= Math.min(4, session.coreTarget - session.answeredCore) ? unseenRecently : unusedAll;
  let candidates = unused.filter((question) => question.difficulty === session.difficulty);
  if (!candidates.length) {
    candidates = unused.filter((question) => Math.abs(question.difficulty - session.difficulty) <= 1);
  }
  if (!candidates.length) {
    candidates = unused;
  }
  if (!candidates.length) return null;

  // 优先选择本轮还没出现过的知识点，让 10 道题覆盖得更广。
  const usedTopics = new Set(
    [...session.usedIds]
      .map((id) => bank.find((question) => question.id === id)?.topic)
      .filter(Boolean)
  );
  const freshTopicQuestions = candidates.filter((question) => !usedTopics.has(question.topic));
  const topicPool = freshTopicQuestions.length ? freshTopicQuestions : candidates;
  const minSeen = Math.min(...topicPool.map((question) => progress.questionHistory[`${session.grade}-${session.subject}-${question.id}`] || 0));
  const leastSeen = topicPool.filter((question) => (progress.questionHistory[`${session.grade}-${session.subject}-${question.id}`] || 0) === minSeen);
  const chosen = randomItem(leastSeen);
  session.usedIds.add(chosen.id);
  return cloneQuestion(chosen, session.subject, session.grade);
}

function pickWrongQuestion() {
  const item = session.wrongQueue[session.answeredCore];
  return item ? cloneQuestion(item.question, item.subject, item.grade || session.grade) : null;
}

function nextQuestion() {
  if (session.pendingTransfer) {
    session.current = session.pendingTransfer;
    session.pendingTransfer = null;
  } else if (session.answeredCore >= session.coreTarget) {
    finishSession();
    return;
  } else {
    session.current = session.mode === "wrong" ? pickWrongQuestion() : pickNormalQuestion();
  }

  if (!session.current) {
    finishSession();
    return;
  }
  renderQuestion();
}

function renderQuestion() {
  const question = session.current;
  const isTransfer = Boolean(question.isTransfer);
  $("#difficultyLabel").textContent = isTransfer ? "举一反三" : DIFFICULTY_NAMES[question.difficulty || session.difficulty];
  $("#questionCounter").textContent = isTransfer
    ? "加练题"
    : `第 ${Math.min(session.answeredCore + 1, session.coreTarget)} / ${session.coreTarget} 题`;
  $("#quizProgress").style.width = `${(session.answeredCore / session.coreTarget) * 100}%`;
  $("#topicLabel").textContent = question.topic || "错题复习";
  $("#typeLabel").textContent = TYPE_NAMES[question.type] || "练习题";
  setFormattedText($("#questionTitle"), question.prompt);
  setFormattedText($("#questionNote"), question.note || "想清楚后再作答，不用抢时间。");
  $("#formMessage").textContent = "";
  $("#answerArea").replaceChildren(renderAnswerArea(question));
  $("#submitAnswerButton").disabled = false;
  $("#hintMessage").textContent = "";
  $("#hintCount").textContent = progress.inventory.hint;
  $("#useHintButton").disabled = progress.inventory.hint < 1;
  $("#conditionScanButton").hidden = progress.title !== "避坑侦探";
  $("#conditionScanButton").disabled = session.scanUsed;
  session.hintUsed = false;
  clearScratch();
  requestAnimationFrame(resizeScratchCanvas);
  renderRoundStats();

  const firstControl = $("#answerArea input, #answerArea select");
  if (firstControl) setTimeout(() => firstControl.focus(), 80);
}

function renderAnswerArea(question) {
  const wrapper = document.createElement("div");

  if (question.type === "choice" || question.type === "truefalse" || question.type === "multiselect") {
    wrapper.className = "choice-list";
    if (question.type === "multiselect") {
      const note = document.createElement("p");
      note.className = "multi-note";
      note.textContent = "这题可能有多个正确答案，要全部选对。";
      wrapper.append(note);
    }
    question.choices.forEach((choice, index) => {
      const label = document.createElement("label");
      label.className = "choice-option";
      const input = document.createElement("input");
      input.type = question.type === "multiselect" ? "checkbox" : "radio";
      input.name = "answer";
      input.value = choice;
      const letter = document.createElement("span");
      letter.className = "choice-letter";
      letter.textContent = String.fromCharCode(65 + index);
      const text = document.createElement("span");
      setFormattedText(text, choice);
      label.append(input, letter, text);
      wrapper.append(label);
    });
  } else if (question.type === "matching") {
    wrapper.className = "matching-list";
    const choices = shuffled(question.pairs.map((pair) => pair.right));
    question.pairs.forEach((pair, index) => {
      const row = document.createElement("label");
      row.className = "matching-row";
      const left = document.createElement("strong");
      setFormattedText(left, pair.left);
      const arrow = document.createElement("span");
      arrow.textContent = "→";
      const select = document.createElement("select");
      select.name = `match-${index}`;
      select.dataset.left = pair.left;
      select.innerHTML = '<option value="">请选择</option>';
      choices.forEach((choice) => {
        const option = document.createElement("option");
        option.value = choice;
        option.textContent = choice;
        select.append(option);
      });
      row.append(left, arrow, select);
      wrapper.append(row);
    });
  } else if (question.type === "ordering") {
    wrapper.className = "ordering-answer";
    const pool = document.createElement("div");
    pool.className = "order-pool";
    const result = document.createElement("div");
    result.className = "order-result";
    result.setAttribute("aria-label", "你选择的顺序");
    shuffled(question.items).forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "order-chip";
      button.dataset.value = item;
      setFormattedText(button, item);
      button.addEventListener("click", () => {
        const selected = document.createElement("span");
        selected.className = "order-chip";
        selected.dataset.value = item;
        setFormattedText(selected, item);
        result.append(selected);
        button.disabled = true;
      });
      pool.append(button);
    });
    const controls = document.createElement("div");
    controls.className = "order-controls";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "重新排序";
    reset.addEventListener("click", () => {
      result.replaceChildren();
      pool.querySelectorAll("button").forEach((button) => { button.disabled = false; });
    });
    controls.append(reset);
    wrapper.append(pool, result, controls);
  } else {
    const input = document.createElement("input");
    input.className = "text-answer";
    input.type = "text";
    input.name = "answer";
    input.autocomplete = "off";
    input.placeholder = question.type === "fill" ? "填写横线上的内容" : question.type === "correction" ? "写出改正后的答案" : "输入答案";
    input.setAttribute("aria-label", input.placeholder);
    wrapper.append(input);
  }
  return wrapper;
}

function collectAnswer(question) {
  if (question.type === "choice" || question.type === "truefalse") {
    return $("#answerArea input:checked")?.value || "";
  }
  if (question.type === "matching") {
    return [...$("#answerArea").querySelectorAll("select")].map((select) => ({ left: select.dataset.left, right: select.value }));
  }
  if (question.type === "multiselect") {
    return [...$("#answerArea").querySelectorAll("input:checked")].map((input) => input.value);
  }
  if (question.type === "ordering") {
    return [...$("#answerArea").querySelectorAll(".order-result .order-chip")].map((item) => item.dataset.value);
  }
  return $("#answerArea input")?.value.trim() || "";
}

function normalize(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[，。！？,.!?'’“”\s]/g, "")
    .replace(/立方厘米/g, "cm3")
    .replace(/平方厘米/g, "cm2")
    .replace(/毫升/g, "ml")
    .replace(/升/g, "l")
    .replace(/³/g, "3")
    .replace(/²/g, "2");
}

function setFormattedText(element, text) {
  element.replaceChildren();
  const parts = String(text).split(/(\d+\s*\/\s*\d+)/g);
  parts.forEach((part) => {
    const match = part.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!match) {
      element.append(document.createTextNode(part));
      return;
    }
    const fraction = document.createElement("span");
    fraction.className = "fraction";
    fraction.setAttribute("aria-label", `${match[2]} 分之 ${match[1]}`);
    const numerator = document.createElement("span");
    numerator.className = "fraction-numerator";
    numerator.textContent = match[1];
    const denominator = document.createElement("span");
    denominator.className = "fraction-denominator";
    denominator.textContent = match[2];
    fraction.append(numerator, denominator);
    element.append(fraction);
  });
}

function isCorrectAnswer(question, answer) {
  if (question.type === "matching") {
    if (answer.some((pair) => !pair.right)) return false;
    return question.pairs.every((pair) => answer.some((choice) => choice.left === pair.left && choice.right === pair.right));
  }
  if (question.type === "multiselect") {
    const expected = question.answer.map(normalize).sort();
    const actual = answer.map(normalize).sort();
    return expected.length === actual.length && expected.every((item, index) => item === actual[index]);
  }
  if (question.type === "ordering") {
    return question.answer.length === answer.length && question.answer.every((item, index) => normalize(item) === normalize(answer[index]));
  }
  const accepted = Array.isArray(question.answer) ? question.answer : [question.answer];
  return accepted.some((candidate) => normalize(candidate) === normalize(answer));
}

function readableAnswer(question) {
  if (question.type === "matching") return question.pairs.map((pair) => `${pair.left} → ${pair.right}`).join("；");
  if (question.type === "multiselect") return question.answer.join("、");
  if (question.type === "ordering") return question.answer.join(" → ");
  return Array.isArray(question.answer) ? question.answer[0] : question.answer;
}

function submitAnswer(event) {
  event.preventDefault();
  const question = session.current;
  const answer = collectAnswer(question);
  const missing = question.type === "matching"
    ? answer.some((pair) => !pair.right)
    : (question.type === "multiselect" || question.type === "ordering")
      ? answer.length === 0
      : !answer;
  if (missing) {
    $("#formMessage").textContent = question.type === "matching" ? "请把每一项都连好。" : "请先填写或选择答案。";
    return;
  }

  $("#submitAnswerButton").disabled = true;
  const correct = isCorrectAnswer(question, answer);
  const isTransfer = Boolean(question.isTransfer);
  const activePet = progress.activePet ? PET_INFO[progress.activePet] : null;
  const petBonus = correct && activePet?.subject === (question.subject || session.subject) ? 1 : 0;
  let earned = correct ? (isTransfer ? 8 : 10 + (question.difficulty - 1) * 5) : 2;
  earned = (earned + petBonus) * session.energyMultiplier;

  session.totalAsked += 1;
  session.points += earned;
  progress.points += earned;
  $("#headerEnergy").textContent = progress.points;
  progress.answered += 1;
  const gradeStats = getGradeStats(question.grade || session.grade);
  gradeStats[question.subject || session.subject].answered += 1;

  if (correct) {
    session.totalCorrect += 1;
    session.streak += 1;
    progress.correct += 1;
    gradeStats[question.subject || session.subject].correct += 1;
    progress.bestStreak = Math.max(progress.bestStreak, session.streak);
    if (session.mode === "wrong" && !isTransfer) {
      const masteredItem = progress.wrongBook.find((item) => item.id === `${question.grade || session.grade}-${question.subject || session.subject}-${question.id}`);
      if (masteredItem) masteredItem.mastered = true;
    }
  } else {
    if (session.shieldAvailable && session.streak > 0) {
      progress.inventory.shield -= 1;
      session.shieldAvailable = false;
      showToast("连胜保护章生效：连续答对次数保住了");
    } else {
      session.streak = 0;
    }
    const topic = question.topic || "未分类";
    session.mistakes[topic] = (session.mistakes[topic] || 0) + 1;
    addToWrongBook(question, answer);
    if (!isTransfer && question.transfer) {
      session.pendingTransfer = cloneQuestion({ ...question.transfer, isTransfer: true }, question.subject || session.subject, question.grade || session.grade);
    }
  }

  if (!isTransfer) {
    session.answeredCore += 1;
    if (correct) session.correctCore += 1;
    gainPetXp(correct ? 5 : 2);
    const historyKey = `${question.grade || session.grade}-${question.subject || session.subject}-${question.id}`;
    progress.questionHistory[historyKey] = (progress.questionHistory[historyKey] || 0) + 1;
    progress.recentQuestions.push(historyKey);
    progress.recentQuestions = progress.recentQuestions.slice(-30);
  }

  adaptDifficulty(correct);
  saveProgress();
  showFeedback(correct, question, answer, earned);
}

function adaptDifficulty(correct) {
  if (correct && session.streak >= 2 && session.difficulty < 3) {
    session.difficulty += 1;
    session.streak = 0;
  } else if (!correct && session.difficulty > 1) {
    session.difficulty -= 1;
  }
}

function addToWrongBook(question, answer) {
  const subject = question.subject || session.subject;
  const grade = Number(question.grade || session.grade);
  const id = `${grade}-${subject}-${question.id}`;
  const safeQuestion = JSON.parse(JSON.stringify(question));
  delete safeQuestion.transfer;
  safeQuestion.isTransfer = false;

  const existing = progress.wrongBook.find((item) => item.id === id);
  const entry = {
    id,
    grade,
    subject,
    topic: question.topic,
    prompt: question.prompt,
    wrongAnswer: question.type === "matching" ? answer.map((pair) => `${pair.left}→${pair.right}`).join("；") : Array.isArray(answer) ? answer.join("、") : answer,
    correctAnswer: readableAnswer(question),
    explanation: question.explanation,
    question: safeQuestion,
    mastered: false,
    lastWrongAt: new Date().toISOString()
  };

  if (existing) Object.assign(existing, entry);
  else progress.wrongBook.unshift(entry);
}

function showFeedback(correct, question, answer, earned) {
  const card = $("#feedbackOverlay .feedback-card");
  card.classList.toggle("correct", correct);
  card.classList.toggle("wrong", !correct);
  $("#feedbackMark").textContent = correct ? "✓" : "×";
  $("#feedbackKicker").textContent = correct ? `回答正确 · +${earned} 能量` : `先补漏洞 · +${earned} 能量`;
  $("#feedbackTitle").textContent = correct ? "方法掌握了" : "这一步要重新想";
  setFormattedText($("#answerLine"), correct
    ? `你的答案：${readableAnswer(question)}`
    : `正确答案：${readableAnswer(question)}`);
  setFormattedText($("#explanationText"), question.explanation);
  $("#transferNotice").hidden = !session.pendingTransfer;
  $("#nextQuestionButton").textContent = session.pendingTransfer ? "做举一反三题" : (session.answeredCore >= session.coreTarget ? "查看本轮报告" : "下一题");
  $("#feedbackOverlay").hidden = false;
  setTimeout(() => $("#nextQuestionButton").focus(), 80);
}

function closeFeedbackAndContinue() {
  $("#feedbackOverlay").hidden = true;
  nextQuestion();
}

function renderRoundStats() {
  $("#roundCorrect").textContent = session.totalCorrect;
  $("#roundStreak").textContent = session.streak;
  $("#roundPoints").textContent = session.points;
}

function finishSession() {
  progress.sessions += 1;
  getGradeStats(session.grade)[session.subject].sessions += 1;
  saveProgress();

  const accuracy = percent(session.correctCore, session.coreTarget);
  $("#summaryCorrect").textContent = `${session.correctCore}/${session.coreTarget}`;
  $("#summaryPoints").textContent = `+${session.points}`;
  $("#summaryLevel").textContent = DIFFICULTY_NAMES[session.difficulty];
  $("#summaryStamp").textContent = accuracy >= 90 ? "稳稳掌握" : accuracy >= 70 ? "继续加固" : "发现漏洞";
  $("#summaryTitle").textContent = accuracy >= 90 ? "这条路线很稳！" : accuracy >= 70 ? "基础不错，再补两处" : "漏洞找到了，正好补上";
  $("#summaryMessage").textContent = accuracy >= 90
    ? "别只重复会的题，下一轮可以换一科。"
    : "先看下面的薄弱点，再去错题本做一次证明。";

  const weakTopics = Object.entries(session.mistakes).sort((a, b) => b[1] - a[1]);
  const list = $("#weakTopicList");
  list.replaceChildren();
  if (!weakTopics.length) {
    const item = document.createElement("span");
    item.textContent = "本轮没有明显薄弱点";
    list.append(item);
  } else {
    weakTopics.forEach(([topic, count]) => {
      const item = document.createElement("span");
      item.textContent = `${topic} · 错 ${count} 次`;
      list.append(item);
    });
  }

  renderHome();
  showScreen("summary");
}

function openWrongBook() {
  renderWrongBook();
  showScreen("wrongBook");
}

function filteredWrongItems() {
  return progress.wrongBook.filter((item) => !item.mastered && Number(item.grade || 5) === Number(progress.grade) && (wrongFilter === "all" || item.subject === wrongFilter));
}

function renderWrongBook() {
  const items = filteredWrongItems();
  const list = $("#wrongList");
  list.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<strong>这一页是空的</strong><span>完成训练后，答错的题会自动记录在这里。</span>";
    list.append(empty);
  } else {
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "wrong-item";
      const tag = document.createElement("span");
      tag.className = "wrong-item-tag";
      tag.textContent = `${GRADE_NAMES[item.grade || 5]}年级 · ${SUBJECT_INFO[item.subject].name}`;
      const content = document.createElement("div");
      const title = document.createElement("h3");
      setFormattedText(title, item.prompt);
      const detail = document.createElement("p");
      setFormattedText(detail, `知识点：${item.topic} · 正确答案：${item.correctAnswer}`);
      content.append(title, detail);
      const button = document.createElement("button");
      button.className = "master-button";
      button.type = "button";
      button.textContent = "标记已掌握";
      button.addEventListener("click", () => {
        item.mastered = true;
        saveProgress();
        renderWrongBook();
        renderHome();
      });
      card.append(tag, content, button);
      list.append(card);
    });
  }
  $("#startWrongPracticeButton").disabled = items.length === 0;
}

function startWrongPractice() {
  const items = filteredWrongItems();
  if (!items.length) return;
  const subjectCounts = items.reduce((counts, item) => {
    counts[item.subject] = (counts[item.subject] || 0) + 1;
    return counts;
  }, {});
  const subject = wrongFilter !== "all"
    ? wrongFilter
    : Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0][0];
  const queue = items.filter((item) => item.subject === subject);
  startSubject(subject, { wrongQueue: queue });
}

function clearMasteredWrong() {
  progress.wrongBook = progress.wrongBook.filter((item) => !item.mastered);
  saveProgress();
  renderWrongBook();
  renderHome();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2200);
}

function useHint() {
  if (!session || session.hintUsed || progress.inventory.hint < 1) return;
  const question = session.current;
  progress.inventory.hint -= 1;
  session.hintUsed = true;
  $("#hintCount").textContent = progress.inventory.hint;
  $("#useHintButton").disabled = true;

  let message = "提示已经放在题目旁边。";
  if (question.type === "choice" || question.type === "truefalse") {
    const wrongOptions = [...$("#answerArea").querySelectorAll(".choice-option")]
      .filter((label) => normalize(label.querySelector("input").value) !== normalize(question.answer));
    shuffled(wrongOptions).slice(0, Math.min(2, wrongOptions.length)).forEach((label) => {
      label.querySelector("input").disabled = true;
      label.style.opacity = ".38";
    });
    message = "已排除两个错误选项。注意：剩下的仍要自己判断。";
  } else if (question.type === "multiselect") {
    message = `正确答案一共有 ${question.answer.length} 个。`;
  } else if (question.type === "ordering") {
    message = `第一步是：${question.answer[0]}`;
  } else if (question.type === "matching") {
    message = `先确定这一组：${question.pairs[0].left} → ${question.pairs[0].right}`;
  } else {
    const answer = String(readableAnswer(question));
    message = `答案开头是“${answer.slice(0, Math.min(2, answer.length))}…”`;
  }
  setFormattedText($("#hintMessage"), message);
  saveProgress();
  renderHome();
}

function useConditionScan() {
  if (!session || progress.title !== "避坑侦探" || session.scanUsed) return;
  session.scanUsed = true;
  $("#conditionScanButton").disabled = true;
  const prompt = session.current.prompt;
  const keywordList = ["全部", "至少", "最少", "最多", "不正确", "错误", "不是", "不能", "最简", "同时", "分别", "还剩", "从小到大", "从大到小", "多选", "单位", "过去", "tomorrow", "yesterday", "than"];
  const found = keywordList.filter((word) => prompt.toLowerCase().includes(word.toLowerCase()));
  const box = $("#hintMessage");
  box.replaceChildren(document.createTextNode(found.length ? "条件扫描：重点检查 " : "条件扫描：这题没有明显陷阱词，检查题目究竟在问什么。"));
  found.forEach((word) => {
    const mark = document.createElement("mark");
    mark.className = "condition-token";
    mark.textContent = word;
    box.append(mark);
  });
}

function gainPetXp(amount) {
  const petId = progress.activePet;
  if (!petId || !progress.pets[petId]?.owned) return;
  progress.pets[petId].xp = Math.min(499, progress.pets[petId].xp + amount);
}

function openPets() {
  renderPets();
  showScreen("pet");
}

function renderPets() {
  const petId = progress.activePet;
  const active = petId && progress.pets[petId]?.owned ? PET_INFO[petId] : null;
  $("#petMessage").textContent = "";
  if (!active) {
    $("#activePetIcon").textContent = "◇";
    $("#activePetName").textContent = "还没有宠物";
    $("#activePetSkill").textContent = "先从下面免费领养墨团猫。";
    $("#petXpBar").style.width = "0%";
    $("#petLevelText").textContent = "等级 0 · 0/50 XP";
  } else {
    const xp = progress.pets[petId].xp;
    const level = petLevel(xp);
    const levelXp = level >= 10 ? 50 : xp % 50;
    $("#activePetIcon").textContent = active.icon;
    $("#activePetName").textContent = `${active.name} · Lv.${level}`;
    $("#activePetSkill").textContent = `${active.skill}。每完成一道主问题还会获得成长经验。`;
    $("#petXpBar").style.width = `${level >= 10 ? 100 : levelXp * 2}%`;
    $("#petLevelText").textContent = level >= 10 ? "等级 10 · 已满级" : `等级 ${level} · ${levelXp}/50 XP`;
  }
  $("#feedPetButton").disabled = !active || progress.inventory.snack < 1 || petLevel(progress.pets[petId]?.xp || 0) >= 10;
  $("#feedPetButton").textContent = `喂成长饼干（${progress.inventory.snack}）`;

  Object.entries(PET_INFO).forEach(([id, info]) => {
    const state = progress.pets[id];
    const card = $(`[data-pet="${id}"]`);
    const button = $(`[data-pet-action="${id}"]`);
    card.classList.toggle("active", progress.activePet === id);
    if (!state.owned) {
      button.disabled = false;
      button.textContent = info.cost ? `${info.cost} ⚡ · 领养` : "免费领养";
    } else if (progress.activePet === id) {
      button.disabled = true;
      button.textContent = `出战中 · Lv.${petLevel(state.xp)}`;
    } else {
      button.disabled = false;
      button.textContent = `设为出战 · Lv.${petLevel(state.xp)}`;
    }
  });
}

function handlePetAction(petId) {
  const info = PET_INFO[petId];
  const state = progress.pets[petId];
  if (!state.owned) {
    if (progress.points < info.cost) {
      $("#petMessage").textContent = `还差 ${info.cost - progress.points} 点能量才能领养。`;
      return;
    }
    progress.points -= info.cost;
    state.owned = true;
    state.xp = 0;
  }
  progress.activePet = petId;
  saveProgress();
  renderHome();
  renderPets();
  $("#petMessage").textContent = `${info.name} 已经出战。`;
}

function feedActivePet() {
  const petId = progress.activePet;
  if (!petId || progress.inventory.snack < 1 || !progress.pets[petId]?.owned) return;
  progress.inventory.snack -= 1;
  gainPetXp(15);
  saveProgress();
  renderHome();
  renderPets();
  $("#petMessage").textContent = `${PET_INFO[petId].name} 获得了 15 XP。`;
}

function openShop() {
  renderShop();
  showScreen("shop");
}

function renderShop() {
  $("#shopEnergy").textContent = progress.points;
  $("#headerEnergy").textContent = progress.points;
  $("#shopMessage").textContent = "";
  const oceanButton = $('[data-buy="ocean"]');
  const titleButton = $('[data-buy="detective"]');
  oceanButton.disabled = progress.unlockedThemes.includes("ocean");
  oceanButton.textContent = oceanButton.disabled ? "已解锁" : "160 ⚡ · 解锁";
  titleButton.disabled = progress.title === "避坑侦探";
  titleButton.textContent = titleButton.disabled ? "已拥有 · 每轮一次条件扫描" : "120 ⚡ · 解锁条件扫描";
  $('[data-buy="hint"]').textContent = `40 ⚡ · 购买（已有 ${progress.inventory.hint}）`;
  $('[data-buy="double"]').textContent = `80 ⚡ · 购买（已有 ${progress.inventory.double}）`;
  $('[data-buy="shield"]').textContent = `60 ⚡ · 购买（已有 ${progress.inventory.shield}）`;
  $('[data-buy="snack"]').textContent = `30 ⚡ · 购买（已有 ${progress.inventory.snack}）`;
}

function buyItem(itemId) {
  const item = SHOP_ITEMS[itemId];
  if (!item) return;
  if (progress.points < item.cost) {
    $("#shopMessage").textContent = `还差 ${item.cost - progress.points} 点能量。完成训练或小游戏就能赚。`;
    return;
  }
  if (itemId === "ocean" && progress.unlockedThemes.includes("ocean")) return;
  if (itemId === "detective" && progress.title === "避坑侦探") return;

  progress.points -= item.cost;
  if (itemId === "hint") progress.inventory.hint += 1;
  if (itemId === "double") progress.inventory.double += 1;
  if (itemId === "shield") progress.inventory.shield += 1;
  if (itemId === "snack") progress.inventory.snack += 1;
  if (itemId === "ocean") {
    progress.unlockedThemes.push("ocean");
    ensureThemeOptions();
    applyTheme("ocean");
  }
  if (itemId === "detective") progress.title = "避坑侦探";
  saveProgress();
  renderHome();
  renderShop();
  const messages = {
    hint: "提示卡已放进背包。",
    double: "双倍能量券将在下一轮训练自动启用。",
    shield: "连胜保护章会在下一次需要时自动生效。",
    snack: "成长饼干已送到宠物营地。",
    ocean: "深海实验室主题已永久解锁。",
    detective: "避坑侦探已解锁：每轮可使用一次条件扫描。"
  };
  $("#shopMessage").textContent = messages[itemId];
}

function startMiniGame(type) {
  miniGameState.type = type;
  miniGameState.selected = new Set();
  miniGameState.flipped = [];
  miniGameState.matched = new Set();
  miniGameState.locked = false;
  miniGameState.rewarded = false;
  $("#factorGame").hidden = type !== "factor";
  $("#memoryGame").hidden = type !== "memory";
  $("#gameResult").hidden = true;
  $("#miniGameTitle").textContent = type === "factor" ? "因数捕手" : "单词翻翻乐";
  $$("[data-switch-game]").forEach((button) => button.classList.toggle("active", button.dataset.switchGame === type));
  showScreen("game");
  if (type === "factor") setupFactorGame();
  else setupMemoryGame();
}

function setupFactorGame() {
  const targets = [18, 24, 30, 36, 40];
  const target = randomItem(targets);
  miniGameState.target = target;
  $("#factorTarget").textContent = target;
  const factors = Array.from({ length: target }, (_, index) => index + 1).filter((number) => target % number === 0);
  const distractors = shuffled(Array.from({ length: target - 1 }, (_, index) => index + 2).filter((number) => target % number !== 0));
  const numbers = shuffled([...factors, ...distractors.slice(0, Math.max(0, 12 - factors.length))]).slice(0, 12);
  const board = $("#factorBoard");
  board.replaceChildren();
  numbers.forEach((number) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "factor-number";
    button.textContent = number;
    button.addEventListener("click", () => {
      if (miniGameState.selected.has(number)) miniGameState.selected.delete(number);
      else miniGameState.selected.add(number);
      button.classList.toggle("selected", miniGameState.selected.has(number));
    });
    board.append(button);
  });
}

function checkFactorGame() {
  const target = miniGameState.target;
  const correct = Array.from({ length: target }, (_, index) => index + 1).filter((number) => target % number === 0).sort((a, b) => a - b);
  const selected = [...miniGameState.selected].sort((a, b) => a - b);
  const success = correct.length === selected.length && correct.every((number, index) => number === selected[index]);
  if (!success) {
    showGameResult("还没找齐", "检查两件事：每个选中的数能否整除目标数？有没有漏掉 1 和它本身？", false);
    return;
  }
  completeMiniGame("全部捕捉成功", `${target} 的因数是：${correct.join("、")}。`);
}

function setupMemoryGame() {
  const pairs = shuffled([
    ["research", "调查；研究"], ["collect", "收集"], ["straight", "笔直地"],
    ["kind", "友善的"], ["first", "第一"], ["yesterday", "昨天"],
    ["birthday", "生日"], ["hotel", "宾馆"]
  ]).slice(0, 3);
  const cards = shuffled(pairs.flatMap(([english, chinese], pairIndex) => [
    { pair: String(pairIndex), text: english }, { pair: String(pairIndex), text: chinese }
  ]));
  const board = $("#memoryBoard");
  board.replaceChildren();
  cards.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-card";
    button.dataset.pair = card.pair;
    button.dataset.index = String(index);
    button.textContent = card.text;
    button.setAttribute("aria-label", `第 ${index + 1} 张牌，未翻开`);
    button.addEventListener("click", () => flipMemoryCard(button));
    board.append(button);
  });
}

function flipMemoryCard(button) {
  if (miniGameState.locked || button.classList.contains("matched") || button.classList.contains("flipped")) return;
  button.classList.add("flipped");
  button.setAttribute("aria-label", button.textContent);
  miniGameState.flipped.push(button);
  if (miniGameState.flipped.length < 2) return;
  miniGameState.locked = true;
  const [first, second] = miniGameState.flipped;
  if (first.dataset.pair === second.dataset.pair) {
    first.classList.add("matched");
    second.classList.add("matched");
    miniGameState.matched.add(first.dataset.pair);
    miniGameState.flipped = [];
    miniGameState.locked = false;
    if (miniGameState.matched.size === 3) completeMiniGame("三组全部配对", "你把单词放进了意思场景里，比孤立背诵更牢。");
  } else {
    window.setTimeout(() => {
      first.classList.remove("flipped");
      second.classList.remove("flipped");
      first.setAttribute("aria-label", "未翻开的牌");
      second.setAttribute("aria-label", "未翻开的牌");
      miniGameState.flipped = [];
      miniGameState.locked = false;
    }, 650);
  }
}

function completeMiniGame(title, text) {
  if (!miniGameState.rewarded) {
    progress.points += 20;
    miniGameState.rewarded = true;
    saveProgress();
    renderHome();
  }
  showGameResult(title, `${text} 获得 20 点知识能量。`, true);
}

function showGameResult(title, text, success) {
  $("#gameResult").hidden = false;
  $("#gameResultTitle").textContent = title;
  $("#gameResultText").textContent = text;
  $("#gameResult").style.borderLeftColor = success ? "var(--good)" : "var(--accent)";
}

function scratchPoint(event) {
  const canvas = $("#scratchCanvas");
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height
  };
}

function resizeScratchCanvas() {
  const canvas = $("#scratchCanvas");
  if (!canvas || !canvas.clientWidth || !canvas.clientHeight) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  redrawScratch();
}

function redrawScratch() {
  const canvas = $("#scratchCanvas");
  if (!canvas || !canvas.width) return;
  const context = canvas.getContext("2d");
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.scale(ratio, ratio);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 2.4;
  context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#17324d";

  [...scratchState.strokes, ...(scratchState.current ? [scratchState.current] : [])].forEach((stroke) => {
    if (!stroke.length) return;
    context.beginPath();
    stroke.forEach((point, index) => {
      const x = point.x * canvas.clientWidth;
      const y = point.y * canvas.clientHeight;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    if (stroke.length === 1) context.lineTo(stroke[0].x * canvas.clientWidth + .1, stroke[0].y * canvas.clientHeight + .1);
    context.stroke();
  });
  context.restore();
  updateScratchButtons();
}

function updateScratchButtons() {
  const undo = $("#undoScratchButton");
  const clear = $("#clearScratchButton");
  if (!undo || !clear) return;
  const empty = scratchState.strokes.length === 0 && !scratchState.current;
  undo.disabled = scratchState.strokes.length === 0;
  clear.disabled = empty;
}

function clearScratch() {
  scratchState.strokes = [];
  scratchState.current = null;
  scratchState.drawing = false;
  redrawScratch();
}

function initScratchPad() {
  const canvas = $("#scratchCanvas");
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    scratchState.drawing = true;
    scratchState.current = [scratchPoint(event)];
    redrawScratch();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!scratchState.drawing || !scratchState.current) return;
    event.preventDefault();
    scratchState.current.push(scratchPoint(event));
    redrawScratch();
  });
  const finishStroke = (event) => {
    if (!scratchState.drawing || !scratchState.current) return;
    event.preventDefault();
    scratchState.strokes.push(scratchState.current);
    scratchState.current = null;
    scratchState.drawing = false;
    redrawScratch();
  };
  canvas.addEventListener("pointerup", finishStroke);
  canvas.addEventListener("pointercancel", finishStroke);
  $("#undoScratchButton").addEventListener("click", () => {
    scratchState.strokes.pop();
    redrawScratch();
  });
  $("#clearScratchButton").addEventListener("click", clearScratch);
  window.addEventListener("resize", () => requestAnimationFrame(resizeScratchCanvas));
  updateScratchButtons();
}

function bindEvents() {
  $$(".subject-button").forEach((button) => button.addEventListener("click", () => startSubject(button.dataset.subject)));
  $$("[data-route-subject]").forEach((button) => button.addEventListener("click", () => startSubject(button.dataset.routeSubject)));
  $$("[data-grade]").forEach((button) => button.addEventListener("click", () => setGrade(button.dataset.grade)));
  $("#quickStartButton").addEventListener("click", () => startSubject(weakestSubject()));
  $("#answerForm").addEventListener("submit", submitAnswer);
  $("#nextQuestionButton").addEventListener("click", closeFeedbackAndContinue);
  $("#exitQuizButton").addEventListener("click", () => { session = null; renderHome(); showScreen("home"); });
  $("#homeButton").addEventListener("click", () => { renderHome(); showScreen("home"); });
  $("#summaryHomeButton").addEventListener("click", () => { renderHome(); showScreen("home"); });
  $("#retryButton").addEventListener("click", () => startSubject(session.subject));
  $("#wrongBookButton").addEventListener("click", openWrongBook);
  $("#reviewWrongButton").addEventListener("click", openWrongBook);
  $("#closeWrongBookButton").addEventListener("click", () => { renderHome(); showScreen("home"); });
  $("#startWrongPracticeButton").addEventListener("click", startWrongPractice);
  $("#clearWrongButton").addEventListener("click", clearMasteredWrong);
  $("#themeSelect").addEventListener("change", (event) => applyTheme(event.target.value));
  $("#useHintButton").addEventListener("click", useHint);
  $("#conditionScanButton").addEventListener("click", useConditionScan);
  $("#shopButton").addEventListener("click", openShop);
  $("#openShopButton").addEventListener("click", openShop);
  $("#gameMenuButton").addEventListener("click", () => startMiniGame("factor"));
  $("#petButton").addEventListener("click", openPets);
  $("#openPetButton").addEventListener("click", openPets);
  $("#closePetButton").addEventListener("click", () => { renderHome(); showScreen("home"); });
  $$("[data-pet-action]").forEach((button) => button.addEventListener("click", () => handlePetAction(button.dataset.petAction)));
  $("#feedPetButton").addEventListener("click", feedActivePet);
  $("#closeShopButton").addEventListener("click", () => { renderHome(); showScreen("home"); });
  $$("[data-buy]").forEach((button) => button.addEventListener("click", () => buyItem(button.dataset.buy)));
  $$(".mini-game-button").forEach((button) => button.addEventListener("click", () => startMiniGame(button.dataset.game)));
  $$("[data-switch-game]").forEach((button) => button.addEventListener("click", () => startMiniGame(button.dataset.switchGame)));
  $("#closeGameButton").addEventListener("click", () => { renderHome(); showScreen("home"); });
  $("#checkFactorsButton").addEventListener("click", checkFactorGame);
  $("#playAgainButton").addEventListener("click", () => startMiniGame(miniGameState.type));

  $$("#wrongFilter button").forEach((button) => {
    button.addEventListener("click", () => {
      wrongFilter = button.dataset.filter;
      $$("#wrongFilter button").forEach((item) => item.classList.toggle("active", item === button));
      renderWrongBook();
    });
  });

  const openHowTo = () => { $("#howToDialog").hidden = false; setTimeout(() => $("#understoodButton").focus(), 50); };
  const closeHowTo = () => { $("#howToDialog").hidden = true; $("#howToButton").focus(); };
  $("#howToButton").addEventListener("click", openHowTo);
  $("#closeHowToButton").addEventListener("click", closeHowTo);
  $("#understoodButton").addEventListener("click", closeHowTo);
  $("#howToDialog").addEventListener("click", (event) => { if (event.target === $("#howToDialog")) closeHowTo(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#howToDialog").hidden) closeHowTo();
  });
}

initScratchPad();
bindEvents();
ensureThemeOptions();
applyTheme(progress.theme);
renderHome();
