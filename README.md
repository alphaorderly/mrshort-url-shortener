# MrShort

팀에서 직접 운영하는 URL 단축 서비스입니다. 긴 주소를 붙여 넣으면 짧은 주소를 만들어 주고, 클릭 수를 확인할 수 있습니다.

## 기능

- 짧은 주소 만들기
  - 만료일 설정, 링크 비밀번호 설정, 원하는 주소(한글 포함) 직접 정하기
  - 내가 만든 링크 목록, 검색, 삭제, 복사, QR 코드
- 클릭 통계: 전체/최근 7일/최근 30일 클릭 수, 일별 그래프, 최근 클릭 시각
- 계정: 초대 링크로만 가입(초대 링크는 24시간 동안 한 번만 사용), 비밀번호 변경
- 라이트/다크 모드, 모바일 대응

## 구조

| 위치 | 내용 |
| ---- | ---- |
| `src/` | NestJS 11 API 서버 (`/api/*`)와 짧은 주소 리다이렉트(`/:code`) |
| `web/` | Vite + React 19 + Tailwind v4 프론트엔드 (`/app/*`) |
| `test/` | e2e 테스트 (실제 PostgreSQL/Redis 사용) |

배포할 때는 프론트엔드를 빌드해서 API 서버가 함께 서비스하므로 **컨테이너는 하나**입니다.
데이터는 PostgreSQL(링크, 계정, 클릭 기록), Redis(로그인 세션, 초대 링크, 리다이렉트 캐시)에 저장됩니다.

---

## 배포

저장소의 `docker-compose.yml` 하나로 앱 + PostgreSQL + Redis 가 함께 배포됩니다.
이미지는 Git 소스에서 직접 빌드되며, DB/Redis 는 외부로 포트를 열지 않고 named volume 에 데이터를 저장합니다.

### Portainer (Git 저장소 방식)

1. **Stacks → Add stack** 을 선택합니다.
2. **Build method** 를 **Repository** 로 선택합니다.
3. 아래 값을 입력합니다.
   - **Repository URL** : 이 저장소의 주소 (private 이면 _Authentication_ 을 켜고 토큰 입력)
   - **Repository reference** : `refs/heads/main`
   - **Compose path** : `docker-compose.yml`
4. **Environment variables** 에서 _Advanced mode_ 를 켜고 [`.env.example`](.env.example) 내용을 붙여넣은 뒤 값을 채웁니다.
   - `POSTGRES_PASSWORD`, `REDIS_PASSWORD` 가 비어 있으면 배포 단계에서 `... is required` 에러가 납니다.
   - 첫 배포라면 `ADMIN_ID`, `ADMIN_PASSWORD` 도 채우세요. (첫 로그인용 계정입니다)
5. **Deploy the stack** 을 누릅니다.

업데이트는 stack 상세 화면에서 **Pull and redeploy** 를 누르면 됩니다. (_GitOps updates_ 를 켜면 자동으로 반영됩니다.)

### 일반 docker compose

```bash
cp .env.example .env   # 값 채우기
docker compose up -d --build
```

업데이트:

```bash
git pull
docker compose up -d --build
```

### HTTPS / 리버스 프록시

nginx, Traefik 같은 리버스 프록시 뒤에서 운영한다면 `TRUST_PROXY=1` 을 설정하세요.
설정하지 않으면 모든 접속자가 프록시 IP 로 보여서 로그인 시도 제한이 의도대로 동작하지 않고,
https 로 접속해도 쿠키에 `Secure` 속성이 붙지 않습니다. `TARGET_URL` 은 실제 접속 주소(예: `https://s.example.com/`)로 맞추세요.

### 이전 버전에서 업데이트할 때

데이터베이스는 그대로 쓸 수 있고, 시작할 때 필요한 변경(`shorten.createdAt` 컬럼과 인덱스 추가)이 자동으로 적용됩니다. 기존 링크 주소(`/<코드>`)도 그대로 동작합니다.

- `JWT_SECRET`, `JWT_REFRESH_SECRET` 은 더 이상 쓰지 않습니다. 지워도 됩니다.
- **`HASH_SALT` 는 이전 값을 그대로 유지하세요.** 기존 계정과 비밀번호 링크의 SHA-256 해시를 확인하는 데 쓰이며,
  로그인하거나 링크를 열 때 성공하면 argon2 해시로 자동 교체됩니다. 모두 교체된 뒤에는 비워도 됩니다.
- 로그인 방식이 서버 세션으로 바뀌어서 업데이트 직후 모두 한 번 다시 로그인해야 합니다.
- 예전 초대 링크(`/register/url/...`)는 새 화면으로 연결되지만, 업데이트 전에 만든 초대 링크는 쓸 수 없습니다. 새로 만드세요.
- 예전 `ID` / `PW` 환경변수도 계속 인식합니다.

---

## 환경변수

`.env.example` 참고.

| 변수                           | 필수 | 기본값                    | 설명                                                                 |
| ------------------------------ | ---- | ------------------------- | -------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`            | O    |                           | PostgreSQL 비밀번호                                                  |
| `REDIS_PASSWORD`               | O    |                           | Redis 비밀번호                                                       |
| `ADMIN_ID` / `ADMIN_PASSWORD`  | 최초 |                           | 사용자가 한 명도 없을 때 만들어질 계정. 첫 실행 후에는 지워도 됩니다 |
| `TARGET_URL`                   |      | `http://localhost:6824/`  | 서비스 주소. 짧은 주소 앞에 붙습니다                                 |
| `APP_PORT`                     |      | `6824`                    | 호스트에 열 포트                                                     |
| `SERVICE_NAME`                 |      | `MrShort`                 | 화면에 보여질 이름                                                   |
| `TRUST_PROXY`                  |      | `false`                   | 리버스 프록시 뒤에서 운영하면 `1` 또는 `true`                        |
| `COOKIE_SECURE`                |      | `auto`                    | 쿠키 `Secure` 속성. `auto` 는 https 접속일 때만 붙입니다             |
| `ALLOWED_ORIGINS`              |      |                           | 같은 사이트가 아닌 출처의 쓰기 요청을 허용할 때만 (쉼표 구분)        |
| `SESSION_TTL_DAYS`             |      | `30`                      | 로그인 유지 기간                                                     |
| `HASH_SALT`                    |      |                           | 이전 버전 계정/링크 비밀번호 호환용. 새 설치는 비워 두세요           |
| `POSTGRES_USER`, `POSTGRES_DB` |      | `mrshort`, `urlshortener` | PostgreSQL 사용자 / DB 이름                                          |

> DB 가 비어 있는데 `ADMIN_ID` / `ADMIN_PASSWORD` 가 없으면 서버는 실행되지만 로그인할 계정이 없습니다. (로그에 경고가 남습니다)

---

## 개발

필요한 것: Node.js 22 이상, Yarn 1, Docker

```bash
# 1. PostgreSQL + Redis 실행
docker compose -f docker-compose.dev.yml up -d

# 2. 백엔드 (http://localhost:3000)
yarn install
cp .env.example .env     # 아래 "로컬 개발용" 값의 주석을 풀고, ADMIN_ID / ADMIN_PASSWORD 도 채웁니다
yarn start:dev

# 3. 프론트엔드 (http://localhost:5173, /api 는 3000 으로 프록시)
cd web && yarn install && yarn dev
```

### 테스트

```bash
yarn test                         # 백엔드 단위 테스트
yarn lint && yarn typecheck       # 백엔드 정적 검사

docker compose -f docker-compose.dev.yml exec postgres createdb -U mrshort mrshort_e2e
yarn test:e2e                     # 실제 PostgreSQL/Redis 를 쓰는 e2e (DB 이름에 e2e 가 들어가야 실행됩니다)

cd web && yarn test               # 프론트엔드 테스트
cd web && yarn build              # 타입 검사 + 빌드
```

e2e 는 데이터베이스를 비우고 다시 만듭니다. 기존 버전이 만든 DB(`test/fixtures/legacy-schema.sql`)를 그대로 이어받는지도 검증합니다.

---

## 보안 설계

- 로그인: Redis 에 저장되는 서버 세션(쿠키는 `HttpOnly`, `SameSite=Lax`). 로그아웃·비밀번호 변경 시 즉시 폐기됩니다.
- 비밀번호: argon2id. 같은 계정으로 10번 틀리면 15분간 잠깁니다.
- 가입: 초대 링크(24시간, 1회용)가 없으면 만들 수 없습니다.
- 요청 검증: 모든 입력을 서버에서 검증하고, `http(s)` 가 아닌 주소(`javascript:` 등)와 서비스 경로와 겹치는 짧은 주소는 거절합니다.
- CSRF: 상태를 바꾸는 요청은 같은 출처에서 온 것만 받습니다(`Origin`/`Sec-Fetch-Site` 검사).
- 보안 헤더(helmet, CSP), 요청 횟수 제한(비밀번호 링크 열기·로그인·가입).
- 응답에 비밀번호 해시가 포함되지 않습니다.

## 데이터 / 백업

- 데이터는 named volume `postgres-data`, `redis-data` 에 저장됩니다. (Portainer → Volumes 에서 확인)
- stack 을 삭제할 때 **Remove associated volumes** 를 체크하지 않으면 데이터가 유지됩니다.
- 중요한 데이터는 PostgreSQL 입니다. (Redis 는 세션과 캐시라서 잃어도 다시 로그인하면 됩니다)

```bash
docker compose exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql
```
