---
label: Boot < 500ms
description: Server cold-starts and responds to the first health-check request within 500 milliseconds
---

This check verifies that the agent boots and responds to the [`initialize`](https://agentclientprotocol.com/protocol/initialization) request within 500ms.

**Why is this important?**

- This affects the load time of the first chat session.
