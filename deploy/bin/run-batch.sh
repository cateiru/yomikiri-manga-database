#!/bin/sh
# ofelia (job-local) の yomikiri-batch ジョブから呼び出される想定。
# ofelia コンテナには /opt/yomikiri/app・/var/lib/yomikiri・/var/log/yomikiri が
# ホストと同一パスで bind mount されている前提（compose.prod.yaml の ofelia サービス参照）。
set -eu

LOGFILE=/var/log/yomikiri/batch.log
mkdir -p /var/lib/yomikiri /var/log/yomikiri

# `run --rm` は必ずアタッチ実行する（`-d` を付けない）。アタッチしたクライアントの
# 標準出力・標準エラーをそのまま `>>` でリダイレクトすることでログファイルへ記録する。
if docker compose -p app -f /opt/yomikiri/app/compose.prod.yaml run --rm batch >>"$LOGFILE" 2>&1; then
    touch /var/lib/yomikiri/last-success
else
    touch /var/lib/yomikiri/last-failure
    exit 1
fi
