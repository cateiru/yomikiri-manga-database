# mcuadros/ofelia は alpine ベースで docker CLI を同梱していないため、
# 公式 docker イメージ（alpine ベース）から CLI 本体と compose プラグインだけを取り込む。
# job-local から `docker compose run` を叩けるようにするための最小構成。
FROM mcuadros/ofelia:0.3.22

COPY --from=docker:29.7.1-cli-alpine3.24 /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker:29.7.1-cli-alpine3.24 /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
