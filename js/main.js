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

// 작업 전후 비교 슬라이더: 마우스를 따라 움직이고, 터치 드래그와 키보드(range)도 지원
(function () {
  document.querySelectorAll('.bas').forEach(function (el) {
    var range = el.querySelector('input[type="range"]');

    function set(p) {
      p = Math.max(0, Math.min(100, p));
      el.style.setProperty('--p', p + '%');
      if (range && Number(range.value) !== Math.round(p)) range.value = Math.round(p);
    }

    function fromEvent(e) {
      var rect = el.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      set((x / rect.width) * 100);
    }

    el.addEventListener('mousemove', fromEvent);
    el.addEventListener('touchstart', fromEvent, { passive: true });
    el.addEventListener('touchmove', fromEvent, { passive: true });
    if (range) {
      range.addEventListener('input', function () { set(Number(range.value)); });
    }
  });
})();

// 후기 마퀴: 콘텐츠를 복제해 무한 흐름을 만든다 (모션 감소 환경에서는 CSS가 정지시킴)
(function () {
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });
})();
