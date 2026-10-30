## URL Shortener

- URL 을 줄이는 서비스입니다.

---

### 사용된 프레임워크/DB

- nestjs
- postgresql
- redis

---

### 기능 목록

- JWT 기반 계정 시스템
- 초대 기반 회원가입 시스템
- URL 줄이기
  - 만료 시간 설정 가능
    - 만료 되어도 리스트에서 확인 가능
  - 비밀번호 설정 가능
  - 임의 주소 설정 가능
  - 자신이 줄인 URL 리스트 확인 및 삭제 가능
  - QR코드 생성 가능
- 전체 클릭 횟수 및 일별 클릭 횟수 확인 가능

---

## 배포법

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
   - 필수 값이 비어 있으면 배포 단계에서 `... is required` 에러가 납니다.
5. **Deploy the stack** 을 누릅니다.

업데이트는 stack 상세 화면에서 **Pull and redeploy** 를 누르면 됩니다. (Git 최신 커밋 기준으로 다시 빌드됩니다. _GitOps updates_ 를 켜면 자동으로 반영됩니다.)

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

---

## 환경변수

`.env.example` 참고. 시크릿은 `openssl rand -hex 64` 로 생성하세요.

| 변수                 | 필수 | 기본값                   | 설명                                                                      |
| -------------------- | ---- | ------------------------ | ------------------------------------------------------------------------- |
| `JWT_SECRET`         | O    |                          | access token 서명용 secret                                                |
| `JWT_REFRESH_SECRET` | O    |                          | refresh token 서명용 secret. **`JWT_SECRET` 과 다른 값**을 사용하세요     |
| `HASH_SALT`          | O    |                          | 비밀번호 해시 솔트. 운영 중 변경하면 기존 계정 로그인이 불가능해집니다    |
| `POSTGRES_PASSWORD`  | O    |                          | PostgreSQL 비밀번호                                                       |
| `REDIS_PASSWORD`     | O    |                          | Redis 비밀번호                                                            |
| `ID` / `PW`          | 최초 |                          | 사용자가 한 명도 없을 때 만들어질 기본 계정. 첫 실행 후에는 지워도 됩니다 |
| `TARGET_URL`         |      | `http://localhost:6824/` | 서비스 주소. **끝에 반드시 `/`** 를 붙이세요                              |
| `APP_PORT`           |      | `6824`                   | 호스트에 열 포트                                                          |
| `SERVICE_NAME`       |      | `MrShort`                | 메인 화면에 보여질 이름                                                   |
| `POSTGRES_USER`      |      | `mrshort`                | PostgreSQL 사용자                                                         |
| `POSTGRES_DB`        |      | `urlshortener`           | PostgreSQL DB 이름                                                        |

> 첫 배포 시에는 반드시 `ID` / `PW` 를 설정하세요. DB 가 비어 있는데 둘 다 없으면 서버가 기동되지 않습니다.

---

## 데이터 / 백업

- 데이터는 named volume `postgres-data`, `redis-data` 에 저장됩니다. (Portainer → Volumes 에서 확인)
- stack 을 삭제할 때 **Remove associated volumes** 를 체크하지 않으면 데이터가 유지됩니다.
- PostgreSQL 백업:

```bash
docker compose exec postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql
```
