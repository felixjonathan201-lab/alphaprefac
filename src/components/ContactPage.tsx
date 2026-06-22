import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/alpha-prefac-logo.asset.json";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

type Lang = "fr" | "ht";

const translations = {
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      contact: "Contact",
      gallery: "Galerie",
      login: "Connexion",
      join: "S'inscrire",
    },
    backHome: "← Retour à l'accueil",
    badge: "Contactez-nous",
    titleStart: "Parlons ",
    titleEnd: "ensemble.",
    subtitle:
      "Une question, une inscription, un partenariat ? L'équipe d'ALPHA Préfac est à ta disposition.",
    labelPhone: "Téléphone",
    labelEmail: "Email",
    labelReceipt: "Preuve de paiement",
    receiptHint: "Envoyez votre confirmation à ce numéro.",
    labelLocal: "Local",
    localHint: "En face du dortoir UNIFA à Tabarre 48.",
    labelSchedule: "Horaires d'ouverture",
    scheduleValue: "Lundi — Samedi · 8h00 à 18h00",

    // Form translations
    formTitle: "Envoyer un message",
    formSubtitle: "Remplissez ce formulaire et nous vous répondrons dans les plus brefs délais.",
    labelName: "Nom complet",
    placeholderName: "Ex: Jean-Paul Laurent",
    labelEmailField: "Adresse email (Optionnelle)",
    placeholderEmail: "Ex: jeanpaul@gmail.com",
    labelPhoneField: "Téléphone / WhatsApp",
    placeholderPhone: "Ex: +509 4463 2467",
    labelSubjectField: "Sujet",
    placeholderSubject: "Sélectionnez un sujet...",
    labelMessageField: "Votre message",
    placeholderMessage: "Écrivez les détails de votre message ici...",
    btnSubmit: "Envoyer le message",
    btnSending: "Envoi en cours...",
    successTitle: "Message envoyé !",
    successDesc:
      "Merci pour votre message ! L'équipe d'ALPHA Préfac a bien reçu vos informations et reviendra vers vous très bientôt.",
    errorTitle: "Erreur d'envoi",
    errorRequired: "Le nom complet et le message sont obligatoires.",

    // Footer
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
      gallery: "Galri",
      login: "Koneksyon",
      join: "Enskri",
    },
    backHome: "← Tounen nann paj akèy",
    badge: "Kontakte nou",
    titleStart: "Ann pale ",
    titleEnd: "ansanm.",
    subtitle: "Yon kesyon, yon enskripsyon, yon patenarya ? Ekip ALPHA Préfac la la pou sèvi ou.",
    labelPhone: "Telefòn",
    labelEmail: "Imèl",
    labelReceipt: "Prèv peman",
    receiptHint: "Voye konfimasyon w lan nan nimewo sa a.",
    labelLocal: "Lokal",
    localHint: "Anfas dòtwa UNIFA nan Tabarre 48.",
    labelSchedule: "Orè travay yo",
    scheduleValue: "Lendi — Samdi · 8:00 AM pou 6:00 PM",

    // Form translations
    formTitle: "Voye yon mesaj",
    formSubtitle: "Ranpli fòm sa a epi n ap reponn ou pi vit posib.",
    labelName: "Non konplè",
    placeholderName: "Kisa k non ou konplè",
    labelEmailField: "Adrès Imèl (Opsyonèl)",
    placeholderEmail: "Ex: jeanpaul@gmail.com",
    labelPhoneField: "Telefòn / WhatsApp",
    placeholderPhone: "Ex: +509 4463 2467",
    labelSubjectField: "Sijè",
    placeholderSubject: "Chwazi yon sijè...",
    labelMessageField: "Mesaj ou",
    placeholderMessage: "Ekri tout mesaj ou a la...",
    btnSubmit: "Voye mesaj la",
    btnSending: "Y ap voye l...",
    successTitle: "Mesaj la voye !",
    successDesc:
      "Mèsi pou mesaj ou a ! Ekip ALPHA Préfac la byen resevwa enfòmasyon ou yo epi n ap reponn ou trè byento.",
    errorTitle: "Erè anvoi",
    errorRequired: "Non konplè ak mesaj la se bagay ki obligatwa.",

    // Footer
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

function InfoCard({
  icon,
  label,
  value,
  href,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const content = (
    <>
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]">
        {icon}
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent-gold)]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground break-words">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const className =
    "block rounded-xl border border-[var(--card-border)] bg-card p-6 transition-all hover:-translate-y-1 hover:border-[var(--accent-gold)]/40 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]";

  return href ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default function ContactPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    role: string;
    nom: string;
  } | null>(null);

  // Form states
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const userObj = JSON.parse(cached);
          setCurrentUser(userObj);
          if (userObj.nom) setNom(userObj.nom);
          if (userObj.email) setEmail(userObj.email);
          if (userObj.telephone) setTelephone(userObj.telephone);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!nom.trim() || !message.trim()) {
      setError(translations[lang].errorRequired);
      setLoading(false);
      return;
    }

    try {
      if (!db) {
        throw new Error("Base de données indisponible.");
      }

      await addDoc(collection(db, "contact_messages"), {
        nom: nom.trim(),
        email: email.trim(),
        telephone: telephone.trim(),
        sujet: sujet.trim() || "Question générale",
        message: message.trim(),
        statut: "nouveau",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setMessage("");
      setSujet("");
    } catch (err: unknown) {
      console.error("Error submitting contact message:", err);
      setError(
        lang === "fr"
          ? "Une erreur s'est produite lors de l'envoi de votre message. Veuillez réessayer."
          : "Yon erè pase pandan n ap voye mesaj ou a. Silvouplè reyezi ankò.",
      );
      handleFirestoreError(err, OperationType.WRITE, "contact_messages");
    } finally {
      setLoading(false);
    }
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
              className="relative text-sm text-foreground/85 transition-colors hover:text-[var(--accent-gold)]"
            >
              {t.nav.about}
            </Link>
            <Link
              to="/galerie"
              className="relative text-sm text-foreground/85 transition-colors hover:text-[var(--accent-gold)]"
            >
              {t.nav.gallery || "Galerie"}
            </Link>
            <Link to="/contact" className="relative text-sm text-[var(--accent-gold)] font-medium">
              {t.nav.contact}
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[var(--accent-gold)]" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 rounded-full border border-border bg-card px-1 py-1 text-xs md:flex">
              <button
                id="contact-lang-btn-fr"
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
                id="contact-lang-btn-ht"
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
              id="contact-theme-toggle-btn"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-[var(--accent-gold)] shadow-sm hover:bg-muted transition-all active:scale-95 cursor-pointer"
            >
              {theme === "light" ? "🌙" : "☀"}
            </button>
            {currentUser ? (
              <Link
                to={
                  currentUser.role === "admin" ||
                  currentUser.role === "super_admin" ||
                  currentUser.role === "moderateur"
                    ? "/dashboard"
                    : "/espace-etudiant"
                }
                className="hidden md:inline-flex rounded-md bg-[var(--accent-gold)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-[0_8px_24px_-8px_rgba(234,200,80,0.55)] transition-transform hover:-translate-y-0.5 font-mono text-[11px] uppercase tracking-wider animate-fadeIn"
              >
                {currentUser.role === "admin" ||
                currentUser.role === "super_admin" ||
                currentUser.role === "moderateur"
                  ? "Dashboard"
                  : "Espace-Étudiant"}
              </Link>
            ) : (
              <Link
                to="/inscription"
                className="hidden md:inline-flex rounded-md bg-[var(--accent-gold)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-[0_8px_24px_-8px_rgba(234,200,80,0.55)] transition-transform hover:-translate-y-0.5"
              >
                {t.nav.join}
              </Link>
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
                  className="block rounded-lg px-3 py-2 text-sm transition-colors text-foreground/85 hover:bg-muted hover:text-[var(--accent-gold)]"
                >
                  {t.nav.about}
                </Link>
                <Link
                  to="/galerie"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors text-foreground/85 hover:bg-muted hover:text-[var(--accent-gold)]"
                >
                  {t.nav.gallery || "Galerie"}
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold"
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
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 0%, oklch(0.28 0.08 265) 0%, transparent 60%)",
          }}
        />

        <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 w-full">
          <div className="text-center mb-16">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/8 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent-gold)] shadow-[0_0_15px_rgba(234,200,80,0.1)]">
              <span>✦</span>
              <span>{t.badge}</span>
            </div>
            <h1 className="mt-6 font-display text-5xl tracking-tight md:text-6xl font-extrabold text-foreground">
              {t.titleStart}
              <span className="text-[var(--accent-gold)] leading-tight">{t.titleEnd}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t.subtitle}
            </p>
            <span className="mx-auto mt-6 block h-0.5 w-16 bg-[var(--accent-gold)]" />
          </div>

          <div className="grid gap-12 lg:grid-cols-12 items-start mt-10">
            {/* LEFT COLUMN: Info Cards (5 / 12) */}
            <div className="lg:col-span-5 space-y-6">
              <InfoCard
                icon={<PhoneIcon />}
                label={t.labelPhone}
                value="+509 4463 2467"
                href="tel:+50944632467"
              />
              <InfoCard
                icon={<MailIcon />}
                label={t.labelEmail}
                value="alphaprefac@gmail.com"
                href="mailto:alphaprefac@gmail.com"
              />
              <InfoCard
                icon={<ReceiptIcon />}
                label={t.labelReceipt}
                value="+509 4147 3014"
                href="tel:+50941473014"
                hint={t.receiptHint}
              />
              <InfoCard
                icon={<PinIcon />}
                label={t.labelLocal}
                value="Institution St-Vincent de Paul"
                hint={t.localHint}
              />

              <div className="rounded-xl border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5 p-6 text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent-gold)]">
                  {t.labelSchedule}
                </p>
                <p className="mt-2 text-sm text-foreground/95">{t.scheduleValue}</p>
              </div>
            </div>

            {/* RIGHT COLUMN: Contact Form (7 / 12) */}
            <div id="contact-form-container" className="lg:col-span-7">
              <div className="rounded-2xl border border-[var(--card-border)] bg-card/45 p-8 md:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-foreground font-display">{t.formTitle}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t.formSubtitle}
                </p>

                {success ? (
                  <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-6 text-emerald-400">
                    <div className="h-10 w-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 text-xl">
                      ✓
                    </div>
                    <h3 className="font-bold text-base text-emerald-300">{t.successTitle}</h3>
                    <p className="mt-2 text-sm text-emerald-400/90 leading-relaxed">
                      {t.successDesc}
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="mt-6 text-sm font-semibold text-[var(--accent-gold)] hover:underline cursor-pointer"
                    >
                      {lang === "fr" ? "Envoyer un autre message" : "Voye yon lòt mesaj"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    {error && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                        ⚠ {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {t.labelName} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder={t.placeholderName}
                        required
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]/50 focus:outline-none"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                          {t.labelPhoneField}
                        </label>
                        <input
                          type="tel"
                          value={telephone}
                          onChange={(e) => setTelephone(e.target.value)}
                          placeholder={t.placeholderPhone}
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]/50 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                          {t.labelEmailField}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.placeholderEmail}
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {t.labelSubjectField}
                      </label>
                      <select
                        value={sujet}
                        onChange={(e) => setSujet(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]/50 focus:outline-none"
                      >
                        <option value="">{t.placeholderSubject}</option>
                        <option value="Question générale">
                          {lang === "fr" ? "Question générale" : "Kesyon jeneral"}
                        </option>
                        <option value="Inscription / Paiement">
                          {lang === "fr"
                            ? "Inscription / Frais de documents"
                            : "Enskripsyon / Frè dokiman"}
                        </option>
                        <option value="Soutien académique">
                          {lang === "fr" ? "Cours / Soutien académique" : "Kou / Sipò akademik"}
                        </option>
                        <option value="Partenariat / HSM">
                          {lang === "fr" ? "Collaboration / HSM" : "Kolaborasyon / HSM"}
                        </option>
                        <option value="Autre">{lang === "fr" ? "Autre motif" : "Lòt rezon"}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {t.labelMessageField} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t.placeholderMessage}
                        required
                        rows={5}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-all focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]/50 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-[var(--accent-gold)] py-3.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-[0_8px_24px_-8px_rgba(234,200,80,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(234,200,80,0.65)] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex justify-center items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary-foreground)] border-t-transparent" />
                          {t.btnSending}
                        </>
                      ) : (
                        t.btnSubmit
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
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
                <Link to="/a-propos" className="text-foreground/85 hover:text-[var(--accent-gold)]">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link to="/galerie" className="text-foreground/85 hover:text-[var(--accent-gold)]">
                  {t.nav.gallery || "Galerie"}
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

function PhoneIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92V21a1 1 0 0 1-1.1 1A19 19 0 0 1 2 4.1 1 1 0 0 1 3 3h4.09a1 1 0 0 1 1 .75l1 4a1 1 0 0 1-.29 1L7.21 10.2a16 16 0 0 0 6.59 6.59l1.45-1.59a1 1 0 0 1 1-.29l4 1a1 1 0 0 1 .75 1z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function ReceiptIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
