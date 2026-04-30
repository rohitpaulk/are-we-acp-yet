import { AgentPage } from "../pages/agent";
import { NotFoundPage } from "../pages/not-found";
import mockData from "../data/mock-results.json";

type AgentRouteProps = {
  params: {
    slug?: string;
  };
};

function findAgent(slug = "") {
  return mockData.agents.find((candidate) => candidate.slug === slug);
}

export function meta({ params }: AgentRouteProps) {
  const agent = findAgent(params.slug);

  return [{ title: agent ? `Is ${agent.name} ACP yet?` : "Agent not found" }];
}

export default function AgentRoute({ params }: AgentRouteProps) {
  const slug = params.slug ?? "";
  const agent = findAgent(slug);

  if (!agent) {
    return <NotFoundPage slug={slug} />;
  }

  return <AgentPage agent={agent} />;
}
