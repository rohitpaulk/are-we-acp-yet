---
label: Switching modes
---

This check verifies that the agent can switch modes using ACP Session Config Options.

**Why is this important?**

Clients need reliable mode switching to implement shortcuts like `Shift+Tab`. If an agent exposes a mode config option with multiple values, it should accept another valid value via `session/set_config_option` and keep the session usable afterward.
