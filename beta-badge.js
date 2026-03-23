(function () {
  // すべてのNAVロゴとヒーロータイトルを「NEXELIA β」に統一
  var logos = document.querySelectorAll('.nav-logo, .logo, .hero-name');

  logos.forEach(function(logo) {
    // テキストが「NEXELIA」の場合、「NEXELIA β」に変更
    if (logo.textContent.trim() === 'NEXELIA') {
      // ロゴのスタイルを継承
      var computedStyle = window.getComputedStyle(logo);
      var fontSize = parseFloat(computedStyle.fontSize);
      var badgeFontSize = (fontSize * 0.75) + 'px';
      var lineHeight = computedStyle.lineHeight;
      var size = lineHeight === 'normal' ? computedStyle.fontSize : lineHeight;
      logo.innerHTML = 'NEXELIA <span style="background:#FF6B35;color:#fff;font-size:' + badgeFontSize + ';font-weight:700;border-radius:50%;margin-left:8px;vertical-align:middle;display:inline-flex;align-items:center;justify-content:center;width:' + size + ';height:' + size + ';line-height:' + size + '">β</span>';
    }
  });
})();
