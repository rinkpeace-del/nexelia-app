(function () {
  if (window.__nexeliaAiButtonMounted) return;
  window.__nexeliaAiButtonMounted = true;

  var style = document.createElement("style");
  style.textContent = [
    ".nx-ai-launcher{position:fixed;right:18px;bottom:18px;z-index:9999;border:0;border-radius:999px;background:#1a56db;color:#fff;font:700 14px 'Noto Sans JP',sans-serif;padding:12px 16px;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.18)}",
    ".nx-ai-launcher:hover{background:#1446b8}",
    ".nx-ai-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9998;display:none}",
    ".nx-ai-panel{position:fixed;right:18px;bottom:72px;width:min(420px,calc(100vw - 24px));z-index:9999;background:#fff;border:1px solid #e8e8e8;border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.2);display:none;overflow:hidden}",
    ".nx-ai-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #eee}",
    ".nx-ai-title{font:700 14px 'Noto Sans JP',sans-serif;color:#111}",
    ".nx-ai-close{border:0;background:transparent;color:#666;font:700 20px/1 sans-serif;cursor:pointer;padding:2px 4px}",
    ".nx-ai-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px}",
    ".nx-ai-note{font:500 12px/1.6 'Noto Sans JP',sans-serif;color:#666}",
    ".nx-ai-context{font:600 12px/1.6 'Noto Sans JP',sans-serif;color:#1a56db;background:#e8f0fe;border-radius:8px;padding:8px 10px}",
    ".nx-ai-input{width:100%;resize:vertical;min-height:92px;max-height:240px;border:1px solid #ddd;border-radius:10px;padding:10px 12px;font:500 14px/1.6 'Noto Sans JP',sans-serif;outline:none}",
    ".nx-ai-input:focus{border-color:#1a56db;box-shadow:0 0 0 2px rgba(26,86,219,.12)}",
    ".nx-ai-actions{display:flex;gap:8px;flex-wrap:wrap}",
    ".nx-ai-btn{border:1px solid #ddd;border-radius:10px;background:#fff;color:#333;padding:9px 12px;font:700 13px 'Noto Sans JP',sans-serif;cursor:pointer}",
    ".nx-ai-btn.primary{background:#1a56db;border-color:#1a56db;color:#fff}",
    ".nx-ai-btn.primary:hover{background:#1446b8}",
    ".nx-ai-status{font:500 12px/1.6 'Noto Sans JP',sans-serif;color:#666;min-height:19px}"
  ].join("");
  document.head.appendChild(style);

  var backdrop = document.createElement("div");
  backdrop.className = "nx-ai-backdrop";

  var panel = document.createElement("aside");
  panel.className = "nx-ai-panel";
  panel.innerHTML = [
    '<div class="nx-ai-head">',
    '  <div class="nx-ai-title">AIに質問</div>',
    '  <button class="nx-ai-close" type="button" aria-label="閉じる">&times;</button>',
    "</div>",
    '<div class="nx-ai-body">',
    '  <p class="nx-ai-note">質問内容を入力して、AIチャットに送信できます。</p>',
    '  <div class="nx-ai-context" id="nxAiContext"></div>',
    '  <textarea class="nx-ai-input" id="nxAiInput" placeholder="例: didn\'t の後ろはなぜ原形になるの？"></textarea>',
    '  <div class="nx-ai-actions">',
    '    <button class="nx-ai-btn primary" id="nxAiAskBtn" type="button">ChatGPTで質問</button>',
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

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  var closeBtn = panel.querySelector(".nx-ai-close");
  var input = panel.querySelector("#nxAiInput");
  var askBtn = panel.querySelector("#nxAiAskBtn");
  var copyBtn = panel.querySelector("#nxAiCopyBtn");
  var statusEl = panel.querySelector("#nxAiStatus");
  var contextEl = panel.querySelector("#nxAiContext");

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

  function openPanel() {
    contextEl.textContent = "現在の学習: " + currentContext();
    panel.style.display = "block";
    backdrop.style.display = "block";
    setTimeout(function () { input.focus(); }, 0);
  }

  function closePanel() {
    panel.style.display = "none";
    backdrop.style.display = "none";
    statusEl.textContent = "";
  }

  function askInChatGPT() {
    var question = input.value.trim();
    if (!question) {
      statusEl.textContent = "質問を入力してください。";
      input.focus();
      return;
    }
    var prompt = buildPrompt(question);
    var chatUrl = "https://chatgpt.com/?q=" + encodeURIComponent(prompt);
    window.open(chatUrl, "_blank", "noopener,noreferrer");
    statusEl.textContent = "ChatGPTを新しいタブで開きました。";
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

  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);
  askBtn.addEventListener("click", askInChatGPT);
  copyBtn.addEventListener("click", copyPrompt);
})();
