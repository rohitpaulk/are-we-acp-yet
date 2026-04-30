import { Link, Outlet, useParams } from "react-router";

import Button from "../components/Button";
import { GitHubIcon } from "../components/GitHubIcon";
import { HelpIcon } from "../components/HelpIcon";
import QuestionHeadline from "../components/QuestionHeadline";
import StatusPill from "../components/StatusPill";
import mockData from "../data/mock-results.json";

function findAgent(slug = "") {
  return mockData.agents.find((candidate) => candidate.slug === slug);
}

function HomeHeaderDetails() {
  return (
    <p className="mt-8 text-base leading-relaxed text-text-muted">
      <span className="font-semibold text-green">Green</span> checks pass,{" "}
      <span className="font-semibold text-red">red</span> checks fail. <br />
    </p>
  );
}

function TopRightLinks() {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button href="https://agentclientprotocol.com/" shouldOpenInNewTab icon={<HelpIcon />}>
        What's this?
      </Button>
      <Button
        href="https://github.com/rohitpaulk/acp-verifier"
        shouldOpenInNewTab
        icon={<GitHubIcon />}
      >
        View on GitHub &rarr;
      </Button>
    </div>
  );
}

function TopNav({ showBackLink }: { showBackLink: boolean }) {
  return (
    <div className="absolute top-7 right-7 left-7 flex items-start justify-between gap-4">
      {showBackLink ? (
        <Link
          to="/"
          className="inline-flex items-center gap-1 pt-1.5 text-xs font-semibold text-text-muted no-underline transition-colors hover:text-text"
        >
          &larr; All agents
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <TopRightLinks />
    </div>
  );
}

export default function AppLayout() {
  const { slug } = useParams();
  const agent = findAgent(slug);

  if (slug && !agent) {
    return <Outlet />;
  }

  return (
    <div className="relative mx-auto max-w-5xl px-7">
      <TopNav showBackLink={Boolean(agent)} />

      <header className="pt-24 pb-12 text-center">
        {agent ? (
          <Link to="/">
            <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
          </Link>
        ) : (
          <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
        )}
        <QuestionHeadline agentName={agent?.name} />
        <StatusPill />
        {agent ? null : <HomeHeaderDetails />}
      </header>

      <Outlet />
    </div>
  );
}
