import type { Config } from "@react-router/dev/config";
import resultsData from "./data/results.json";

const agentSlugs = resultsData.agents.map((a: { slug: string }) => a.slug);

export default {
  appDirectory: "src",
  buildDirectory: "dist",
  ssr: false,
  prerender: ["/", "/404", ...agentSlugs.map((slug) => `/${slug}`)],
} satisfies Config;
