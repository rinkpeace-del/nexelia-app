/**
 * exercise-retry.js
 * 間違えた問題だけやり直す機能を全演習ページに追加する共通スクリプト
 */
(function () {
  'use strict';

  var CSS_ADDED = false;

  function addStyles() {
    if (CSS_ADDED) return;
    CSS_ADDED = true;
    var style = document.createElement('style');
    style.textContent = [
      '.retry-overlay{position:fixed;inset:0;background:#fff;z-index:9000;display:flex;flex-direction:column;overflow:hidden;}',
      '.retry-nav{background:#fff;border-bottom:1px solid #E8E8E8;height:60px;display:flex;align-items:center;justify-content:center;padding:0 32px;flex-shrink:0;position:relative;}',
      '.retry-nav-logo{font-weight:700;font-size:20px;color:#D32F2F;letter-spacing:.08em;text-decoration:none;position:absolute;left:32px;}',
      '.retry-nav-center{width:100%;max-width:400px;display:flex;align-items:center;gap:12px;}',
      '.retry-lesson-name{font-size:13px;font-weight:600;color:#888;white-space:nowrap;}',
      '.retry-track{flex:1;height:4px;background:#E8E8E8;border-radius:2px;overflow:hidden;}',
      '.retry-fill{height:100%;background:#E65100;border-radius:2px;transition:width .4s ease;}',
      '.retry-count{font-size:12px;font-weight:600;color:#888;white-space:nowrap;}',
      '.retry-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;max-width:680px;width:100%;margin:0 auto;padding:36px 24px 28px;}',
      '.retry-slide{display:none;flex-direction:column;flex:1;animation:retryFadeUp .3s ease both;}',
      '.retry-slide.active{display:flex;}',
      '@keyframes retryFadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}',
      '.retry-done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0;gap:16px;}',
      '.retry-done h2{font-size:24px;font-weight:700;}',
      '.retry-done p{font-size:15px;color:#888;line-height:1.7;}',
    ].join('');
    document.head.appendChild(style);
  }

  function getWrongSlideIndices() {
    var indices = [];
    document.querySelectorAll('.slide').forEach(function (slide, i) {
      if (slide.querySelector('.opt.wrong, .opt-card.wrong')) {
        indices.push(i);
      }
    });
    return indices;
  }

  function cloneAndReset(slide) {
    var clone = slide.cloneNode(true);
    clone.classList.remove('active');
    clone.removeAttribute('id');

    // Reset option buttons
    clone.querySelectorAll('.opt, .opt-card').forEach(function (btn) {
      btn.classList.remove('correct', 'wrong', 'selected-q5');
      btn.disabled = false;
      btn.style.borderColor = '';
      btn.style.background = '';
      btn.style.textDecoration = '';
    });

    // Clear feedback
    var fb = clone.querySelector('.feedback');
    if (fb) {
      fb.classList.remove('show', 'ok', 'ng');
      fb.textContent = '';
    }

    // Disable next button
    var nextBtn = clone.querySelector('.btn-nav.primary, .btn-nav.cta');
    if (nextBtn) nextBtn.disabled = true;

    // Remove AI buttons
    clone.querySelectorAll('[id^="aiBtn_"]').forEach(function (b) { b.remove(); });

    // Remove back button (we manage navigation ourselves)
    var backBtn = clone.querySelector('.btn-nav:not(.primary):not(.cta)');
    if (backBtn && backBtn.style.visibility !== 'hidden') {
      backBtn.style.visibility = 'hidden';
    }

    // Remove dot container (we have our own progress bar)
    clone.querySelectorAll('.dots').forEach(function (d) { d.innerHTML = ''; });

    return clone;
  }

  function buildRetryOverlay(wrongIndices) {
    addStyles();

    var overlay = document.createElement('div');
    overlay.className = 'retry-overlay';

    // Nav bar
    var nav = document.createElement('div');
    nav.className = 'retry-nav';
    nav.innerHTML = '<span class="retry-nav-logo">NEXELIA</span>' +
      '<div class="retry-nav-center">' +
        '<span class="retry-lesson-name">間違えた問題をやり直す</span>' +
        '<div class="retry-track"><div class="retry-fill" id="retryFill" style="width:0%"></div></div>' +
        '<span class="retry-count" id="retryCount">1 / ' + wrongIndices.length + '</span>' +
      '</div>';
    overlay.appendChild(nav);

    // Body
    var body = document.createElement('div');
    body.className = 'retry-body';
    overlay.appendChild(body);

    var total = wrongIndices.length;
    var slides = [];
    var cur = 0;
    var retryCorrect = 0;

    // FB texts from original slides
    var originalFbOk = [];
    var originalFbNg = [];
    document.querySelectorAll('.feedback').forEach(function (fb, i) {
      if (wrongIndices.indexOf(i) !== -1) {
        var okText = fb.classList.contains('ok') ? fb.textContent : '';
        var ngText = fb.classList.contains('ng') ? fb.textContent : '';
        originalFbOk.push(okText);
        originalFbNg.push(ngText);
      }
    });

    // Clone and add wrong slides
    wrongIndices.forEach(function (origIdx, retryIdx) {
      var origSlide = document.getElementById('s' + origIdx);
      if (!origSlide) return;
      var clone = cloneAndReset(origSlide);
      clone.id = 'rs' + retryIdx;
      clone.className = 'retry-slide' + (retryIdx === 0 ? ' active' : '');
      body.appendChild(clone);
      slides.push(clone);
    });

    // Done screen
    var doneScreen = document.createElement('div');
    doneScreen.className = 'retry-done';
    doneScreen.id = 'retryDone';
    doneScreen.style.display = 'none';
    doneScreen.innerHTML =
      '<div style="font-size:52px" id="retryDoneIcon">👍</div>' +
      '<h2 id="retryDoneTitle">やり直し完了！</h2>' +
      '<p id="retryDoneMsg"></p>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:8px;">' +
        '<button id="retryClose" class="cbtn secondary" style="padding:13px 28px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;background:#fff;border:1.5px solid #E8E8E8;font-family:inherit;">閉じる</button>' +
      '</div>';
    body.appendChild(doneScreen);

    function updateProgress(idx) {
      var fill = document.getElementById('retryFill');
      var count = document.getElementById('retryCount');
      if (fill) fill.style.width = ((idx + 1) / total * 100) + '%';
      if (count) count.textContent = (idx + 1) + ' / ' + total;
    }

    function showSlide(idx) {
      slides.forEach(function (s) { s.classList.remove('active'); });
      if (slides[idx]) {
        slides[idx].classList.add('active');
        updateProgress(idx);
      }
    }

    function showDone() {
      slides.forEach(function (s) { s.classList.remove('active'); });
      doneScreen.style.display = 'flex';
      doneScreen.style.flexDirection = 'column';
      doneScreen.style.alignItems = 'center';
      doneScreen.style.justifyContent = 'center';

      var fill = document.getElementById('retryFill');
      if (fill) fill.style.width = '100%';
      var count = document.getElementById('retryCount');
      if (count) count.textContent = '完了';

      var icon = document.getElementById('retryDoneIcon');
      var msg = document.getElementById('retryDoneMsg');
      if (retryCorrect === total) {
        if (icon) icon.textContent = '🎉';
        document.getElementById('retryDoneTitle').textContent = '全問正解！';
        if (msg) msg.textContent = '完璧です！次のレッスンへ進もう。';
      } else {
        if (icon) icon.textContent = '📖';
        document.getElementById('retryDoneTitle').textContent = retryCorrect + ' / ' + total + ' 問正解';
        if (msg) msg.textContent = 'もう一度スライドを確認してみよう。';
      }

      document.getElementById('retryClose').addEventListener('click', function () {
        document.body.removeChild(overlay);
      });
    }

    // Wire up each cloned slide's options
    slides.forEach(function (slide, retryIdx) {
      var origIdx = wrongIndices[retryIdx];
      var origSlide = document.getElementById('s' + origIdx);
      var isMulti = origSlide && origSlide.querySelectorAll('[data-correct="true"]').length > 1;
      var answered = false;

      var opts = slide.querySelectorAll('.opt, .opt-card');
      var nextBtn = slide.querySelector('.btn-nav.primary, .btn-nav.cta');
      var fb = slide.querySelector('.feedback');

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          cur = retryIdx + 1;
          if (cur >= total) {
            showDone();
          } else {
            showSlide(cur);
          }
        });
      }

      if (isMulti) {
        var selected = [];
        var correctCount = 0;
        opts.forEach(function (b) { if (b.dataset.correct === 'true') correctCount++; });

        opts.forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (answered) return;
            if (btn.classList.contains('selected-q5')) return;
            btn.classList.add('selected-q5');
            btn.style.borderColor = 'var(--blue)';
            btn.style.background = 'var(--blue-light)';
            selected.push(btn);

            if (selected.length === correctCount) {
              answered = true;
              var allRight = selected.every(function (b) { return b.dataset.correct === 'true'; });
              opts.forEach(function (b) {
                b.disabled = true;
                b.style.borderColor = '';
                b.style.background = '';
                if (b.dataset.correct === 'true') b.classList.add('correct');
              });
              selected.forEach(function (b) {
                if (b.dataset.correct !== 'true') b.classList.add('wrong');
              });
              if (allRight) retryCorrect++;
              if (fb) {
                fb.classList.add('show', allRight ? 'ok' : 'ng');
                fb.textContent = allRight ? '✓ 正解！' : '✗ もう一度スライドで確認しよう。';
              }
              if (nextBtn) nextBtn.disabled = false;
            }
          });
        });
      } else {
        opts.forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (answered) return;
            answered = true;
            var isCorrect = btn.dataset.correct === 'true';
            if (isCorrect) retryCorrect++;
            opts.forEach(function (b) {
              b.disabled = true;
              if (b.dataset.correct === 'true') b.classList.add('correct');
            });
            if (!isCorrect) btn.classList.add('wrong');
            if (fb) {
              fb.classList.add('show', isCorrect ? 'ok' : 'ng');
              fb.textContent = isCorrect ? '✓ 正解！' : '✗ もう一度スライドで確認しよう。';
            }
            if (nextBtn) nextBtn.disabled = false;
          });
        });
      }
    });

    showSlide(0);
    document.body.appendChild(overlay);
  }

  function setupRetryButton() {
    if (document.getElementById('retryWrongBtn')) return;

    var wrongIndices = getWrongSlideIndices();
    if (wrongIndices.length === 0) return;

    var btns = document.querySelector('.complete-btns');
    if (!btns) return;

    var btn = document.createElement('button');
    btn.id = 'retryWrongBtn';
    btn.className = 'cbtn';
    btn.style.cssText = 'background:#E65100;color:white;border:none;padding:13px 28px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;';
    btn.textContent = '間違えた ' + wrongIndices.length + ' 問をやり直す';

    btns.insertBefore(btn, btns.firstChild);

    btn.addEventListener('click', function () {
      buildRetryOverlay(wrongIndices);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var complete = document.getElementById('complete');
    if (!complete) return;

    var observer = new MutationObserver(function () {
      if (complete.classList.contains('active')) {
        setupRetryButton();
      }
    });
    observer.observe(complete, { attributes: true, attributeFilter: ['class'] });

    // ドットをクリック可能にする（renderDotsをオーバーライド）
    if (typeof window.renderDots === 'function') {
      var _origRenderDots = window.renderDots;
      window.renderDots = function (id) {
        _origRenderDots(id);
        var el = document.getElementById('d' + id);
        if (!el) return;
        el.querySelectorAll('.dot').forEach(function (dot, i) {
          dot.style.cursor = 'pointer';
          dot.title = 'スライド ' + (i + 1);
          dot.addEventListener('click', function () {
            if (typeof window.go === 'function') window.go(i);
          });
        });
      };
    }
  });
})();
