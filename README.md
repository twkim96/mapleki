# 🍁 Mapleki (메이플키우기 매왕 길드 관리 대시보드)

## 📌 프로젝트 개요
메이플스토리 키우기 '매왕' 길드(최대 30명)의 길드 컨텐츠 참여도를 관리하기 위한 웹 대시보드입니다. 
길드원의 실제 스펙(전투력 순위)과 컨텐츠 내 수행 등수를 비교하여 '1인분'을 제대로 하고 있는지 파악하는 것을 목적으로 합니다. 기존 엑셀 수작업을 웹 스크래핑과 연동하여 반자동화합니다.

## 🛠 기술 스택
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Database:** Vercel Postgres (또는 Supabase)
- **Scraping:** Cheerio (API Route에서 서버 사이드 스크래핑 수행)

## 🎯 핵심 요구사항 및 기능 명세

### 1. 인증 및 권한 (Authentication & Route Protection)
- 복잡한 회원가입 없이 **단일 공용 계정(ID/PW)**으로 로그인하여 관리자 권한을 공유합니다.
- **조회(Read):** 로그인 없이 누구나 열람 가능. (메인 대시보드, 컨텐츠별 게시판)
- **추가/수정(Create/Update):** 로그인한 관리자만 접근 가능. (`/new`, `/edit` 라우트 보호)

### 2. 컨텐츠 카테고리 동적 관리 (Dynamic Categories)
- 길드 컨텐츠(예: 길드 토벌전, 플래그 레이스 등)의 종류가 유동적이므로, 사용자가 직접 추가할 수 있어야 합니다.
- 사이드바 또는 메인 상단의 `+` 버튼 클릭 시 모달창이 열리며 새 컨텐츠를 생성합니다.
- 생성된 컨텐츠는 사이드바 네비게이션과 메인 화면의 그리드 카드에 즉각 반영됩니다.

### 3. 데이터 자동 수집 및 수동 기입 융합 (Scraping & Sheet)
- **시트 UI:** 최대 30행으로 구성된 테이블 UI.
- **자동 수집 (좌측):** - 시트 내 '길드원 재검색' 버튼 클릭 시, `mgf.gg`에서 데이터를 스크래핑합니다.
  - 1차 수집: `https://mgf.gg/contents/guild_info.php?g_name=매왕` (현재 길드원 닉네임 목록 확보)
  - 2차 수집: `https://mgf.gg/contents/character.php?n={닉네임}` (해당 캐릭터의 서버 내 등수 확보. 타겟 요소: `<div class="stat-value rank-world">O위</div>`)
  - 수집된 데이터를 바탕으로 **서버 순위 -> 닉네임** 순으로 정렬하여 시트에 자동 바인딩합니다.
- **수동 기입 (우측):**
  - 관리자가 각 길드원의 실제 컨텐츠 수행 등수를 직접 입력(Input)합니다.
- **데이터 처리:** 서버 순위와 실제 등수를 비교하여 순위 변동, 등급 등을 계산 후 저장합니다.

## 📂 디렉토리 및 라우팅 구조 (App Router 기준)

Next.js의 Dynamic Routing(`[ ]`)을 활용하여, 컨텐츠가 몇 개가 생성되든 단일 템플릿 파일로 대응하도록 설계되었습니다.

```text
mapleki/
├── app/
│   ├── page.tsx                           # 메인 대시보드 (컨텐츠 카드 그리드 뷰, 누구나 열람)
│   ├── login/page.tsx                     # 공용 로그인 화면
│   └── [contentId]/                       # 컨텐츠별 동적 라우팅 (예: /subjugation)
│       ├── page.tsx                       # 해당 컨텐츠의 회차별 게시판 뷰 (누구나 열람)
│       ├── new/page.tsx                   # 새 회차 기록 추가 시트 화면 (로그인 필요)
│       └── [recordId]/edit/page.tsx       # 기존 회차 기록 수정 시트 화면 (로그인 필요)
│   ├── api/                               # Serverless API 엔드포인트
│       ├── auth/route.ts                  # 로그인 세션 처리
│       ├── scrape/guild/route.ts          # 길드원 목록 스크래핑 (CORS 우회용 서버 API)
│       ├── scrape/character/route.ts      # 캐릭터별 전투력 스크래핑 (CORS 우회용 서버 API)
│       ├── contents/route.ts              # 컨텐츠 카테고리 CRUD
│       └── records/route.ts               # 시트 기록 CRUD
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                    # 좌측 네비게이션
│   │   └── Header.tsx                     # 상단 바 (로그인 버튼 등)
│   ├── common/
│   │   └── Modal.tsx                      # 컨텐츠 추가용 공통 팝업
│   ├── board/
│   │   └── GridCard.tsx                   # 메인/게시판용 카드 컴포넌트
│   └── sheet/
│       └── RecordSheet.tsx                # 핵심 기능인 30칸 데이터 입력 시트 컴포넌트
├── lib/
│   ├── scraper.ts                         # 실제 DOM 파싱 로직 (Cheerio 등)
│   ├── auth.ts                            # 인증 관련 유틸리티
│   └── db.ts                              # 데이터베이스 연결 객체
└── types/
    └── index.ts                           # 전역 TypeScript 인터페이스 정의 (GuildMember, ContentCategory 등)
⚠️ 개발 원칙 (AI 코딩 가이드라인)
모듈화 엄수: 코드를 작성할 때 Canvas 미리보기를 위해 파일들을 하나로 합치지 마세요. 파일별로 모듈화된 구조(export/import)를 철저히 유지해야 합니다.

명확한 경로 명시: 각 코드 블록 상단이나 주석에 해당 파일의 정확한 경로(예: // components/layout/Sidebar.tsx)를 반드시 명시하세요.

생략 금지: 수정 사항이 발생하더라도 전체를 합치지 말고, 해당 파일만 수정해서 답변하되 코드를 복사해서 바로 붙여넣을 수 있도록 생략(... 등) 없이 모듈의 코드 전체를 작성해 주세요.