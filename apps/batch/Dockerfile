FROM node:24.19.0-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

CMD ["pnpm", "--filter", "@yomikiri/batch", "start"]
