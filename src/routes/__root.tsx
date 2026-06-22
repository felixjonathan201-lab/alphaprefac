import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Le chemin d'accès demandé n'existe pas ou a été déplacé.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retourner à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu se charger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue de notre côté. Vous pouvez réessayer ou retourner à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Aller à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [showStatus, setShowStatus] = useState(false);
  const [statusType, setStatusType] = useState<"online" | "offline">("online");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setStatusType("online");
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatusType("offline");
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check: if offline, display persistently
    if (!navigator.onLine) {
      setIsOnline(false);
      setStatusType("offline");
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      {statusType === "offline" ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/95 px-4 py-3.5 shadow-2xl backdrop-blur-md text-amber-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div className="text-left">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider">
              Mode Hors-ligne
            </p>
            <p className="text-[11px] text-amber-300/90 font-sans mt-0.5">
              Données lues depuis le cache local (IndexedDB) 💾
            </p>
          </div>
          <button
            onClick={() => setShowStatus(false)}
            className="text-amber-400 hover:text-amber-100 text-xs pl-2 font-mono font-bold"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/95 px-4 py-3.5 shadow-2xl backdrop-blur-md text-emerald-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="text-left">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider">
              Connexion rétablie
            </p>
            <p className="text-[11px] text-emerald-300/90 font-sans mt-0.5">
              Données et cache entièrement synchronisés ⚡
            </p>
          </div>
          <button
            onClick={() => setShowStatus(false)}
            className="text-emerald-400 hover:text-emerald-100 text-xs pl-2 font-mono font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("alpha-theme") || "dark";
      if (savedTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ConnectionStatus />
    </QueryClientProvider>
  );
}
