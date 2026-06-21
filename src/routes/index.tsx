import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/alpha-prefac-logo.asset.json";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.currentTarget;
  if (target.src.endsWith(".png")) {
    target.src = target.src.replace(".png", ".jpg");
  } else if (target.src.endsWith(".jpg")) {
    target.src = target.src.replace(".jpg", ".jpeg");
  } else if (target.src.endsWith(".jpeg")) {
    target.src = target.src.replace(".jpeg", ".webp");
  }
};

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
  component: Index,
});

type Lang = "fr" | "ht";

const translations = {
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      contact: "Contact",
      login: "Connexion",
      join: "S'inscrire / Rejoindre",
    },
    hero: {
      badge: "Inscriptions ouvertes — Cohorte 2026",
      stayFocus: "Stay ",
      focus: "Focus.",
      tagline: "Atteins ton université de rêve.",
      objective: "Objectif : Université d'État & Université privée",
      description:
        "ALPHA PRÉFAC t'accompagne pas-à-pas pour combler tes lacunes académiques, renforcer ton niveau en mathématiques et sciences physiques, et maximiser tes chances de décrocher ton admission dans les plus grandes universités d'État et privées du pays.",
      cta: "Rejoignez la famille d'ALPHA Préfac",
      ctaGmail: "Se connecter avec un compte Gmail",
      ctaDiscover: "Découvrir les programmes",
    },
    features: {
      title: "L'excellence académique à ta portée",
      subtitle:
        "Notre méthodologie rigoureuse et nos entraîneurs de haut niveau t'assurent de maîtriser chaque concept clé requis pour les concours d'admission.",
      items: [
        {
          title: "Suivi Ultra-Personnalisé",
          text: "Des classes à taille humaine et des points hebdomadaires individuels pour identifier et éliminer tes blocages immédiatement.",
        },
        {
          title: "Enseignants & Coachs Réputés",
          text: "Apprends auprès de professionnels expérimentés et d'anciens lauréats des concours nationaux les plus compétitifs.",
        },
        {
          title: "Oraux & Concours Blancs",
          text: "Pratique en conditions réelles avec nos simulateurs physiques et oraux réguliers afin d'éliminer définitivement le stress.",
        },
      ],
    },
    programs: {
      title: "Nos Programmes Officiels",
      subtitle:
        "Choisis ta voie de spécialisation pour maximiser tes chances de réussite aux concours.",
      cta: "S'inscrire à ce programme",
      card1: {
        badge: "Sciences Clés",
        tag: "Niveau Avancé",
        title: "Mathématiques, Physique & Chimie",
        desc: "Ce programme intensif couvre l'intégralité du programme d'admission en universités d'état (FDS, ENST, etc.) : algèbre, géométrie euclidienne, fonctions complexes, mécanique classique et électricité.",
        feats: [
          "Algèbre dynamique & calcul analytique",
          "Mécanique, thermodynamique et applications",
          "Analyse de documents scientifiques",
          "Résolution active de sujets d'oraux antérieurs",
        ],
      },
      card2: {
        badge: "Général & Lettres",
        tag: "Trigonométrie & Logique",
        title: "Sciences Humaines, Logique & Culture",
        desc: "Forme-toi à l'argumentation rigoureuse, à l'analyse critique de textes, et prépare les épreuves de culture générale indispensables de certaines spécialisations d'affaires et de droit privé.",
        feats: [
          "Tests psycho-techniques & de logique",
          "Culture historique & géo-politique contemporaine",
          "Méthodologie de dissertation et rédaction fluide",
          "Simulations réelles d'entretien d'admission",
        ],
      },
    },
    stats: [
      { value: "145+", label: "Étudiants formés" },
      { value: "4", label: "Filières disponibles" },
      { value: "97.5%", label: "Taux de réussite" },
      { value: "1", label: "Année d'excellence" },
    ],
    cta: {
      title: "Prêt à intégrer l'université de ton choix ?",
      text: "Inscris-toi dès maintenant pour réserver ta place au sein de la prochaine cohorte et entamer ta route vers l'excellence.",
      primary: "Rejoindre la cohorte maintenant",
      secondary: "Parler à un conseiller",
    },
    footer: {
      tagline:
        "La prépa numéro un pour garantir votre transition vers les études supérieures de médecine, d'ingénierie et de sciences appliquées.",
      slogan: "Stay Focus. Atteins ton université de rêve.",
      navTitle: "Navigation",
      home: "Accueil",
      contact: "Contactez-nous",
      memberTitle: "Espace Membres",
      signin: "Se connecter",
      register: "Inscription Étudiant",
      dashboard: "Dashboard Admin",
      rights: "© 2026 Alpha PRÉFAC Platform. Tous droits réservés.",
      by: "Développé par",
    },
  },
  ht: {
    nav: {
      home: "Akèy",
      about: "À propos",
      contact: "Kontak",
      login: "Koneksyon",
      join: "Enskri / Rantre",
    },
    hero: {
      badge: "Enskripsyon louvri — Pwomosyon 2026",
      stayFocus: "Rete ",
      focus: "Konsantre.",
      tagline: "Rive nan inivèsite rèv ou a.",
      objective: "Objektif : Inivèsite Leta & Inivèsite Prive",
      description:
        "ALPHA PRÉFAC akonpaye w etap pa etap pou konble feblès akademik ou yo, ranfòse nivo w nan matematik ak syans fizik, epi maksimize chans ou pou w jwenn admisyon nan pi gwo inivèsite Leta ak prive nan peyi a.",
      cta: "Rantre nan fanmi ALPHA Préfac la",
      ctaGmail: "Konekte ak yon kont Gmail",
      ctaDiscover: "Dekouvri pwogram yo",
    },
    features: {
      title: "Eksèlans akademik nan men w",
      subtitle:
        "Metodoloji rigourèz nou an ak antrenè wo nivo nou yo asire w ke w metrize chak konsèp kle ou bezwen pou konkou admisyon yo.",
      items: [
        {
          title: "Swivi Ultra-Pèsonalize",
          text: "Klas piti ak randevou endividyèl chak semèn pou idantifye e elimine blokaj ou yo touswit.",
        },
        {
          title: "Pwofesè & Antrenè Repite",
          text: "Aprann avèk pwofesyonèl ki gen eksperyans ak ansyen loreya konkou nasyonal ki pi konpetitif yo.",
        },
        {
          title: "Oral & Konkou Blan",
          text: "Pratike nan kondisyon reyèl ak similatè fizik nou yo ak oral regilye pou elimine estrès la nèt.",
        },
      ],
    },
    programs: {
      title: "Pwogram Ofisyèl Nou Yo",
      subtitle: "Chwazi filyè w pou w ka ogmante chans ou pou w reyisi nan konkou yo.",
      cta: "Enskri nan pwogram sa a",
      card1: {
        badge: "Syans Kle",
        tag: "Nivo Avanse",
        title: "Matematik, Fizik & Chimi",
        desc: "Pwogram entansif sa a kouvri tout pwogram admisyon nan inivèsite Leta yo (FDS, ENST, elatriye) : aljèb, jeyometri eklididyn, fonksyon konplèks, mekanik klasik ak elektrisite.",
        feats: [
          "Aljèb dinamik & kalkil analitik",
          "Mekanik, tèmodinamik ak aplikasyon yo",
          "Analyz dokiman syantifik",
          "Rezolisyon aktif sijè egzamen oral anvan yo",
        ],
      },
      card2: {
        badge: "Jeneral & Lèt",
        tag: "Trijonometri & Lojik",
        title: "Syans Imèn, Lojik & Kilti",
        desc: "Fòme tèt ou nan agimantasyon rigourèz, analiz kritik tèks, epi prepare pou egzamen kilti jeneral ki endispansab pou kèk espesyalizasyon nan zafè ak dwa prive.",
        feats: [
          "Tès psiko-teknik & lojik",
          "Kilti istorik & jewopolitik kontanporen",
          "Metodoloji disètasyon & redaksyon fasil",
          "Similasyon reyèl pou entèvyou admisyon",
        ],
      },
    },
    stats: [
      { value: "145+", label: "Etidyan fòme" },
      { value: "4", label: "Filyè disponib" },
      { value: "97.5%", label: "To reyisit" },
      { value: "1", label: "Ane eksèlans" },
    ],
    cta: {
      title: "Pare pou rantre nan inivèsite chwa w la?",
      text: "Enskri kounye a pou rezève plas ou nan pwochen pwomosyon an epi kòmanse wout ou vè eksèlans.",
      primary: "Rantre nan pwomosyon an kounye a",
      secondary: "Pale ak yon konseye",
    },
    footer: {
      tagline:
        "Prepa nimewo en pou garanti tranzisyon w vè etid siperyè nan medsin, jeni ak syans aplike.",
      slogan: "Rete Konsantre. Rive nan inivèsite rèv ou a.",
      navTitle: "Navigasyon",
      home: "Akèy",
      contact: "Kontakte nou",
      memberTitle: "Espas Manm",
      signin: "Konekte",
      register: "Enskripsyon Etidyan",
      dashboard: "Dashboard Admin",
      rights: "© 2026 Alpha PRÉFAC Platform. Tout dwa rezève.",
      by: "Devlope pa",
    },
  },
} as const;

function NavLink({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <a
      href="#"
      className={`relative text-sm transition-colors ${
        active ? "text-[var(--accent-gold)]" : "text-foreground/85 hover:text-[var(--accent-gold)]"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[var(--accent-gold)]" />
      )}
    </a>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-[var(--card-border)] bg-card p-4 md:p-7 transition-all hover:-translate-y-1 hover:border-[var(--accent-gold)]/40 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]"
    >
      <div className="mb-3 md:mb-5 inline-flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-lg bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]">
        {icon}
      </div>
      <h3 className="mb-2 md:mb-3 text-sm md:text-lg font-semibold text-foreground truncate">
        {title}
      </h3>
      <p className="text-xs md:text-sm leading-relaxed text-muted-foreground line-clamp-2 md:line-clamp-none">
        {text}
      </p>
    </div>
  );
}

function Index() {
  const [lang, setLang] = useState<Lang>("fr");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<{ title: string; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLang = localStorage.getItem("alpha-lang") as Lang;
        if (savedLang && (savedLang === "fr" || savedLang === "ht")) {
          setLang(savedLang);
        }
        const savedTheme = localStorage.getItem("alpha-theme") as "light" | "dark";
        if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
          setTheme(savedTheme);
        }
      } catch (_) {
        console.warn("Storage reading bypassed", _);
      }
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<{
    role: string;
    nom: string;
  } | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("alpha_user");
      if (cached) {
        setCurrentUser(JSON.parse(cached));
      }
    } catch (_) {
      console.warn("Non-critical local cache parsing skipped", _);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("alpha-lang", lang);
  }, [lang]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("alpha-theme", theme);
      if (theme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
  }, [theme]);

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <img
              src={logo.url}
              alt="ALPHA Préfac"
              className="h-9 w-9 rounded-full bg-white object-contain"
              referrerPolicy="no-referrer"
              onError={handleLogoError}
            />
            <span className="text-base font-semibold tracking-wide">
              <span className="text-[var(--accent-gold)]">ALPHA</span>{" "}
              <span className="text-foreground/90">Préfac</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-4 sm:gap-6 md:gap-8">
            <NavLink active>{t.nav.home}</NavLink>
            <Link
              to="/a-propos"
              className="relative text-sm text-foreground/85 transition-colors hover:text-[var(--accent-gold)]"
            >
              {t.nav.about}
            </Link>
            <Link
              to="/contact"
              className="relative text-sm text-foreground/85 transition-colors hover:text-[var(--accent-gold)]"
            >
              {t.nav.contact}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 rounded-full border border-border bg-card px-1 py-1 text-xs md:flex">
              <button
                type="button"
                onClick={() => setLang("fr")}
                aria-pressed={lang === "fr"}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                  lang === "fr"
                    ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                FR
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={() => setLang("ht")}
                aria-pressed={lang === "ht"}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                  lang === "ht"
                    ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                KREYÒL
              </button>
            </div>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-[var(--accent-gold)] shadow-sm hover:bg-muted transition-all active:scale-95"
            >
              {theme === "light" ? "🌙" : "☀"}
            </button>
            {currentUser ? (
              <>
                <Link
                  to={
                    currentUser.role === "admin" ||
                    currentUser.role === "super_admin" ||
                    currentUser.role === "moderateur"
                      ? "/dashboard"
                      : "/espace-etudiant"
                  }
                  className="hidden text-sm text-foreground/85 hover:text-[var(--accent-gold)] md:inline"
                >
                  Bonjour, {currentUser.nom.split(" ")[0]}
                </Link>
                <Link
                  to={
                    currentUser.role === "admin" ||
                    currentUser.role === "super_admin" ||
                    currentUser.role === "moderateur"
                      ? "/dashboard"
                      : "/espace-etudiant"
                  }
                  className="hidden md:inline-flex rounded-md bg-[var(--accent-gold)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-[0_8px_24px_-8px_rgba(234,200,80,0.55)] transition-transform hover:-translate-y-0.5 font-mono text-[11px] uppercase tracking-wider"
                >
                  {currentUser.role === "admin" ||
                  currentUser.role === "super_admin" ||
                  currentUser.role === "moderateur"
                    ? "Dashboard"
                    : "Espace-Étudiant"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/inscription"
                  search={{ mode: "login" }}
                  className="hidden text-sm text-foreground/85 hover:text-[var(--accent-gold)] md:inline"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/inscription"
                  className="hidden md:inline-flex rounded-md bg-[var(--accent-gold)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-[0_8px_24px_-8px_rgba(234,200,80,0.55)] transition-transform hover:-translate-y-0.5"
                >
                  {t.nav.join}
                </Link>
              </>
            )}

            {/* Hamburger button for mobile/tablet */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground md:hidden hover:bg-muted focus:outline-none transition-all cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="border-t border-border/40 bg-background/95 backdrop-blur-md md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col gap-4 p-6">
              <nav className="flex flex-col gap-3 font-medium">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold"
                >
                  {t.nav.home}
                </Link>
                <Link
                  to="/a-propos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors text-foreground/85 hover:bg-muted hover:text-[var(--accent-gold)]"
                >
                  {t.nav.about}
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors text-foreground/85 hover:bg-muted hover:text-[var(--accent-gold)]"
                >
                  {t.nav.contact}
                </Link>
              </nav>

              <hr className="border-border/30" />

              <div className="flex flex-col gap-4">
                {/* Language Switcher */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {lang === "fr" ? "Langue" : "Lang"}
                  </span>
                  <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1 text-xs">
                    <button
                      id="mobile-lang-fr"
                      type="button"
                      onClick={() => setLang("fr")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors cursor-pointer ${
                        lang === "fr"
                          ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      FR
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      id="mobile-lang-ht"
                      type="button"
                      onClick={() => setLang("ht")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors cursor-pointer ${
                        lang === "ht"
                          ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      KREYÒL
                    </button>
                  </div>
                </div>

                <hr className="border-border/30" />

                <div className="flex flex-col gap-2">
                  {currentUser ? (
                    <>
                      <div className="px-3 py-1 text-sm text-foreground/80 font-medium">
                        {lang === "fr" ? "Bonjour," : "Bonjou,"} {currentUser.nom.split(" ")[0]}
                      </div>
                      <Link
                        to={
                          currentUser.role === "admin" ||
                          currentUser.role === "super_admin" ||
                          currentUser.role === "moderateur"
                            ? "/dashboard"
                            : "/espace-etudiant"
                        }
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-center rounded-lg bg-[var(--accent-gold)] py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-md hover:-translate-y-0.5 transition-transform"
                      >
                        {currentUser.role === "admin" ||
                        currentUser.role === "super_admin" ||
                        currentUser.role === "moderateur"
                          ? "Dashboard"
                          : "Espace-Étudiant"}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/inscription"
                        search={{ mode: "login" }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-center rounded-lg border border-border bg-card py-2.5 text-sm text-foreground/90 hover:bg-muted"
                      >
                        {t.nav.login}
                      </Link>
                      <Link
                        to="/inscription"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-center rounded-lg bg-[var(--accent-gold)] py-2.5 text-sm font-semibold text-[var(--primary-foreground)]"
                      >
                        {t.nav.join}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, oklch(0.28 0.08 265) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-28 text-center">
          <div className="mx-auto mb-10 flex h-32 w-32 items-center justify-center rounded-2xl bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
            <img
              src={logo.url}
              alt="ALPHA Préfac logo"
              className="h-28 w-28 object-contain rounded-xl"
              referrerPolicy="no-referrer"
              onError={handleLogoError}
            />
          </div>

          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/8 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent-gold)] animate-blink">
            <span>⚡</span>
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="font-display text-7xl font-extrabold leading-[0.95] tracking-tight md:text-8xl">
            <span className="text-foreground">{t.hero.stayFocus}</span>
            <span className="gradient-focus">{t.hero.focus}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/85">{t.hero.tagline}</p>

          <div className="mx-auto mt-8 flex max-w-md flex-col items-center">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-gold)]">
              {t.hero.objective}
            </p>
            <span className="mt-3 h-0.5 w-40 bg-[var(--accent-gold)]/70" />
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {t.hero.description}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={
                currentUser
                  ? currentUser.role === "admin" ||
                    currentUser.role === "super_admin" ||
                    currentUser.role === "moderateur"
                    ? "/dashboard"
                    : "/espace-etudiant"
                  : "/inscription"
              }
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-[var(--accent-gold)] px-8 py-4 text-sm font-bold text-[var(--primary-foreground)] shadow-[0_25px_50px_-12px_rgba(234,200,80,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-8px_rgba(234,200,80,0.6)]"
            >
              <span>{currentUser ? "Accéder à mon Espace" : t.hero.ctaGmail}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#programmes"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("programmes")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-xl border-2 border-[var(--accent-gold)] px-8 py-4 text-sm font-bold text-[var(--accent-gold)] bg-transparent transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-gold)]/10"
            >
              {t.hero.ctaDiscover}
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="avantages" className="relative px-6 pb-28 scroll-mt-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">{t.features.title}</h2>
          <span className="mx-auto mt-4 block h-0.5 w-16 bg-[var(--accent-gold)]" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t.features.subtitle}
          </p>

          <div className="mt-14 grid grid-cols-3 gap-2 md:gap-6 text-left">
            <FeatureCard
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              }
              title={t.features.items[0].title}
              text={t.features.items[0].text}
              onClick={() => setSelectedFeature(t.features.items[0])}
            />
            <FeatureCard
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="9" r="5" />
                  <path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" />
                </svg>
              }
              title={t.features.items[1].title}
              text={t.features.items[1].text}
              onClick={() => setSelectedFeature(t.features.items[1])}
            />
            <FeatureCard
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M16 8l-2.5 5.5L8 16l2.5-5.5z" fill="currentColor" />
                </svg>
              }
              title={t.features.items[2].title}
              text={t.features.items[2].text}
              onClick={() => setSelectedFeature(t.features.items[2])}
            />
          </div>
        </div>
      </section>

      {/* Feature Modal */}
      {selectedFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedFeature(null)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-foreground mb-4">{selectedFeature.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{selectedFeature.text}</p>
            <button
              onClick={() => setSelectedFeature(null)}
              className="mt-6 w-full rounded-lg bg-[var(--accent-gold)] py-2 text-sm font-semibold text-[var(--primary-foreground)]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* EXCELLENT ACADEMIC PROGRAMS */}
      <section id="programmes" className="relative px-6 pb-28 scroll-mt-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            {t.programs.title}
          </h2>
          <span className="mx-auto mt-4 block h-0.5 w-16 bg-[var(--accent-gold)]" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t.programs.subtitle}
          </p>

          <div className="mt-14 grid gap-8 text-left md:grid-cols-2">
            {/* CARD 1 */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-[var(--card-border)] bg-card/45 p-8 md:p-10 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-gold)]/40 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-gold)]">
                    {t.programs.card1.badge}
                  </span>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                    {t.programs.card1.tag}
                  </span>
                </div>

                <h3 className="font-display text-2xl font-bold text-foreground mt-8 leading-snug">
                  {t.programs.card1.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground/90">
                  {t.programs.card1.desc}
                </p>

                <ul className="mt-8 space-y-4">
                  {t.programs.card1.feats.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] mt-0.5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className="text-[14px] text-foreground/85 font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/inscription"
                className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/5 py-4 text-center font-bold text-sm tracking-wide text-foreground transition-all duration-300 hover:bg-[var(--accent-gold)] hover:text-[var(--primary-foreground)] hover:border-transparent"
              >
                <span>{t.programs.cta}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>

            {/* CARD 2 */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-[var(--card-border)] bg-card/45 p-8 md:p-10 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-gold)]/40 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-gold)]">
                    {t.programs.card2.badge}
                  </span>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                    {t.programs.card2.tag}
                  </span>
                </div>

                <h3 className="font-display text-2xl font-bold text-foreground mt-8 leading-snug">
                  {t.programs.card2.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground/90">
                  {t.programs.card2.desc}
                </p>

                <ul className="mt-8 space-y-4">
                  {t.programs.card2.feats.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] mt-0.5">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className="text-[14px] text-foreground/85 font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/inscription"
                className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/5 py-4 text-center font-bold text-sm tracking-wide text-foreground transition-all duration-300 hover:bg-[var(--accent-gold)] hover:text-[var(--primary-foreground)] hover:border-transparent"
              >
                <span>{t.programs.cta}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 pb-28">
        <div className="mx-auto grid max-w-5xl gap-2 md:gap-6 grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10L12 5 2 10l10 5 10-5z" />
                <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
              </svg>
            }
            value={t.stats[0].value}
            label={t.stats[0].label}
          />
          <StatCard
            icon={
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 5s3-1 7 0v14c-4-1-7 0-7 0V5zM22 5s-3-1-7 0v14c4-1 7 0 7 0V5z" />
              </svg>
            }
            value={t.stats[1].value}
            label={t.stats[1].label}
          />
          <StatCard
            icon={
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
                <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
              </svg>
            }
            value={t.stats[2].value}
            label={t.stats[2].label}
          />
          <StatCard
            icon={
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5l-5-5 7-1L12 2z" />
              </svg>
            }
            value={t.stats[3].value}
            label={t.stats[3].label}
          />
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[var(--card-border)] bg-card/60 px-6 py-16 text-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]">
          <h2 className="font-display text-3xl tracking-tight md:text-5xl">{t.cta.title}</h2>
          <span className="mx-auto mt-5 block h-0.5 w-24 bg-[var(--accent-gold)]" />
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {t.cta.text}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/inscription"
              className="rounded-lg bg-[var(--accent-gold)] px-7 py-3.5 text-sm font-bold text-[var(--primary-foreground)] shadow-[0_15px_40px_-15px_rgba(234,200,80,0.7)] transition-transform hover:-translate-y-0.5"
            >
              {t.cta.primary}
            </Link>
            <Link
              to="/contact"
              className="rounded-lg border-2 border-[var(--accent-gold)] px-7 py-3 text-sm font-semibold text-[var(--accent-gold)] transition-colors hover:bg-[var(--accent-gold)]/10"
            >
              {t.cta.secondary}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 bg-background/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src={logo.url}
                alt="ALPHA Préfac"
                className="h-9 w-9 rounded-full bg-white object-contain"
                referrerPolicy="no-referrer"
                onError={handleLogoError}
              />
              <span className="text-base font-semibold tracking-wide">
                <span className="text-[var(--accent-gold)]">Alpha</span>{" "}
                <span className="text-foreground/90">Prefac</span>
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{t.footer.tagline}</p>
            <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent-gold)]">
              {t.footer.slogan}
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-gold)]">
              {t.footer.navTitle}
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link to="/" className="text-foreground/85 hover:text-[var(--accent-gold)]">
                  {t.footer.home}
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-foreground/85 hover:text-[var(--accent-gold)]">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-foreground/85 hover:text-[var(--accent-gold)]">
                  {t.footer.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-gold)]">
              {t.footer.memberTitle}
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  to="/inscription"
                  search={{ mode: "login" }}
                  className="text-foreground/85 hover:text-[var(--accent-gold)]"
                >
                  {t.footer.signin}
                </Link>
              </li>
              <li>
                <Link
                  to="/inscription"
                  className="text-foreground/85 hover:text-[var(--accent-gold)]"
                >
                  {t.footer.register}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="text-foreground/85 hover:text-[var(--accent-gold)]"
                >
                  {t.footer.dashboard}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground md:flex-row">
            <p>{t.footer.rights}</p>
            <p>
              {t.footer.by}{" "}
              <a
                href="https://www.haitiandev.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--accent-gold)] hover:underline"
              >
                Haitian Dev
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function parseStat(value: string): {
  target: number;
  prefix: string;
  suffix: string;
  decimals: number;
} {
  const match = value.match(/^(\D*)([\d.]+)(.*)$/);
  if (!match) return { target: 0, prefix: "", suffix: value, decimals: 0 };
  const [, prefix, num, suffix] = match;
  const decimals = num.includes(".") ? num.split(".")[1].length : 0;
  return { target: parseFloat(num), prefix, suffix, decimals };
}

function useCountUp(target: number, decimals: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(target * eased);
            if (p < 1) requestAnimationFrame(tick);
            else setVal(target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { ref, display: val.toFixed(decimals) };
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const { target, prefix, suffix, decimals } = parseStat(value);
  const { ref, display } = useCountUp(target, decimals);
  return (
    <div
      ref={ref}
      className="rounded-2xl border border-[var(--card-border)] bg-card p-4 md:p-8 transition-all hover:-translate-y-1 hover:border-[var(--accent-gold)]/40 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]"
    >
      <div className="mb-3 md:mb-6 text-[var(--accent-gold)]">{icon}</div>
      <div className="font-display text-4xl md:text-7xl tracking-tight tabular-nums animate-gold-value">
        {prefix}
        {display}
        {suffix}
      </div>
      <div className="mt-2 md:mt-4 font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.22em] text-muted-foreground animate-gold-label">
        {label}
      </div>
    </div>
  );
}
