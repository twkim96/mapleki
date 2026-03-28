# 🍁 Mapleki (메이플키우기 매왕 길드 관리 대시보드)

## 📌 프로젝트 개요
메이플스토리 키우기 '매왕' 길드(최대 30명)의 길드 컨텐츠 참여도를 관리하기 위한 웹 대시보드입니다. 
길드원의 실제 스펙(전투력 순위)과 컨텐츠 내 수행 등수를 비교하여 '1인분'을 제대로 하고 있는지 파악하는 것을 목적으로 합니다. 기존 엑셀 수작업을 웹 스크래핑과 연동하여 반자동화합니다.

## 🛠 기술 스택
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Scraping:** Cheerio (API Route에서 서버 사이드 스크래핑 수행)

## 🎯 핵심 요구사항 및 기능 명세

### 1. 인증 및 권한 (Authentication & Route Protection)
- 복잡한 회원가입이나 DB 연동 없이, **환경변수(`.env`)에 저장된 단일 공용 계정(ID/PW)**으로 로그인합니다.
- 로그인 성공 시 서버에서 HTTP-Only 쿠키를 발급하며, Next.js `middleware.ts`를 통해 라우트를 보호합니다.
- **조회(Read):** 로그인 없이 누구나 열람 가능. (메인 대시보드, 컨텐츠별 게시판)
- **추가/수정(Create/Update):** 로그인한 관리자만 접근 가능. (`/new`, `/edit` 라우트 보호)

### 2. 컨텐츠 카테고리 동적 관리 (Dynamic Categories)
- 길드 컨텐츠(예: 길드 토벌전, 플래그 레이스 등)의 종류가 유동적이므로, 사용자가 직접 추가할 수 있어야 합니다.
- 사이드바 또는 메인 상단의 `+` 버튼 클릭 시 모달창이 열리며 새 컨텐츠를 생성합니다.
- 생성된 컨텐츠는 사이드바 네비게이션과 메인 화면의 그리드 카드에 즉각 반영됩니다.

### 3. 데이터 자동 수집 및 스마트 캐싱 (Scraping & Caching)
- **외부 사이트 스크래핑 정책:** 초과 요청 시 발생할 수 있는 타 사이트(mgf.gg) IP 영구 차단을 방지하기 위해, **'전체 길드원 관리'** 메뉴에 길드원 명단 캐싱 기능을 도입했습니다. 
- 관리자가 이 메뉴에서 수동 갱신을 누를 때에만 전체 길드원의 캐릭터명과 전투력 순위(1~30위)를 긁어오며, **10분 대기 쿨타임**이 동작합니다. 이외 일반적인 기록 시트 작성 시에는 캐싱된 우리 DB의 데이터를 즉각 꺼내와 0% 차단 위험률과 1초의 초고속 로딩을 보장합니다.

### 4. 편리한 입력 시스템과 드래그앤드롭 (Easy Rank & Sliding)
- **수동 기입 (서버 컨텐츠 전용):** 다른 서버의 길드와 경쟁하므로 관리자가 각 길드원의 등수를 직접 숫자(예: 1, 15위)로 입력합니다.
- **편하게 배정하기 (길드 내전용 컨텐츠 전용):** 30명이 끼리끼리 경쟁하는 시스템인 경우, 점수를 칠 필요 없이 제공되는 `[✨편하게 배정하기]` 모달을 통해 **모바일 터치 패드처럼 카드를 스마트폰 넘기듯 상하로 드래그**하여 순위를 직관적으로 줄 세울 수 있습니다.
- 저장된 데이터는 '양호(1인분)', '주의', '위험' 3단계로 배지가 자체 판정됩니다.

## 🎨 Design System & Aesthetics (UI/UX 가이드라인)

AI 에이전트는 모든 UI 컴포넌트를 작성할 때 아래 가이드라인을 철저히 따라야 합니다.

### 1. 벤치마킹 대상: 토스증권 (https://www.tossinvest.com/)
- **핵심 키워드:** 극강의 깔끔함, 미니멀리즘, 직관성, 여백의 미(Whitespace), 부드러운 라운딩.
- **여백 (Spacing):** 컴포넌트 간, 텍스트 간 여백을 충분히 두어 정보가 꽉 차 보이지 않게 하세요. (Tailwind의 `p-`, `m-`, `gap-` 값을 넉넉히 사용)
- **둥글기 (Border Radius):** 직각보다는 부드러운 라운딩을 선호합니다. 카드, 버튼, 인풋창 등에 `rounded-xl` 이상의 값을 기본으로 사용하세요.
- **색상 (Color Palette):**
  - **Primary:** 토스 고유의 파란색 (예: `bg-blue-600`, `text-blue-600`).
  - **Greyscale:** 텍스트와 배경에는 꽉 찬 검은색/흰색 대신 부드러운 그레이톤을 사용하세요. (예: 라이트모드 텍스트는 `text-slate-900`, 보조 텍스트는 `text-slate-600`)

### 2. 테마 스위칭 (라이트/다크 모드)
- **기본 설정:** 사용자가 처음 접속 시 **라이트 모드**가 기본으로 설정되어야 합니다.
- **구현 방식:** Tailwind CSS의 `darkMode: 'class'` 전략과 `next-themes` 라이브러리를 사용하세요.
- **UI:** 헤더 우측 상단에 태양/달 아이콘 버튼(테마 토글러)을 배치하여 사용자가 언제든지 전환할 수 있도록 하세요.
- **다크모드 색상:** 단순히 색상을 반전시키지 말고, 토스 앱처럼 눈이 편안한 깊은 다크 그레이톤을 사용하세요. (예: 배경은 `dark:bg-slate-950`, 카드 배경은 `dark:bg-slate-900`)

## 🗄️ 데이터베이스 스키마 (Supabase)
프로젝트는 4개의 핵심 테이블로 (PostgreSQL) 구성됩니다.
1. `contents`: 길드 컨텐츠 종류 (id TEXT PRIMARY KEY, name TEXT, is_server_content BOOLEAN, created_at)
2. `records`: 특정 컨텐츠의 특정 회차 기록 (id UUID, content_id, title, created_at)
3. `sheet_data`: 회차별 길드원 성적 (id UUID, record_id, power_rank, character_name, content_rank, grade, created_at) - *rank_diff 는 저장하지 않고 프론트에서 계산*
4. `guild_members`: 스크래핑 IP 차단을 피하기 위한 전체 길드원 캐싱용 명단 (character_name TEXT PRIMARY KEY, power_rank INTEGER, updated_at TIMESTAMP WITH TIME ZONE)

## 🔑 환경 변수 (.env.local)
로컬 테스트 및 Vercel 배포 시 다음 환경변수가 필요합니다.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_ID`: 공용 관리자 아이디
- `ADMIN_PASSWORD`: 공용 관리자 비밀번호

## 📂 디렉토리 및 라우팅 구조 (App Router 기준)
```text
mapleki/
├── app/
│   ├── page.tsx                           # 메인 대시보드 (누구나 열람)
│   ├── login/page.tsx                     # 공용 로그인 화면
│   └── [contentId]/                       # 컨텐츠별 동적 라우팅
│       ├── page.tsx                       # 해당 컨텐츠 게시판 뷰 (누구나 열람)
│       ├── new/page.tsx                   # 기록 추가 시트 화면 (로그인 필요)
│       └── [recordId]/edit/page.tsx       # 기록 수정 시트 화면 (로그인 필요)
├── api/
│   ├── scrape/guild/route.ts              # 길드원 스크래핑 (CORS 우회)
│   ├── scrape/character/route.ts          # 캐릭터 순위 스크래핑
│   └── ...
├── components/                            # UI 컴포넌트 모음 (layout, common, board, sheet 등)
├── lib/
│   ├── db.ts                              # Supabase 클라이언트 설정
│   └── scraper.ts                         # Cheerio 파싱 로직
└── types/
    └── index.ts                           # 전역 타입 (TypeScript)
