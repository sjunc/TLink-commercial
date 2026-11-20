# T-Link Pitch AI (A-29-차OO(4157) 프로젝트)

현장 사진 1장과 최소 제품 정보만 올리면 **개인정보를 블러 처리**하고, **티링크의 팩트 기반 기술 차별점(6개 업종 × 5개 포인트 = 30개)**을 자동 매칭해 **3중 키워드 카드뉴스 · GEO 블로그 · 티링크노트 CRM 규격 영업 문자(MMS/LMS)**를 1분 안에 생성하는 B2B 마케팅 자동화 솔루션입니다.

## 주요 기능
1. **현장 사진 전처리 & 개인정보 보호**: HTML5 Canvas 기반 모자이크 블러 브러시 + 개인정보 마스킹 확인 체크리스트
2. **팩트 가드레일 AI 매칭 (`gemini-3.6-flash`)**: `data/tlinkKnowledge.json` 컨텍스트 주입으로 매뉴얼 출처·적용 조건을 근거로 제시하고 할루시네이션 차단 (사진 분석 실패 시 6개 업종 수동 프리셋 지원)
3. **3종 채널 홍보 콘텐츠 원클릭 생성**:
   - **카드뉴스 (PNG)**: 3종 디자인 템플릿(신뢰형·강조형·사례형) + 1080×1080 HTML5 Canvas 직접 렌더링
   - **GEO·SEO 블로그**: AI 검색 인용용 Q&A 블록 + SEO 키워드 + 원클릭 복사
   - **티링크노트 CRM 영업 문자**: EUC-KR 바이트 + 변수 치환 여유분(+30B) 실시간 계산, `(광고)`/080 수신거부 자동 삽입, **300KB 이하 JPG MMS 자동 압축**

## 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example`을 `.env.local`로 복사하고 Gemini API 키를 입력합니다.
```bash
cp .env.example .env.local
```
`.env.local` 내용:
```env
GEMINI_API_KEY=발급받은_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.6-flash
```
> **참고:** `.env.local`을 설정하지 않아도 우측 상단 **[API 설정]** 버튼에서 브라우저 입력으로 바로 테스트할 수 있으며, 키 없이도 지식베이스 기반 데모 모드로 전체 UI 시연이 가능합니다.

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속합니다.

## 프로젝트 구조
```text
tlink-pitch-ai/
├── app/
│   ├── api/analyze/route.js   # Gemini 3.6 Flash 멀티모달 분석 & 팩트 가드레일 API
│   ├── globals.css
│   ├── layout.js
│   └── page.js                # 메인 2컬럼 워크스페이스
├── components/
│   ├── BlurCanvas.jsx         # 사진 업로드 + 모자이크 블러 브러시 + 개인정보 체크
│   ├── CardNewsStudio.jsx     # 3종 카드뉴스 템플릿 + Canvas PNG 렌더링
│   ├── BlogGeoPanel.jsx       # GEO(AI 검색 최적화) Q&A + 블로그 에디터
│   └── CrmMessagePanel.jsx    # EUC-KR 바이트 검증 + 300KB 이하 JPG 자동 압축
├── data/
│   └── tlinkKnowledge.json    # 티링크 6개 업종 × 5개 포인트(30개) 팩트 지식베이스
├── lib/
│   ├── canvasUtils.js         # Canvas 카드뉴스 합성 & MMS JPG 압축기
│   └── crmUtils.js            # EUC-KR 바이트 & 변수 치환 검증기
├── .env.example
└── package.json
```
