import { Link, Outlet, useLocation, useParams } from "react-router";

import Button from "../components/Button";
import { GitHubIcon } from "../components/GitHubIcon";
import { HelpIcon } from "../components/HelpIcon";
import QuestionHeadline from "../components/QuestionHeadline";
import StatusPill from "../components/StatusPill";
import resultsData from "../../data/results.json";

function findAgent(slug = "") {
  return resultsData.agents.find((candidate) => candidate.slug === slug);
}

function TopRightLinks() {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button href="https://agentclientprotocol.com/" shouldOpenInNewTab icon={<HelpIcon />}>
        What's ACP?
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
  const location = useLocation();
  const agent = findAgent(slug);

  if (slug && !agent) {
    return <Outlet />;
  }

  return (
    <div className="relative mx-auto max-w-5xl px-7">
      <TopNav showBackLink={Boolean(agent)} />

      <header className="pt-24 pb-8 text-center">
        <Link to="/">
          <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
        </Link>

        <QuestionHeadline agentName={agent?.name} />

        <StatusPill key={location.pathname} />
      </header>

      <Outlet />
    </div>
  );
}
