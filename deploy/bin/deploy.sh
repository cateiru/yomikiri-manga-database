#!/bin/sh
# VPS 上でのバッチ更新用。リポジトリのルートで実行する想定。
set -eu

git pull --ff-only
docker compose -f compose.prod.yaml build batch
