/* 고객 후기: 작성하면 바로 홈페이지에 표시됩니다. */
(function () {
  var cfg = window.REVIEW_CONFIG || {};
  var form = document.getElementById('review-form');
  var listWrap = document.getElementById('customer-reviews');
  if (!form && !listWrap) return;

  /* ---------- 백엔드 선택 ---------- */
  var sb = cfg.SUPABASE || {};
  var gas = cfg.GAS || {};
  var provider = null;
  if (cfg.PROVIDER === 'supabase' && sb.URL && sb.ANON_KEY) provider = 'supabase';
  else if (cfg.PROVIDER === 'gas' && gas.ENDPOINT) provider = 'gas';

  // 설정 전에는 관련 영역을 숨긴 채로 둔다 (깨진 기능을 노출하지 않는다)
  if (!provider) return;

  function show(id) { var el = document.getElementById(id); if (el) el.hidden = false; }
  function hide(id) { var el = document.getElementById(id); if (el) el.hidden = true; }

  show('review-write-section');

  /* ---------- 공통 도구 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function stars(n) {
    n = Math.min(5, Math.max(1, Number(n) || 5));
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getFullYear() + '. ' +
      String(d.getMonth() + 1).padStart(2, '0') + '. ' +
      String(d.getDate()).padStart(2, '0') + '.';
  }

  // 광고·욕설이 섞인 글은 등록 단계에서 걸러낸다
  var BLOCK = ['카지노', '바카라', '토토', '먹튀', '비아그라', '대출', '홀덤',
               '섹스', '야동', '립카페', '조건만남', 'viagra', 'casino', 'crypto',
               '코인리딩', '주식리딩', '씨발', '개새끼', '병신', '좆'];
  function looksLikeSpam(text) {
    var low = text.toLowerCase();
    for (var i = 0; i < BLOCK.length; i++) if (low.indexOf(BLOCK[i]) !== -1) return true;
    if ((text.match(/https?:\/\//g) || []).length > 0) return true;      // 링크 금지
    if (/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(text)) return true;     // 전화번호 홍보 금지
    return false;
  }

  /* ---------- 백엔드 어댑터 ---------- */
  var api = {};

  if (provider === 'supabase') {
    var base = sb.URL.replace(/\/+$/, '');
    var headers = {
      apikey: sb.ANON_KEY,
      Authorization: 'Bearer ' + sb.ANON_KEY
    };
    api.list = function () {
      return fetch(base + '/rest/v1/' + sb.TABLE +
          '?select=created_at,nickname,service,rating,body,photos&hidden=eq.false' +
          '&order=created_at.desc&limit=60', { headers: headers })
        .then(function (r) { return r.json(); })
        .then(function (rows) {
          return (rows || []).map(function (r) {
            return {
              date: fmtDate(r.created_at),
              nickname: r.nickname || '익명',
              service: r.service || '',
              rating: r.rating,
              body: r.body || '',
              photos: r.photos || []
            };
          });
        });
    };
    api.upload = function (blobs) {
      return Promise.all(blobs.map(function (blob, i) {
        var name = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '_' + i + '.jpg';
        return fetch(base + '/storage/v1/object/' + sb.BUCKET + '/' + name, {
          method: 'POST',
          headers: {
            apikey: sb.ANON_KEY,
            Authorization: 'Bearer ' + sb.ANON_KEY,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'false'
          },
          body: blob
        }).then(function (r) {
          if (!r.ok) throw new Error('사진 업로드에 실패했습니다.');
          return base + '/storage/v1/object/public/' + sb.BUCKET + '/' + name;
        });
      }));
    };
    api.submit = function (data, photoUrls) {
      return fetch(base + '/rest/v1/' + sb.TABLE, {
        method: 'POST',
        headers: Object.assign({}, headers, {
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        }),
        body: JSON.stringify({
          nickname: data.nickname || '익명',
          service: data.service,
          rating: Number(data.rating),
          body: data.body,
          photos: photoUrls
        })
      }).then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            throw new Error(t && t.indexOf('violates') !== -1
              ? '입력한 내용을 다시 확인해 주세요.'
              : '등록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
          });
        }
      });
    };
  } else {
    api.list = function () {
      return fetch(gas.ENDPOINT).then(function (r) { return r.json(); })
        .then(function (d) { return (d && d.ok && d.reviews) || []; });
    };
    api.upload = function (blobs) {
      // 앱스 스크립트는 사진을 본문에 담아 함께 보낸다
      return Promise.all(blobs.map(function (b) {
        return new Promise(function (res) {
          var fr = new FileReader();
          fr.onload = function () { res(fr.result); };
          fr.readAsDataURL(b);
        });
      }));
    };
    api.submit = function (data, photos) {
      return fetch(gas.ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          nickname: data.nickname, service: data.service, rating: data.rating,
          body: data.body, photos: photos, agree: true, website: data.website,
          fp: navigator.userAgent
        })
      }).then(function (r) { return r.json(); })
        .then(function (d) { if (!d.ok) throw new Error(d.error || '등록에 실패했습니다.'); });
    };
  }

  /* ---------- 후기 목록 ---------- */
  function cardHTML(r) {
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
  }

  function loadList() {
    if (!listWrap) return Promise.resolve();
    return api.list().then(function (reviews) {
      var status = document.getElementById('customer-reviews-status');
      if (!reviews.length) { hide('customer-reviews-section'); return; }
      if (status) status.remove();
      show('customer-reviews-section');
      listWrap.innerHTML = reviews.map(cardHTML).join('');
    }).catch(function () {
      hide('customer-reviews-section');
    });
  }
  loadList();

  /* ---------- 작성 폼 ---------- */
  if (!form) return;

  var fileInput = form.querySelector('#rv-photos');
  var preview = form.querySelector('#rv-preview');
  var msg = form.querySelector('#rv-msg');
  var submitBtn = form.querySelector('button[type="submit"]');
  var picked = [];   // { blob, url }

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
        c.toBlob(function (blob) {
          if (!blob) return reject();
          resolve({ blob: blob, url: URL.createObjectURL(blob) });
        }, 'image/jpeg', cfg.JPEG_QUALITY || 0.78);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  function drawPreview() {
    preview.innerHTML = picked.map(function (p, i) {
      return '<div class="rv-thumb"><img src="' + p.url + '" alt="첨부한 사진 ' + (i + 1) + '">' +
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

  function cooldownLeft() {
    try {
      var last = Number(localStorage.getItem('rv_last') || 0);
      var wait = (cfg.COOLDOWN_MINUTES || 3) * 60 * 1000;
      return Math.max(0, last + wait - Date.now());
    } catch (e) { return 0; }
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
    if (form.querySelector('#rv-website').value) return;  // 스팸 봇
    if (looksLikeSpam(body) || looksLikeSpam(form.querySelector('#rv-nickname').value)) {
      say('광고나 연락처, 링크가 포함된 글은 등록할 수 없습니다.', 'err');
      return;
    }
    var left = cooldownLeft();
    if (left > 0) {
      say('방금 후기를 남기셨습니다. ' + Math.ceil(left / 60000) + '분 후에 다시 시도해 주세요.', 'err');
      return;
    }

    submitBtn.disabled = true;
    var original = submitBtn.textContent;
    submitBtn.textContent = '등록 중...';
    say('후기를 등록하고 있습니다.');

    var data = {
      nickname: form.querySelector('#rv-nickname').value.trim().slice(0, 20),
      service: form.querySelector('#rv-service').value,
      rating: form.querySelector('input[name="rating"]:checked').value,
      body: body.slice(0, 1000),
      website: ''
    };

    api.upload(picked.map(function (p) { return p.blob; }))
      .then(function (urls) { return api.submit(data, urls); })
      .then(function () {
        try { localStorage.setItem('rv_last', String(Date.now())); } catch (e) {}
        form.reset();
        picked = [];
        drawPreview();
        say('후기를 남겨주셔서 감사합니다. 아래 목록에 바로 반영되었습니다.', 'ok');
        return loadList();
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
