# syntax=docker/dockerfile:1

FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app

ENV ASTRO_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app

ENV ASTRO_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/astro.config.mjs ./astro.config.mjs

EXPOSE 4321

CMD ["sh", "-c", "bun run preview -- --host 0.0.0.0 --port ${PORT:-4321}"]
