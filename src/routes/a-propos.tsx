import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À Propos — ALPHA Préfac" },
      {
        name: "description",
        content:
          "Découvrez l'histoire, la vision et l'engagement d'ALPHA Préfac en collaboration avec Haiti Santé Moderne.",
      },
      { property: "og:title", content: "À Propos — ALPHA Préfac" },
      {
        property: "og:description",
        content:
          "Démocratiser l'accès à une préparation d'excellence pour intégrer les universités.",
      },
    ],
  }),
  component: lazyRouteComponent(() => import("../components/AboutPage")),
});
