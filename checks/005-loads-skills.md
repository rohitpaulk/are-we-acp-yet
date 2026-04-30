---
label: Loads skills
description: Loads skills from `.agents/skills` in the working directory as slash commands
---

This check verifies that when a session is created with a working directory containing `.agents/skills`, the agent advertises those skills through [Slash Commands](https://agentclientprotocol.com/protocol/slash-commands).

### Why is this important?

Clients use slash command updates to show users which project-specific skills are available in the current workspace.

Agents should discover skills from the session working directory and send an `available_commands_update` notification that includes each user-invocable skill.
