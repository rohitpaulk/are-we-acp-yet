---
label: Streams terminal output
description: Polls terminal output while commands are running so command progress can be streamed
---

This check verifies that terminal command output is reported through ACP. Agents can satisfy this by polling a client-managed terminal with [`terminal/output`](https://agentclientprotocol.com/protocol/terminals#getting-output), or by reporting output in ACP `execute` tool call updates when the agent owns command execution.

**Why is this important?**

Long-running commands should not feel like black boxes. Polling terminal output lets the agent observe progress, react to failures, and keep users informed while work is still in progress.
