#!/bin/sh
# VPS 上でのバッチ更新用。リポジトリのルートで実行する想定。
# デプロイ実行は 00:05・12:05・18:05 の実行時間帯を避けること
# （実行中の run-batch.sh と `up -d` が重なると、アタッチ中の compose クライアントが
# 切られて last-success が更新されないまま実行が終わる可能性がある）。
set -eu

git pull --ff-only
docker compose -p app -f compose.prod.yaml build batch ofelia mackerel-agent
# ofelia のラベル（スケジュール等）や Dockerfile の変更を反映するために毎回実行する
# （Docker のコンテナラベルは実行中変更できないため）。差分が無ければ no-op。
# batch は profiles: ["batch"] で縛られているため、bare な `up -d` では
# ofelia・mackerel-agent・otelcol-mackerel のみが対象になり常駐しない。
docker compose -p app -f compose.prod.yaml up -d
