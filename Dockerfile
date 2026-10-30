FROM node:22-slim AS base
WORKDIR /app
COPY package.json yarn.lock ./

# 런타임에 필요한 의존성만 설치
FROM base AS prod-deps
RUN yarn install --frozen-lockfile --production && yarn cache clean

# 빌드용 (devDependencies 포함)
FROM base AS build
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node public ./public
COPY --chown=node:node views ./views

USER node
EXPOSE 3000
CMD ["node", "dist/main"]
