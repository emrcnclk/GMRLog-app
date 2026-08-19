# Shared proxy headers for every location that forwards to the API.
#
# Mounted at /etc/nginx/conf.d/gmrlog-proxy.inc. The `.inc` extension matters:
# the base nginx.conf includes /etc/nginx/conf.d/*.conf, so a `.conf` name here
# would load these directives at http level and fail the config test.
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;

# The backend's Fastify adapter is configured with requestIdHeader
# 'x-gmrlog-request-id' (apps/backend/src/main.ts), so a request id assigned at
# the edge is the same id that appears in the API's structured logs and in
# Sentry. Without this, a 502 logged by nginx cannot be joined to anything.
proxy_set_header X-Gmrlog-Request-Id $request_id;

proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $gmrlog_connection_upgrade;

# No timeouts here on purpose. They are set once at server level so the
# /socket.io/ location can raise its own without nginx rejecting the config for
# a duplicate directive in the same context — which is exactly what happened
# when this file carried them and that location overrode them.
