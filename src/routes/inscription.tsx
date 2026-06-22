import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/inscription")({
  validateSearch: (search: Record<string, unknown>): { mode?: "login" | "signup" } => {
    return {
      mode: search.mode === "login" ? "login" : "signup",
    };
  },
  head: () => ({
    meta: [
      { title: "Créer un compte — ALPHA Préfac" },
      {
        name: "description",
        content:
          "Rejoignez Alpha PRÉFAC dès aujourd'hui et préparez votre admission universitaire.",
      },
    ],
  }),
  component: lazyRouteComponent(() => import("../components/InscriptionPage")),
});
