#!/bin/sh
echo "${LOCAL_DOMAIN} {
    tls internal
    reverse_proxy /ptma* http://${IP_RANGE_BASE}.0.1:3001
    reverse_proxy  http://${IP_RANGE_BASE}.0.1:3000
}" > /etc/caddy/Caddyfile

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile