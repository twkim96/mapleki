# 🚀 Mapleki 프로젝트 진행도 (Progress Tracker)

이 문서는 프로젝트의 현재 진행 상황을 추적하고, AI 에이전트가 다음 수행할 작업을 명확히 파악하기 위해 사용됩니다.

## ✅ 완료된 작업 (Phase 1: 초기 기획 및 인프라 세팅)
- [x] 프로젝트 기획 및 요구사항 구체화
- [x] Next.js (App Router) + Tailwind CSS 프로젝트 뼈대 생성
- [x] 디렉토리 구조 및 라우팅 설계 완료
- [x] Supabase 프로젝트 생성 완료
- [x] Supabase 테이블 생성 완료 (SQL 쿼리 실행: `contents`, `records`, `sheet_data`)
- [x] 로컬 및 Vercel 환경 변수 세팅 완료 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## ⏳ 현재 진행 중 / 다음 수행할 작업 (Phase 2: 기본 모듈 및 타입 설정)
Antigravity 에이전트는 아래 체크리스트의 맨 처음 항목부터 순서대로 작업을 진행해 주세요.

- [x] `@supabase/supabase-js`, `cheerio` 패키지 설치
- [x] `lib/db.ts` 작성 (Supabase 클라이언트 인스턴스 초기화)
- [x] `types/index.ts` 작성 (DB 스키마를 바탕으로 한 TypeScript 인터페이스 정의)
- [x] `components/layout/Sidebar.tsx`, `components/layout/Header.tsx` 등 공통 레이아웃 UI 구현

## 📝 대기 중인 작업 (Phase 3: 공용 계정 인증 및 토스증권 스타일 UI/UX 적용)
- [x] `next-themes` 패키지 설치 및 글로벌 `ThemeProvider` 구성 (다크/라이트 모드 지원)
- [x] Header 안 테마 토글 스위치 구현 및 토스증권 벤치마킹 디자인 시스템(여백/둥글기/색상) 전역 적용
- [x] 로그인 처리를 위한 API 라우트 (`app/api/auth/login/route.ts`) 구현 (HTTP-Only 쿠키 발급)
- [x] 관리자 전용 기능(`/new`, `/edit`) 보호를 위한 Next.js `middleware.ts` 구현
- [x] 토스 스타일의 모던 공용 계정 로그인 화면 (`app/login/page.tsx`) 구현

## 📝 대기 중인 작업 (Phase 4: 스크래핑 및 핵심 비즈니스 로직)
- [x] API 라우트를 통한 웹 스크래핑 로직 구현 (`mgf.gg` 파싱)
- [x] 메인 대시보드 화면 및 동적 카테고리 추가 기능 (사이드바 리렌더링)
- [x] 핵심 UI인 30칸 데이터 입력 시트 (`components/sheet/RecordSheet.tsx`) 및 Supabase 연동