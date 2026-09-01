// 모바일 메뉴 토글
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.gnb');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '닫기' : '메뉴';
  });
})();

// 모션 감소 환경에서는 히어로 영상 자동재생 중지
(function () {
  var v = document.querySelector('.hero video');
  if (!v) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    v.removeAttribute('autoplay');
    v.pause();
  }
})();
