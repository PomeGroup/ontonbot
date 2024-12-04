#!/bin/sh

# Determine which Cloudflare credentials to use based on the branch name
if [ "${BRANCH_NAME}" = "main" ]; then
    CLOUDFLARE_EMAIL="${CLOUDFLARE_EMAIL_MAIN}"
    CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN_MAIN}"
fi

# Define TLS configuration based on the USE_CLOUDFLARE variable
echo "Generating Caddyfile... USE_CLOUDFLARE=${USE_CLOUDFLARE}"
if [ -n "${USE_CLOUDFLARE}" ]; then
    TLS_CONFIG="tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
        protocols tls1.2 tls1.3
    }"
else
    TLS_CONFIG="tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }"
fi

# Debug output
echo "Using Cloudflare email: ${CLOUDFLARE_EMAIL}"

# Set the IP for services based on the USE_MAIN_IP_TO_EXPOSE variable
if [ "${USE_MAIN_IP_TO_EXPOSE}" = "true" ]; then
    PROXY_MINI_APP=${IP_RANGE_BASE}
    PROXY_PARTICIPANT_TMA=${IP_RANGE_BASE}
    PROXY_METABASE=${IP_RANGE_BASE}
    PROXY_MINIO=${IP_RANGE_BASE}
    PROXY_PGADMIN=${IP_RANGE_BASE}
    PROXY_CLIENT_WEB=${IP_RANGE_BASE}
    PROXY_WEBSITE=${IP_RANGE_BASE}
else
    PROXY_MINI_APP=${IP_MINI_APP}
    PROXY_PARTICIPANT_TMA=${IP_PARTICIPANT_TMA}
    PROXY_METABASE=${IP_METABASE}
    PROXY_MINIO=${IP_MINIO}
    PROXY_PGADMIN=${IP_PGADMIN}
    PROXY_CLIENT_WEB=${IP_CLIENT_WEB}
    PROXY_WEBSITE=${IP_WEBSITE}
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
    reverse_proxy /ptma* http://${PROXY_PARTICIPANT_TMA}:${PARTICIPANT_TMA_PORT}
    reverse_proxy http://${PROXY_MINI_APP}:${MINI_APP_PORT}
}

${METABASE_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy ${PROXY_METABASE}:${PORT_METABASE}
}

${MINIO_STORAGE_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy http://${PROXY_MINIO}:${MINIO_PORT}
}

${MINIO_STORAGE_ADMIN_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy http://${PROXY_MINIO}:${MINIO_DASHBOARD_PORT}
}

${MONITORING_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy grafana:3000
}

${PGADMIN_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    reverse_proxy http://${PROXY_PGADMIN}:${PORT_PGADMIN} {
       header_up X-Forwarded-Proto {scheme}
       header_up Host {host}
       header_down -X-Content-Type-Options
    }
}

${CLIENT_WEB_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}

    reverse_proxy ${PROXY_CLIENT_WEB}:${PORT_CLIENT_WEB}
}

${ONTON_DOMAIN} {
    ${TLS_CONFIG}
    ${LOG_CONFIG}
    # Allow CORS for all subdomains of onton.live

            reverse_proxy /blog* ${IP_RANGE_BASE}:6600
            header {
                Access-Control-Allow-Origin *
                Access-Control-Allow-Methods GET, POST, OPTIONS, PUT, DELETE
                Access-Control-Allow-Headers Content-Type, Authorization
                Access-Control-Allow-Credentials true
            }


    reverse_proxy ${PROXY_WEBSITE}:${PORT_WEB_SITE}
}

" > "${CADDYFILE_PATH}"
cat "${CADDYFILE_PATH}"

