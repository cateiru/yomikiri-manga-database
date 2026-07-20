# yomikiri-manga-database

各漫画配信サービスに掲載されている「読み切り漫画」を横断的に収集し、一覧表示する Web サービス。

## 構成

| ディレクトリ | 内容 |
| --- | --- |
| `apps/web` | 一覧表示・投票 UI（Next.js） |
| `apps/batch` | 各サービスをクロールしてデータを収集するバッチ |
| `packages/db` | DB スキーマ・マイグレーション・DB クライアント（Drizzle ORM） |

## ローカル開発環境

Docker Compose で `db`（PostgreSQL） / `web`（Next.js 開発サーバー）を起動する。
`DATABASE_URL` は compose 内で設定済みのため、個別の環境変数設定は不要。

### 初回セットアップ

```sh
# db を起動
docker compose up -d db

# マイグレーション・ジャンルマスタの投入
docker compose run --rm web sh -c "corepack enable && pnpm install && pnpm --filter @yomikiri/db migrate && pnpm --filter @yomikiri/db seed"

# web を起動（db が未起動なら自動的に起動する）
docker compose up
```

`http://localhost:3000` で一覧ページを確認できる。

### バッチの手動実行

```sh
docker compose run --rm batch
```

### コンテナの停止・破棄

```sh
docker compose down
```

PostgreSQL のデータは named volume に保存されるため、コンテナを破棄・再作成してもデータは保持される。
データごと削除したい場合は `docker compose down -v` を使う。

### 補足

- `web` は `@neondatabase/serverless`（WebSocket 経由）で DB に接続する本番実装をそのまま使うため、
  ローカルの PostgreSQL コンテナとの間に `wsproxy` コンテナ（WebSocket ⇔ TCP 変換）を挟んでいる
  （`batch` は通常の TCP 接続のドライバを使うため `wsproxy` は不要）
- `web` / `batch` はリポジトリを bind mount し、コンテナ起動時に `pnpm install` を実行する
- `web` コンテナは起動のたびに `apps/web/.dev.vars` を `db` サービス向けの内容で上書きする。
  Docker を使わずホストで直接 `next dev` する場合は、この上書きに注意して手動で書き直すこと

## CI

`.github/workflows/ci.yml` で Pull Request と `main` への push を検証する。

- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` を実行する
