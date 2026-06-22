import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ALPHA Préfac" },
      {
        name: "description",
        content:
          "Contactez ALPHA Préfac : formulaire de contact, téléphone, email, locaux et horaires.",
      },
      { property: "og:title", content: "Contact — ALPHA Préfac" },
      {
        property: "og:description",
        content: "Joignez l'équipe ALPHA Préfac pour toute question ou inscription.",
      },
    ],
  }),
  component: lazyRouteComponent(() => import("../components/ContactPage")),
});
