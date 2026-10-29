-- 기존 DB 검토용 변경 SQL 초안. 앱에서 자동 실행하지 않았고 이 파일도 실행하지 않았습니다.
-- 기존 행/테이블을 삭제하거나 재생성하지 않습니다. 현재 구조와 정책을 먼저 살피고 필요한 부분만 선택하세요.
-- evidence 열이 이미 있으면 ADD COLUMN 문장을 생략하고, constraint 이름/정의를 확인하세요.

ALTER TABLE public.kpi_monthly
  ADD COLUMN evidence text NOT NULL DEFAULT '' CHECK (char_length(evidence) <= 500);

-- Data API 권한이 아직 없다면 프로젝트 설정과 기존 GRANT를 검토한 뒤 적용하세요.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpi_monthly TO authenticated;

-- RLS가 꺼져 있거나 본인 소유 정책이 없을 때 기존 정책을 먼저 점검하세요.
-- 정책을 무조건 제거하거나 교체하지 말고, 기본 schema.sql의 정책을 기존 정책과 대조해 추가하세요.
