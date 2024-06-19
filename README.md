## URL Shortener

- URL 을 줄이는 서비스입니다.

---

## 배포법

```
yarn
yarn start
```

- 첫 실행시 유저가 없으면 아이디/비밀번호를 입력해야 합니다.
- 유저를 추가하고 싶으실 시 db.sqlite 에 직접 추가하실수 있습니다.
  - 비밀번호는 뒤에 HASH_SALT 내용을 붙혀서 sha256으로 인코딩해야 합니다.
  - 개인용 url 줄이기 서비스를 표방해 회원가입 서비스는 지금은 넣지 않았습니다.

---

## 필요한 환경변수 목록

- .env 파일을 최상단 폴더에 생성해 아래 값을 입력합니다.

```
JWT_SECRET={{jwt secret 값}}
HASH_SALT={{비밀번호 해시 솔트}}
TARGET_URL={{url}}
```

### 예시

- TARGET_URL : http://localhost:3000/
  - 끝에 반드시 / 포함
- SECRET과 SALT는 웹에서 JWT SECRET GENERATOR 같이 검색하면 많이 나옵니다.
