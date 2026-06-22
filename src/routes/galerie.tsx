import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/galerie")({
  head: () => ({
    meta: [
      { title: "Galerie Photos — ALPHA Préfac" },
      {
        name: "description",
        content:
          "Découvrez en images la vie à ALPHA Préfac, nos formations, nos événements et la réussite de nos étudiants.",
      },
      { property: "og:title", content: "Galerie Photos — ALPHA Préfac" },
      {
        property: "og:description",
        content: "Découvrez en images nos formations, séances de révision et moments mémorables.",
      },
    ],
  }),
  component: lazyRouteComponent(() => import("../components/GaleriePage")),
});
