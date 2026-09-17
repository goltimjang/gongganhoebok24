/* 고객 후기 기능 설정
   후기는 구글 앱스 스크립트(구글 시트 + 드라이브)에 저장되고 바로 홈페이지에 표시됩니다.
   활동이 없어도 일시정지되지 않고 비용이 들지 않습니다.
   ENDPOINT 가 비어 있으면 작성 폼과 후기 목록이 화면에 나타나지 않습니다.
   설치 방법: tools/REVIEW-SETUP.md
*/
window.REVIEW_CONFIG = {
  PROVIDER: "gas",

  GAS: {
    ENDPOINT: "https://script.google.com/macros/s/AKfycbx_QW0kEJVoLt5DdPVb02tP4P-BY1k6UHhuN6owye2XsqAJGuXF_uPdkqRU_-wUiX5e/exec"
  },

  MAX_PHOTOS: 3,
  MAX_WIDTH: 1400,     // 사진을 보내기 전에 이 가로 크기로 줄입니다
  JPEG_QUALITY: 0.78,
  COOLDOWN_MINUTES: 3  // 같은 브라우저에서 반복 등록을 막는 시간
};
