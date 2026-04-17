const DATA_URL = "data/lessons-data.json";
const PROGRESS_KEY = "nexeliaLessonProgress";
const LAST_LESSON_KEY = "nexeliaLastLesson";
const STEP_STATE_KEY = "nexeliaLessonStep";
const PDF_PAGE_STATE_KEY = "nexeliaPdfPageState";

const lessonTitleEl = document.getElementById("lessonTitle");
const progressTextEl = document.getElementById("progressText");
const currentPathEl = document.getElementById("currentPath");
const stepContentEl = document.getElementById("stepContent");
const feedbackTextEl = document.getElementById("feedbackText");
const stageWrapEl = document.getElementById("stageWrap");
const prevBtnEl = document.getElementById("prevBtn");
const nextBtnEl = document.getElementById("nextBtn");
const exerciseBtnEl = document.getElementById("exerciseBtn");
const navRowEl = document.getElementById("navRow");
const navRowHomeEl = navRowEl ? navRowEl.parentElement : null;
const navRowHomeNextSibling = navRowEl ? navRowEl.nextSibling : null;
const tocPanelEl = document.getElementById("tocPanel");
const tocListEl = document.getElementById("tocList");
const progressRowEl = document.querySelector(".progress-row");
const fullscreenToggleEl = document.getElementById("fullscreenToggle");
const slideProgressEl = document.getElementById("slideProgress");
const slideProgressFillEl = document.getElementById("slideProgressFill");
const slideAiBtnEl = document.getElementById("slideAiBtn");

let lesson = null;
let steps = [];
let allLessonIds = [];
let allLessons = [];
let stepIndex = 0;
let pdfPage = 1;
let navDirection = 0;
let transitionTimer = null;
let isClearScreen = false;
let slideFullscreenEnabled = false;
const answeredMap = {};
const correctAnswerMap = {};

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const pageParams = new URLSearchParams(window.location.search);

function getLessonIdFromUrl() {
  return pageParams.get("lesson") || "lesson1";
}

function getInitialStepIndex(stepCount) {
  const rawStep = Number(pageParams.get("step"));
  if (!Number.isFinite(rawStep)) return 0;

  const index = Math.floor(rawStep) - 1;
  if (index < 0) return 0;
  return Math.min(index, Math.max(stepCount - 1, 0));
}

function shouldHideExerciseButton() {
  return pageParams.get("noExercise") === "1";
}

function getExerciseLessonIdFromUrl() {
  const explicitLessonId = pageParams.get("exerciseLesson") || pageParams.get("exercise") || "";
  if (explicitLessonId) return explicitLessonId;

  const currentLessonId = lesson?.id || getLessonIdFromUrl();
  if (currentLessonId === "lesson1") {
    return "lesson1q";
  }
  if (currentLessonId === "lesson3") {
    return "lesson3q";
  }
  if (currentLessonId === "lesson6") {
    return "lesson6q";
  }
  if (currentLessonId === "lesson87") {
    return "lesson87q";
  }
  if (currentLessonId === "lesson4") {
    return "lesson4q";
  }
  if (currentLessonId === "lesson7") {
    return "lesson7q";
  }
  if (currentLessonId === "lesson8") {
    return "lesson8q";
  }
  if (currentLessonId === "lesson9") {
    return "lesson9q";
  }
  if (currentLessonId === "lesson89") {
    return "lesson89q";
  }
  if (currentLessonId === "lesson10") {
    return "lesson10q";
  }
  if (currentLessonId === "lesson12") {
    return "lesson12q";
  }
  if (currentLessonId === "lesson13") {
    return "lesson13q";
  }
  if (currentLessonId === "lesson91") {
    return "lesson91q";
  }
  if (currentLessonId === "lesson47") {
    return "lesson47q";
  }
  if (currentLessonId === "lesson48") {
    return "lesson48q";
  }
  if (currentLessonId === "lesson49") {
    return "lesson49q";
  }
  if (currentLessonId === "lesson111") {
    return "lesson111q";
  }
  if (currentLessonId === "lesson50") {
    return "lesson50q";
  }
  if (currentLessonId === "lesson51") {
    return "lesson51q";
  }
  if (currentLessonId === "lesson52") {
    return "lesson52q";
  }
  if (currentLessonId === "lesson53") {
    return "lesson53q";
  }
  if (currentLessonId === "lesson113") {
    return "lesson113q";
  }
  if (currentLessonId === "lesson54") {
    return "lesson54q";
  }
  if (currentLessonId === "lesson14") {
    return "lesson14q";
  }
  if (currentLessonId === "lesson15") {
    return "lesson15q";
  }
  if (currentLessonId === "lesson16") {
    return "lesson16q";
  }
  if (currentLessonId === "lesson17") {
    return "lesson17q";
  }
  if (currentLessonId === "lesson5") {
    return "lesson5q";
  }
  if (["lesson1b", "lesson1c", "lesson1d"].includes(currentLessonId)) {
    return "lesson1e";
  }
  if (currentLessonId === "lesson1g") {
    return "lesson1h";
  }

  return "";
}

function isPdfUrl(url) {
  return /\.pdf($|[?#])/i.test(String(url || ""));
}

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|svg)($|[?#])/i.test(String(url || ""));
}

function normalizeStep(step) {
  const rawType = String(step.type || "slide").toLowerCase();
  const type = rawType === "exercise" ? "question" : rawType;

  if (type === "question") {
    return {
      type: "question",
      question: step.question || "\u554f\u984c",
      subText: step.subText || step.hint || "",
      sentence: step.sentence || "",
      choices: Array.isArray(step.choices) ? step.choices : [],
      answer: Number.isFinite(Number(step.answer)) ? Number(step.answer) : Number(step.answerIndex || 0),
      explanation: step.explanation || "",
      wrongExplanation: step.wrongExplanation || step.hint || step.explanation || "",
      hint: step.hint || ""
    };
  }

  const pageCount = Number(step.pdfPages || 0);
  return {
    type: "slide",
    title: step.title || "\u30b9\u30e9\u30a4\u30c9",
    text: step.text || step.summary || "",
    embedUrl: step.embedUrl || "",
    pdfPages: Number.isFinite(pageCount) && pageCount > 0 ? pageCount : 0
  };
}

function normalizeLesson(rawLesson) {
  const safeSteps = Array.isArray(rawLesson?.steps) ? rawLesson.steps.map(normalizeStep) : [];
  return {
    id: rawLesson?.id || "lesson1",
    title: rawLesson?.title || "\u30ec\u30c3\u30b9\u30f3",
    steps: safeSteps
  };
}

function getCurrentStep() {
  return steps[stepIndex] || null;
}

function getQuestionStepIndexes() {
  return steps.reduce((list, step, index) => {
    if (step.type === "question") list.push(index);
    return list;
  }, []);
}

function getSlideStepIndexes() {
  return steps.reduce((list, step, index) => {
    if (step.type === "slide") list.push(index);
    return list;
  }, []);
}

function getSlideProgress(index = stepIndex) {
  const slideIndexes = getSlideStepIndexes();
  if (!slideIndexes.length) return { current: 0, total: 0 };

  const order = slideIndexes.indexOf(index);
  return { current: order >= 0 ? order + 1 : 0, total: slideIndexes.length };
}

function getScore() {
  const questionIndexes = getQuestionStepIndexes();
  if (!questionIndexes.length) return { score: 0, total: 0 };

  const score = questionIndexes.reduce((sum, index) => {
    return sum + (correctAnswerMap[index] ? 1 : 0);
  }, 0);

  return { score, total: questionIndexes.length };
}

function getNextLessonId() {
  if (!lesson || !allLessonIds.length) return null;
  const current = allLessonIds.indexOf(lesson.id);
  if (current < 0 || current >= allLessonIds.length - 1) return null;
  return allLessonIds[current + 1];
}

function isPdfPagedStep(step) {
  return !!step && step.type === "slide" && isPdfUrl(step.embedUrl) && Number(step.pdfPages) > 1;
}

function getNextStep() {
  return steps[stepIndex + 1] || null;
}

function canGoForwardWithArrow(step = getCurrentStep()) {
  if (!step) return false;
  if (step.type !== "slide") return true;

  if (steps.length === 1 && isPdfPagedStep(step)) {
    return pdfPage < step.pdfPages;
  }

  const nextStep = getNextStep();
  if (!nextStep) return false;
  return nextStep.type === "slide";
}

function canShowExerciseButton(step = getCurrentStep()) {
  if (!step || step.type !== "slide" || isClearScreen) return false;

  if (steps.length === 1 && isPdfPagedStep(step)) {
    return pdfPage >= step.pdfPages;
  }

  const nextStep = getNextStep();
  if (!nextStep) return true;
  return nextStep.type !== "slide";
}

function shouldUseNextAsExercise(step = getCurrentStep()) {
  if (!step || step.type !== "slide" || isClearScreen) return false;
  if (shouldHideExerciseButton()) return false;
  return canShowExerciseButton(step);
}

function getProgressPercent() {
  if (!steps.length) return 0;
  const step = getCurrentStep();

  if (steps.length === 1 && isPdfPagedStep(step)) {
    return Math.round((pdfPage / step.pdfPages) * 100);
  }

  return Math.round(((stepIndex + 1) / steps.length) * 100);
}

function saveProgress() {
  if (!lesson) return;

  const progressMap = readJSON(PROGRESS_KEY, {});
  const current = Number(progressMap[lesson.id] ?? 0);
  progressMap[lesson.id] = Math.max(current, getProgressPercent());
  writeJSON(PROGRESS_KEY, progressMap);

  const stepMap = readJSON(STEP_STATE_KEY, {});
  stepMap[lesson.id] = stepIndex;
  writeJSON(STEP_STATE_KEY, stepMap);

  const pageMap = readJSON(PDF_PAGE_STATE_KEY, {});
  pageMap[lesson.id] = pdfPage;
  writeJSON(PDF_PAGE_STATE_KEY, pageMap);

  localStorage.setItem(LAST_LESSON_KEY, lesson.id);
}

function setFeedback(text, status = "") {
  feedbackTextEl.textContent = text || "";
  feedbackTextEl.className = "feedback";
  if (status === "ok") feedbackTextEl.classList.add("ok");
  if (status === "ng") feedbackTextEl.classList.add("ng");
}

function setSlideProgress(value) {
  if (!slideProgressEl || !slideProgressFillEl) return;

  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const clamped = Math.max(0, Math.min(100, safe));

  slideProgressFillEl.style.width = `${clamped}%`;
  slideProgressEl.setAttribute("aria-valuenow", String(Math.round(clamped)));

  // デバッグ用コンソール出力
  if (typeof console !== 'undefined') {
    // console.log(`進捗バー更新: ${Math.round(clamped)}%`);
  }
}
function shortenLabel(text, maxLength = 26) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}...`;
}

function buildTocLabel(step, index) {
  if (lesson?.id === "lesson1") {
    const fixedLabels = ["① be動詞とは？", "② be動詞の種類"];
    if (fixedLabels[index]) return fixedLabels[index];
  }

  const labelBase = step.type === "slide"
    ? (step.title || step.text || `\u30b9\u30e9\u30a4\u30c9 ${index + 1}`)
    : (step.question || `\u6f14\u7fd2 ${index + 1}`);
  const kind = step.type === "slide" ? "S" : "Q";
  return `${kind}${index + 1} ${shortenLabel(labelBase)}`;
}

function jumpToStep(index) {
  if (!Number.isInteger(index) || index < 0 || index >= steps.length) return;
  if (isClearScreen) return;

  const currentIndex = stepIndex;
  navDirection = index === currentIndex ? 0 : (index > currentIndex ? 1 : -1);
  stepIndex = index;

  const selectedStep = getCurrentStep();
  if (isPdfPagedStep(selectedStep)) {
    pdfPage = 1;
  } else if (steps.length > 1) {
    pdfPage = 1;
  }

  renderStep();
}

function getCustomTocEntries() {
  const isLesson1Series = ["lesson1", "lesson1b", "lesson1c", "lesson1d", "lesson1g"].includes(lesson?.id);
  if (!isLesson1Series) return null;

  return [
    {
      label: "① be動詞とは？",
      active: lesson.id === "lesson1" && stepIndex === 0,
      href: "learning.html?lesson=lesson1&step=1"
    },
    {
      label: "② be動詞の種類",
      active: lesson.id === "lesson1" && stepIndex >= 1,
      href: "learning.html?lesson=lesson1&step=2"
    },
    {
      label: "③演習Ⅰ",
      active: false,
      href: "exercise.html?lesson=lesson1"
    },
    {
      label: "④ I のときのbe動詞",
      active: lesson.id === "lesson1b"
        || lesson.id === "lesson1c"
        || lesson.id === "lesson1d",
      href: "learning.html?lesson=lesson1b&step=1"
    },
    {
      label: "⑤ You / They のときのbe動詞",
      active: lesson.id === "lesson1g" && stepIndex === 0,
      href: "learning.html?lesson=lesson1g&step=1"
    },
    {
      label: "⑥ He / She / It のときのbe動詞",
      active: lesson.id === "lesson1g" && stepIndex === 1,
      href: "learning.html?lesson=lesson1g&step=2"
    }
  ];
}
function renderToc() {
  if (!tocPanelEl || !tocListEl) return;

  if (!steps.length) {
    tocPanelEl.hidden = true;
    tocListEl.replaceChildren();
    return;
  }

  tocPanelEl.hidden = false;
  const fragment = document.createDocumentFragment();

  const customEntries = getCustomTocEntries();
  if (Array.isArray(customEntries) && customEntries.length) {
    customEntries.forEach((entry, index) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "toc-item";
      btn.textContent = entry.label;
      btn.setAttribute("aria-label", entry.label || `目次 ${index + 1}`);

      if (entry.active && !isClearScreen) {
        btn.classList.add("active");
        btn.setAttribute("aria-current", "step");
      }

      btn.addEventListener("click", () => {
        if (!entry.href || isClearScreen) return;
        window.location.href = entry.href;
      });

      li.appendChild(btn);
      fragment.appendChild(li);
    });

    tocListEl.replaceChildren(fragment);
    return;
  }

  steps.forEach((step, index) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc-item";
    btn.textContent = buildTocLabel(step, index);
    btn.setAttribute("aria-label", `目次 ${index + 1}`);

    if (index === stepIndex && !isClearScreen) {
      btn.classList.add("active");
      btn.setAttribute("aria-current", "step");
    }

    btn.addEventListener("click", () => {
      jumpToStep(index);
    });

    li.appendChild(btn);
    fragment.appendChild(li);
  });

  tocListEl.replaceChildren(fragment);
}

function applySlideMode(isSlideStep) {
  document.body.classList.toggle("slide-mode", Boolean(slideFullscreenEnabled && isSlideStep));
}

function canUseFullscreenApi() {
  const rootEl = document.documentElement;
  return Boolean(
    document.fullscreenEnabled
      && rootEl
      && typeof rootEl.requestFullscreen === "function"
      && typeof document.exitFullscreen === "function"
  );
}

async function setSlideFullscreen(nextEnabled) {
  const step = getCurrentStep();
  const isSlideStep = Boolean(step && step.type === "slide" && !isClearScreen);

  if (nextEnabled && !isSlideStep) return;

  if (!canUseFullscreenApi()) {
    slideFullscreenEnabled = Boolean(nextEnabled && isSlideStep);
    applySlideMode(isSlideStep);
    updateFullscreenToggle(isSlideStep);
    return;
  }

  try {
    if (nextEnabled && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
    if (!nextEnabled && document.fullscreenElement) {
      await document.exitFullscreen();
    }
    slideFullscreenEnabled = Boolean(nextEnabled);
  } catch {
    slideFullscreenEnabled = Boolean(document.fullscreenElement);
  }

  const currentStep = getCurrentStep();
  const currentIsSlideStep = Boolean(currentStep && currentStep.type === "slide" && !isClearScreen);
  applySlideMode(currentIsSlideStep);
  updateFullscreenToggle(currentIsSlideStep);
}

function handleFullscreenChange() {
  slideFullscreenEnabled = Boolean(document.fullscreenElement);
  const step = getCurrentStep();
  const isSlideStep = Boolean(step && step.type === "slide" && !isClearScreen);
  applySlideMode(isSlideStep);
  updateFullscreenToggle(isSlideStep);
}

function updateFullscreenToggle(isSlideStep) {
  if (!fullscreenToggleEl) return;
  if (!isSlideStep || isClearScreen) {
    fullscreenToggleEl.hidden = true;
    return;
  }

  fullscreenToggleEl.hidden = false;
  fullscreenToggleEl.dataset.state = slideFullscreenEnabled ? "shrink" : "expand";
  fullscreenToggleEl.setAttribute("aria-pressed", slideFullscreenEnabled ? "true" : "false");
  fullscreenToggleEl.setAttribute("aria-label", slideFullscreenEnabled ? "\u901a\u5e38\u8868\u793a" : "\u5168\u753b\u9762");
}

function buildPdfPageUrl(url, page) {
  if (!url || page <= 0) return url;
  const base = url.split("#")[0];
  return `${base}#page=${page}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
}

function buildSlideStep(step) {
  const wrap = document.createElement("section");

  if (step.embedUrl) {
    if (isImageUrl(step.embedUrl)) {
      const img = document.createElement("img");
      img.className = "slide-image";
      img.src = step.embedUrl;
      img.alt = step.title || "\u6559\u6750\u30b9\u30e9\u30a4\u30c9";
      img.loading = "lazy";
      wrap.appendChild(img);
      return wrap;
    }

    const iframe = document.createElement("iframe");
    iframe.className = "slide-embed";

    const page = isPdfPagedStep(step) ? pdfPage : 1;
    iframe.src = isPdfUrl(step.embedUrl) ? buildPdfPageUrl(step.embedUrl, page) : step.embedUrl;
    if (isPdfUrl(step.embedUrl)) iframe.classList.add("pdf-static");

    iframe.title = step.title || "\u6559\u6750\u30b9\u30e9\u30a4\u30c9";
    iframe.loading = "lazy";
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("scrolling", "no");
    iframe.style.overflow = "hidden";
    wrap.appendChild(iframe);
  }

  const title = document.createElement("h2");
  title.className = "step-title";
  title.textContent = step.title || "\u30b9\u30e9\u30a4\u30c9";

  const text = document.createElement("p");
  text.className = "step-text";
  text.textContent = step.text || "";

  wrap.append(title, text);
  return wrap;
}

function getQuestionExplanation(step) {
  if (step.explanation) return step.explanation;
  const answerText = Array.isArray(step.choices) ? step.choices[Number(step.answer)] : "";
  return answerText ? `\u6b63\u89e3\u306f\u300c${answerText}\u300d\u3067\u3059\u3002` : "\u6b21\u3082\u540c\u3058\u8abf\u5b50\u3067\u9032\u3081\u307e\u3057\u3087\u3046\u3002";
}

function getQuestionHint(step) {
  if (step.hint) return step.hint;
  return "\u30d2\u30f3\u30c8: \u4e3b\u8a9e\u3068be\u52d5\u8a5e\u306e\u5f62\u306b\u6ce8\u76ee\u3057\u3066\u3001\u3082\u3046\u4e00\u5ea6\u8003\u3048\u3066\u307f\u307e\u3057\u3087\u3046\u3002";
}

function shuffleArray(list) {
  const shuffled = [...list];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderQuestionText(target, text) {
  const lines = String(text || "").split("\n");
  target.replaceChildren();

  const mainLine = document.createElement("span");
  mainLine.className = "question-line-main";
  mainLine.textContent = lines[0] || "";
  target.appendChild(mainLine);

  if (lines.length > 1) {
    const emphLine = document.createElement("span");
    emphLine.className = "question-line-emphasis";
    emphLine.textContent = lines.slice(1).join("\n");
    target.appendChild(emphLine);
  }
}
function buildQuestionStep(step) {
  const wrap = document.createElement("section");
  wrap.className = "q-card-wrap";

  // 問題文
  const qText = document.createElement("p");
  qText.className = "q-card-text";
  qText.textContent = step.question || "問題";
  wrap.appendChild(qText);

  // サブテキスト
  if (step.subText) {
    const qSub = document.createElement("p");
    qSub.className = "q-card-sub";
    qSub.textContent = step.subText;
    wrap.appendChild(qSub);
  }

  // 文（青いボックス）
  if (step.sentence) {
    const qFocus = document.createElement("div");
    qFocus.className = "q-card-focus";
    if (step.sentence.includes("___")) {
      const parts = step.sentence.split("___");
      qFocus.innerHTML = `${parts[0]}<span class="q-card-blank"></span>${parts[1] || ""}`;
    } else {
      qFocus.textContent = step.sentence;
    }
    wrap.appendChild(qFocus);
  }

  // 選択肢グリッド
  const choicesDiv = document.createElement("div");
  choicesDiv.className = "q-card-choices";

  const randomizedChoices = shuffleArray(step.choices.map((choice, idx) => ({ choice, idx })));

  randomizedChoices.forEach(({ choice, idx }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "q-card-opt";
    btn.textContent = choice;
    btn.dataset.idx = String(idx);
    choicesDiv.appendChild(btn);
  });

  wrap.appendChild(choicesDiv);

  // フィードバック
  const fb = document.createElement("div");
  fb.className = "q-card-feedback";
  wrap.appendChild(fb);

  // アクション行（navRow配置用）
  const actionRow = document.createElement("div");
  actionRow.className = "question-actions";
  wrap.appendChild(actionRow);

  // クリックイベント
  choicesDiv.querySelectorAll(".q-card-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (answeredMap[stepIndex]) return;
      answeredMap[stepIndex] = true;

      const selectedIdx = Number(btn.dataset.idx);
      const isCorrect = selectedIdx === Number(step.answer);
      correctAnswerMap[stepIndex] = isCorrect;

      // 全ボタン無効化＋正解/不正解表示
      choicesDiv.querySelectorAll(".q-card-opt").forEach((b) => {
        b.disabled = true;
        if (Number(b.dataset.idx) === Number(step.answer)) b.classList.add("correct");
        else if (b === btn && !isCorrect) b.classList.add("wrong");
      });

      // フィードバック表示
      fb.classList.add("show", isCorrect ? "ok" : "ng");
      fb.textContent = isCorrect
        ? `✓ 正解！${step.explanation || ""}`
        : `✗ 惜しい！${step.wrongExplanation || step.explanation || ""}`;

      // AIボタン (一時無効)
      if (false && !actionRow.querySelector(".btn-ask-ai")) {
        const selectedChoice = step.choices[selectedIdx] || "";
        const correctChoice = step.choices[Number(step.answer)] || "";
        const aiBtn = document.createElement("button");
        aiBtn.type = "button";
        aiBtn.className = "btn-ask-ai";
        aiBtn.textContent = "🤖 AIに質問";
        aiBtn.addEventListener("click", () => {
          openAiPanel({
            question: step.question || "",
            selected: selectedChoice,
            correct: correctChoice,
            isCorrect,
            explanation: isCorrect ? step.explanation : (step.wrongExplanation || step.explanation),
          });
        });
        actionRow.appendChild(aiBtn);
      }

      setFeedback("");
      saveProgress();
    });
  });

  return wrap;
}

function restoreNavRowHome() {
  if (!navRowEl || !navRowHomeEl) return;

  if (navRowHomeNextSibling && navRowHomeNextSibling.parentElement === navRowHomeEl) {
    navRowHomeEl.insertBefore(navRowEl, navRowHomeNextSibling);
  } else {
    navRowHomeEl.appendChild(navRowEl);
  }
}

function placeNavRowForStep(step) {
  if (!navRowEl) return;

  if (step?.type === "question") {
    const actionRow = stepContentEl.querySelector(".question-actions");
    if (actionRow) {
      actionRow.appendChild(navRowEl);
      return;
    }
  }

  restoreNavRowHome();
}

function updateHeaderAndButtons() {
  if (isClearScreen) {
    lessonTitleEl.textContent = lesson.title;
    progressTextEl.textContent = "\u5b8c\u4e86";
    progressTextEl.style.display = "";
    if (currentPathEl) {
      currentPathEl.textContent = "";
      currentPathEl.style.display = "none";
    }
    if (progressRowEl) progressRowEl.style.marginBottom = "8px";
    prevBtnEl.disabled = true;
    nextBtnEl.disabled = true;
    prevBtnEl.style.display = "none";
    nextBtnEl.style.display = "none";
    if (exerciseBtnEl) exerciseBtnEl.hidden = true;
    setSlideProgress(100);
    updateFullscreenToggle(false);
    return;
  }

  const step = getCurrentStep();
  const isQuestionStep = step.type === "question";
  const stepTypeLabel = isQuestionStep ? "\u6f14\u7fd2" : "\u30b9\u30e9\u30a4\u30c9";
  const useNextAsExercise = shouldUseNextAsExercise(step);
  const hideProgressText = shouldHideExerciseButton();

  prevBtnEl.style.display = "";
  nextBtnEl.style.display = "";
  if (exerciseBtnEl) exerciseBtnEl.hidden = true;

  lessonTitleEl.textContent = lesson.title;
  prevBtnEl.textContent = "\u524d\u3078";
  nextBtnEl.textContent = useNextAsExercise ? "\u6f14\u7fd2\u306b\u9032\u3080" : "\u6b21\u3078";
  prevBtnEl.setAttribute("aria-label", "\u623b\u308b");
  nextBtnEl.setAttribute("aria-label", useNextAsExercise ? "\u6f14\u7fd2\u306b\u9032\u3080" : "\u6b21\u3078");
  nextBtnEl.disabled = false;
  progressTextEl.style.display = hideProgressText ? "none" : "";

  updateFullscreenToggle(!isQuestionStep);

  if (currentPathEl) {
    currentPathEl.style.display = "none";
  }
  if (progressRowEl) {
    progressRowEl.style.marginBottom = isQuestionStep ? "8px" : "14px";
  }

  if (steps.length === 1 && isPdfPagedStep(step)) {
    progressTextEl.textContent = hideProgressText ? "" : `${pdfPage} / ${step.pdfPages}`;
    if (currentPathEl) currentPathEl.textContent = `${stepTypeLabel} ${pdfPage}/${step.pdfPages}`;
    prevBtnEl.disabled = pdfPage <= 1;
    nextBtnEl.disabled = !(useNextAsExercise || canGoForwardWithArrow(step));
    setSlideProgress((pdfPage / step.pdfPages) * 100);
    return;
  }

  const { current: slideCurrentRaw, total: slideTotalRaw } = getSlideProgress(stepIndex);
  const slideTotal = slideTotalRaw || steps.length;
  const slideCurrent = slideCurrentRaw || Math.min(stepIndex + 1, slideTotal);
  const slideProgressPercent = slideTotal > 0 ? (slideCurrent / slideTotal) * 100 : 0;

  setSlideProgress(isQuestionStep ? 0 : slideProgressPercent);
  progressTextEl.textContent = (isQuestionStep || hideProgressText) ? "" : `${slideCurrent} / ${slideTotal}`;
  if (currentPathEl && !isQuestionStep) {
    currentPathEl.textContent = `${stepTypeLabel} ${slideCurrent}/${slideTotal}`;
  }
  prevBtnEl.disabled = stepIndex === 0;
  nextBtnEl.disabled = !(useNextAsExercise || canGoForwardWithArrow(step));
}

function buildClearScreen() {
  const { score, total } = getScore();
  const nextLessonId = getNextLessonId();

  const wrap = document.createElement("section");

  const title = document.createElement("h2");
  title.className = "step-title";
  title.textContent = "\uD83C\uDF89 \u3053\u306e\u6f14\u7fd2\u3092\u30af\u30ea\u30a2\u3057\u307e\u3057\u305f\uff01";

  const scoreLabel = document.createElement("p");
  scoreLabel.className = "step-text";
  scoreLabel.textContent = "\u6b63\u89e3\u6570";

  const scoreValue = document.createElement("p");
  scoreValue.className = "question-text";
  scoreValue.textContent = `${score} / ${total}`;

  const actions = document.createElement("div");
  actions.className = "choices";
  actions.style.marginTop = "12px";

  const nextLessonLink = document.createElement("a");
  nextLessonLink.className = "btn-primary";
  nextLessonLink.href = nextLessonId
    ? `learning.html?lesson=${encodeURIComponent(nextLessonId)}`
    : "lessons.html";
  nextLessonLink.textContent = "\u6b21\u306e\u30ec\u30c3\u30b9\u30f3\u3078";
  nextLessonLink.style.display = "inline-block";
  nextLessonLink.style.textDecoration = "none";
  nextLessonLink.style.width = "fit-content";

  const lessonsLink = document.createElement("a");
  lessonsLink.className = "btn-small";
  lessonsLink.href = "lessons.html";
  lessonsLink.textContent = "\u30ec\u30c3\u30b9\u30f3\u4e00\u89a7\u3078";
  lessonsLink.style.display = "inline-block";
  lessonsLink.style.textDecoration = "none";
  lessonsLink.style.width = "fit-content";

  actions.append(nextLessonLink, lessonsLink);
  wrap.append(title, scoreLabel, scoreValue, actions);
  return wrap;
}

function renderClearScreen() {
  isClearScreen = true;
  navDirection = 0;
  if (slideFullscreenEnabled || document.fullscreenElement) {
    slideFullscreenEnabled = false;
    if (typeof document.exitFullscreen === "function" && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  }
  applySlideMode(false);
  stageWrapEl.dataset.stepType = "question";
  restoreNavRowHome();
  updateHeaderAndButtons();
  renderToc();
  setFeedback("");
  stepContentEl.replaceChildren(buildClearScreen());
  saveProgress();
}

function playSlideTransition(isSlideStep) {
  stepContentEl.classList.remove("anim-next", "anim-prev");

  if (!isSlideStep || navDirection === 0) {
    return;
  }

  const cls = navDirection > 0 ? "anim-next" : "anim-prev";
  void stepContentEl.offsetWidth;
  stepContentEl.classList.add(cls);

  if (transitionTimer) {
    clearTimeout(transitionTimer);
  }
  transitionTimer = setTimeout(() => {
    stepContentEl.classList.remove("anim-next", "anim-prev");
  }, 320);
}

function renderStep() {
  if (!lesson || !steps.length) return;

  isClearScreen = false;
  const step = getCurrentStep();
  const isSlideStep = step.type === "slide";

  if (!isSlideStep && (slideFullscreenEnabled || document.fullscreenElement)) {
    slideFullscreenEnabled = false;
    if (typeof document.exitFullscreen === "function" && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  }

  applySlideMode(isSlideStep);
  stageWrapEl.dataset.stepType = isSlideStep ? "slide" : "question";

  updateHeaderAndButtons();
  updateProgress();  // 進捗を更新
  renderToc();
  setFeedback("");

  stepContentEl.replaceChildren(step.type === "question" ? buildQuestionStep(step) : buildSlideStep(step));
  stepContentEl.classList.toggle('has-iframe-slide', !!stepContentEl.querySelector('.slide-embed'));
  placeNavRowForStep(step);
  playSlideTransition(isSlideStep);
  navDirection = 0;

  // AIボタンのコンテキストを更新（常時表示）
  if (slideAiBtnEl) {
    slideAiBtnEl.onclick = () => {
      if (typeof window.openAiPanel === "function") {
        window.openAiPanel({
          slideTitle: step.title || "",
          lessonTitle: lessonTitleEl ? lessonTitleEl.textContent : "",
          isSlide: isSlideStep,
          stepType: step.type,
        });
      }
    };
  }

  saveProgress();

  // 次スライドを隠しiframeで先読み（ラグ軽減）
  const nextStep = steps[stepIndex + 1];
  const preloadId = '__preload_next_slide';
  const existing = document.getElementById(preloadId);
  if (existing) existing.remove();
  if (nextStep && nextStep.embedUrl && !isPdfUrl(nextStep.embedUrl) && !isImageUrl(nextStep.embedUrl)) {
    const preIframe = document.createElement('iframe');
    preIframe.id = preloadId;
    preIframe.src = nextStep.embedUrl;
    preIframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:600px;visibility:hidden;pointer-events:none;';
    preIframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(preIframe);
  }
}

function goToPreviousStep() {
  if (isClearScreen) return;

  const step = getCurrentStep();

  if (steps.length === 1 && isPdfPagedStep(step)) {
    if (pdfPage <= 1) return;
    pdfPage -= 1;
    navDirection = -1;
    renderStep();
    return;
  }

  if (stepIndex <= 0) return;
  stepIndex -= 1;
  navDirection = -1;
  renderStep();
}

function goToNextStep(options = {}) {
  const { allowExerciseTransition = false } = options;
  if (isClearScreen) return;

  const step = getCurrentStep();
  if (!step) return;
  const exerciseLessonId = getExerciseLessonIdFromUrl() || lesson?.id || "lesson1";
  const exerciseUrl = `exercise.html?lesson=${encodeURIComponent(exerciseLessonId)}`;

  if (step.type === "question" && !answeredMap[stepIndex]) {
    setFeedback("\u3053\u306e\u554f\u984c\u306b\u56de\u7b54\u3057\u3066\u304b\u3089\u6b21\u3078\u9032\u3093\u3067\u304f\u3060\u3055\u3044\u3002", "ng");
    return;
  }
  if (step.type === "question" && !correctAnswerMap[stepIndex]) {
    setFeedback("\u6b63\u89e3\u3057\u3066\u304b\u3089\u6b21\u3078\u9032\u3093\u3067\u304f\u3060\u3055\u3044\u3002", "ng");
    return;
  }

  if (steps.length === 1 && isPdfPagedStep(step)) {
    if (pdfPage < step.pdfPages) {
      pdfPage += 1;
      navDirection = 1;
      renderStep();
      return;
    }

    if (!allowExerciseTransition) return;

    const progressMap = readJSON(PROGRESS_KEY, {});
    progressMap[lesson.id] = 100;
    writeJSON(PROGRESS_KEY, progressMap);
    window.location.href = exerciseUrl;
    return;
  }

  const nextStep = getNextStep();

  if (!nextStep) {
    const progressMap = readJSON(PROGRESS_KEY, {});
    progressMap[lesson.id] = 100;
    writeJSON(PROGRESS_KEY, progressMap);

    if (step.type === "question") {
      renderClearScreen();
      return;
    }

    if (!allowExerciseTransition) return;

    window.location.href = exerciseUrl;
    return;
  }

  if (step.type === "slide" && nextStep.type !== "slide" && !allowExerciseTransition) {
    return;
  }

  stepIndex += 1;
  navDirection = 1;
  renderStep();
}
function goToExercise() {
  goToNextStep({ allowExerciseTransition: true });
}

// 進捗を更新する関数
function updateProgress() {
  if (!lesson || !steps.length) return;

  // 現在のステップ進捗を計算（0～1の値）
  const stepProgress = (stepIndex + 1) / steps.length;
  const lessonProgress = Math.round(stepProgress * 100);

  const progressMap = readJSON(PROGRESS_KEY, {});

  // より高い進捗値を保存する（進捗は後退しない）
  const currentProgress = progressMap[lesson.id] || 0;
  progressMap[lesson.id] = Math.max(currentProgress, lessonProgress);

  writeJSON(PROGRESS_KEY, progressMap);
}
function isTextInputFocused(target) {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function handleKeyNavigation(event) {
  if (event.defaultPrevented) return;
  if (isTextInputFocused(event.target) || isTextInputFocused(document.activeElement)) return;

  const step = getCurrentStep();
  if (!step || step.type !== "slide" || isClearScreen) return;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    goToNextStep();
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToPreviousStep();
  }
}
async function loadLessons() {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("\u6559\u6750\u30c7\u30fc\u30bf\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002");
  }

  const data = await response.json();
  if (!Array.isArray(data.lessons)) {
    throw new Error("lessons-data.json \u306e lessons \u914d\u5217\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002");
  }

  return data.lessons;
}

async function init() {
  prevBtnEl.addEventListener("click", goToPreviousStep);
  nextBtnEl.addEventListener("click", () => {
    goToNextStep({ allowExerciseTransition: shouldUseNextAsExercise() });
  });
  if (exerciseBtnEl) {
    exerciseBtnEl.addEventListener("click", goToExercise);
  }
  if (fullscreenToggleEl) {
    fullscreenToggleEl.addEventListener("click", async () => {
      const step = getCurrentStep();
      if (!step || step.type !== "slide") return;
      await setSlideFullscreen(!slideFullscreenEnabled);
    });
  }
  window.addEventListener("keydown", handleKeyNavigation);
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  try {
    const lessons = await loadLessons();
    allLessons = lessons.map(normalizeLesson);
    allLessonIds = allLessons.map((item) => String(item.id || ""));
    const lessonId = getLessonIdFromUrl();
    const picked = allLessons.find((item) => item.id === lessonId) || allLessons[0];

    lesson = picked;
    steps = lesson.steps;

    if (!steps.length) {
      throw new Error("\u3053\u306e\u30ec\u30c3\u30b9\u30f3\u306b\u306f steps \u304c\u3042\u308a\u307e\u305b\u3093\u3002");
    }

    stepIndex = getInitialStepIndex(steps.length);
    pdfPage = 1;

    localStorage.setItem(LAST_LESSON_KEY, lesson.id);
    renderStep();
  } catch (error) {
    applySlideMode(false);
    lessonTitleEl.textContent = "\u8aad\u307f\u8fbc\u307f\u30a8\u30e9\u30fc";
    progressTextEl.textContent = "0 / 0";
    if (currentPathEl) currentPathEl.textContent = "\u8aad\u307f\u8fbc\u307f\u30a8\u30e9\u30fc";
    stepContentEl.innerHTML = `<p class="step-text">${error.message}</p>`;
    setFeedback("\u6559\u6750\u3092\u8aad\u307f\u8fbc\u3081\u307e\u305b\u3093\u3067\u3057\u305f\u3002", "ng");
    updateFullscreenToggle(false);
    prevBtnEl.disabled = true;
    nextBtnEl.disabled = true;
    if (exerciseBtnEl) exerciseBtnEl.hidden = true;
    if (tocPanelEl) tocPanelEl.hidden = true;
  }
}

init();

// ── AI Chat Panel ──
(function () {
  const panel = document.getElementById("aiChatPanel");
  const overlay = document.getElementById("aiOverlay");
  const closeBtn = document.getElementById("aiPanelClose");
  const contextEl = document.getElementById("aiPanelContext");
  const messagesEl = document.getElementById("aiPanelMessages");
  const formEl = document.getElementById("aiPanelForm");
  const questionInput = document.getElementById("aiPanelQuestion");
  const sendBtn = document.getElementById("aiPanelSend");
  if (!panel) return;

  let currentContext = "";

  function openPanel(ctx) {
    currentContext = ctx || "";
    contextEl.innerHTML = ctx || "";
    messagesEl.innerHTML = "";
    panel.classList.add("open");
    overlay.classList.add("open");
    document.body.classList.add("ai-open");
    setTimeout(() => questionInput.focus(), 350);
  }

  function closePanel() {
    panel.classList.remove("open");
    overlay.classList.remove("open");
    document.body.classList.remove("ai-open");
  }

  closeBtn.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = questionInput.value.trim();
    if (!q) return;

    const userMsg = document.createElement("div");
    userMsg.className = "ai-msg user";
    userMsg.textContent = q;
    messagesEl.appendChild(userMsg);

    questionInput.value = "";
    sendBtn.disabled = true;

    const loadingMsg = document.createElement("div");
    loadingMsg.className = "ai-msg assistant loading";
    loadingMsg.textContent = "回答を生成中...";
    messagesEl.appendChild(loadingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const res = await fetch("/.netlify/functions/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          context: currentContext,
        }),
      });
      const data = await res.json();
      loadingMsg.classList.remove("loading");
      loadingMsg.textContent = data.answer || "回答を取得できませんでした。";
    } catch {
      loadingMsg.classList.remove("loading");
      loadingMsg.textContent = "エラーが発生しました。もう一度お試しください。";
    }

    sendBtn.disabled = false;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  window.openAiPanel = function (info) {
    let ctx, contextText;
    if (info && info.isSlide) {
      ctx = `<strong>レッスン:</strong> ${info.lessonTitle}<br><strong>スライド:</strong> ${info.slideTitle}`;
      contextText = `レッスン: ${info.lessonTitle} / スライド: ${info.slideTitle}`;
    } else if (info) {
      ctx = `<strong>問題:</strong> ${info.question}<br><strong>あなたの回答:</strong> ${info.selected}<br><strong>正解:</strong> ${info.correct}<br><strong>結果:</strong> ${info.isCorrect ? "正解" : "不正解"}`;
      contextText = `問題: ${info.question} / あなたの回答: ${info.selected} / 正解: ${info.correct} / 結果: ${info.isCorrect ? "正解" : "不正解"}`;
    } else {
      ctx = "";
      contextText = "NEXELIA 学習ページ";
    }
    currentContext = contextText;
    openPanel(ctx);
  };
})();


















































