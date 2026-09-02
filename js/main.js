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

// 작업 전후 비교 슬라이더: 누른 채로 움직여야 이동한다 (마우스, 터치, 키보드 지원)
(function () {
  document.querySelectorAll('.bas').forEach(function (el) {
    var range = el.querySelector('input[type="range"]');
    var dragging = false;

    function set(p) {
      p = Math.max(0, Math.min(100, p));
      el.style.setProperty('--p', p + '%');
      if (range && Number(range.value) !== Math.round(p)) range.value = Math.round(p);
    }

    function moveTo(clientX) {
      var rect = el.getBoundingClientRect();
      set(((clientX - rect.left) / rect.width) * 100);
    }

    el.addEventListener('pointerdown', function (e) {
      // 키보드 접근용 range를 직접 조작하는 경우는 제외
      if (e.target === range) return;
      dragging = true;
      el.classList.add('dragging', 'touched');
      el.setPointerCapture(e.pointerId);
      moveTo(e.clientX);
      e.preventDefault();
    });

    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      moveTo(e.clientX);
    });

    function stop(e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      if (e.pointerId !== undefined && el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
    }
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);

    if (range) {
      range.addEventListener('input', function () {
        el.classList.add('touched');
        set(Number(range.value));
      });
    }
  });
})();

// 후기 마퀴: 콘텐츠를 복제해 무한 흐름을 만든다 (모션 감소 환경에서는 CSS가 정지시킴)
(function () {
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });
})();

// 숫자 카운터: 화면에 들어오면 목표값까지 올라간다
(function () {
  var els = document.querySelectorAll('.stat .v[data-to]');
  if (!els.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function format(n, decimals) {
    return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function run(el) {
    var to = parseFloat(el.dataset.to);
    var decimals = (el.dataset.to.split('.')[1] || '').length;
    var unit = el.dataset.unit || '';
    var suffix = unit ? '<span class="u">' + unit + '</span>' : '';

    if (reduce) {
      el.innerHTML = format(to, decimals) + suffix;
      return;
    }
    var start = null;
    var dur = 1400;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.innerHTML = format(to * eased, decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    els.forEach(run);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        run(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  els.forEach(function (el) { io.observe(el); });
})();

// 스크롤 등장 애니메이션
(function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(function (el) { el.classList.add('shown'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('shown');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(function (el) { io.observe(el); });
})();

// 진행 절차 연결선 채우기
(function () {
  var line = document.querySelector('.step-line');
  if (!line) return;
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    line.classList.add('run');
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { line.classList.add('run'); io.disconnect(); }
    });
  }, { threshold: 0.5 });
  io.observe(line);
})();
