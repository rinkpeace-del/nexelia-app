(function () {
  // すべてのNAVロゴとヒーロータイトルを「NEXELIA β」に統一
  var logos = document.querySelectorAll('.nav-logo, .logo, .hero-name');

  logos.forEach(function(logo) {
    // テキストが「NEXELIA」の場合、「NEXELIA β」に変更
    if (logo.textContent.trim() === 'NEXELIA') {
      var fontSize = logo.classList.contains('hero-name') ? '18px' : '10px';
      var padding = logo.classList.contains('hero-name') ? '4px 10px' : '2px 6px';
      logo.innerHTML = 'NEXELIA <span style="background:#FF6B35;color:#fff;font-size:' + fontSize + ';font-weight:700;padding:' + padding + ';border-radius:999px;margin-left:8px;vertical-align:middle;letter-spacing:0.05em">β</span>';
    }
  });
})();
