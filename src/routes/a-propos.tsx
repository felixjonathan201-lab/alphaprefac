import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/alpha-prefac-logo.asset.json";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

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
  component: AboutPage,
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
    about: {
      badge: "Qui sommes-nous ?",
      title: "À Propos de ",
      titleHighlight: "ALPHA Préfac",
      subtitle:
        "En collaboration avec Haiti Santé Moderne (HSM), nous innovons pour ouvrir grand les portes de l'enseignement supérieur à la jeunesse d'excellence.",
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
    about: {
      badge: "Kiyès nou ye ?",
      title: "Konsènan ",
      titleHighlight: "ALPHA Préfac",
      subtitle:
        "An kolaborasyon ak Haiti Santé Moderne (HSM), n ap inove pou nou louvri byen lafraj pòt edikasyon siperyè bay jèn ki briyan yo.",
    },
    footer: {
      tagline:
        "Prepa nimewo en pou gwaranti tranzisyon w vè etid siperyè nan medsin, jeni ak syans aplike.",
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

const DEFAULT_ABOUT_FR = `ALPHA Préfac : Une initiative qui transforme des rêves en réussite

Depuis sa première édition, ALPHA Préfac s'est donné pour mission d'accompagner les jeunes dans leur préparation aux concours d'admission des principales facultés et universités du pays. Grâce à un encadrement sérieux, des supports pédagogiques adaptés et l'engagement d'une équipe dévouée, de nombreux candidats ont pu renforcer leurs connaissances et améliorer leurs chances de réussite.

Pour cette nouvelle édition, ALPHA Préfac poursuit sa vision de démocratiser l'accès à une préparation de qualité en collaboration avec Haïti Santé Moderne (HSM), une organisation engagée dans l'épanouissement de la jeunesse haïtienne à travers l'éducation, la santé et le développement communautaire.

Lieu des activités

Les cours se dérouleront à l'Institution Saint-Vincent de Paul, située à Tabarre 48, Carradeux, en face du dortoir de l'Université, dans un environnement favorable à l'apprentissage et à la réussite académique.

Frais d'inscription

Les frais d'inscription sont fixés à 1 000 gourdes. Ce montant permet de confirmer la participation du candidat et de faciliter l'organisation administrative du programme.

Frais de documents : 4 000 gourdes

Les 4 000 gourdes demandées pour les documents couvrent la préparation, l'impression et la mise à disposition de l'ensemble des supports pédagogiques nécessaires au préfac. Ces documents comprennent notamment les modules de cours, exercices pratiques, évaluations, corrigés et autres matériels académiques destinés à assurer une préparation complète et efficace aux concours.

Participation gratuite

Fidèle à sa mission de rendre l'éducation accessible au plus grand nombre, la participation aux cours est entièrement gratuite. Aucun frais n'est exigé pour assister aux séances de formation. Les participants n'ont qu'à s'acquitter des frais d'inscription et des documents afin de bénéficier de l'ensemble du programme.

ALPHA Préfac demeure une opportunité exceptionnelle pour tous les jeunes désireux de se préparer sérieusement aux concours universitaires et de bâtir un avenir prometteur.`;

const DEFAULT_ABOUT_HT = `ALPHA Préfac : Yon inisyativ k ap transfòme rèv yo an reyisit

Depi premye edisyon l, ALPHA Préfac bay tèt li misyon pou l akonpanye jèn yo nan preparasyon yo pou konkou admisyon nan prensipal fakilte ak inivèsite nan peyi a. Gras ak yon bon jan sipò, materyèl pedagojik ki adapte ak angajman yon ekip devwe, anpil kandida te kapab ranfòse konesans yo epi ogmante chans yo pou yo reyisi.

Pou nouvo edisyon sa a, ALPHA Préfac ap kontinye vizyon li pou rann yon preparasyon bon jan kalite aksesib pou tout moun an kolaborasyon ak Haïti Santé Moderne (HSM), yon òganizasyon ki angaje nan devlopman jèn ayisyen yo atravè edikasyon, sante ak devlopman kominotè.

Kote aktivite yo ap fèt

Kou yo ap fèt nan Enstitisyon Saint-Vincent de Paul, ki sitye nan Tabarre 48, Carradeux, anfas dòtwa Inivèsite a, nan yon anviwònman ki favorab pou aprann ak reyalize siksè akademik.

Frè enskripsyon

Frè enskripsyon yo fikse a 1,000 goud. Montan sa a pèmèt konfime patisipasyon kandida a epi fasilite òganizasyon administratif pwogram nan.

Frè pou dokiman : 4,000 goud

4,000 goud yo mande pou dokiman yo kouvri preparasyon, enpresyon ak distribisyon tout materyèl pedagojik ki nesesè pou prefas la. Dokiman sa yo gen ladan yo modil kou, egzèsis pratik, evalyasyon, korije ak lòt materyèl akademik ki fèt pou asire yon preparasyon konplè epi efikas pou konkou yo.

Patisipasyon gratis

Fidèl ak misyon li pou rann edikasyon an aksesib pou pi gwo kantite moun, patisipasyon nan kou yo konplètman gratis. Yo pa mande okenn frè pou asiste klas fòmasyon yo. Patisipan yo sèlman bezwen peye frè enskripsyon yo ak dokiman yo pou yo ka benefisye tout pwogram nan.

ALPHA Préfac rete yon bèl opòtinite pou tout jèn ki vle prepare yo seryezman pou konkou inivèsite yo epi bati yon bèl avni.`;

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

function AboutPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    role: string;
    nom: string;
  } | null>(null);

  const [aboutConfig, setAboutConfig] = useState<{
    content_fr: string;
    content_ht: string;
  }>({
    content_fr: DEFAULT_ABOUT_FR,
    content_ht: DEFAULT_ABOUT_HT,
  });

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
        const cached = localStorage.getItem("alpha_user");
        if (cached) {
          setCurrentUser(JSON.parse(cached));
        }
      } catch (_) {
        console.warn("Storage reading bypassed");
      }
    }
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      doc(db, "settings", "about_us"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setAboutConfig({
            content_fr: data.content_fr || DEFAULT_ABOUT_FR,
            content_ht: data.content_ht || DEFAULT_ABOUT_HT,
          });
        }
      },
      (error) => {
        console.warn("Could not load about settings from Firestore, using defaults.", error);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("alpha-lang", lang);
    }
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur shrink-0">
        <div
          id="about-header-container"
          className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"
        >
          <Link to="/" className="flex items-center gap-2.5">
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
          </Link>

          <nav className="hidden md:flex items-center gap-4 sm:gap-6 md:gap-8">
            <Link
              to="/"
              className="relative text-sm text-foreground/85 transition-colors hover:text-[var(--accent-gold)]"
            >
              {t.nav.home}
            </Link>
            <Link
              to="/a-propos"
              className="relative text-sm text-[var(--accent-gold)] font-medium transition-colors"
            >
              {t.nav.about}
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[var(--accent-gold)]" />
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
                id="lang-btn-fr"
                type="button"
                onClick={() => setLang("fr")}
                aria-pressed={lang === "fr"}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors cursor-pointer ${
                  lang === "fr"
                    ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                FR
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                id="lang-btn-ht"
                type="button"
                onClick={() => setLang("ht")}
                aria-pressed={lang === "ht"}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors cursor-pointer ${
                  lang === "ht"
                    ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                KREYÒL
              </button>
            </div>
            <button
              id="theme-toggle-btn"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-[var(--accent-gold)] shadow-sm hover:bg-muted transition-all active:scale-95 cursor-pointer"
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
                  className="block rounded-lg px-3 py-2 text-sm transition-colors text-foreground/85 hover:bg-muted hover:text-[var(--accent-gold)]"
                >
                  {t.nav.home}
                </Link>
                <Link
                  to="/a-propos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold"
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

      {/* CONTENT BODY */}
      <main className="flex-1 flex flex-col justify-start relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, oklch(0.28 0.08 265) 0%, transparent 60%)",
          }}
        />

        <article className="relative mx-auto max-w-4xl px-6 pt-16 pb-24 w-full">
          {/* Header Area */}
          <div className="text-center mb-16">
            <div
              id="about-badge"
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/8 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent-gold)] shadow-[0_0_15px_rgba(234,200,80,0.1)]"
            >
              <span>🏛️</span>
              <span>{t.about.badge}</span>
            </div>
            <h1
              id="about-main-title"
              className="mt-6 font-display text-5xl tracking-tight md:text-6xl font-extrabold text-foreground"
            >
              {t.about.title}
              <span className="text-[var(--accent-gold)] leading-tight">
                {t.about.titleHighlight}
              </span>
            </h1>
            <p
              id="about-subtitle"
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground"
            >
              {t.about.subtitle}
            </p>
            <span className="mx-auto mt-8 block h-0.5 w-24 bg-[var(--accent-gold)]" />
          </div>

          {/* Main content body rendered elegantly */}
          <div
            id="about-content"
            className="rounded-2xl border border-[var(--card-border)] bg-card/45 p-8 md:p-12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm"
          >
            {(() => {
              const text = lang === "fr" ? aboutConfig.content_fr : aboutConfig.content_ht;
              return text.split("\n\n").map((para, idx) => {
                const trimmed = para.trim();
                if (!trimmed) return null;

                const lines = trimmed.split("\n");
                // Check if it's a short title-like heading block
                if (
                  lines.length === 1 &&
                  (trimmed.length < 50 || trimmed.includes(":") || trimmed.match(/^[A-ZÉÀ]/))
                ) {
                  return (
                    <h3
                      key={idx}
                      className="mt-8 mb-4 text-xl font-bold text-[var(--accent-gold)] tracking-wide font-display border-l-2 border-[var(--accent-gold)] pl-4"
                    >
                      {trimmed}
                    </h3>
                  );
                }

                return (
                  <p
                    key={idx}
                    className="mb-5 text-base leading-relaxed text-foreground/85 font-sans"
                  >
                    {lines.map((line, lIdx) => (
                      <span key={lIdx}>
                        {line}
                        {lIdx < lines.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                );
              });
            })()}
          </div>
        </article>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/40 bg-background/60 shrink-0">
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
