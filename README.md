# 공간회복24 홈페이지

특수청소 업체 공간회복24의 공식 홈페이지입니다.
빌드 도구 없이 순수 HTML/CSS/JS로 구성된 정적 사이트로, GitHub Pages로 호스팅합니다.

## 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 메인 (히어로 영상, 서비스, 절차, 신뢰 정보, 전후/후기 미리보기, FAQ, 상담) |
| `about.html` | 소개 (작업 원칙, 허가·등록 정보) |
| `gallery.html` | 작업 전후 사진 24건 |
| `reviews.html` | 숨고 고객 후기 (전사 + 원문 캡처) |
| `privacy.html` | 개인정보처리방침 |
| `js/review-config.js` | 고객 후기 기능 켜고 끄는 설정 (백엔드 주소) |
| `tools/review-backend.gs` | 후기 접수 백엔드 (구글 앱스 스크립트) |
| `tools/REVIEW-SETUP.md` | 후기 기능 설치 안내 |
| `404.html` | 오류 페이지 |
| `assets/video/hero.mp4` | 히어로 배경 영상 (연출 컷, 2MB) |

## 회사 정보 수정 방법

전화번호, 상호, 사업자 정보 등은 모든 페이지의 머리글/바닥글에 동일하게 들어 있습니다.
수정할 때는 아래 명령으로 전체 페이지를 한 번에 바꾸고, 검증 스크립트로 누락을 확인하세요.

```bash
# 예: 전화번호 변경 (맥/리눅스)
grep -rl "010-9265-7604" *.html | xargs sed -i '' 's/010-9265-7604/새번호/g'

# 일관성 검증
python3 tools/check.py
```

## 로컬 미리보기

```bash
python3 -m http.server 8613
# 브라우저에서 http://localhost:8613 접속
```

## 도메인

정식 주소는 **https://areaclean24.com** 입니다 (등록업체: 가비아).

- 저장소 루트의 `CNAME` 파일이 GitHub Pages 사용자 지정 도메인을 지정합니다. 이 파일을 지우면 도메인 연결이 끊깁니다.
- 가비아 DNS에 등록된 레코드
  | 타입 | 호스트 | 값 | TTL |
  |---|---|---|---|
  | A | @ | 185.199.108.153 | 3600 |
  | A | @ | 185.199.109.153 | 3600 |
  | A | @ | 185.199.110.153 | 3600 |
  | A | @ | 185.199.111.153 | 3600 |
  | CNAME | www | goltimjang.github.io. | 3600 |
- `www.areaclean24.com`과 기존 GitHub 주소는 모두 정식 주소로 자동 이동합니다.
- HTTPS 강제(Enforce HTTPS)가 켜져 있습니다.

도메인을 다시 바꿀 때는 `CNAME` 파일과 DNS 레코드를 수정한 뒤, 사이트 안의 절대 주소를 함께 바꿉니다.

```bash
grep -rl "https://areaclean24.com" . | xargs sed -i '' 's#https://areaclean24.com#https://새도메인#g'
python3 tools/check.py
```

## 고객 후기 기능

고객이 홈페이지에서 직접 후기를 남기고(닉네임 또는 익명, 사진 최대 3장),
사장님이 승인한 후기만 표시되는 기능입니다. 서버 비용은 들지 않습니다.

`js/review-config.js` 의 `ENDPOINT` 가 비어 있으면 작성 폼과 고객 후기 목록이
화면에 나타나지 않습니다. 설치 방법은 `tools/REVIEW-SETUP.md` 를 참고하세요.

## 회사로 소유권 이전

저장소 Settings → General → Danger Zone → Transfer ownership에서 회사 GitHub 계정으로 이전하면 됩니다. 이전 후 Pages 설정과 도메인 연결을 다시 확인하세요.

## 콘텐츠 원칙

- 확인되지 않은 가격, 실적 수치, 후기를 게시하지 않습니다.
- 후기는 숨고 접수 원문 캡처가 있는 것만 게시합니다.
- 전후 사진은 실제 작업 현장 사진만 사용합니다.
- 내용을 수정한 날에만 `sitemap.xml`의 `lastmod`를 갱신합니다.
