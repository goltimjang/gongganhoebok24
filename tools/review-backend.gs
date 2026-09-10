/**
 * 공간회복24 고객 후기 접수 백엔드 (Google Apps Script)
 *
 * 하는 일
 *  - 홈페이지 후기 작성 폼에서 보낸 내용을 구글 시트에 저장합니다.
 *  - 첨부 사진은 구글 드라이브 폴더에 저장합니다.
 *  - 사장님이 시트에서 '승인' 으로 바꾼 후기만 홈페이지에 표시됩니다.
 *
 * 설치 방법은 tools/REVIEW-SETUP.md 를 참고하세요.
 */

// 접수 결과가 쌓이는 시트 이름
var SHEET_NAME = '후기';
// 사진이 저장될 드라이브 폴더 이름
var PHOTO_FOLDER = '공간회복24 후기사진';
// 후기 하나에 첨부할 수 있는 사진 수
var MAX_PHOTOS = 3;
// 사진 한 장의 최대 용량 (바이트). 홈페이지에서 미리 줄여 보내지만 한 번 더 막습니다.
var MAX_PHOTO_BYTES = 3 * 1024 * 1024;
// 같은 사람이 짧은 시간에 반복 등록하는 것을 막는 간격 (분)
var COOLDOWN_MINUTES = 3;

function doGet(e) {
  // 홈페이지가 '승인된 후기' 목록을 읽어가는 통로입니다.
  try {
    var sheet = getSheet();
    var rows = sheet.getDataRange().getValues();
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (String(r[7]).trim() !== '승인') continue;
      out.push({
        date: formatDate(r[0]),
        nickname: r[1] || '익명',
        service: r[2] || '',
        rating: Number(r[3]) || 0,
        body: r[4] || '',
        photos: String(r[5] || '').split(',').filter(function (s) { return s; })
      });
    }
    out.reverse();
    return json({ ok: true, reviews: out });
  } catch (err) {
    return json({ ok: false, error: '목록을 불러오지 못했습니다.' });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var data = JSON.parse(e.postData.contents || '{}');

    // 스팸 봇이 채우는 숨은 칸. 값이 있으면 사람이 아닙니다.
    if (data.website) return json({ ok: true });

    var nickname = clean(data.nickname, 20);
    var service = clean(data.service, 30);
    var body = clean(data.body, 1000);
    var rating = Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5));

    if (body.replace(/\s/g, '').length < 10) {
      return json({ ok: false, error: '후기 내용을 10자 이상 남겨주세요.' });
    }
    if (!data.agree) {
      return json({ ok: false, error: '게시 동의를 확인해 주세요.' });
    }

    // 짧은 시간에 반복 등록 차단
    var cache = CacheService.getScriptCache();
    var who = 'rv_' + Utilities.base64Encode(String(data.fp || 'anon')).slice(0, 40);
    if (cache.get(who)) {
      return json({ ok: false, error: '잠시 후 다시 시도해 주세요.' });
    }
    cache.put(who, '1', COOLDOWN_MINUTES * 60);

    // 사진 저장
    var urls = [];
    var photos = (data.photos || []).slice(0, MAX_PHOTOS);
    if (photos.length) {
      var folder = getFolder();
      for (var i = 0; i < photos.length; i++) {
        var p = photos[i];
        if (!/^data:image\/(jpeg|png|webp);base64,/.test(p)) continue;
        var b64 = p.substring(p.indexOf(',') + 1);
        var bytes = Utilities.base64Decode(b64);
        if (bytes.length > MAX_PHOTO_BYTES) continue;
        var mime = p.substring(5, p.indexOf(';'));
        var blob = Utilities.newBlob(bytes, mime,
          Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd_HHmmss') + '_' + (i + 1) + '.jpg');
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        urls.push('https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000');
      }
    }

    getSheet().appendRow([
      new Date(),          // A 접수일시
      nickname || '익명',   // B 닉네임
      service,             // C 서비스
      rating,              // D 별점
      body,                // E 내용
      urls.join(','),      // F 사진
      '',                  // G 메모
      '대기'                // H 상태 (대기 / 승인 / 보류)
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: '등록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['접수일시', '닉네임', '서비스', '별점', '내용', '사진', '메모', '상태']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getFolder() {
  var it = DriveApp.getFoldersByName(PHOTO_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER);
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, max);
}

function formatDate(d) {
  if (!(d instanceof Date)) return '';
  return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy. MM. dd.');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
