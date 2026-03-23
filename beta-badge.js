(function () {
  // すべてのNAVロゴとヒーロータイトルを「NEXELIA β」に統一
  var logos = document.querySelectorAll('.nav-logo, .logo, .hero-name');

  logos.forEach(function(logo) {
    // テキストが「NEXELIA」の場合、「NEXELIA β」に変更
    if (logo.textContent.trim() === 'NEXELIA') {
      // ロゴのフォントサイズを継承
      var computedStyle = window.getComputedStyle(logo);
      var fontSize = computedStyle.fontSize;
      var padding = '2px';
      var minWidth = 'calc(' + fontSize + ' + 4px)';
      logo.innerHTML = 'NEXELIA <span style="background:#FF6B35;color:#fff;font-size:' + fontSize + ';font-weight:700;padding:' + padding + ';border-radius:50%;margin-left:8px;vertical-align:middle;display:inline-flex;align-items:center;justify-content:center;width:' + minWidth + ';height:' + minWidth + '">β</span>';
    }
  });
})();
