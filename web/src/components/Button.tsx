import { Link } from "react-router";

interface ButtonProps {
  href: string;
  icon?: React.ReactNode;
  shouldOpenInNewTab?: boolean;
  children: React.ReactNode;
}

const BUTTON_CLASS =
  "inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-dim no-underline transition-colors hover:border-border-hover hover:text-text hover:bg-surface-hover";

function isAbsolute(href: string) {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//");
}

export default function Button({ href, icon, shouldOpenInNewTab, children }: ButtonProps) {
  const newTabProps = shouldOpenInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {};

  if (isAbsolute(href)) {
    return (
      <a href={href} className={BUTTON_CLASS} {...newTabProps}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={BUTTON_CLASS} {...newTabProps}>
      {icon}
      {children}
    </Link>
  );
}
