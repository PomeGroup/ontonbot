#!/bin/sh
# Define TLS configuration based on the USE_CLOUDFLARE variable
echo "Generating Caddyfile... ${USE_CLOUDFLARE}"
if [ -n "${USE_CLOUDFLARE}" ]; then
    TLS_CONFIG="tls {
        dns cloudflare  {env.CLOUDFLARE_API_TOKEN}
        protocols tls1.2 tls1.3
    }"
else
    TLS_CONFIG="tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }"
fi

# Define log configuration
LOG_CONFIG="log {
    output stdout
    format json
}"

# Generate Caddyfile
echo "

${MINI_APP_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy /ptma* http://${IP_RANGE_BASE}:${PARTICIPANT_TMA_PORT}
    reverse_proxy http://${IP_RANGE_BASE}:${MINI_APP_PORT}
}

${METABASE_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy ${IP_RANGE_BASE}:${PORT_METABASE}
}

${MINIO_STORAGE_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy http://${IP_MINIO}:${MINIO_PORT}
}

${MINIO_STORAGE_ADMIN_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy http://${IP_RANGE_BASE}:${MINIO_DASHBOARD_PORT}
}

${MONITORING_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy grafana:3000
}

${PGADMIN_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy http://${IP_PGADMIN}:${PORT_PGADMIN}
}

${CLIENT_WEB_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy ${IP_RANGE_BASE}:${PORT_CLIENT_WEB}
}

${ONTON_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy ${IP_RANGE_BASE}:${PORT_WEB_SITE}
}

" > /etc/caddy/Caddyfile
cat /etc/caddy/Caddyfile
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
