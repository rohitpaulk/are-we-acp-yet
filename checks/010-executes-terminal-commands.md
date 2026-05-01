---
label: Executes terminal commands
description: Successfully executes a command in response to a user request
---

This check verifies that the agent actually executes a terminal command in response to a user request. The agent is asked to run a command that creates a file at a known path; the check passes if that file exists after the prompt completes. The agent may execute the command through the ACP [`terminal/create`](https://agentclientprotocol.com/protocol/terminals#executing-commands) method or through its own built-in execute tool — either is acceptable.

**Why is this important?**

Agents often need to run tests, builds, formatters, and other command-line tools. This check confirms that the agent is willing and able to execute commands when asked.
