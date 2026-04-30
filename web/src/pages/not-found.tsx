import { Link } from "react-router";

export function NotFoundPage({ slug }: { slug: string }) {
  return (
    <div className="mx-auto max-w-5xl px-7">
      <main className="pt-24 pb-14 text-center">
        <Link to="/">
          <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
        </Link>
        <h1 className="text-5xl leading-none font-bold tracking-tighter text-text">
          Agent not found
        </h1>
        <p className="mt-6 text-text-muted">
          No ACP verifier results exist for <span className="text-text-dim">{slug}</span>.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted no-underline transition-colors hover:border-border-hover hover:text-text"
        >
          &larr; All agents
        </Link>
      </main>
    </div>
  );
}
