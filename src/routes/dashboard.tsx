import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard Admin — ALPHA Préfac" }] }),
  component: lazyRouteComponent(() => import("../components/DashboardPage")),
});
