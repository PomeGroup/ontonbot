# Stage 1: Build Caddy with the Cloudflare DNS module
FROM caddy:builder AS builder
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare@1fb64108d4debf196b19d7398e763cb78c8a0f41

# Stage 2: Copy the built Caddy binary to a new Caddy image
FROM caddy:latest AS production
COPY --from=builder /usr/bin/caddy /usr/bin/caddy


