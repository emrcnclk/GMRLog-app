# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

# Copy workspace configuration and lock files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Copy all package.json and source files from packages and apps
COPY packages/ packages/
COPY apps/backend/ apps/backend/
COPY tooling/ tooling/

# Install dependencies - this sets up workspace symlinks correctly
RUN pnpm install --frozen-lockfile

# Generate and build in dependency order
RUN pnpm --filter @gmrlog/database generate && \
  pnpm --filter @gmrlog/types build && \
  pnpm --filter @gmrlog/validators build && \
  pnpm --filter @gmrlog/database build && \
  pnpm --filter @gmrlog/backend build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# Copy only necessary files from build stage
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/packages/ packages/
COPY --from=build /app/tooling/ tooling/
COPY --from=build /app/apps/backend/ apps/backend/
COPY --from=build /app/node_modules/ node_modules/

WORKDIR /app/apps/backend
EXPOSE 4000
CMD ["node", "dist/main.js"]
