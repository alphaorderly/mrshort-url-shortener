# 1) 프론트엔드(web/) 빌드
FROM node:22-slim AS web-build
WORKDIR /web
COPY web/package.json web/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY web/ ./
RUN yarn build

# 2) 백엔드 빌드 (devDependencies 포함)
FROM node:22-slim AS api-build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN yarn build

# 3) 런타임에 필요한 의존성만 설치
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# 4) 실행 이미지: API 서버 + 빌드된 프론트엔드를 한 컨테이너로
FROM node:22-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    WEB_DIST=/app/web/dist
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=api-build /app/dist ./dist
COPY --chown=node:node --from=web-build /web/dist ./web/dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main"]
