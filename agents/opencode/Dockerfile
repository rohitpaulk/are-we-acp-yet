FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g opencode-ai

ENTRYPOINT ["opencode", "acp"]
