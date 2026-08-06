#!/bin/sh
# VPS 上でのバッチ更新用。リポジトリのルート（git clone 先はどこでもよい）で
# 実行する想定。compose.prod.yaml は ${PWD}（= このスクリプトを実行した
# カレントディレクトリ）を軸にパスを解決するため、必ずリポジトリのルートで
# 実行すること（`cd` せずに他の場所から呼び出すと動かない）。
# デプロイ実行は 00:05・12:05・18:05 の実行時間帯を避けること
# （実行中の run-batch.sh と `up -d` が重なると、アタッチ中の compose クライアントが
# 切られて last-success が更新されないまま実行が終わる可能性がある）。
set -eu

# プロジェクト名は compose.prod.yaml 冒頭の `name: app` から決まるため -p は付けない
# （run-batch.sh・yomikiri-ofelia-service チェックは Docker-outside-of-Docker 越しの
# 呼び出しのため明示的に -p app を使っている。こちらはホスト側の直接呼び出しなので不要）。
git pull --ff-only
docker compose -f compose.prod.yaml build batch ofelia mackerel-agent
# ofelia のラベル（スケジュール等）や Dockerfile の変更を反映するために毎回実行する
# （Docker のコンテナラベルは実行中変更できないため）。差分が無ければ no-op。
# batch は profiles: ["batch"] で縛られているため、bare な `up -d` では
# ofelia・mackerel-agent・otelcol-mackerel のみが対象になり常駐しない。
docker compose -f compose.prod.yaml up -d
