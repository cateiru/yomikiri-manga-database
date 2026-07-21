#!/bin/sh
# yomikiri-batch.service から呼び出される想定（WorkingDirectory=リポジトリのルート）。
# 成功時のみ last-success を touch し、Mackerel の check-file-age で実行漏れを検知できるようにする。
set -eu

docker compose -f compose.prod.yaml run --rm batch

mkdir -p /var/lib/yomikiri
touch /var/lib/yomikiri/last-success
