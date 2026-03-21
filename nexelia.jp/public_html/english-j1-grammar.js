// ここに自分のスライド埋め込みURLを設定
const EMBED_URL = "slides/be-doushi-basic/index.html";

const slideFrameWrap = document.getElementById("slideFrameWrap");
const slideFrame = document.getElementById("slideFrame");
const fullscreenBtn = document.getElementById("fullscreenBtn");

function initSlide() {
  if (!EMBED_URL || !EMBED_URL.trim()) {
    slideFrameWrap.style.display = "none";
    return;
  }
  slideFrame.src = EMBED_URL.trim();
}

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await slideFrameWrap.requestFullscreen();
      }
    } catch {
      // no-op
    }
  });
}

initSlide();


