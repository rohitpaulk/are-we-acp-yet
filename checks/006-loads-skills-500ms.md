---
label: Loads skills < 500ms
description: Loads `.agents/skills` slash commands within 500 milliseconds of session creation
---

This check verifies that skills from the session working directory are advertised as slash commands within 500ms of calling `session/new`.

### Why is this important?

Project skills affect the commands a client presents immediately after a session starts. Slow skill discovery can make command menus feel incomplete or laggy.
