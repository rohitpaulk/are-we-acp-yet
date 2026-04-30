---
label: Session close
description: Properly handles session termination by cleaning up resources and acknowledging the close request
---

This check verifies that the agent supports the `session/close` capability.

### Why is this important?

`session/close` is required to terminate a running session and free up resources.

<!-- TODO: See if this is used to remove threads from the sidebar -->
