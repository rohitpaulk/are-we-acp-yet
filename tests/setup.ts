import { setDefaultTimeout } from "bun:test";
import { AgentRegistry } from "../lib/agent-registry";
import { CheckCollectorRegistry } from "../lib/check-collector-registry";

setDefaultTimeout(15_000);

export const registry = new AgentRegistry();
await registry.buildAllImages();

export const checkCollectorRegistry = new CheckCollectorRegistry(registry);

