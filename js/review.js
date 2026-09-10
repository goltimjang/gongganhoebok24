/* 고객 후기 작성 + 승인된 후기 표시 */
(function () {
  var cfg = window.REVIEW_CONFIG || {};
  var form = document.getElementById('review-form');
  var listWrap = document.getElementById('customer-reviews');
  if (!form && !listWrap) return;

  var enabled = !!(cfg.ENDPOINT && cfg.ENDPOINT.indexOf('http') === 0);
  // 백엔드 주소가 없으면 관련 영역은 숨긴 채로 둔다 (깨진 기능을 노출하지 않는다)
  if (!enabled) return;

  function show(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = false;
  }
  function hide(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  // 작성 폼은 바로 열어준다
  show('review-write-section');

  /* ---------- 승인된 후기 불러오기 ---------- */
  function stars(n) {
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  if (listWrap) {
    var status = document.getElementById('customer-reviews-status');
    fetch(cfg.ENDPOINT)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok || !d.reviews || !d.reviews.length) {
          hide('customer-reviews-section');
          return;
        }
        if (status) status.remove();
        show('customer-reviews-section');
        listWrap.innerHTML = d.reviews.map(function (r) {
          var photos = (r.photos || []).map(function (u) {
            return '<img src="' + esc(u) + '" alt="고객이 첨부한 작업 사진" loading="lazy">';
          }).join('');
          return '<article class="rv-card cust">' +
            '<div class="rv-meta"><span class="rv-cat">' + esc(r.service || '이용 후기') +
            ' <span class="rv-stars" aria-label="별점 5점 만점에 ' + r.rating + '점">' + stars(r.rating) + '</span></span>' +
            '<span>' + esc(r.nickname) + ', ' + esc(r.date) + '</span></div>' +
            '<p class="rv-body">' + esc(r.body).replace(/\n/g, '<br>') + '</p>' +
            (photos ? '<div class="rv-photos">' + photos + '</div>' : '') +
            '<p class="rv-src">홈페이지에서 직접 남겨주신 후기</p>' +
            '</article>';
        }).join('');
      })
      .catch(function () {
        hide('customer-reviews-section');
      });
  }

  /* ---------- 작성 폼 ---------- */
  if (!form) return;

  var fileInput = form.querySelector('#rv-photos');
  var preview = form.querySelector('#rv-preview');
  var msg = form.querySelector('#rv-msg');
  var submitBtn = form.querySelector('button[type="submit"]');
  var picked = [];

  function say(text, kind) {
    msg.textContent = text;
    msg.className = 'rv-msg' + (kind ? ' ' + kind : '');
  }

  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var scale = Math.min(1, (cfg.MAX_WIDTH || 1400) / img.width);
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', cfg.JPEG_QUALITY || 0.78));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  function drawPreview() {
    preview.innerHTML = picked.map(function (src, i) {
      return '<div class="rv-thumb"><img src="' + src + '" alt="첨부한 사진 ' + (i + 1) + '">' +
        '<button type="button" data-i="' + i + '" aria-label="사진 ' + (i + 1) + ' 삭제">삭제</button></div>';
    }).join('');
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      var max = cfg.MAX_PHOTOS || 3;
      var files = Array.prototype.slice.call(fileInput.files, 0, max - picked.length);
      if (!files.length) return;
      say('사진을 준비하는 중입니다.');
      Promise.all(files.map(shrink)).then(function (list) {
        picked = picked.concat(list).slice(0, max);
        drawPreview();
        say('');
        fileInput.value = '';
      }).catch(function () {
        say('사진을 읽지 못했습니다. 다른 사진으로 시도해 주세요.', 'err');
      });
    });
  }

  if (preview) {
    preview.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]');
      if (!b) return;
      picked.splice(Number(b.dataset.i), 1);
      drawPreview();
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var body = form.querySelector('#rv-body').value.trim();
    if (body.replace(/\s/g, '').length < 10) {
      say('후기 내용을 10자 이상 남겨주세요.', 'err');
      form.querySelector('#rv-body').focus();
      return;
    }
    if (!form.querySelector('#rv-agree').checked) {
      say('게시 동의를 확인해 주세요.', 'err');
      return;
    }

    submitBtn.disabled = true;
    var original = submitBtn.textContent;
    submitBtn.textContent = '등록 중...';
    say('후기를 등록하고 있습니다.');

    fetch(cfg.ENDPOINT, {
      method: 'POST',
      // 사전 요청(preflight) 없이 보내기 위한 형식
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        nickname: form.querySelector('#rv-nickname').value.trim(),
        service: form.querySelector('#rv-service').value,
        rating: form.querySelector('input[name="rating"]:checked').value,
        body: body,
        photos: picked,
        agree: true,
        website: form.querySelector('#rv-website').value,
        fp: navigator.userAgent + '|' + new Date().getTimezoneOffset()
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.error || '등록에 실패했습니다.');
        form.reset();
        picked = [];
        drawPreview();
        say('후기를 남겨주셔서 감사합니다. 확인 후 홈페이지에 게시됩니다.', 'ok');
      })
      .catch(function (err) {
        say(err.message || '등록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'err');
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      });
  });
})();
