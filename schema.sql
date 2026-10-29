-- DB 저장용 설계 초안 (실습앱 화면은 이 SQL을 실행하지 않습니다.)
-- 빈 교육용 Supabase 프로젝트/DB에 최초 1회만 적용하는 기본 설치 스크립트입니다.
-- 이미 DB가 있는 경우 이 파일을 실행하지 말고 schema-existing-db.sql을 검토하세요.
-- 월/부서/목표/실적은 원본에서 확인한 항목입니다.
-- UUID id, user_id, created_at, 타입/범위/유일성 제약 및 RLS는 DB 연결을 위한 추가 설계입니다.
-- 한 행은 한 사용자의 한 달·한 부서 KPI이며 금액은 원 단위 안전한 정수(bigint)입니다.
-- 테이블이 이미 존재할 수 있으므로 CREATE TABLE IF NOT EXISTS 또는 DROP/재생성은 사용하지 않습니다.

CREATE TABLE public.kpi_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  department text NOT NULL CHECK (char_length(btrim(department)) BETWEEN 1 AND 80),
  target_won bigint NOT NULL CHECK (target_won >= 0),
  actual_won bigint NOT NULL CHECK (actual_won >= 0),
  evidence text NOT NULL DEFAULT '' CHECK (char_length(evidence) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kpi_monthly_first_day CHECK (EXTRACT(DAY FROM month) = 1),
  CONSTRAINT kpi_monthly_user_month_department_unique UNIQUE (user_id, month, department)
);

ALTER TABLE public.kpi_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own KPI rows"
  ON public.kpi_monthly FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KPI rows"
  ON public.kpi_monthly FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KPI rows"
  ON public.kpi_monthly FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own KPI rows"
  ON public.kpi_monthly FOR DELETE
  USING (auth.uid() = user_id);

-- PostgREST/Data API 접근 권한. 실제 적용 전 Supabase 프로젝트의 API 설정과 함께 검토하세요.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpi_monthly TO authenticated;
