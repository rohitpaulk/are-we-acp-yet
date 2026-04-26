FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g @zed-industries/codex-acp

# Required at runtime (pass one of these):
#   OPENAI_API_KEY  - OpenAI API key
#   CODEX_API_KEY   - Codex-specific API key (alternative)

ENTRYPOINT ["codex-acp"]
