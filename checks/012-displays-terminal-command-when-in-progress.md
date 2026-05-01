---
label: Displays running terminal command
---

This check verifies that the agent makes the running command visible through ACP while it is in progress. Agents can satisfy this by embedding client-managed terminal content in a `tool_call` or `tool_call_update`, or by emitting ACP `execute` tool call updates for an agent-managed terminal command.

**Why is this important?**

Clients can only render a live terminal UI when the agent embeds the terminal ID in a tool call, but ACP `execute` tool calls still give users immediate visibility into which command is running and how it progresses.
