/**
 * 공간회복24 고객 후기 백엔드 (Google Apps Script)
 *
 * - 후기는 구글 스프레드시트에, 사진은 구글 드라이브 폴더에 저장합니다.
 * - 등록된 후기는 바로 홈페이지에 표시됩니다.
 *   시트의 '상태' 열을 '숨김' 으로 바꾸면 그 후기만 내려갑니다.
 * - 활동이 없어도 일시정지되지 않으며 비용이 들지 않습니다.
 *
 * 처음 한 번 편집기에서 setup 을 실행하면 시트와 사진 폴더가 만들어집니다.
 */

var SHEET_TITLE = '공간회복24 고객 후기';
var SHEET_NAME = '후기';
var PHOTO_FOLDER = '공간회복24 후기사진';
var MAX_PHOTOS = 3;
var MAX_PHOTO_BYTES = 3 * 1024 * 1024;
var COOLDOWN_MINUTES = 3;
var LIST_CACHE_SECONDS = 300;

var HEADER = ['접수일시', '닉네임', '서비스', '별점', '내용', '사진', '메모', '상태(공개/숨김)'];

var BLOCK = ['카지노', '바카라', '토토', '먹튀', '비아그라', '대출', '홀덤',
             '섹스', '야동', '립카페', '조건만남', 'viagra', 'casino', 'crypto',
             '코인리딩', '주식리딩', '씨발', '개새끼', '병신', '좆'];

/** 처음 한 번 실행: 시트와 폴더를 만들고 권한을 승인합니다. */
function setup() {
  var ss = getSpreadsheet();
  getSheet();
  getFolder();
  Logger.log('준비 완료. 시트 주소: ' + ss.getUrl());
}

function doGet() {
  try {
    var cache = CacheService.getScriptCache();
    var hit = cache.get('reviews_json');
    if (hit) return raw(hit);

    var rows = getSheet().getDataRange().getValues();
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[4]) continue;
      if (String(r[7]).trim() === '숨김') continue;
      out.push({
        date: formatDate(r[0]),
        nickname: r[1] || '익명',
        service: r[2] || '',
        rating: Number(r[3]) || 5,
        body: String(r[4]),
        photos: String(r[5] || '').split(',').filter(function (s) { return s; })
      });
    }
    out.reverse();
    var body = JSON.stringify({ ok: true, reviews: out.slice(0, 60) });
    try { cache.put('reviews_json', body, LIST_CACHE_SECONDS); } catch (ignore) {}
    return raw(body);
  } catch (err) {
    return json({ ok: false, error: '목록을 불러오지 못했습니다.' });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (data.website) return json({ ok: true });            // 봇 함정 칸

    var nickname = clean(data.nickname, 20);
    var service = clean(data.service, 30);
    var body = clean(data.body, 1000);
    var rating = Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5));

    if (body.replace(/\s/g, '').length < 10) {
      return json({ ok: false, error: '후기 내용을 10자 이상 남겨주세요.' });
    }
    if (looksLikeSpam(body) || looksLikeSpam(nickname)) {
      return json({ ok: false, error: '광고나 연락처, 링크가 포함된 글은 등록할 수 없습니다.' });
    }
    if (!data.agree) {
      return json({ ok: false, error: '게시 동의를 확인해 주세요.' });
    }

    var cache = CacheService.getScriptCache();
    var who = 'rv_' + Utilities.base64EncodeWebSafe(String(data.fp || 'anon')).slice(0, 60);
    if (cache.get(who)) {
      return json({ ok: false, error: '방금 후기를 남기셨습니다. 잠시 후 다시 시도해 주세요.' });
    }

    var urls = [];
    var photos = (data.photos || []).slice(0, MAX_PHOTOS);
    if (photos.length) {
      var folder = getFolder();
      var stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd_HHmmss');
      for (var i = 0; i < photos.length; i++) {
        var p = String(photos[i]);
        if (!/^data:image\/(jpeg|png|webp);base64,/.test(p)) continue;
        var bytes = Utilities.base64Decode(p.substring(p.indexOf(',') + 1));
        if (bytes.length > MAX_PHOTO_BYTES) continue;
        var mime = p.substring(5, p.indexOf(';'));
        var file = folder.createFile(Utilities.newBlob(bytes, mime, stamp + '_' + (i + 1) + '.jpg'));
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        urls.push('https://lh3.googleusercontent.com/d/' + file.getId() + '=w1000');
      }
    }

    getSheet().appendRow([new Date(), nickname || '익명', service, rating, body, urls.join(','), '', '공개']);

    cache.put(who, '1', COOLDOWN_MINUTES * 60);
    cache.remove('reviews_json');
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: '등록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* ---------- 저장 위치 ---------- */

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (ignore) {}
  }
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (ignore) {}
  if (!ss) ss = SpreadsheetApp.create(SHEET_TITLE);
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

function getSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    var first = ss.getSheets()[0];
    if (first && first.getLastRow() === 0) {
      sheet = first.setName(SHEET_NAME);
    } else {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADER.length).setFontWeight('bold');
  }
  return sheet;
}

function getFolder() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (ignore) {}
  }
  var it = DriveApp.getFoldersByName(PHOTO_FOLDER);
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

/* ---------- 도구 ---------- */

function looksLikeSpam(text) {
  var low = String(text || '').toLowerCase();
  for (var i = 0; i < BLOCK.length; i++) if (low.indexOf(BLOCK[i]) !== -1) return true;
  if (/https?:\/\//.test(low)) return true;
  if (/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(low)) return true;
  return false;
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, max);
}

function formatDate(d) {
  if (!(d instanceof Date)) return '';
  return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy. MM. dd.');
}

function json(obj) {
  return raw(JSON.stringify(obj));
}

function raw(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
