FROM debian:trixie-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://install.ottocode.io | sh

ENTRYPOINT ["/root/.local/bin/otto", "--ci", "--acp"]
