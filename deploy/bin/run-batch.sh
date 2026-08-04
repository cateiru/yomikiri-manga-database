#!/bin/sh
# ofelia (job-local) の yomikiri-batch ジョブから呼び出される想定。
# ofelia コンテナには compose.prod.yaml の environment: PWD: ${PWD} で
# クローン先のリポジトリルート（ホストと同一の絶対パス）が PWD として渡されている
# 前提（compose.prod.yaml の ofelia サービス参照。クローン先が /opt/yomikiri/app 以外でも動く）。
set -eu

# ofelia コンテナ内は root で実行されるが、otelcol-mackerel コンテナは
# distroless nonroot（UID/GID 65532）で batch.log を読む。ofelia のベースイメージの
# umask に依存せず world-readable（644/755）で作成されることを保証するため明示する。
umask 022

LOGDIR="$PWD/data/log/yomikiri"
LIBDIR="$PWD/data/lib/yomikiri"
LOGFILE="$LOGDIR/batch.log"
mkdir -p "$LIBDIR" "$LOGDIR"
touch "$LOGFILE"

# `run --rm` は必ずアタッチ実行する（`-d` を付けない）。アタッチしたクライアントの
# 標準出力・標準エラーをそのまま `>>` でリダイレクトすることでログファイルへ記録する。
if docker compose -p app -f "$PWD/compose.prod.yaml" run --rm batch >>"$LOGFILE" 2>&1; then
    touch "$LIBDIR/last-success"
else
    touch "$LIBDIR/last-failure"
    exit 1
fi
