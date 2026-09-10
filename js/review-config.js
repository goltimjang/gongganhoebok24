/* 고객 후기 기능 설정
   ENDPOINT 에 구글 앱스 스크립트 웹앱 주소를 넣으면 후기 작성 기능이 켜집니다.
   비워두면 작성 폼과 고객 후기 목록이 화면에 나타나지 않습니다.
   설치 방법: tools/REVIEW-SETUP.md */
window.REVIEW_CONFIG = {
  ENDPOINT: "",
  MAX_PHOTOS: 3,
  MAX_WIDTH: 1400,   // 사진을 보내기 전에 이 가로 크기로 줄입니다
  JPEG_QUALITY: 0.78
};
