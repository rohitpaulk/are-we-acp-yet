---
label: Listing session modes
description: Advertises supported modes (e.g., Ask/Plan/Build) through session config options
---

This check verifies that the agent supports modes through [Session Config Options](https://agentclientprotocol.com/protocol/session-config-options).

### Why is this important?

Clients need this information to render the current mode (for example Ask/Plan/Build) in the UI.

Agents that support modes should expose a valid single-select session config option for modes, including the current value and the available values that clients can present to users.
