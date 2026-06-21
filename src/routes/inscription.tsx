import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import logo from "@/assets/alpha-prefac-logo.asset.json";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import {
  auth,
  createUserProfile,
  getUserProfile,
  updateLastLogin,
  googleProvider,
} from "@/lib/firebase";

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
  component: Inscription,
});

function Field({
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)]">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-card/60 px-4 py-3 transition-colors focus-within:border-[var(--accent-gold)]/60 relative">
        <span className="text-[var(--accent-gold)]">{icon}</span>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none pr-8"
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[var(--accent-gold)]/70 hover:text-[var(--accent-gold)] transition-colors focus:outline-none p-1"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}

function Inscription() {
  const { mode: searchMode } = Route.useSearch();
  const [mode, setMode] = useState<"signup" | "login">(searchMode || "signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAuthRestricted, setIsAuthRestricted] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard or home
  useEffect(() => {
    const cached = localStorage.getItem("alpha_user");
    if (cached) {
      try {
        const u = JSON.parse(cached);
        if (u.role === "admin") {
          navigate({ to: "/dashboard" });
        }
      } catch (e) {
        // ignore
      }
    }
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError("Le service d'authentification n'est pas prêt.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { signInWithPopup } = await import("firebase/auth");
      const userCredential = await signInWithPopup(auth, googleProvider);
      const { uid, displayName, email: oEmail } = userCredential.user;

      if (!oEmail) {
        throw new Error("L'adresse email Google est requise.");
      }

      // Check if user has an existing Firestore user profile
      let profile = await getUserProfile(uid);
      if (!profile) {
        profile = await createUserProfile(uid, {
          nom: displayName || oEmail.split("@")[0],
          email: oEmail.toLowerCase().trim(),
        });
      }

      // Update last login
      await updateLastLogin(uid);

      // Cache in localStorage
      const nameParts = profile.nom.split(" ");
      const appUser = {
        id: uid,
        uid,
        firstName: nameParts[0] || profile.nom,
        lastName: nameParts.slice(1).join(" ") || "",
        nom: profile.nom,
        email: profile.email,
        phone: profile.telephone,
        telephone: profile.telephone,
        role: profile.role,
        statut_compte: profile.statut_compte,
        universite: profile.universite,
        createdAt:
          profile.createdAt &&
          typeof profile.createdAt === "object" &&
          "toDate" in profile.createdAt &&
          typeof (profile.createdAt as { toDate: () => { toISOString: () => string } }).toDate ===
            "function"
            ? (profile.createdAt as { toDate: () => { toISOString: () => string } })
                .toDate()
                .toISOString()
            : new Date().toISOString(),
      };

      localStorage.setItem("alpha_user", JSON.stringify(appUser));
      setSuccess(true);

      setTimeout(() => {
        if (profile.role === "admin" || profile.role === "super_admin") {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/espace-etudiant" });
        }
      }, 1500);
    } catch (err: unknown) {
      console.warn("Google Sign-In response:", err);
      setError("La connexion avec Google a échoué. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email) || !password) {
      setError("Veuillez remplir correctement tous les champs obligatoires.");
      return;
    }

    if (mode === "signup" && (!firstName || !lastName)) {
      setError("Veuillez entrer votre prénom et votre nom.");
      return;
    }

    if (!auth) {
      setError("Le service d'authentification n'est pas prêt.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { uid } = userCredential.user;

        // 2. Automatically create User Profile in Firestore users collection
        const profile = await createUserProfile(uid, {
          nom: `${firstName.trim()} ${lastName.trim()}`,
          email: email.toLowerCase().trim(),
          telephone: phone.trim(),
        });

        // 3. Keep in localStorage to maintain dynamic application logic
        const appUser = {
          id: uid,
          uid,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          nom: profile.nom,
          email: profile.email,
          phone: profile.telephone,
          telephone: profile.telephone,
          role: profile.role,
          statut_compte: profile.statut_compte,
          universite: profile.universite,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem("alpha_user", JSON.stringify(appUser));
        setSuccess(true);

        // Wait briefly, then redirect student to internal espace-etudiant route
        setTimeout(() => {
          if (profile.role === "admin") {
            navigate({ to: "/dashboard" });
          } else {
            navigate({ to: "/espace-etudiant" });
          }
        }, 1500);
      } else {
        // Login mode
        // 1. Sign in via Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const { uid } = userCredential.user;

        // 2. Fetch the user profile from Firestore collection "users"
        let profile = await getUserProfile(uid);

        // Fallback: If no firestore document exists yet (e.g. legacy or manual account), create it dynamically!
        if (!profile) {
          profile = await createUserProfile(uid, {
            nom: email.split("@")[0],
            email: email.toLowerCase().trim(),
          });
        }

        const isPrimaryAdmin =
          email.toLowerCase().trim() === "felixjonathan201@gmail.com" ||
          email.toLowerCase().trim() === "devhaitian@gmail.com";

        if (profile && isPrimaryAdmin && profile.role !== "admin") {
          await updateUserProfile(uid, { role: "admin", statut_compte: "approuve" });
          profile.role = "admin";
          profile.statut_compte = "approuve";
        }

        // 3. Update last login timestamp in Firestore
        await updateLastLogin(uid);

        // 4. Cache in local storage for navigation & state
        const nameParts = profile.nom.split(" ");
        const appUser = {
          id: uid,
          uid,
          firstName: nameParts[0] || profile.nom,
          lastName: nameParts.slice(1).join(" ") || "",
          nom: profile.nom,
          email: profile.email,
          phone: profile.telephone,
          telephone: profile.telephone,
          role: profile.role,
          statut_compte: profile.statut_compte,
          universite: profile.universite,
          createdAt: profile.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };

        localStorage.setItem("alpha_user", JSON.stringify(appUser));

        if (
          profile.role === "admin" ||
          profile.role === "super_admin" ||
          profile.role === "moderateur"
        ) {
          navigate({ to: "/dashboard" });
        } else {
          setSuccess(true);
          setTimeout(() => {
            navigate({ to: "/espace-etudiant" });
          }, 1000);
        }
      }
    } catch (err: unknown) {
      console.warn("Firebase Auth status:", err);
      let frenchMessage = "Une erreur est survenue. Veuillez réessayer.";
      const errWithCode = err as { code?: string };

      switch (errWithCode.code) {
        case "auth/email-already-in-use":
          frenchMessage = "Cette adresse email est déjà utilisée.";
          break;
        case "auth/weak-password":
          frenchMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          break;
        case "auth/invalid-email":
          frenchMessage = "L'adresse email n'est pas valide.";
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          frenchMessage = "Adresse email ou mot de passe incorrect.";
          break;
        case "auth/too-many-requests":
          frenchMessage = "Trop d'essais infructueux. Veuillez réessayer plus tard.";
          break;
        case "auth/operation-not-allowed":
          frenchMessage =
            "La connexion par e-mail et mot de passe n'est pas activée dans le bac à sable Firebase.";
          setIsAuthRestricted(true);
          break;
      }

      setError(frenchMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-card/60 px-4 py-2 text-sm text-foreground/85 transition-colors hover:border-[var(--accent-gold)]/60 hover:text-[var(--accent-gold)]"
        >
          <span aria-hidden>←</span> Retour à l'accueil
        </Link>
        <Link
          to="/"
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]"
        >
          <img
            src={logo.url}
            alt="ALPHA Préfac"
            className="h-16 w-16 object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith(".png")) {
                target.src = target.src.replace(".png", ".jpg");
              } else if (target.src.endsWith(".jpg")) {
                target.src = target.src.replace(".jpg", ".jpeg");
              }
            }}
          />
        </Link>

        <h1 className="text-center font-display text-4xl tracking-tight md:text-5xl">
          {mode === "signup" ? (
            <>
              <span className="text-foreground">Créer un </span>
              <span className="text-[var(--accent-gold)]">Compte</span>
            </>
          ) : (
            <>
              <span className="text-foreground">Se </span>
              <span className="text-[var(--accent-gold)]">Connecter</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "signup"
            ? "Rejoignez Alpha PRÉFAC dès aujourd'hui"
            : "Connectez-vous pour accéder à votre espace"}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 rounded-2xl border border-[var(--card-border)] bg-card/40 p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)]"
        >
          {error && (
            <div className="mb-5 flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-400/60 text-red-300">
                  !
                </span>
                <span>{error}</span>
              </div>
              {error === "Cette adresse email est déjà utilisée." && mode === "signup" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setIsAuthRestricted(false);
                  }}
                  className="mt-1 text-xs font-semibold text-[var(--accent-gold)] underline hover:text-[var(--accent-gold)]/85 self-start text-left"
                >
                  👉 Cliquer ici pour vous connecter à la place
                </button>
              )}
            </div>
          )}

          {isAuthRestricted && (
            <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-950/40 p-5 text-sm text-blue-200 shadow-md">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-black text-xs font-bold font-mono">
                  i
                </span>
                <div className="space-y-3">
                  <p className="font-semibold text-white leading-relaxed">
                    Pourquoi cette restriction d'autorisation Firebase ?
                  </p>
                  <p className="text-xs text-blue-300 leading-relaxed">
                    Le projet Firebase actuel{" "}
                    <code className="rounded bg-blue-950/80 px-1.5 py-0.5 text-[var(--accent-gold)] font-mono">
                      {auth?.app?.options?.projectId || "alphaprefac"}
                    </code>{" "}
                    est un environnement de développement.
                  </p>
                  <ol className="list-decimal pl-4 space-y-2 text-xs text-blue-300">
                    <li>
                      <strong className="text-white">Option recommandée et instantanée :</strong>{" "}
                      Cliquez sur{" "}
                      <strong className="text-[var(--accent-gold)]">"Continuer avec Google"</strong>{" "}
                      juste ci-dessous. Cette option fonctionne immédiatement sans aucune
                      configuration !
                    </li>
                    <li>
                      <strong className="text-white">Option développeur :</strong> Si vous souhaitez
                      tester les flux Email/Mot de passe classique, créez votre propre projet
                      Firebase (avec la méthode Email/Mot de passe activée) et remplacez la
                      configuration dans le fichier{" "}
                      <code className="rounded bg-blue-950/80 px-1 py-0.5 font-mono text-[11px] text-[var(--accent-gold)]">
                        firebase-applet-config.json
                      </code>
                      .
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 animate-pulse">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black text-xs font-bold">
                ✓
              </span>
              <span>
                {mode === "signup"
                  ? "Compte créé avec succès ! Redirection..."
                  : "Connexion réussie ! Redirection..."}
              </span>
            </div>
          )}

          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-4 mb-5">
              <Field
                label="Prénom"
                icon={<UserIcon />}
                placeholder="Jonathan"
                value={firstName}
                onChange={setFirstName}
              />
              <Field
                label="Nom"
                icon={<UserIcon />}
                placeholder="Félix"
                value={lastName}
                onChange={setLastName}
              />
            </div>
          )}

          <div>
            <Field
              label="Adresse Email"
              icon={<MailIcon />}
              type="email"
              placeholder="exemple@gmail.com"
              value={email}
              onChange={setEmail}
            />
          </div>

          {mode === "signup" && (
            <div className="mt-5">
              <Field
                label="Téléphone (optionnel)"
                icon={<PhoneIcon />}
                type="tel"
                placeholder="+509 0000 0000"
                value={phone}
                onChange={setPhone}
              />
            </div>
          )}

          <div className="mt-5">
            <Field
              label="Mot de passe"
              icon={<LockIcon />}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="mt-7 w-full rounded-lg bg-[var(--accent-gold)] py-3.5 text-sm font-bold text-[var(--primary-foreground)] shadow-[0_15px_40px_-15px_rgba(234,200,80,0.7)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Chargement..." : mode === "signup" ? "S'inscrire" : "Se connecter"}
          </button>

          <div className="my-5 flex items-center justify-between gap-3 text-xs uppercase text-muted-foreground/50">
            <span className="h-px flex-1 bg-[var(--card-border)]" />
            <span>OU</span>
            <span className="h-px flex-1 bg-[var(--card-border)]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-[var(--card-border)] bg-card/60 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card/85 hover:border-[var(--accent-gold)]/50 focus:outline-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.12.57 4.28 1.69l3.22-3.22C17.52 1.58 14.97 1 12 1 7.24 1 3.19 3.73 1.24 7.72l3.87 3a6.978 6.978 0 0 1 6.89-5.68z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43a5.55 5.55 0 0 1-2.4 3.64l3.71 2.87c2.17-2 3.75-4.94 3.75-8.66z"
              />
              <path
                fill="#FBBC05"
                d="M5.11 14.72A6.898 6.898 0 0 1 4.7 12c0-.96.16-1.9.41-2.72L1.24 6.28A11.956 11.956 0 0 0 0 12c0 2.11.55 4.1 1.5 5.84l3.61-3.12z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.71-2.87c-1.04.7-2.37 1.12-4.25 1.12-3.21 0-5.94-2.17-6.91-5.12L1.5 16.34A11.972 11.972 0 0 0 12 23z"
              />
            </svg>
            Continuer avec Google
          </button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setIsAuthRestricted(false);
                  }}
                  className="font-semibold text-[var(--accent-gold)] hover:underline focus:outline-none"
                >
                  Se connecter
                </button>
              </>
            ) : (
              <>
                Nouveau chez nous ?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setIsAuthRestricted(false);
                  }}
                  className="font-semibold text-[var(--accent-gold)] hover:underline focus:outline-none"
                >
                  S'inscrire
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
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
function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
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
function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
