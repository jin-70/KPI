# KPI 대시보드 실습앱

단일 HTML 원본의 KPI 화면을 파일로 나눈 정적 실습 예제입니다. 기존 필터·합계·차트·근거표를 유지하고, 설정이 있을 때만 Supabase 로그인 및 사용자별 DB 자료를 사용합니다.

## 파일 역할
- `index.html`: 화면 구조와 상대 경로 리소스, Supabase JS CDN 연결.
- `style.css`: 원본 화면의 스타일과 작은 화면 대응.
- `app.js`: 샘플/DB 모드, 로그인, 필터, 표, 합계, 차트와 사용자 입력.
- `core.js`: 샘플, 금액·행 검사, 합계와 달성률 계산.
- `supabase-repository.js`: 세션 확인, 본인 행 조회, 직접 입력한 행 저장, 응답/재조회 대조.
- `data/kpi.json`, `data/kpi.csv`: 가져오기와 원본 비교용 사본. 대시보드에서 읽지 않습니다.
- `config.example.js`: 공개 설정 예시 자리표시자.
- `config.js`: 기존 파일은 보존합니다. 공개 URL·anon/publishable 키만 둘 수 있습니다. 브라우저가 읽으며 service role/secret 키는 절대 두지 마세요.
- `schema.sql`: 빈 교육용 DB에 최초 한 번 적용하도록 만든 기본 SQL. 앱은 실행하지 않습니다.
- `schema-existing-db.sql`: 기존 DB 상태를 검토할 때 참고하는 변경 초안. 자동 적용하지 않습니다.
- `prd.md`, `검증체크리스트.md`: 요구사항, 미확인 검증 항목.

## 실행법
`index.html`을 직접 열면 연결 설정이 없을 때 `core.js`의 샘플과 미연결 안내가 표시됩니다. Supabase JS CDN을 불러올 수 있고 `config.js`에 URL 및 공개 키가 있을 때 로그인 UI가 활성화됩니다. service_role/secret 키는 브라우저 설정에서 거부합니다. 인증/세션에는 정적 웹 서버 사용을 권장합니다. JSON/CSV를 fetch하지 않습니다.

## 샘플과 DB 모드
샘플 6건은 메모리에서만 표시되며 자동 저장되지 않습니다. 로그인한 뒤 DB 모드에서는 본인 행만 조회하고, 입력 폼에서 사용자가 직접 저장한 행만 씁니다. 저장 응답의 소유자와 행을 검사하고 재조회한 값과 일치해야 성공으로 표시합니다. 연결 정보가 없거나 접속에 실패하면 미연결 샘플 모드로 안내합니다.

`schema.sql`은 새 빈 교육용 DB에 한 번만 적용하는 기본 스크립트입니다. 기존 DB에 실행하지 마세요. 기존 DB에서는 테이블, 데이터, 제약, RLS 정책을 살핀 뒤 `schema-existing-db.sql`을 검토하세요. 어느 SQL도 앱에서 실행하지 않으며 실제 DB 변경은 하지 않았습니다. 본인 행 제한은 클라이언트 조건과 DB RLS 양쪽에서 적용합니다.

## GitHub 공유
HTML/CSS/JS, `config.example.js`, 샘플 JSON/CSV, SQL 초안과 문서를 올릴 수 있습니다. `.gitignore`는 실제 `config.js`를 제외합니다. 공유 키는 공개 anon/publishable 키뿐이며 service role/secret 키, 비밀번호, 토큰, 세션은 절대 올리지 마세요.
