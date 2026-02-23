# Stage 1: Install dependencies
FROM oven/bun:1 AS install
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/cli/package.json apps/cli/
COPY apps/web/package.json apps/web/
COPY packages/api-routes/package.json packages/api-routes/
COPY packages/ch-schema/package.json packages/ch-schema/
COPY packages/sql-schema/package.json packages/sql-schema/
COPY packages/typescript-config/package.json packages/typescript-config/

RUN bun install --frozen-lockfile

# Stage 2: Build the frontend
FROM install AS build
WORKDIR /app

COPY . .
RUN bun run build

# Stage 3: Runtime — copy the full build workspace, then overlay built frontend
FROM oven/bun:1-slim AS runtime
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./

# Copy built frontend into the API's public directory
COPY --from=build /app/apps/web/dist ./apps/api/public

ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=public

EXPOSE 3000

CMD ["bun", "run", "apps/api/src/index.ts"]
