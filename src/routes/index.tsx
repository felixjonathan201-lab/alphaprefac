import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALPHA Préfac — Stay Focus. Atteins ton université de rêve." },
      {
        name: "description",
        content:
          "ALPHA PRÉFAC t'accompagne pas-à-pas pour combler tes lacunes académiques et décrocher ton admission dans les plus grandes universités d'État et privées.",
      },
      { property: "og:title", content: "ALPHA Préfac — Stay Focus." },
      {
        property: "og:description",
        content: "Atteins ton université de rêve avec un accompagnement d'excellence.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: lazyRouteComponent(() => import("../components/HomePage")),
});
