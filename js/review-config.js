/* 고객 후기 기능 설정
   PROVIDER 를 고르고 값만 채우면 후기 기능이 켜집니다.
   값이 비어 있으면 작성 폼과 후기 목록이 화면에 나타나지 않습니다.
   설치 방법: tools/REVIEW-SETUP.md

   supabase : 후기가 바로 홈페이지에 표시됩니다 (권장)
   gas      : 구글 스프레드시트에 쌓입니다 (사장님 승인 없이 바로 표시)
*/
window.REVIEW_CONFIG = {
  PROVIDER: "supabase",

  SUPABASE: {
    URL: "https://ibncnjdyvxhidfiehvhv.supabase.co",
    ANON_KEY: "sb_publishable_1eqewSuXRX_400qhTqWksQ_1-cyVXoT",
    TABLE: "reviews",
    BUCKET: "review-photos"
  },

  GAS: {
    ENDPOINT: ""    // 예: https://script.google.com/macros/s/...../exec
  },

  MAX_PHOTOS: 3,
  MAX_WIDTH: 1400,     // 사진을 보내기 전에 이 가로 크기로 줄입니다
  JPEG_QUALITY: 0.78,
  COOLDOWN_MINUTES: 3  // 같은 브라우저에서 반복 등록을 막는 시간
};
