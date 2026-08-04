FROM node:24.16.0-bookworm-slim

WORKDIR /app

RUN corepack enable

# playwright の実行には Chromium 本体と Debian の各種システムライブラリが必要。
# `pnpm install` の postinstall での自動ダウンロードには頼らず、明示的な
# `playwright install --with-deps` の1回だけでイメージに焼き込む
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @yomikiri/batch exec playwright install --with-deps chromium

CMD ["pnpm", "--filter", "@yomikiri/batch", "start"]
