import { NotFoundPage } from "../pages/not-found";

type NotFoundRouteProps = {
  params: {
    "*"?: string;
  };
};

export function meta() {
  return [{ title: "Agent not found" }];
}

export default function NotFoundRoute({ params }: NotFoundRouteProps) {
  return <NotFoundPage slug={params["*"] ?? ""} />;
}
