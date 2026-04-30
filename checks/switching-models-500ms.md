---
label: Switch mode < 500ms
description: Changes the mode session configuration option within 500 milliseconds
---

This check verifies that the agent responds to a mode config option change within 500ms.

### Why is this important?

Mode switching is often exposed through keyboard shortcuts like `Shift+Tab`, so changing the mode config option should feel instantaneous. Slow config option updates make the client feel laggy and can interrupt the user's flow.
