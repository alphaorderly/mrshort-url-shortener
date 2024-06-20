## URL Shortener

- URL 을 줄이는 서비스입니다.

---

### 사용된 프레임워크/DB

- nestjs
- postgresql
- redis

---

## 배포법

- 도커를 사용합니다.

```
version: '3.8'
services:
  app:
    image: ilov1112/url-shortener-alpha:latest
    ports:
      - '6824:3000'
    environment:
      - JWT_SECRET=ea28f835f9be0be2bbc35481ca04543d88ef2474e9500a7baacb6109d4ff7132abba86bdc14f62c6739cff536a042132f0892a668a2750c9b8e897647f8e1bec
      - HASH_SALT=thisishashsaltforalphaorderly
      - TARGET_URL=http://localhost:6824/
      - ID=example_id
      - PW=example_pw
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=example_user
      - DB_PASSWORD=example_password
      - DB_DATABASE=urlshortener
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=example_redis
    depends_on:
      - postgres
      - redis
    networks:
      - urlshortener

  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: example_user
      POSTGRES_PASSWORD: example_password
      POSTGRES_DB: urlshortener
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    networks:
      - urlshortener

  redis:
    image: redis:7.2
    command: ['redis-server', '--requirepass', 'example_redis']
    volumes:
      - ./data:/data
    restart: always
    networks:
      - urlshortener

networks:
  urlshortener:
    driver: bridge

```

- 위 내용을 docker-compose.yml 로 만들어줍니다.
- 그리고 같은 디렉토리에서 docker-compose up -d 를 실행합니다.

---

## 도커 환경변수 목록

- 기타 환경변수는 잘 모르시겠으면 건드리시지 말고 아래 환경변수만 변경해 주세요

```
JWT_SECRET : jwt 토큰 secret입니다. 쉘에서 openssl rand -hex 64 를 실행해 생성 후 넣습니다.
HASH_SALT : 비밀번호 해시 솔트입니다. jwt_secret 과 같이 생성 후 넣습니다.
TARGET_URL : 배포할 url 주소입니다. 개발을 원하시면 유지하시고 아니면 바꿔주세요
ID : 초기 실행시 만들어질 기본 계정의 아이디입니다.
PW : 초기 실행시 만들어질 기본 계정의 비밀번호입니다.
```

## 추가 기능

- URL 모니터링 관련 기능
