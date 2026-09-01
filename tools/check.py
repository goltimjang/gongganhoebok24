#!/usr/bin/env python3
"""사이트 일관성 검증: 회사 정보, JSON-LD, 링크, 금지 문자.

사용법: python3 tools/check.py  (site 폴더에서 실행)
"""
import json, re, glob, os, sys, html.parser
import xml.etree.ElementTree as ET

# 회사 정보의 단일 원본. 값을 바꾸면 모든 페이지가 이 값과 일치하는지 검사합니다.
SITE = {
    "phone": "010-9265-7604",
    "brand": "공간회복24",
    "legal_name": "투명클린",
    "ceo": "김효중",
    "biz_no": "604-07-95837",
    "kakao": "https://open.kakao.com/o/sWXW52Hi",
    "blog": "https://blog.naver.com/limpidityclean",
}

errs = []
pages = [f for f in glob.glob("*.html")]

class LD(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.inld = False; self.blocks = []
    def handle_starttag(self, tag, attrs):
        if tag == "script" and ("type", "application/ld+json") in attrs:
            self.inld = True; self.cur = ""
    def handle_endtag(self, tag):
        if tag == "script" and self.inld:
            self.inld = False; self.blocks.append(self.cur)
    def handle_data(self, d):
        if self.inld: self.cur += d

for f in pages:
    t = open(f, encoding="utf-8").read()
    if "—" in t:
        errs.append(f"{f}: 엠 대시(U+2014) 발견")
    nums = set(re.findall(r"01[0-9]-\d{3,4}-\d{4}", t))
    if nums - {SITE["phone"]}:
        errs.append(f"{f}: 등록되지 않은 전화번호 {nums - {SITE['phone']}}")
    if f not in ("404.html",):
        for key in ("brand", "legal_name", "ceo", "biz_no"):
            if SITE[key] not in t:
                errs.append(f"{f}: {key} ({SITE[key]}) 누락")
    p = LD(); p.feed(t)
    for b in p.blocks:
        try:
            json.loads(b)
        except Exception as e:
            errs.append(f"{f}: JSON-LD 문법 오류 {e}")
    for href in re.findall(r'(?:href|src)="([^"]+)"', t):
        if href.startswith(("http", "tel:", "mailto:", "#")):
            continue
        path = href.split("#")[0]
        if path and not os.path.exists(path):
            errs.append(f"{f}: 깨진 링크 {href}")

try:
    ET.parse("sitemap.xml")
except Exception as e:
    errs.append(f"sitemap.xml 파싱 오류: {e}")

if errs:
    print("문제 발견:")
    for e in errs:
        print(" -", e)
    sys.exit(1)
print("모든 검사 통과")
