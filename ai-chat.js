(function () {
  if (window.__nexeliaAiButtonMounted) return;
  window.__nexeliaAiButtonMounted = true;

  var page = ((window.location.pathname || "").split("/").pop() || "").toLowerCase();
  var isUnitPage =
    /^nexelia-unit\d+-final\.html?$/.test(page) ||
    /^nexelia-unit\d+-final$/.test(page);
  if (!isUnitPage) return;

  var WIDTH_KEY = "nexeliaAiPanelWidth";
  var DEFAULT_WIDTH = 420;
  var MIN_WIDTH = 320;
  var RESERVE_MAIN = 360;
  var ENDPOINTS = ["/api/ai-chat", "/.netlify/functions/ai-chat", "/ai-chat-proxy.php"];

  function getMaxWidth() {
    return Math.max(MIN_WIDTH, window.innerWidth - RESERVE_MAIN);
  }

  function clampWidth(v) {
    var n = Number(v) || DEFAULT_WIDTH;
    return Math.max(MIN_WIDTH, Math.min(getMaxWidth(), n));
  }

  function setPanelWidth(v) {
    var w = clampWidth(v);
    document.documentElement.style.setProperty("--nx-ai-panel-width", w + "px");
    try { localStorage.setItem(WIDTH_KEY, String(w)); } catch (_) {}
    return w;
  }

  var initialWidth = DEFAULT_WIDTH;
  try {
    initialWidth = clampWidth(localStorage.getItem(WIDTH_KEY));
  } catch (_) {
    initialWidth = clampWidth(DEFAULT_WIDTH);
  }
  document.documentElement.style.setProperty("--nx-ai-panel-width", initialWidth + "px");

  var style = document.createElement("style");
  style.textContent = [
    "html,body{overflow-x:hidden}",
    "body{transition:width .22s ease}",
    "html.nx-ai-open body{width:calc(100vw - var(--nx-ai-panel-width, 420px))}",
    ".nx-ai-launcher{position:fixed;right:18px;bottom:18px;z-index:10001;border:0;border-radius:999px;background:#1a56db;color:#fff;font:700 14px 'Noto Sans JP',sans-serif;padding:12px 16px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18);transition:opacity .15s ease}",
    ".nx-ai-launcher:hover{background:#1446b8}",
    "html.nx-ai-open .nx-ai-launcher{opacity:0;pointer-events:none}",
    ".nx-ai-panel{position:fixed;top:0;right:0;bottom:0;height:100vh;width:var(--nx-ai-panel-width, 420px);z-index:10000;background:#fff;border-left:1px solid #e8e8e8;box-shadow:-8px 0 24px rgba(0,0,0,.12);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .22s ease}",
    ".nx-ai-panel.is-open{transform:translateX(0)}",
    ".nx-ai-resizer{position:absolute;left:-4px;top:0;bottom:0;width:8px;cursor:col-resize;background:transparent}",
    ".nx-ai-resizer:hover{background:rgba(26,86,219,.12)}",
    ".nx-ai-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #eee;min-height:60px}",
    ".nx-ai-title{font:700 14px 'Noto Sans JP',sans-serif;color:#111}",
    ".nx-ai-close{border:0;background:transparent;color:#666;font:700 20px/1 sans-serif;cursor:pointer;padding:2px 4px}",
    ".nx-ai-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px;height:calc(100vh - 60px);overflow:auto}",
    ".nx-ai-note{font:500 12px/1.6 'Noto Sans JP',sans-serif;color:#666}",
    ".nx-ai-context{font:600 12px/1.6 'Noto Sans JP',sans-serif;color:#1a56db;background:#e8f0fe;border-radius:8px;padding:8px 10px}",
    ".nx-ai-messages{flex:1;min-height:220px;border:1px solid #e8e8e8;border-radius:12px;background:#fafafa;padding:10px;overflow:auto;display:flex;flex-direction:column;gap:8px}",
    ".nx-ai-empty{font:500 12px/1.7 'Noto Sans JP',sans-serif;color:#888;padding:10px 8px}",
    ".nx-ai-msg{max-width:92%;padding:9px 11px;border-radius:10px;font:500 13px/1.7 'Noto Sans JP',sans-serif;white-space:pre-wrap;word-break:break-word}",
    ".nx-ai-msg.user{align-self:flex-end;background:#1a56db;color:#fff}",
    ".nx-ai-msg.assistant{align-self:flex-start;background:#fff;color:#1a1a1a;border:1px solid #e8e8e8}",
    ".nx-ai-msg.loading{opacity:.7}",
    ".nx-ai-input{width:100%;resize:vertical;min-height:92px;max-height:220px;border:1px solid #ddd;border-radius:10px;padding:10px 12px;font:500 14px/1.6 'Noto Sans JP',sans-serif;outline:none}",
    ".nx-ai-input:focus{border-color:#1a56db;box-shadow:0 0 0 2px rgba(26,86,219,.12)}",
    ".nx-ai-actions{display:flex;gap:8px;flex-wrap:wrap}",
    ".nx-ai-btn{border:1px solid #ddd;border-radius:10px;background:#fff;color:#333;padding:9px 12px;font:700 13px 'Noto Sans JP',sans-serif;cursor:pointer}",
    ".nx-ai-btn.primary{background:#1a56db;border-color:#1a56db;color:#fff}",
    ".nx-ai-btn.primary:hover{background:#1446b8}",
    ".nx-ai-btn:disabled{opacity:.6;cursor:not-allowed}",
    ".nx-ai-status{font:500 12px/1.6 'Noto Sans JP',sans-serif;color:#666;min-height:19px}",
    "@media (max-width: 900px){",
    "  html.nx-ai-open body{width:100vw}",
    "  .nx-ai-panel{width:min(100vw, 520px)}",
    "  .nx-ai-resizer{display:none}",
    "}"
  ].join("");
  document.head.appendChild(style);

  var panel = document.createElement("aside");
  panel.className = "nx-ai-panel";
  panel.innerHTML = [
    '<div class="nx-ai-resizer" title="幅を調整"></div>',
    '<div class="nx-ai-head">',
    '  <div class="nx-ai-title">AIに質問</div>',
    '  <button class="nx-ai-close" type="button" aria-label="閉じる">&times;</button>',
    "</div>",
    '<div class="nx-ai-body">',
    '  <p class="nx-ai-note">この画面内でAIが回答します。</p>',
    '  <div class="nx-ai-context" id="nxAiContext"></div>',
    '  <div class="nx-ai-messages" id="nxAiMessages">',
    '    <div class="nx-ai-empty" id="nxAiEmpty">ここにAIの回答が表示されます。</div>',
    "  </div>",
    '  <textarea class="nx-ai-input" id="nxAiInput" placeholder="例: 比較級と最上級の違いをやさしく説明して"></textarea>',
    '  <div class="nx-ai-actions">',
    '    <button class="nx-ai-btn primary" id="nxAiAskBtn" type="button">AIに送信</button>',
    '    <button class="nx-ai-btn" id="nxAiCopyBtn" type="button">質問文をコピー</button>',
    "  </div>",
    '  <div class="nx-ai-status" id="nxAiStatus"></div>',
    "</div>"
  ].join("");

  var launcher = document.createElement("button");
  launcher.className = "nx-ai-launcher";
  launcher.type = "button";
  launcher.textContent = "AIに質問";
  launcher.setAttribute("aria-label", "AIに質問");

  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  var closeBtn = panel.querySelector(".nx-ai-close");
  var input = panel.querySelector("#nxAiInput");
  var askBtn = panel.querySelector("#nxAiAskBtn");
  var copyBtn = panel.querySelector("#nxAiCopyBtn");
  var statusEl = panel.querySelector("#nxAiStatus");
  var contextEl = panel.querySelector("#nxAiContext");
  var resizer = panel.querySelector(".nx-ai-resizer");
  var messagesEl = panel.querySelector("#nxAiMessages");
  var emptyEl = panel.querySelector("#nxAiEmpty");

  function currentContext() {
    var lessonNameEl = document.querySelector(".lesson-name");
    var lessonName = lessonNameEl ? lessonNameEl.textContent.trim() : "";
    var title = (document.title || "").trim();
    return lessonName || title || "NEXELIA";
  }

  function buildPrompt(question) {
    return [
      "中学生向け英語学習サイト NEXELIA を使っています。",
      "現在の画面: " + currentContext(),
      "",
      "質問:",
      question,
      "",
      "日本語でやさしく解説して、最後に確認クイズを1問出してください。"
    ].join("\n");
  }

  function ensureEmptyStateHidden() {
    if (emptyEl) emptyEl.style.display = "none";
  }

  function appendMessage(role, text, loading) {
    ensureEmptyStateHidden();
    var div = document.createElement("div");
    div.className = "nx-ai-msg " + role + (loading ? " loading" : "");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function setLoading(isLoading) {
    askBtn.disabled = isLoading;
    copyBtn.disabled = isLoading;
    input.disabled = isLoading;
  }

  function extractAnswer(data) {
    if (!data) return "";
    if (typeof data.answer === "string" && data.answer.trim()) return data.answer.trim();
    if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
    var out = [];
    var blocks = Array.isArray(data.output) ? data.output : [];
    blocks.forEach(function (b) {
      var content = Array.isArray(b.content) ? b.content : [];
      content.forEach(function (c) {
        if (c && typeof c.text === "string" && c.text.trim()) out.push(c.text.trim());
      });
    });
    return out.join("\n").trim();
  }

  async function requestAI(payload) {
    var errors = [];
    for (var i = 0; i < ENDPOINTS.length; i++) {
      var ep = ENDPOINTS[i];
      try {
        var res = await fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          errors.push(ep + " -> " + res.status);
          continue;
        }
        var data = await res.json();
        var answer = extractAnswer(data);
        if (answer) return answer;
        errors.push(ep + " -> empty response");
      } catch (err) {
        errors.push(ep + " -> " + (err && err.message ? err.message : String(err)));
      }
    }
    throw new Error(errors.join(" | "));
  }

  function openPanel() {
    contextEl.textContent = "現在の学習: " + currentContext();
    setPanelWidth(initialWidth);
    panel.classList.add("is-open");
    document.documentElement.classList.add("nx-ai-open");
    setTimeout(function () { input.focus(); }, 0);
  }

  function closePanel() {
    panel.classList.remove("is-open");
    document.documentElement.classList.remove("nx-ai-open");
    statusEl.textContent = "";
  }

  async function askInPanel() {
    var question = input.value.trim();
    if (!question) {
      statusEl.textContent = "質問を入力してください。";
      input.focus();
      return;
    }

    appendMessage("user", question, false);
    input.value = "";
    statusEl.textContent = "AIが回答中です...";
    setLoading(true);

    var loadingBubble = appendMessage("assistant", "考えています...", true);
    try {
      var answer = await requestAI({
        question: question,
        context: currentContext(),
        prompt: buildPrompt(question)
      });
      loadingBubble.classList.remove("loading");
      loadingBubble.textContent = answer || "回答を取得できませんでした。";
      statusEl.textContent = "回答しました。";
    } catch (err) {
      loadingBubble.classList.remove("loading");
      loadingBubble.textContent = "回答に失敗しました。サーバー設定を確認してください。";
      statusEl.textContent = "AIサーバー未接続: /api/ai-chat または /ai-chat-proxy.php を設定してください。";
    } finally {
      setLoading(false);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function copyPrompt() {
    var question = input.value.trim();
    if (!question) {
      statusEl.textContent = "質問を入力してください。";
      input.focus();
      return;
    }
    var prompt = buildPrompt(question);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(prompt).then(function () {
        statusEl.textContent = "質問文をコピーしました。";
      }).catch(function () {
        statusEl.textContent = "コピーに失敗しました。";
      });
      return;
    }
    statusEl.textContent = "このブラウザではコピーが使えません。";
  }

  function startResize(e) {
    if (window.innerWidth <= 900) return;
    e.preventDefault();
    var startX = e.clientX;
    var current = getComputedStyle(document.documentElement).getPropertyValue("--nx-ai-panel-width");
    var startWidth = parseInt(current, 10) || initialWidth;
    var onMove = function (ev) {
      var delta = startX - ev.clientX;
      var next = setPanelWidth(startWidth + delta);
      initialWidth = next;
    };
    var onUp = function () {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  askBtn.addEventListener("click", function () { askInPanel(); });
  copyBtn.addEventListener("click", copyPrompt);
  resizer.addEventListener("pointerdown", startResize);
  input.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") askInPanel();
  });

  window.addEventListener("resize", function () {
    initialWidth = setPanelWidth(initialWidth);
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) closePanel();
  });
})();
