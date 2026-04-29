# syntax=docker/dockerfile:1

FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/vite.config.ts ./vite.config.ts

EXPOSE 4321

CMD ["sh", "-c", "bun run preview -- --host 0.0.0.0 --port ${PORT:-4321}"]
