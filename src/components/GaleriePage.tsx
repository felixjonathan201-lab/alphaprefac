import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/alpha-prefac-logo.asset.json";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  Search,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  X,
  Menu,
  ArrowRight,
} from "lucide-react";
import { GalleryPhoto, handleFirestoreError, OperationType } from "@/lib/firebase";

type Lang = "fr" | "ht";

const translations = {
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      contact: "Contact",
      gallery: "Galerie",
      login: "Connexion",
      join: "S'inscrire / Rejoindre",
    },
    gallery: {
      badge: "Notre Galerie",
      title: "ALPHA en ",
      titleHighlight: "Images",
      subtitle:
        "Revivez les séances de formation intensive, les moments d'entraide et les célébrations de réussite d'ALPHA Préfac.",
      searchPlaceholder: "Rechercher une photo...",
      noPhotos: "Aucune photo publiée pour le moment.",
      loading: "Chargement de la galerie...",
      backHome: "Retour à l'accueil",
      by: "Publié par",
      dateAdded: "Ajouté le",
      close: "Fermer",
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
    },
  },
  ht: {
    nav: {
      home: "Akèy",
      about: "Konsènan nou",
      contact: "Kontakte nou",
      gallery: "Galri",
      login: "Koneksyon",
      join: "Enskri / Antre",
    },
    gallery: {
      badge: "Galri Nou an",
      title: "ALPHA an ",
      titleHighlight: "Imaj",
      subtitle:
        "Reviv sesyon fòmasyon entansif, moman antrayd, ek siksè elèv ALPHA Préfac yo nan bèl foto.",
      searchPlaceholder: "Chèche yon foto...",
      noPhotos: "Pa gen okenn foto ki pibliye pou kounye a.",
      loading: "Chaje galri a...",
      backHome: "Tounen nan akèy",
      by: "Pibliye pa",
      dateAdded: "Ajoute nan dat",
      close: "Fèmen",
    },
    footer: {
      tagline:
        "Prepa nimewo en pou garanti tranzisyon w nan gwo inivèsite medsin, jeni ak syans aplike.",
      slogan: "Stay Focus. Rive nan inivèsite rèv ou.",
      navTitle: "Navigasyon",
      home: "Akèy",
      contact: "Kontakte nou",
      memberTitle: "Espas Manm yo",
      signin: "Konekte",
      register: "Enskripsyon Elèv",
      dashboard: "Dachbòd Admin",
      rights: "© 2026 Alpha PRÉFAC Platform. Tout dwa rezève.",
    },
  },
};

export default function GaleriePage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    role: string;
    nom: string;
  } | null>(null);

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

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

  // Real-time Firestore subscription to "gallery" collection
  useEffect(() => {
    if (!db) return;
    const galleryQuery = query(collection(db, "gallery"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      galleryQuery,
      (snapshot) => {
        const list: GalleryPhoto[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as GalleryPhoto);
        });
        setPhotos(list);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore loading error for gallery :", error);
        handleFirestoreError(error, OperationType.GET, "gallery");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const t = translations[lang];

  // Helper date configuration
  const formatDate = (val: unknown) => {
    if (!val) return "date inconnue";
    const dateObj =
      typeof val === "object" &&
      val !== null &&
      "toDate" in val &&
      typeof (val as { toDate: () => Date }).toDate === "function"
        ? (val as { toDate: () => Date }).toDate()
        : new Date(val as string | number | Date);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    return dateObj.toLocaleDateString(lang === "fr" ? "fr-FR" : "ht-HT", options);
  };

  // Filtered Photos List
  const filteredPhotos = photos.filter((p) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link id="galerie-logo-link" to="/" className="flex items-center gap-2.5">
            <img
              src={logo.url}
              alt="ALPHA Préfac"
              className="h-9 w-9 rounded-full bg-white object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-base font-semibold tracking-wide">
              <span className="text-[var(--accent-gold)]">ALPHA</span>{" "}
              <span className="text-foreground/90">Préfac</span>
            </span>
          </Link>

          {/* Desktop Navigation Link Menu */}
          <nav className="hidden md:flex items-center gap-4 sm:gap-6 md:gap-8">
            <Link
              to="/"
              className="relative text-sm text-foreground/85 transition-colors hover:text-[var(--accent-gold)]"
            >
              {t.nav.home}
            </Link>
            <Link
              to="/a-propos"
              className="relative text-sm text-foreground/85 transition-colors hover:text-[var(--accent-gold)]"
            >
              {t.nav.about}
            </Link>
            <Link
              to="/galerie"
              className="relative text-sm text-[var(--accent-gold)] font-medium transition-colors"
            >
              {t.nav.gallery}
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
            {/* Language Selection Buttons */}
            <div className="hidden items-center gap-1 rounded-full border border-border bg-card px-1 py-1 text-xs md:flex">
              <button
                id="galerie-lang-fr"
                type="button"
                onClick={() => setLang("fr")}
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
                id="galerie-lang-ht"
                type="button"
                onClick={() => setLang("ht")}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors cursor-pointer ${
                  lang === "ht"
                    ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                KREYÒL
              </button>
            </div>

            {/* Dark & Light Theme selection toggler */}
            <button
              id="galerie-theme-btn"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
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
                  className="hidden text-sm text-foreground/85 hover:text-[var(--accent-gold)] md:inline font-medium"
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

            {/* Mobile Nav Button */}
            <button
              id="galerie-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground md:hidden hover:bg-muted cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu view */}
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
                  className="block rounded-lg px-3 py-2 text-sm transition-colors text-foreground/85 hover:bg-muted hover:text-[var(--accent-gold)]"
                >
                  {t.nav.about}
                </Link>
                <Link
                  to="/galerie"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold"
                >
                  {t.nav.gallery}
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Language
                  </span>
                  <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1 text-xs">
                    <button
                      id="galerie-mobile-lang-fr"
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
                      id="galerie-mobile-lang-ht"
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
                        Bonjour, {currentUser.nom.split(" ")[0]}
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
                        className="w-full text-center rounded-lg bg-[var(--accent-gold)] py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-md transition-transform"
                      >
                        Dashboard
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

      {/* CORE HERO SECTION */}
      <main className="flex-1 flex flex-col justify-start relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, oklch(0.28 0.08 265) 0%, transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 w-full">
          {/* Header Banner Content */}
          <div className="text-center max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-gold)]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] border border-[var(--accent-gold)]/20 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse" />
              {t.gallery.badge}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {t.gallery.title}
              <span className="text-[var(--accent-gold)]">{t.gallery.titleHighlight}</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              {t.gallery.subtitle}
            </p>

            {/* Live Search bar */}
            <div className="mt-8 relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t.gallery.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border/80 bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/60 focus:border-transparent tracking-wide transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* REALTIME GRID WITH LOADING STATE */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="bg-card rounded-2xl border border-border/40 overflow-hidden h-72"
                >
                  <div className="w-full h-48 bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border/40 max-w-xl mx-auto p-8 animate-in fade-in duration-300">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-semibold">{t.gallery.noPhotos}</p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-border/50 hover:bg-border/80 text-sm font-semibold text-foreground px-4 py-2 transition-transform"
              >
                {t.gallery.backHome}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPhotos.map((photo, index) => (
                <article
                  key={photo.id || index}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--accent-gold)]/40 hover:shadow-black/20"
                >
                  {/* Aspect Ratio container with responsive fluid resizing */}
                  <div className="aspect-video w-full overflow-hidden bg-black/20 relative">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Shadow gradient overlay overlay only visible on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Card bottom panel information */}
                  <div className="p-5 border-t border-[var(--borderColor,rgba(255,255,255,0.05))] flex flex-col justify-between h-32">
                    <div>
                      <h3 className="font-semibold text-base text-foreground tracking-tight group-hover:text-[var(--accent-gold)] transition-colors line-clamp-1">
                        {photo.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {photo.description ||
                          "Aucune description supplémentaire fournie pour cette photo."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-3 border-t border-border/30">
                      <span className="flex items-center gap-1 font-medium">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDate(photo.createdAt)}
                      </span>
                      <span className="line-clamp-1 max-w-[120px]">
                        {photo.uploadedBy || "ALPHA Admin"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/40 bg-zinc-950 text-zinc-400 py-12 shrink-0">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-base font-semibold tracking-wide text-white">
              <span className="text-[var(--accent-gold)]">ALPHA</span> Préfac
            </span>
            <p className="mt-4 text-xs leading-relaxed text-zinc-400">{t.footer.tagline}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[var(--accent-gold)]">
              {t.footer.slogan}
            </p>
          </div>

          <div>
            <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
              {t.footer.navTitle}
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {t.footer.home}
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="hover:text-white transition-colors">
                  {t.nav.about || "À propos"}
                </Link>
              </li>
              <li>
                <Link to="/galerie" className="hover:text-white transition-colors">
                  {t.nav.gallery || "Galerie"}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  {t.footer.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
              {t.footer.memberTitle}
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link
                  to="/inscription"
                  search={{ mode: "login" }}
                  className="hover:text-white transition-colors"
                >
                  {t.footer.signin}
                </Link>
              </li>
              <li>
                <Link to="/inscription" className="hover:text-white transition-colors">
                  {t.footer.register}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 border-t border-zinc-900 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono">
          <span>{t.footer.rights}</span>
          <span className="mt-3 sm:mt-0">ALPHA Préfac Platform x Haiti Santé Moderne</span>
        </div>
      </footer>

      {/* LIGHTBOX FULLSCREEN OVERLAY ON CLICK */}
      {selectedPhoto && (
        <div
          id="lightbox-container"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close lightbox action */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            title={t.gallery.close}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Dialog detail panel */}
          <div
            className="relative max-w-5xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image side */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-[35vh] md:min-h-0 relative">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-[50vh] md:max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Description Meta information side */}
            <div className="w-full md:w-80 bg-zinc-950 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 shrink-0 select-none overflow-y-auto">
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full bg-[var(--accent-gold)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-gold)] border border-[var(--accent-gold)]/20">
                  ALPHA FOCUS
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {selectedPhoto.title}
                </h2>
                <hr className="border-zinc-800" />
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {selectedPhoto.description ||
                    "Aucune description supplémentaire fournie pour cette photo de la galerie."}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800 space-y-2 font-mono text-[10px] text-zinc-500">
                <div className="flex items-center justify-between">
                  <span>{t.gallery.dateAdded}</span>
                  <span className="text-zinc-300 font-medium">
                    {formatDate(selectedPhoto.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t.gallery.by}</span>
                  <span className="text-zinc-300 font-medium">
                    {selectedPhoto.uploadedBy || "ALPHA Admin"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
