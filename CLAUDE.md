# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

各漫画配信サービス（GigaViewer 系）に掲載されている「読み切り漫画」を横断的に収集・一覧表示する Web サービス。仕様は `docs/001_plan.md`、UI デザイン指針は `docs/002_design.md`、機能ごとの実装計画は `docs/plans/` を参照。漫画本体は配信せず、外部ビューワーページへ遷移させ、読了後にジャンル投票を集める。

## リポジトリ構成（pnpm workspace）

- `apps/web` — 一覧表示・投票 UI（Next.js App Router、`@opennextjs/cloudflare` で Cloudflare Workers にデプロイ）
- `apps/batch` — 各サービスをクロールしてデータを収集するバッチ（さくら VPS 上で Docker コンテナとして systemd timer により 6 時間ごと実行、Mackerel で監視）
- `packages/db` — Drizzle ORM のスキーマ・マイグレーション・DB クライアント（web / batch で共有）
- `sources.json` / `sources.schema.json` — クロール対象サービスの宣言的定義（リポジトリ直下）

## コマンド

ルートから実行する（`pnpm -r` でワークスペース全体に伝播）。

```sh
pnpm lint              # biome check .
pnpm lint:fix          # biome check --write .
pnpm format            # biome format --write .
pnpm typecheck         # 各パッケージの tsc --noEmit
pnpm test              # 各パッケージの vitest run
pnpm build             # 各パッケージの build（web は next build）
pnpm validate:sources  # sources.json を sources.schema.json で検証（ajv）
```

単一パッケージ・単一テストファイルを対象にする場合:

```sh
pnpm --filter @yomikiri/batch test              # apps/batch のみ
pnpm --filter @yomikiri/batch exec vitest run src/parsers/gigaviewer/sources/comic-days.test.ts
pnpm --filter @yomikiri/web exec vitest run src/lib/readDetection.test.ts
```

CI（`.github/workflows/ci.yml`）は `pnpm install --frozen-lockfile` の後に lint → typecheck → test → build の順で実行する。

## ローカル開発環境（Docker Compose）

```sh
docker compose up -d db   # PostgreSQL を起動
docker compose run --rm web sh -c "corepack enable && pnpm install && pnpm --filter @yomikiri/db migrate && pnpm --filter @yomikiri/db seed"
docker compose up         # web（http://localhost:3000）を起動。db も自動起動
docker compose run --rm batch   # バッチを手動実行（one-shot、常駐しない）
```

- Neon（本番の Serverless PostgreSQL）はローカルでは使わず、`db` サービス（PostgreSQL コンテナ）を使う
- `web` は本番と同じ `@neondatabase/serverless`（WebSocket 経由）ドライバをそのまま使うため、`wsproxy` コンテナ（WebSocket ⇔ TCP 変換）を挟んでいる。`batch` は通常の TCP ドライバ（`postgres`）を使うため `wsproxy` は不要
- `web` コンテナは起動のたびに `apps/web/.dev.vars` を `db` 向けの内容で上書きする。Docker を使わずホストで直接 `next dev` する場合はこの上書きに注意して手動で書き直すこと
- コンテナを破棄しても `db-data` named volume によりデータは保持される。データごと消す場合のみ `docker compose down -v`

## アーキテクチャ

### データフロー

```
batch（sources.json に基づき収集） → Neon（Drizzle で upsert） → web（Server Component で直接クエリ） → ユーザー
```

Web の一覧表示は Server Component から直接 DB を参照する設計で、公開 API は投票エンドポイント（`POST /api/oneshots/[id]/votes`）のみ。

### バッチの 2 段構成（`apps/batch/src/index.ts`）

バッチは「URL 収集」→「詳細取得」の順に**必ず両方**実行する。URL 収集を毎回全ソース完走させてから詳細取得（キュー処理）を行うことで、詳細取得に時間がかかっても新規作品の発見自体は毎回滞りなく行われる（1 ソースだけ処理が偏り続けることを防ぐ）。

1. **URL 収集**（`crawler/collectUrls.ts`）: 各ソースの `listUrls` を GET し、`parsers/gigaviewer` でビューワー URL を抽出、`(source_key, viewer_url)` をキーに `oneshots` へ upsert。新規行は `title` 等が `null` のまま登録され、詳細取得バッチのキュー対象になる。既存行は `last_seen_at` のみ更新（詳細情報は上書きしない）
2. **詳細取得**（`crawler/fetchDetails.ts`）: `details_fetched_at IS NULL` の行をキューとし、**source ごとにグルーピングしてラウンドロビンで 1 件ずつ処理**（1 ソースの滞留が他ソースの処理を遅らせないため）。GigaViewer 共通のビューワー DOM 構造（`parsers/gigaviewer/viewerDetail.ts`）からタイトル・著者・サムネイル・掲載日を抽出
   - 抽出成功: 詳細情報 + `details_fetched_at` を更新
   - 抽出失敗（タイトル取得不可等）: `details_fetched_at` のみ更新し無限リトライを防ぐ
   - HTTP/ネットワークエラー: `details_fetched_at` を更新せず次回再試行

どちらの段もソース単位でエラーをハンドリングし、1 ソースの失敗が他ソースへ波及しないようにする。

### クロールマナー（`crawler/robots.ts`, `crawler/fetchHtml.ts`）

- 一覧・ビューワーページとも `robots.txt` を確認し、拒否パスへはアクセスしない
- リクエスト間隔はソースごとに 1 リクエスト/秒以上空ける（`REQUEST_INTERVAL_MS`）
- 取得するのは HTML のみ（漫画本体の画像データは取得しない）

### GigaViewer パーサーの構造（`apps/batch/src/parsers/gigaviewer/`）

`parser` 種別としては `gigaviewer` の 1 種類のみだが、一覧ページの HTML 構造は掲載元ごとに異なるため、**ソースごとに個別の抽出ロジック**が必要。新しいソースを追加する際のパターン:

1. `sources/<source-key>.ts` に `extract($: CheerioAPI, source: Source): ParsedOneshotUrl[]` を実装（`common.ts` の `buildUrlItem` でアイテム構築）
2. `index.ts` の `registry` に `source.key → extract` を登録（未登録の `source.key` は `assertSupportedSources` でエラーになる）
3. 対応するテスト（`sources/<source-key>.test.ts`）と fixture HTML（`apps/batch/test/fixtures/<source-key>.html`）を追加
4. ビューワーページ側の詳細抽出は GigaViewer 全サービス共通（`viewerDetail.ts`）のため個別実装不要

### `sources.json`（クロール対象サービス定義）

サービスの追加・変更は基本的に `sources.json`（+ 上記パーサー追加）のみで完結する。フィールドの意味は `sources.schema.json` を参照。特に:

- `listUrls`: 同じ `parser`・同じ `source.key` で解析する複数の一覧ページ URL（1 ソースが複数ページを持つ場合に使う）
- `fallbackSourceKey`: 姉妹サイト等で同一作品が重複掲載される場合、指定した source に既に同一パス（クエリ除く）の viewer URL が登録済みならこのソースでの登録をスキップする（`collectUrls.ts` の `filterFallbackDuplicates`）
- 変更後は `pnpm validate:sources` でスキーマ検証する

### DB スキーマ（`packages/db/src/schema.ts`）

- `oneshots`: `(source_key, viewer_url)` に unique index。一覧から消えた作品も削除せず `last_seen_at` の更新が止まるだけ。Web の一覧表示は `title IS NOT NULL`（詳細取得済み）の行のみ対象
- `genres`: 固定ジャンルマスタ（`packages/db/scripts/seed.ts` で投入）
- `genre_votes`: `(oneshot_id, genre_id, anonymous_user_id)` に unique index で重複投票防止。認証は無く匿名 UUID（localStorage 由来）で管理

DB クライアントは接続先ごとに使い分ける（スキーマは共通）:
- `@yomikiri/db/client-serverless`（`drizzle-orm/neon-serverless`）— Cloudflare Workers（`apps/web`）用
- `@yomikiri/db/client-node`（`drizzle-orm/postgres-js`）— Node.js（`apps/batch`、マイグレーション/seed スクリプト）用

### 一覧のページング・ソート（`apps/web/src/lib/oneshots.ts`）

ソートは `published_at` 降順（NULL は末尾）、同着は `title` 昇順。カーソルベースページングのカーソル比較条件（`buildCursorCondition`）はこのソート順と正確に一致させる必要がある。ジャンルバッジは `genre_votes` を都度 `GROUP BY` 集計する設計（将来的な負荷増ではマテリアライズ化を検討、ページ自体は ISR キャッシュで軽減）。

### 読了検知・投票フロー

外部サイト遷移のため正確な読了は検知できず、「外部遷移してから 60 秒以上経って戻ってきた」ことをヒューリスティックに読了とみなす（`apps/web/src/lib/readDetection.ts`）。判定・スキップ状態は localStorage で管理する（サーバー側に状態を持たない）。

## デザイン規約（`apps/web`）

`docs/002_design.md` に厳密なデザイントークン・原則が定義されている。UI 変更時は必ず参照すること。要点:

- 「漫画のコマ」をメタファーにしたモノトーン UI。角丸なし（`border-radius: 0`）、ソリッドな実線ボーダー、blur 無しのオフセットのみの `box-shadow`
- 有彩色は「他社サービスのロゴ・ファビコン」と「エラー表示（`--color-error`）」にのみ限定。それ以外での色の流用は禁止
- カラー・タイポグラフィ・スペーシング等のトークンは CSS カスタムプロパティとして `apps/web` のグローバル CSS に定義する
- フォーカスリングの無効化（`outline: none`）は禁止。状態表現を色のみに依存させない

## コーディング規約

- Lint/フォーマットは Biome（`biome.json`）。ダブルクォート・セミコロン必須・末尾カンマあり・インデント幅 2、行幅 100
- コミットメッセージは日本語（Conventional Commits ライクなプレフィックス: `feat:` / `fix:` / `refactor:` 等。`git log` 参照）
