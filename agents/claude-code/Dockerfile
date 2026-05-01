FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates ripgrep && rm -rf /var/lib/apt/lists/*
RUN npm install -g @agentclientprotocol/claude-agent-acp@0.31.4

ENV CLAUDE_CODE_REMOTE=1

ENTRYPOINT ["claude-agent-acp", "--hide-claude-auth"]
