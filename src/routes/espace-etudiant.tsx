import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/espace-etudiant")({
  head: () => ({
    meta: [
      { title: "Espace Étudiant — ALPHA Préfac" },
      {
        name: "description",
        content:
          "Suivez votre parcours d'admission, vos cours, vos notes et actualités en temps réel.",
      },
    ],
  }),
  component: lazyRouteComponent(() => import("../components/EspaceEtudiantPage")),
});
