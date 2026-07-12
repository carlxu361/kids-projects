(() => {
  "use strict";

  const STORAGE_KEY = "pictureChineseQuestProfileV1";
  const SETTINGS_KEY = "pictureChineseQuestSettingsV1";
  const MODE_LABELS = { mixed: "混合卷", idiom: "成语卷", classic: "文言卷", poem: "诗词卷" };
  const STAGES = [
    ["启卷台", "先读懂图、字和符号"],
    ["竹影径", "留心箭头与数量"],
    ["藏句阁", "识别被图形替换的词"],
    ["问墨桥", "从出处判断完整句子"],
    ["百卷楼", "三类题目连续挑战"],
    ["登科门", "综合终章"],
  ];
  const REWARDS = [
    { key: "hintTickets", name: "免墨提示券", effect: "下次提示不消耗墨点" },
    { key: "streakShields", name: "连胜护符", effect: "一次答错不会中断连胜" },
    { key: "doubleInk", name: "双倍墨锭", effect: "下一次答对获得双倍墨点" },
  ];
  const DISTRACTOR_CHARS = "天地人山水日月风花雪云心知学行书竹鸟鱼春秋上下东西";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const elements = {
    setup: $("#setupScreen"),
    game: $("#gameScreen"),
    result: $("#resultScreen"),
    ink: $("#inkPoints"),
    streak: $("#streakCount"),
    stars: $("#starCount"),
    theme: $("#themeSelect"),
    stageSize: $("#stageSize"),
    stageSizeOutput: $("#stageSizeOutput"),
    timerToggle: $("#timerToggle"),
    questMap: $("#questMap"),
    inventory: $("#inventoryList"),
    questionCounter: $("#questionCounter"),
    currentModeLabel: $("#currentModeLabel"),
    progressFill: $("#progressFill"),
    timer: $("#timerDisplay"),
    questionGrade: $("#questionGrade"),
    questionTitle: $("#questionTitle"),
    modeStamp: $("#modeStamp"),
    sourceLine: $("#sourceLine"),
    rebusBoard: $("#rebusBoard"),
    questionPrompt: $("#questionPrompt"),
    answerArea: $("#answerArea"),
    hintButton: $("#hintButton"),
    submit: $("#submitAnswer"),
    feedback: $("#feedback"),
    feedbackMark: $("#feedbackMark"),
    feedbackTitle: $("#feedbackTitle"),
    feedbackText: $("#feedbackText"),
    next: $("#nextQuestion"),
    resultSeal: $("#resultSeal"),
    resultTitle: $("#resultTitle"),
    resultStars: $("#resultStars"),
    correctResult: $("#correctResult"),
    accuracyResult: $("#accuracyResult"),
    pointsResult: $("#pointsResult"),
    rewardBanner: $("#rewardBanner"),
    toast: $("#toast"),
  };

  const defaultProfile = {
    ink: 120,
    streak: 0,
    stars: 0,
    inventory: { hintTickets: 1, streakShields: 1, doubleInk: 0 },
    completed: {},
  };
  const defaultSettings = {
    mode: "mixed",
    grade: 5,
    answerMode: "auto",
    stageSize: 10,
    timer: true,
    theme: "academy",
  };

  let profile = loadData(STORAGE_KEY, defaultProfile);
  let settings = loadData(SETTINGS_KEY, defaultSettings);
  let run = null;
  let timerId = null;
  let toastId = null;

  function loadData(key, fallback) {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved ? mergeDeep(structuredClone(fallback), saved) : structuredClone(fallback);
    } catch {
      return structuredClone(fallback);
    }
  }

  function mergeDeep(target, source) {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        target[key] = mergeDeep(target[key] || {}, value);
      } else {
        target[key] = value;
      }
    });
    return target;
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function normalizeSettings() {
    if (settings.grade > 6) settings.grade = 6;
    if (settings.grade < 1) settings.grade = 1;
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\s，。！？、；：“”‘’《》,.!?;:'"（）()]/g, "");
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function switchScreen(screen) {
    [elements.setup, elements.game, elements.result].forEach((item) => item.classList.remove("is-active"));
    screen.classList.add("is-active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toast(message) {
    clearTimeout(toastId);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastId = setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }

  function updateHeader() {
    elements.ink.textContent = profile.ink;
    elements.streak.textContent = profile.streak;
    elements.stars.textContent = profile.stars;
  }

  function updateInventory() {
    const inventory = profile.inventory;
    elements.inventory.innerHTML = [
      `<li title="提示时优先使用">提示券 × ${inventory.hintTickets}</li>`,
      `<li title="答错时自动保护连胜">连胜护符 × ${inventory.streakShields}</li>`,
      `<li title="下次答对自动翻倍">双倍墨锭 × ${inventory.doubleInk}</li>`,
    ].join("");
  }

  function applySettingsToUI() {
    document.body.dataset.theme = settings.theme;
    elements.theme.value = settings.theme;
    elements.stageSize.value = settings.stageSize;
    elements.stageSizeOutput.value = settings.stageSize;
    elements.timerToggle.checked = settings.timer;
    $$("[data-mode]").forEach((button) => button.classList.toggle("is-selected", button.dataset.mode === settings.mode));
    $$("[data-grade]").forEach((button) => button.classList.toggle("is-selected", Number(button.dataset.grade) === settings.grade));
    $$("[data-answer-mode]").forEach((button) => button.classList.toggle("is-selected", button.dataset.answerMode === settings.answerMode));
  }

  function stageKey(stage) {
    return `${settings.mode}-${settings.grade}-${stage}`;
  }

  function renderMap() {
    elements.questMap.innerHTML = STAGES.map(([name, description], index) => {
      const stage = index + 1;
      const stars = Number(profile.completed[stageKey(stage)] || 0);
      const status = stars ? "已完成" : "可挑战";
      return `
        <button class="quest-node ${stars ? "is-complete" : ""}" type="button" data-stage="${stage}" data-number="${stage}">
          <span class="node-status">${status}</span>
          <span class="start-mark" aria-hidden="true">${stars ? "✓" : "→"}</span>
          <strong>${name}</strong>
          <small>${description}</small>
          <span class="node-stars">${stars ? "★".repeat(stars) + "☆".repeat(3 - stars) : "尚无星章"}</span>
        </button>`;
    }).join("");

    $$(".quest-node").forEach((button) => {
      button.addEventListener("click", () => startStage(Number(button.dataset.stage)));
    });
  }

  function availableQuestions() {
    return window.QUESTION_BANK.filter((question) => {
      const modeMatches = settings.mode === "mixed" || question.mode === settings.mode;
      return modeMatches && question.grade === settings.grade;
    });
  }

  function pickQuestions(stage) {
    const pool = availableQuestions();
    const count = Math.min(settings.stageSize, pool.length);
    const rotated = [...pool.slice((stage - 1) % Math.max(pool.length, 1)), ...pool.slice(0, (stage - 1) % Math.max(pool.length, 1))];
    return shuffle(rotated).slice(0, count);
  }

  function startStage(stage) {
    const questions = pickQuestions(stage);
    if (!questions.length) {
      toast("当前设置下没有可用题目");
      return;
    }
    if (questions.length < settings.stageSize) {
      toast(`当前难度有 ${questions.length} 道不重复题，本关按实际数量开始`);
    }
    run = {
      stage,
      questions,
      index: 0,
      correct: 0,
      earnedInk: 0,
      answered: false,
      hintUsed: false,
      tileValue: "",
      selectedChoice: "",
    };
    elements.currentModeLabel.textContent = MODE_LABELS[settings.mode];
    switchScreen(elements.game);
    renderQuestion();
  }

  function currentQuestion() {
    return run.questions[run.index];
  }

  function getAnswerMode(question) {
    if (settings.answerMode !== "auto") return settings.answerMode;
    if (question.mode !== "idiom") return "input";
    return ["tiles", "choice", "input"][run.index % 3];
  }

  function renderQuestion() {
    clearInterval(timerId);
    run.answered = false;
    run.hintUsed = false;
    run.tileValue = "";
    run.selectedChoice = "";
    const question = currentQuestion();
    const answerMode = getAnswerMode(question);
    const count = run.questions.length;

    elements.questionCounter.textContent = `${run.index + 1} / ${count}`;
    elements.progressFill.style.width = `${((run.index + 1) / count) * 100}%`;
    elements.questionGrade.textContent = `${numberToChinese(question.grade)}年级难度`;
    elements.questionTitle.textContent = question.mode === "idiom" ? "看图猜成语" : question.mode === "classic" ? "看图猜文言句" : "看图猜古诗词";
    elements.modeStamp.textContent = window.MODE_NAMES[question.mode];
    elements.sourceLine.textContent = "先逐块读图，再把整句话连起来";
    elements.questionPrompt.textContent = question.mode === "idiom" ? "这组图表示哪个成语？" : "请写出这组图表示的完整句子。";
    elements.rebusBoard.innerHTML = question.clue.map(renderToken).join("");
    elements.feedback.hidden = true;
    elements.feedback.classList.remove("is-wrong");
    elements.submit.hidden = false;
    elements.hintButton.hidden = false;
    elements.next.textContent = run.index === count - 1 ? "查看结算 →" : "下一题 →";
    renderAnswerArea(question, answerMode);
    startTimer();
  }

  function renderToken(token) {
    const isSymbol = /^[+×=<>→←↩️⬆️⬇️…≠]+$/u.test(token);
    const isEmoji = /\p{Extended_Pictographic}/u.test(token);
    const className = `rebus-token${isSymbol ? " is-symbol" : ""}${isEmoji && token.length <= 8 ? " is-emoji" : ""}`;
    return `<span class="${className}">${escapeHTML(token)}</span>`;
  }

  function renderAnswerArea(question, mode) {
    if (mode === "choice") {
      const alternatives = shuffle(window.QUESTION_BANK.filter((item) => item.mode === question.mode && item.grade === settings.grade && item.id !== question.id)).slice(0, 3);
      const choices = shuffle([question.answer, ...alternatives.map((item) => item.answer)]);
      elements.answerArea.innerHTML = `<span class="answer-label">选择完整答案</span><div class="choice-list">${choices.map((choice) => `<button class="choice-button" type="button" data-choice="${escapeHTML(choice)}">${escapeHTML(choice)}</button>`).join("")}</div>`;
      $$(".choice-button").forEach((button) => button.addEventListener("click", () => {
        $$(".choice-button").forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
        run.selectedChoice = button.dataset.choice;
      }));
      return;
    }

    if (mode === "tiles" && question.answer.length <= 8) {
      const answerChars = [...question.answer];
      const distractors = shuffle([...DISTRACTOR_CHARS].filter((char) => !answerChars.includes(char))).slice(0, Math.max(3, 8 - answerChars.length));
      const tiles = shuffle([...answerChars, ...distractors]);
      elements.answerArea.innerHTML = `
        <span class="answer-label">按顺序拼出答案，点击上方汉字可撤回</span>
        <div class="tile-answer" id="tileAnswer" aria-label="已选择的汉字"></div>
        <div class="tile-bank">${tiles.map((char, index) => `<button class="char-tile" type="button" data-char="${char}" data-tile-index="${index}">${char}</button>`).join("")}</div>`;
      $$(".tile-bank .char-tile").forEach((button) => button.addEventListener("click", () => {
        run.tileValue += button.dataset.char;
        button.disabled = true;
        renderSelectedTiles();
      }));
      return;
    }

    elements.answerArea.innerHTML = `<label class="answer-label" for="textAnswer">输入完整答案</label><input class="text-answer" id="textAnswer" type="text" autocomplete="off" placeholder="不用输入标点">`;
    const input = $("#textAnswer");
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submitCurrentAnswer();
    });
    setTimeout(() => input.focus(), 0);
  }

  function renderSelectedTiles() {
    const container = $("#tileAnswer");
    if (!container) return;
    container.innerHTML = [...run.tileValue].map((char, index) => `<button class="char-tile" type="button" data-remove-index="${index}">${char}</button>`).join("");
    $$('[data-remove-index]').forEach((button) => button.addEventListener("click", () => {
      const index = Number(button.dataset.removeIndex);
      const char = run.tileValue[index];
      run.tileValue = [...run.tileValue].filter((_, itemIndex) => itemIndex !== index).join("");
      const disabledMatch = $$(".tile-bank .char-tile:disabled").find((tile) => tile.dataset.char === char);
      if (disabledMatch) disabledMatch.disabled = false;
      renderSelectedTiles();
    }));
  }

  function readAnswer() {
    const input = $("#textAnswer");
    if (input) return input.value;
    if (run.selectedChoice) return run.selectedChoice;
    return run.tileValue;
  }

  function submitCurrentAnswer(forcedWrong = false) {
    if (!run || run.answered) return;
    const question = currentQuestion();
    const answer = readAnswer();
    if (!forcedWrong && !normalize(answer)) {
      toast("先写下或选择答案");
      return;
    }
    clearInterval(timerId);
    run.answered = true;
    const isCorrect = !forcedWrong && normalize(answer) === normalize(question.answer);
    let outcome = "";

    if (isCorrect) {
      profile.streak += 1;
      run.correct += 1;
      let points = 10 + Math.min(10, Math.floor(profile.streak / 3) * 2);
      if (profile.inventory.doubleInk > 0) {
        profile.inventory.doubleInk -= 1;
        points *= 2;
        outcome = `双倍墨锭生效，获得 ${points} 墨点。`;
      } else {
        outcome = `获得 ${points} 墨点。`;
      }
      profile.ink += points;
      run.earnedInk += points;
    } else if (profile.inventory.streakShields > 0 && profile.streak > 0) {
      profile.inventory.streakShields -= 1;
      outcome = "连胜护符已消耗，本次连胜保留。";
    } else {
      profile.streak = 0;
      outcome = forcedWrong ? "时间到，本题按答错记录。" : "连胜重新从 0 开始。";
    }

    showFeedback(isCorrect, question, outcome);
    updateHeader();
    save();
  }

  function showFeedback(isCorrect, question, outcome) {
    elements.feedback.hidden = false;
    elements.feedback.classList.toggle("is-wrong", !isCorrect);
    elements.feedbackMark.textContent = isCorrect ? "✓" : "×";
    elements.feedbackTitle.textContent = isCorrect ? "答对了" : `正确答案：${question.answer}`;
    elements.feedbackText.textContent = `${outcome} ${question.source}：${question.explanation}`;
    elements.submit.hidden = true;
    elements.hintButton.hidden = true;
    elements.answerArea.querySelectorAll("button, input").forEach((control) => { control.disabled = true; });
  }

  function useHint() {
    if (!run || run.answered || run.hintUsed) return;
    const question = currentQuestion();
    if (profile.inventory.hintTickets > 0) {
      profile.inventory.hintTickets -= 1;
      toast(`提示券生效：${question.hint}`);
    } else if (profile.ink >= 15) {
      profile.ink -= 15;
      toast(`提示：${question.hint}`);
    } else {
      toast("墨点不足 15，先答题赚墨点");
      return;
    }
    run.hintUsed = true;
    elements.hintButton.disabled = true;
    updateHeader();
    updateInventory();
    save();
  }

  function startTimer() {
    elements.timer.hidden = !settings.timer;
    elements.timer.classList.remove("is-low");
    if (!settings.timer) return;
    let remaining = 45;
    elements.timer.querySelector("strong").textContent = remaining;
    timerId = setInterval(() => {
      remaining -= 1;
      elements.timer.querySelector("strong").textContent = remaining;
      elements.timer.classList.toggle("is-low", remaining <= 10);
      if (remaining <= 0) {
        clearInterval(timerId);
        submitCurrentAnswer(true);
      }
    }, 1000);
  }

  function nextQuestion() {
    if (run.index >= run.questions.length - 1) {
      finishStage();
      return;
    }
    run.index += 1;
    renderQuestion();
  }

  function finishStage() {
    clearInterval(timerId);
    const accuracy = run.correct / run.questions.length;
    const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= 0.5 ? 1 : 0;
    const key = stageKey(run.stage);
    const oldStars = Number(profile.completed[key] || 0);
    profile.completed[key] = Math.max(oldStars, stars);
    profile.stars += Math.max(0, stars - oldStars);

    const reward = REWARDS[(run.stage - 1) % REWARDS.length];
    const getsReward = stars > 0;
    if (getsReward) profile.inventory[reward.key] += 1;

    elements.resultSeal.textContent = stars > 0 ? "通" : "习";
    elements.resultTitle.textContent = stars > 0 ? "闯关成功" : "再练一轮";
    elements.resultStars.textContent = `${"★".repeat(stars)}${"☆".repeat(3 - stars)}`;
    elements.correctResult.textContent = `${run.correct}/${run.questions.length}`;
    elements.accuracyResult.textContent = `${Math.round(accuracy * 100)}%`;
    elements.pointsResult.textContent = `+${run.earnedInk}`;
    elements.rewardBanner.innerHTML = getsReward
      ? `<span>奖</span><div><small>${reward.effect}</small><strong>${reward.name} × 1</strong></div>`
      : `<span>练</span><div><small>答对一半即可获得关卡奖励</small><strong>本轮暂未获得道具</strong></div>`;

    updateHeader();
    updateInventory();
    renderMap();
    save();
    switchScreen(elements.result);
  }

  function exitToMap(force = false) {
    if (run && elements.game.classList.contains("is-active") && !force) {
      const leave = window.confirm("退出后，本关当前进度不会保存。要返回地图吗？");
      if (!leave) return;
    }
    clearInterval(timerId);
    run = null;
    renderMap();
    switchScreen(elements.setup);
  }

  function numberToChinese(number) {
    return ["一", "二", "三", "四", "五", "六"][number - 1] || number;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  }

  function changeStageSize(delta) {
    const next = Math.max(5, Math.min(15, Number(settings.stageSize) + delta));
    settings.stageSize = next;
    elements.stageSize.value = next;
    elements.stageSizeOutput.value = next;
    save();
  }

  function bindEvents() {
    $$("[data-mode]").forEach((button) => button.addEventListener("click", () => {
      settings.mode = button.dataset.mode;
      applySettingsToUI();
      renderMap();
      save();
    }));
    $$("[data-grade]").forEach((button) => button.addEventListener("click", () => {
      settings.grade = Number(button.dataset.grade);
      applySettingsToUI();
      renderMap();
      save();
    }));
    $$("[data-answer-mode]").forEach((button) => button.addEventListener("click", () => {
      settings.answerMode = button.dataset.answerMode;
      applySettingsToUI();
      save();
    }));
    elements.theme.addEventListener("change", () => {
      settings.theme = elements.theme.value;
      document.body.dataset.theme = settings.theme;
      save();
    });
    elements.stageSize.addEventListener("input", () => {
      settings.stageSize = Number(elements.stageSize.value);
      elements.stageSizeOutput.value = settings.stageSize;
      save();
    });
    elements.timerToggle.addEventListener("change", () => {
      settings.timer = elements.timerToggle.checked;
      save();
    });
    $("#decreaseSize").addEventListener("click", () => changeStageSize(-1));
    $("#increaseSize").addEventListener("click", () => changeStageSize(1));
    $("#exitGame").addEventListener("click", () => exitToMap());
    $("#homeButton").addEventListener("click", () => exitToMap());
    elements.submit.addEventListener("click", () => submitCurrentAnswer());
    elements.hintButton.addEventListener("click", useHint);
    elements.next.addEventListener("click", nextQuestion);
    $("#retryButton").addEventListener("click", () => startStage(run.stage));
    $("#backToMap").addEventListener("click", () => exitToMap(true));
  }

  function init() {
    normalizeSettings();
    applySettingsToUI();
    updateHeader();
    updateInventory();
    renderMap();
    bindEvents();
  }

  init();
})();
