# mackerel/mackerel-agent は debian ベースで docker CLI を同梱していないため、
# 公式 docker イメージ（debian ベース = glibc。ベースが musl の alpine 版だと
# 動かない可能性があるため必ず glibc 版を使う）から CLI 本体と compose プラグインだけを取り込む。
# yomikiri-ofelia-service チェックプラグイン（deploy/mackerel/yomikiri-batch-checks.conf）が
# `docker compose ps` を叩けるようにするための最小構成（deploy/ofelia/Dockerfile と同じ狙い）。
FROM mackerel/mackerel-agent:latest

COPY --from=docker:29.7.1-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker:29.7.1-cli /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
