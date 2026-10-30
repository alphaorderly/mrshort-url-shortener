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
| `web/` | Vite + React 19 + Tailwind v4 프론트엔드 (`/~/*`) |
| `test/` | e2e 테스트 (실제 PostgreSQL/Redis 사용) |

배포할 때는 프론트엔드를 빌드해서 API 서버가 함께 서비스하므로 **컨테이너는 하나**입니다.
데이터는 PostgreSQL(링크, 계정, 클릭 기록), Redis(로그인 세션, 초대 링크, 리다이렉트 캐시)에 저장됩니다.

---

## 배포 전에 채워야 할 값

배포하기 전에 아래 값을 정해 두세요. 예시 파일은 없고, 배포 방식에 따라 입력하는 곳만 다릅니다.

- **Portainer**: Stack 화면의 **Environment variables** 에 `이름` 과 `값` 을 하나씩 추가합니다. (_Advanced mode_ 에서는 `이름=값` 을 줄마다 붙여넣을 수 있습니다)
- **docker compose**: 프로젝트 루트에 `.env` 파일을 만들고 `이름=값` 형태로 한 줄에 하나씩 적습니다.

비밀번호는 `openssl rand -hex 24` 처럼 특수문자(`$`, `#`, 공백 등)가 없는 값을 권장합니다.

### 1. 반드시 채워야 하는 값

비어 있으면 배포 단계에서 `... is required` 에러가 납니다.

| 이름                | 설명                                |
| ------------------- | ----------------------------------- |
| `POSTGRES_PASSWORD` | PostgreSQL 비밀번호 (직접 정하세요) |
| `REDIS_PASSWORD`    | Redis 비밀번호 (직접 정하세요)      |

### 2. 첫 배포라면 채워야 하는 값

사용자가 한 명도 없을 때만 쓰이는 첫 로그인용 계정입니다. 로그인한 뒤에는 지워도 됩니다.
채우지 않으면 서버는 실행되지만 로그인할 계정이 없습니다. (로그에 경고가 남습니다)

| 이름                         | 설명                                                |
| ---------------------------- | --------------------------------------------------- |
| `ADMIN_ID`                   | 관리자 아이디                                       |
| `ADMIN_PASSWORD`             | 관리자 비밀번호 (8자 이상 권장)                     |

### 3. 내 환경에 맞게 채울 값 (비우면 기본값)

| 이름              | 기본값                    | 언제 바꾸나                                                              |
| ----------------- | ------------------------- | ------------------------------------------------------------------------ |
| `APP_PORT`        | `6824`                    | 호스트에서 열 포트를 바꾸고 싶을 때 (컨테이너 내부 포트는 3000 고정)     |
| `SERVICE_NAME`    | `MrShort`                 | 화면 왼쪽 위에 보일 이름을 바꾸고 싶을 때                                |
| `SESSION_TTL_DAYS`| `30`                      | 로그인을 유지할 일수                                                     |
| `POSTGRES_USER`   | `mrshort`                 | PostgreSQL 사용자 이름                                                   |
| `POSTGRES_DB`     | `urlshortener`            | PostgreSQL DB 이름                                                       |

---

## 배포 방법

저장소의 `docker-compose.yml` 하나로 앱 + PostgreSQL + Redis 가 함께 배포됩니다.
이미지는 Git 소스에서 직접 빌드되며, DB/Redis 는 외부로 포트를 열지 않고 named volume 에 데이터를 저장합니다.

### Portainer (Git 저장소 방식)

1. **Stacks → Add stack** 을 선택합니다.
2. **Build method** 를 **Repository** 로 선택합니다.
3. 아래 값을 입력합니다.
   - **Repository URL** : 이 저장소의 주소 (private 이면 _Authentication_ 을 켜고 토큰 입력)
   - **Repository reference** : `refs/heads/main`
   - **Compose path** : `docker-compose.yml`
4. **Environment variables** 에 위의 "배포 전에 채워야 할 값" 을 입력합니다. (1번은 필수, 2번은 첫 배포 때)
5. **Deploy the stack** 을 누릅니다.

업데이트는 stack 상세 화면에서 **Pull and redeploy** 를 누르면 됩니다. (_GitOps updates_ 를 켜면 자동으로 반영됩니다.)

### 일반 docker compose

프로젝트 루트에 `.env` 파일을 만들어 위의 값을 적은 뒤 실행합니다.

```bash
docker compose up -d --build
```

업데이트:

```bash
git pull
docker compose up -d --build
```

---

## 개발

필요한 것: Node.js 22 이상, Yarn 1, Docker

```bash
# 1. PostgreSQL + Redis 실행
docker compose -f docker-compose.dev.yml up -d

# 2. 프로젝트 루트에 .env 를 만들고 아래 "로컬 개발용 값" 을 채운 뒤 백엔드 실행 (http://localhost:3000)
yarn install
yarn start:dev

# 3. 프론트엔드 (http://localhost:5173, /api 는 3000 으로 프록시)
cd web && yarn install && yarn dev
```

### 로컬 개발용 값

`docker-compose.dev.yml` 이 띄우는 DB/Redis 에 맞춘 값입니다. (개발용이며 운영에서 쓰면 안 됩니다)

| 이름               | 값          | 설명                                          |
| ------------------ | ----------- | --------------------------------------------- |
| `DB_HOST`          | `localhost` |                                               |
| `DB_PORT`          | `5432`      |                                               |
| `DB_USERNAME`      | `mrshort`   |                                               |
| `DB_PASSWORD`      | `devpass`   |                                               |
| `DB_DATABASE`      | `mrshort`   |                                               |
| `REDIS_HOST`       | `localhost` |                                               |
| `REDIS_PORT`       | `6379`      |                                               |
| `REDIS_PASSWORD`   | `devpass`   |                                               |
| `ADMIN_ID`         | 원하는 값   | 첫 로그인용 계정                              |
| `ADMIN_PASSWORD`   | 원하는 값   |                                               |

컨테이너 없이 서버를 직접 실행할 때만 쓰는 값도 있습니다: `PORT`(기본 `3000`), `REDIS_DB`(기본 `0`), `WEB_DIST`(기본 `./web/dist`, 빌드된 프론트엔드 위치).

### 테스트

```bash
yarn test                         # 백엔드 단위 테스트
yarn lint && yarn typecheck       # 백엔드 정적 검사

docker compose -f docker-compose.dev.yml exec postgres createdb -U mrshort mrshort_e2e
yarn test:e2e                     # 실제 PostgreSQL/Redis 를 쓰는 e2e (DB 이름에 e2e 가 들어가야 실행됩니다)

cd web && yarn test               # 프론트엔드 테스트
cd web && yarn build              # 타입 검사 + 빌드
```

e2e 는 데이터베이스를 비우고 다시 만듭니다.

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
