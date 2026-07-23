---
name: batch-deploy
description: バッチサーバー（さくら VPS）上でリポジトリを最新化し、本番バッチの Docker イメージを再ビルドして反映する。「バッチを更新して」「最新のバッチロジックを反映して」「バッチサーバーに pull して」等のリクエストで使用する。
---

# バッチサーバーへの反映（git pull → イメージ再ビルド → 動作確認）

さくら VPS 上のバッチサーバーで、リポジトリの最新変更（`apps/batch`・`packages/db`・`sources.json` 等）を本番のバッチ実行に反映する手順。バッチは systemd timer から `docker compose -f compose.prod.yaml run --rm batch` として毎日 00:05・12:05・18:05（JST）に使い捨てコンテナとして実行される（常駐しない）。

作業はリポジトリのルートディレクトリ（`compose.prod.yaml` がある場所）で行う。

## 重要: `run` だけでは更新されない

`compose.prod.yaml` の `batch` サービスは `build:` のみ定義されており `pull_policy` も無いため、`docker compose run --rm batch` は**既存イメージが残っていれば `git pull` 後でも再ビルドしない**。systemd timer 自身も素の `run --rm batch` を叩くだけで再ビルドはしない。つまり、**明示的にビルドし直すことだけが新しいコードを反映させる唯一の手段**であり、これがこの SKILL の core。

## 手順

1. **作業ツリーの確認**
   ```sh
   git status
   ```
   コミットされていない変更が残っていないか確認する。残っている場合は内容を確認してから進める（無断で退避・破棄しない）。

2. **ビルド前のイメージ状態を記録**
   ```sh
   docker image inspect "$(docker compose -f compose.prod.yaml config --images batch)" --format '{{.Id}} {{.Created}}' 2>/dev/null || echo "(イメージ未作成)"
   ```
   `docker compose images -q` は `run --rm` の使い捨て運用だとコンテナが残らず常に空を返すため使わない。イメージ名は `config --images` でプロジェクト名に依存せず解決する。

3. **最新を取得**
   ```sh
   git branch --show-current   # main であることを確認
   git pull
   ```

4. **イメージを再ビルド（本質的なデプロイ操作）**
   ```sh
   docker compose -f compose.prod.yaml build batch
   ```

5. **イメージが更新されたか確認**
   ```sh
   docker image inspect "$(docker compose -f compose.prod.yaml config --images batch)" --format '{{.Id}} {{.Created}}'
   ```
   手順 2 の Id / Created と比較し、変わっていれば更新成功。変わっていない場合は手順 3 で実際に差分が取得できていたか（`git pull` の出力）を確認する。

6. **手動実行による疎通確認（要ユーザー確認）**

   `docker compose -f compose.prod.yaml run --rm batch` は以下 2 つの副作用を伴う、実行判断をユーザーに委ねるべき操作である。**イメージの再ビルドまでで作業を止め、手動実行を行ってよいか必ずユーザーに確認してから実行する**（無断で実行しない）。

   - 本番 DB に接続して実際にクロール結果を upsert する
   - 全 `enabled` ソースの一覧ページ・詳細ページへ実際に外部サイトへの HTTP リクエストを送る。systemd timer による定期実行（1 日 3 回）とは別に、手動実行のたびに追加の外部アクセスが発生するため、動作確認目的で何度も繰り返し実行しない（1 回の実行で `REQUEST_INTERVAL_MS` 等のクロールマナー自体は守られるが、実行回数を増やすこと自体が相手サイトへの負荷増になる）

   実行してよいと確認が取れた場合のみ、1 回だけ実行する:
   ```sh
   docker compose -f compose.prod.yaml run --rm batch
   ```
   - 正常終了（exit code 0）かどうかを確認する
   - ログは JSON 1 行形式（`apps/batch/src/logger.ts`）。`"level":"error"` が出ていないか、`URL 収集バッチが完了しました` / `詳細取得バッチが完了しました` / `引き継ぎコード削除バッチが完了しました` の 3 つが出力されているかを確認する
   - exit code 1 の場合、1 ソースの失敗が全体を止める設計ではないため、どのソースでエラーが発生したかをログの `results` フィールドから特定する
   - 失敗したからといって原因調査のために再実行を繰り返さない。ログから読み取れる範囲で判断し、追加実行が必要な場合も改めてユーザーに確認する

   ユーザーが手動実行を望まない場合は、イメージの再ビルドが完了した時点で作業終了とし、実際の反映確認は次回の systemd timer 実行（00:05・12:05・18:05 JST）に委ねる。

## スコープ外

コード自体の変更（新規ソース追加やパーサー修正など）はこの SKILL の対象外。変更・テスト（`pnpm lint` / `pnpm typecheck` / `pnpm test`）・PR 作成・`main` へのマージが完了した後の反映作業にのみ使う。
