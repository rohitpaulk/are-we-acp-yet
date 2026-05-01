---
label: Displays terminal output
---

This check verifies that terminal output remains displayable in ACP session updates. Agents can satisfy this with embedded client-managed terminal content, or with ACP `execute` tool call content that includes the command result.

**Why is this important?**

Users need to see the command output that led to the agent's next steps, especially for test failures, build errors, and generated logs. Terminal or `execute` tool call content lets clients display this output directly in the conversation.
