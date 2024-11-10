#!/bin/sh
echo "

${MINI_APP_DOMAIN} {
    tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }
    log {
        output stdout
        format json
    }
    reverse_proxy /ptma* http://${IP_RANGE_BASE}:${PARTICIPANT_TMA_PORT}
    reverse_proxy  http://${IP_RANGE_BASE}:${MINI_APP_PORT}
}

${METABASE_DOMAIN} {
    tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }
    log {
        output stdout
        format json
    }
    reverse_proxy ${IP_RANGE_BASE}:${PORT_METABASE}
}

${MINIO_STORAGE_DOMAIN} {
    tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }
    log {
        output stdout
        format json
    }
    reverse_proxy http://${IP_MINIO}:${MINIO_PORT}
}

${MINIO_STORAGE_ADMIN_DOMAIN} {
    tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }
    log {
        output stdout
        format json
    }
    reverse_proxy http://${IP_RANGE_BASE}:${MINIO_DASHBOARD_PORT}
}

${MONITORING_DOMAIN} {
    tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }
    log {
        output stdout
        format json
    }
    reverse_proxy grafana:3000
}

${PGADMIN_DOMAIN} {
    tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }
    log {
        output stdout
        format json
    }
    reverse_proxy http://${IP_PGADMIN}:${PORT_PGADMIN}
}

${CLIENT_WEB_DOMAIN} {
    tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }
    log {
        output stdout
        format json
    }
    reverse_proxy ${IP_RANGE_BASE}:${PORT_CLIENT_WEB}
}

${ONTON_DOMAIN} {
    tls /certs/fullchain.pem /certs/privkey.pem {
        protocols tls1.2 tls1.3
    }
    log {
        output stdout
        format json
    }
    reverse_proxy ${IP_RANGE_BASE}:${PORT_WEB_SITE}
}




" > /etc/caddy/Caddyfile

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile