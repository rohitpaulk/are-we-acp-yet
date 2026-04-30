import type { Config } from "@react-router/dev/config";
import { readdirSync } from "fs";
import { resolve } from "path";

const agentsDir = resolve(__dirname, "../agents");
const agentSlugs = readdirSync(agentsDir, { withFileTypes: true }).filter((d) => d.isDirectory());

export default {
  appDirectory: "src",
  buildDirectory: "dist",
  ssr: false,
  prerender: ["/", "/404", ...agentSlugs.map((d) => `/${d.name}`)],
} satisfies Config;
