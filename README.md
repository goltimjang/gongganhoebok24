# 공간회복24 홈페이지

특수청소 업체 공간회복24(등록 상호: 투명클린)의 공식 홈페이지입니다.
빌드 도구 없이 순수 HTML/CSS/JS로 구성된 정적 사이트로, GitHub Pages로 호스팅합니다.

## 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 메인 (히어로 영상, 서비스, 절차, 신뢰 정보, 전후/후기 미리보기, FAQ, 상담) |
| `about.html` | 소개 (작업 원칙, 허가·등록 정보) |
| `gallery.html` | 작업 전후 사진 24건 |
| `reviews.html` | 숨고 고객 후기 (전사 + 원문 캡처) |
| `privacy.html` | 개인정보처리방침 |
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

## 도메인 연결 (areaclaen24.co.kr)

현재는 GitHub Pages 기본 주소로 서비스됩니다. 도메인을 연결하려면:

1. 저장소 Settings → Pages → Custom domain에 도메인 입력 (CNAME 파일이 자동 생성됨)
2. 도메인 등록업체 DNS에서 `www` CNAME을 `<계정>.github.io`로, 루트(A 레코드)는 GitHub Pages IP로 설정
3. HTTPS(Enforce HTTPS) 활성화
4. 모든 HTML의 `canonical`, `og:url`, JSON-LD URL과 `sitemap.xml`, `robots.txt`의 주소를 새 도메인으로 일괄 치환:
   ```bash
   grep -rl "caddiewow-blip.github.io/gongganhoebok24" . | xargs sed -i '' 's#https://caddiewow-blip.github.io/gongganhoebok24#https://areaclaen24.co.kr#g'
   ```

## 회사로 소유권 이전

저장소 Settings → General → Danger Zone → Transfer ownership에서 회사 GitHub 계정으로 이전하면 됩니다. 이전 후 Pages 설정과 도메인 연결을 다시 확인하세요.

## 콘텐츠 원칙

- 확인되지 않은 가격, 실적 수치, 후기를 게시하지 않습니다.
- 후기는 숨고 접수 원문 캡처가 있는 것만 게시합니다.
- 전후 사진은 실제 작업 현장 사진만 사용합니다.
- 내용을 수정한 날에만 `sitemap.xml`의 `lastmod`를 갱신합니다.
