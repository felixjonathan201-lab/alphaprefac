import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  auth,
  db,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  UserProfile,
  AppNotification,
} from "@/lib/firebase";
import { onSnapshot, doc, collection, query, where } from "firebase/firestore";
import logo from "@/assets/alpha-prefac-logo.asset.json";
import { ApplicationStatus } from "@/components/ApplicationStatus";

export const Route = createFileRoute("/espace-etudiant")({
  component: EspaceEtudiant,
});

function EspaceEtudiant() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [nom, setNom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ancienneEcole, setAncienneEcole] = useState("");

  const [faculteVisee, setFaculteVisee] = useState("");
  const [customFaculte, setCustomFaculte] = useState("");

  const [matiereLacune, setMatiereLacune] = useState("");
  const [customMatiere, setCustomMatiere] = useState("");

  const [sourceAlpha, setSourceAlpha] = useState("");
  const [customSource, setCustomSource] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  // Listen to Auth & real-time profile updates
  useEffect(() => {
    // Safety fallback: ensure loading is turned off after 5 seconds to prevent spinner hang
    const fallbackTimeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn(
            "Safety trigger: taking too long to load, forcing loading spinner to disable",
          );
          return false;
        }
        return prev;
      });
    }, 4500);

    if (!auth) {
      setLoading(false);
      clearTimeout(fallbackTimeout);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or listen to profile
        try {
          // Wrap getUserProfile call with a 1500ms timeout to avoid infinite loaders when offline
          const profilePromise = getUserProfile(firebaseUser.uid);
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 1500),
          );
          const profile = await Promise.race([profilePromise, timeoutPromise]);

          if (profile) {
            setCurrentUser(profile);
            setNom(profile.nom);
            setTelephone(profile.telephone || "");
          } else {
            // Offline fallback: check if we have a locally cached profile corresponding to this UID
            const cached = localStorage.getItem("alpha_user");
            let loadedFromCache = false;
            if (cached) {
              try {
                const cachedProfile = JSON.parse(cached) as UserProfile;
                if (cachedProfile && cachedProfile.uid === firebaseUser.uid) {
                  setCurrentUser(cachedProfile);
                  setNom(cachedProfile.nom);
                  setTelephone(cachedProfile.telephone || "");
                  loadedFromCache = true;
                }
              } catch (cacheErr) {
                console.warn("Could not parse locally cached user profile:", cacheErr);
              }
            }

            if (!loadedFromCache) {
              try {
                // Try creating profile, also wrapped with a timeout
                const createPromise = createUserProfile(firebaseUser.uid, {
                  nom: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Étudiant",
                  email: firebaseUser.email || "",
                });
                const fallbackProfile = await Promise.race([createPromise, timeoutPromise]);
                if (fallbackProfile) {
                  setCurrentUser(fallbackProfile);
                  setNom(fallbackProfile.nom);
                } else {
                  // Final visual client-side fallback representation so the student can still view the app offline
                  const localFallback: UserProfile = {
                    uid: firebaseUser.uid,
                    nom:
                      firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Étudiant",
                    email: firebaseUser.email || "",
                    telephone: "",
                    role: "etudiant",
                    statut_compte: "en_attente",
                    universite: "",
                    createdAt: null,
                    lastLogin: null,
                  };
                  setCurrentUser(localFallback);
                  setNom(localFallback.nom);
                }
              } catch (createErr) {
                console.warn("Could not create/fetch profile under offline conditions:", createErr);
              }
            }
          }

          // Setup real-time listener for user profile
          if (db) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const unsubProfile = onSnapshot(
              userDocRef,
              (snap) => {
                if (snap.exists()) {
                  const updated = snap.data() as UserProfile;
                  setCurrentUser(updated);

                  // Keep local cache synced
                  const localData = JSON.parse(localStorage.getItem("alpha_user") || "{}");
                  localStorage.setItem(
                    "alpha_user",
                    JSON.stringify({
                      ...localData,
                      nom: updated.nom,
                      email: updated.email,
                      telephone: updated.telephone,
                      role: updated.role,
                      statut_compte: updated.statut_compte,
                      universite: updated.universite,
                      formulaire_rempli: updated.formulaire_rempli,
                    }),
                  );
                }
              },
              (error) => {
                console.error("Profile listen failed:", error);
              },
            );

            // Listen to real-time personal or global notifications
            const notifsQuery = query(
              collection(db, "notifications"),
              where("destinataire", "in", [firebaseUser.uid, "all"]),
            );
            const unsubNotifs = onSnapshot(
              notifsQuery,
              (snap) => {
                const fetchedNotifs = snap.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                })) as AppNotification[];

                // Sort in-memory to prevent complex Firestore composite index requests
                fetchedNotifs.sort((a, b) => {
                  const timeA =
                    a.createdAt && typeof a.createdAt === "object" && "seconds" in a.createdAt
                      ? (a.createdAt as { seconds: number }).seconds
                      : 0;
                  const timeB =
                    b.createdAt && typeof b.createdAt === "object" && "seconds" in b.createdAt
                      ? (b.createdAt as { seconds: number }).seconds
                      : 0;
                  return timeB - timeA;
                });

                setNotifications(fetchedNotifs);
              },
              (error) => {
                console.error("Notifications list listener failed:", error);
              },
            );

            return () => {
              unsubProfile();
              unsubNotifs();
            };
          }
        } catch (error) {
          console.error("Error setting up student space real-time listeners:", error);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem("alpha_user");
      }
      setLoading(false);
      clearTimeout(fallbackTimeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
    localStorage.removeItem("alpha_user");
    setCurrentUser(null);
    navigate({ to: "/inscription" });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate inputs
    const finalFaculte = faculteVisee === "Other" ? customFaculte.trim() : faculteVisee;
    const finalMatiere = matiereLacune === "Other" ? customMatiere.trim() : matiereLacune;
    const finalSource = sourceAlpha === "Other" ? customSource.trim() : sourceAlpha;

    if (
      !nom.trim() ||
      !dateNaissance ||
      !adresse.trim() ||
      !telephone.trim() ||
      !ancienneEcole.trim() ||
      !finalFaculte ||
      !finalMatiere ||
      !finalSource
    ) {
      setFormError("Veuillez remplir tous les champs obligatoires (*) du formulaire.");
      return;
    }

    if (!currentUser) return;

    setSubmittingForm(true);
    try {
      await updateUserProfile(currentUser.uid, {
        nom: nom.trim(),
        telephone: telephone.trim(),
        date_naissance: dateNaissance,
        adresse: adresse.trim(),
        ancienne_ecole: ancienneEcole.trim(),
        faculte_visee: finalFaculte,
        matiere_lacune: finalMatiere,
        source_alpha_prefac: finalSource,
        formulaire_rempli: true,
        statut_compte: "en_attente", // Auto passes to "en_attente" upon form submission
      });

      setSuccessMessage("Votre dossier a été soumis avec succès !");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (e) {
      console.error("Form submission failed:", e);
      setFormError("Une erreur s'est produite lors de la soumission de votre inscription.");
    } finally {
      setSubmittingForm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent-gold)] border-t-transparent"></div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Synchronisation de votre espace...
          </p>
        </div>
      </div>
    );
  }

  // Guard: User is not authenticated
  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-card p-8 shadow-xl">
          <img
            src={logo.url}
            alt="ALPHA Préfac"
            className="mx-auto h-14 w-14 rounded-full bg-white object-contain mb-6"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith(".png")) {
                target.src = target.src.replace(".png", ".jpg");
              } else if (target.src.endsWith(".jpg")) {
                target.src = target.src.replace(".jpg", ".jpeg");
              }
            }}
          />
          <h1 className="text-xl font-bold text-foreground">Accès Réservé</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Vous devez être connecté pour accéder à votre espace d'inscription et de formation.
          </p>
          <Link
            to="/inscription"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent-gold)] px-6 py-3 font-semibold text-[var(--primary-foreground)] hover:-translate-y-0.5 transition-transform"
          >
            Se connecter / S'inscrire
          </Link>
          <Link
            to="/"
            className="mt-4 block text-xs text-muted-foreground hover:text-[var(--accent-gold)]"
          >
            Retour à l'accueil du site
          </Link>
        </div>
      </div>
    );
  }

  const { statut_compte, formulaire_rempli } = currentUser;

  // Render Onboarding Registration Form
  if (!formulaire_rempli) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <img
                src={logo.url}
                alt="ALPHA Préfac"
                className="h-9 w-9 rounded-full bg-white object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.endsWith(".png")) {
                    target.src = target.src.replace(".png", ".jpg");
                  } else if (target.src.endsWith(".jpg")) {
                    target.src = target.src.replace(".jpg", ".jpeg");
                  }
                }}
              />
              <span className="text-base font-semibold tracking-wide">
                <span className="text-[var(--accent-gold)]">ALPHA</span>{" "}
                <span className="text-foreground/90">Espace Étudiant</span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-center mb-10">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/8 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent-gold)]">
              <span>✦ Step 2 : Formulaire Interne ✦</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Dossier d'Inscription Académique
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Merci de remplir ce formulaire interne avec exactitude. Ces informations sont
              cruciales pour l'évaluation de votre dossier par l'administration d'ALPHA Préfac.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="rounded-2xl border border-[var(--card-border)] bg-card p-6 md:p-8 space-y-6 shadow-md">
              {/* Form errors */}
              {formError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
                  ⚠️ {formError}
                </div>
              )}

              {/* Success */}
              {successMessage && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                  🎉 {successMessage}
                </div>
              )}

              {/* 1. Nom Complet */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                />
              </div>

              {/* 2. Date de Naissance */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  required
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                />
              </div>

              {/* 3. Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Email de connexion *
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-background/50 px-4 py-3 text-sm text-muted-foreground/75 cursor-not-allowed"
                />
                <span className="text-[10px] text-muted-foreground mt-1.5 block">
                  Cet email est rattaché à votre compte d'authentification.
                </span>
              </div>

              {/* 4. Téléphone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Numéro de téléphone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+509 xx xx xx xx"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                />
              </div>

              {/* 5. Adresse */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Adresse de résidence *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Port-au-Prince, Haiti..."
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                />
              </div>

              {/* 6. Ancienne École */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Ancienne école secondaire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Collège Catts Pressoir, Saint-Louis..."
                  value={ancienneEcole}
                  onChange={(e) => setAncienneEcole(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                />
              </div>

              {/* 7. Faculté visée */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Faculté visée *
                </label>
                <div className="grid gap-2 sm:grid-cols-2 mt-3">
                  {["FMP", "FLA", "UNIFA", "USFAH", "IERAH", "FDSE", "INAGHEI", "FASCH"].map(
                    (fac) => (
                      <label
                        key={fac}
                        className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-background/25 px-4 py-3 cursor-pointer hover:bg-background/60 transition-colors"
                      >
                        <input
                          type="radio"
                          name="faculte"
                          required
                          value={fac}
                          checked={faculteVisee === fac}
                          onChange={() => setFaculteVisee(fac)}
                          className="accent-[var(--accent-gold)] text-[var(--accent-gold)]"
                        />
                        <span className="text-sm font-semibold">{fac}</span>
                      </label>
                    ),
                  )}
                  <label className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-background/25 px-4 py-3 cursor-pointer hover:bg-background/60 transition-colors col-span-1 sm:col-span-2">
                    <input
                      type="radio"
                      name="faculte"
                      required
                      value="Other"
                      checked={faculteVisee === "Other"}
                      onChange={() => setFaculteVisee("Other")}
                      className="accent-[var(--accent-gold)] text-[var(--accent-gold)]"
                    />
                    <span className="text-sm font-semibold">Autre :</span>
                  </label>
                </div>

                {faculteVisee === "Other" && (
                  <input
                    type="text"
                    required
                    placeholder="Veuillez spécifier la faculté..."
                    value={customFaculte}
                    onChange={(e) => setCustomFaculte(e.target.value)}
                    className="w-full mt-3 rounded-lg border border-[var(--accent-gold)]/50 bg-background px-4 py-3 text-sm text-foreground focus:outline-none"
                  />
                )}
              </div>

              {/* 8. Matière avec lacune */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Matière avec lacune *
                </label>
                <div className="grid gap-2 sm:grid-cols-2 mt-3">
                  {[
                    "MATHS",
                    "CONNAISSANCE GENERALES",
                    "PHYSIQUES",
                    "CHIMIE",
                    "HISTORE",
                    "GEOGRAPHIE",
                  ].map((mat) => (
                    <label
                      key={mat}
                      className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-background/25 px-4 py-3 cursor-pointer hover:bg-background/60 transition-colors"
                    >
                      <input
                        type="radio"
                        name="matiere"
                        required
                        value={mat}
                        checked={matiereLacune === mat}
                        onChange={() => setMatiereLacune(mat)}
                        className="accent-[var(--accent-gold)] text-[var(--accent-gold)]"
                      />
                      <span className="text-sm font-semibold text-xs uppercase">{mat}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-background/25 px-4 py-3 cursor-pointer hover:bg-background/60 transition-colors col-span-1 sm:col-span-2">
                    <input
                      type="radio"
                      name="matiere"
                      required
                      value="Other"
                      checked={matiereLacune === "Other"}
                      onChange={() => setMatiereLacune("Other")}
                      className="accent-[var(--accent-gold)] text-[var(--accent-gold)]"
                    />
                    <span className="text-sm font-semibold">Autre lacune :</span>
                  </label>
                </div>

                {matiereLacune === "Other" && (
                  <input
                    type="text"
                    required
                    placeholder="Définissez votre matière..."
                    value={customMatiere}
                    onChange={(e) => setCustomMatiere(e.target.value)}
                    className="w-full mt-3 rounded-lg border border-[var(--accent-gold)]/50 bg-background px-4 py-3 text-sm text-foreground focus:outline-none"
                  />
                )}
              </div>

              {/* 9. Qui vous a parle d'Alpha Prefac */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] font-mono mb-2">
                  Qui vous a parlé d'Alpha Prefac ? *
                </label>
                <div className="grid gap-2 sm:grid-cols-2 mt-3">
                  {["Amis", "Famille", "Reseau social"].map((src) => (
                    <label
                      key={src}
                      className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-background/25 px-4 py-3 cursor-pointer hover:bg-background/60 transition-colors"
                    >
                      <input
                        type="radio"
                        name="source"
                        required
                        value={src}
                        checked={sourceAlpha === src}
                        onChange={() => setSourceAlpha(src)}
                        className="accent-[var(--accent-gold)] text-[var(--accent-gold)]"
                      />
                      <span className="text-sm font-semibold">{src}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-background/25 px-4 py-3 cursor-pointer hover:bg-background/60 transition-colors col-span-1 sm:col-span-2">
                    <input
                      type="radio"
                      name="source"
                      required
                      value="Other"
                      checked={sourceAlpha === "Other"}
                      onChange={() => setSourceAlpha("Other")}
                      className="accent-[var(--accent-gold)] text-[var(--accent-gold)]"
                    />
                    <span className="text-sm font-semibold">Autre :</span>
                  </label>
                </div>

                {sourceAlpha === "Other" && (
                  <input
                    type="text"
                    required
                    placeholder="Saisissez la source..."
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    className="w-full mt-3 rounded-lg border border-[var(--accent-gold)]/50 bg-background px-4 py-3 text-sm text-foreground focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Form Action buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submittingForm}
                className="flex-1 rounded-xl bg-[var(--accent-gold)] py-4 text-center text-sm font-bold text-[var(--primary-foreground)] shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-50"
              >
                {submittingForm ? "Envoi du dossier..." : "Soumettre mon inscription définitive"}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // Render Waiting Page / Rejection / Suspension screen for non-approved profiles
  if (statut_compte !== "approuve") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <img
                src={logo.url}
                alt="ALPHA Préfac"
                className="h-9 w-9 rounded-full bg-white object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.endsWith(".png")) {
                    target.src = target.src.replace(".png", ".jpg");
                  } else if (target.src.endsWith(".jpg")) {
                    target.src = target.src.replace(".jpg", ".jpeg");
                  }
                }}
              />
              <span className="text-base font-semibold tracking-wide">
                <span className="text-[var(--accent-gold)]">ALPHA</span>{" "}
                <span className="text-foreground/90">Espace Admissibilité</span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded bg-black/40 border border-[var(--card-border)] px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-white hover:border-white transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-12 grid gap-8 md:grid-cols-3">
          {/* Main Status Display Column: Left and middle span */}
          <div className="md:col-span-2 space-y-6">
            <ApplicationStatus userId={currentUser.uid} />

            {/* Profile recap card */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-card p-6 shadow-sm">
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-[var(--accent-gold)] mb-4">
                📋 Récapitulatif de votre Demande
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="border-b border-[var(--card-border)]/40 pb-2">
                  <p className="text-muted-foreground font-mono uppercase tracking-wider mb-0.5 text-[9px]">
                    Ecole Secondaire
                  </p>
                  <p className="font-semibold text-foreground">
                    {currentUser.ancienne_ecole || "—"}
                  </p>
                </div>
                <div className="border-b border-[var(--card-border)]/40 pb-2">
                  <p className="text-muted-foreground font-mono uppercase tracking-wider mb-0.5 text-[9px]">
                    Faculté Visée
                  </p>
                  <p className="font-semibold text-foreground text-amber-400 font-mono">
                    {currentUser.faculte_visee || "—"}
                  </p>
                </div>
                <div className="border-b border-[var(--card-border)]/40 pb-2">
                  <p className="text-muted-foreground font-mono uppercase tracking-wider mb-0.5 text-[9px]">
                    Lacune à Combler
                  </p>
                  <p className="font-semibold text-foreground text-rose-300 font-mono">
                    {currentUser.matiere_lacune || "—"}
                  </p>
                </div>
                <div className="border-b border-[var(--card-border)]/40 pb-2">
                  <p className="text-muted-foreground font-mono uppercase tracking-wider mb-0.5 text-[9px]">
                    Date de naissance
                  </p>
                  <p className="font-semibold text-foreground">
                    {currentUser.date_naissance || "—"}
                  </p>
                </div>
                <div className="border-b border-[var(--card-border)]/40 pb-2">
                  <p className="text-muted-foreground font-mono uppercase tracking-wider mb-0.5 text-[9px]">
                    Téléphone fourni
                  </p>
                  <p className="font-semibold text-foreground">{currentUser.telephone || "—"}</p>
                </div>
                <div className="border-b border-[var(--card-border)]/40 pb-2">
                  <p className="text-muted-foreground font-mono uppercase tracking-wider mb-0.5 text-[9px]">
                    Adresse d'habitation
                  </p>
                  <p className="font-semibold text-foreground truncate">
                    {currentUser.adresse || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic real-time Notifications & Requests Center column */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--card-border)] bg-card p-6 h-full flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--card-border)]/40">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-[var(--accent-gold)] flex items-center gap-1.5">
                    <span>🔔</span> Notifications Directes
                  </h3>
                  <span className="rounded bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-mono animate-pulse">
                    Temps Réel
                  </span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-muted-foreground italic">
                        Aucune notification pour le moment.
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Les messages de l'administration apparaîtront ici instantanément.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="rounded-lg bg-black/25 border border-[var(--card-border)]/50 p-3 text-xs space-y-1.5 transition-colors hover:border-[var(--accent-gold)]/20"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-foreground text-[12px]">{notif.titre}</p>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {notif.type === "globale" ? "📣 Globale" : "✉️ Personnelle"}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[var(--card-border)]/40">
                <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                  Des questions sur votre admission ? <br />
                  <Link
                    to="/contact"
                    className="text-[var(--accent-gold)] hover:underline font-bold"
                  >
                    Écrire à un conseiller →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render FULLY APPROVED student space
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Dynamic Header */}
      <header className="border-b border-border/40 bg-card/65 sticky top-0 z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src={logo.url}
              alt="ALPHA Préfac"
              className="h-9 w-9 rounded-full bg-white object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith(".png")) {
                  target.src = target.src.replace(".png", ".jpg");
                } else if (target.src.endsWith(".jpg")) {
                  target.src = target.src.replace(".jpg", ".jpeg");
                }
              }}
            />
            <span className="text-base font-semibold tracking-wide">
              <span className="text-[var(--accent-gold)]">ALPHA</span>{" "}
              <span className="text-foreground/90">Espace Privé Étudiant</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/contact"
              className="hidden sm:inline-block text-xs font-semibold text-muted-foreground hover:text-[var(--accent-gold)] transition-colors"
            >
              Parler à un prof
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Layout */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-10 space-y-8">
        {/* Welcome Section Banner */}
        <div className="relative rounded-3xl border border-[var(--accent-gold)]/20 bg-gradient-to-r from-card to-background p-8 md:p-10 shadow-lg overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
            <svg width="350" height="350" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM4.18 12.33l-2-.55L12 16.5l9.82-4.72-2 .55L12 14.5l-7.82-2.17z" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              ✓ Compte Validé et Approuvé
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-4">
              Bienvenue dans la famille,{" "}
              <span className="text-[var(--accent-gold)]">{currentUser.nom}</span> !
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Votre inscription est validée ! Vos cours de préparation en{" "}
              {currentUser.faculte_visee} sont entièrement débloqués et prêts dans votre espace
              d'accompagnement de pointe.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <Link
              to="/"
              className="rounded-xl border border-[var(--accent-gold)] bg-transparent hover:bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] text-xs font-extrabold px-5 py-3 tracking-wide"
            >
              Page d'accueil
            </Link>
            <a
              href="#cours"
              className="rounded-xl bg-[var(--accent-gold)] text-[var(--primary-foreground)] text-xs font-extrabold px-5 py-3 tracking-wide shadow-md"
            >
              Voir mon programme
            </a>
          </div>
        </div>

        {/* Real-time Application Admissibility Status tracking widget */}
        <ApplicationStatus userId={currentUser.uid} className="w-full" />

        {/* Dashboard Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Course program & Academic roadmap */}
          <div className="md:col-span-2 space-y-6" id="cours">
            {/* unlocked dynamic courses */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-card p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--card-border)]/40 pb-3">
                <h2 className="text-lg font-bold text-foreground">
                  📚 Vos Cours et Sujets d'Entraînement
                </h2>
                <span className="text-xs font-mono text-[var(--accent-gold)] uppercase tracking-wider">
                  Universitaire : {currentUser.faculte_visee}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                Sur la base de votre profil académique, voici le planning intensif sélectionné pour
                combler vos lacunes et garantir votre réussite au concours :
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Course Block 1 */}
                <div className="rounded-xl border border-[var(--card-border)] bg-black/25 p-5 space-y-3 group hover:border-[var(--accent-gold)]/35 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[var(--accent-gold)] uppercase tracking-wider font-bold">
                      Mathématiques Avancées
                    </span>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5">
                      Actif
                    </span>
                  </div>
                  <h4 className="font-bold text-[15px]">Algèbre & Analyse vectorielle</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cours complets sur l'analyse complexe, la trigonométrie dynamique, et
                    l'application géométrique.
                  </p>
                  <button className="text-xs font-bold text-[var(--accent-gold)] hover:underline flex items-center gap-1">
                    Accéder aux fiches →
                  </button>
                </div>

                {/* Course Block 2 */}
                <div className="rounded-xl border border-[var(--card-border)] bg-black/25 p-5 space-y-3 group hover:border-[var(--accent-gold)]/35 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                      Mécanique & Physique
                    </span>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5">
                      Actif
                    </span>
                  </div>
                  <h4 className="font-bold text-[15px]">Cinématique & Physique Newtonienne</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Résolution pas-à-pas de l'épreuve reine d'ingénierie et de médecine.
                  </p>
                  <button className="text-xs font-bold text-[var(--accent-gold)] hover:underline flex items-center gap-1">
                    Télécharger les PDFs →
                  </button>
                </div>

                {/* Course Block 3 */}
                <div className="rounded-xl border border-[var(--card-border)] bg-black/25 p-5 space-y-3 group hover:border-[var(--accent-gold)]/35 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                      Chimie & Dissertations
                    </span>
                    <span className="rounded bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5">
                      Disponible
                    </span>
                  </div>
                  <h4 className="font-bold text-[15px]">Stoechiométrie & Écrits Français</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Maximisez votre notation d'essai en maîtrisant les critères officiels de
                    correction.
                  </p>
                  <button className="text-xs font-bold text-[var(--accent-gold)] hover:underline flex items-center gap-1">
                    Parcourir la cohorte →
                  </button>
                </div>

                {/* Lacune specific review course */}
                <div className="rounded-xl border border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[var(--accent-gold)] uppercase tracking-wider font-bold">
                      🚨 Focus Lacune Ciblé
                    </span>
                    <span className="rounded bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] text-[10px] px-2 py-0.5">
                      Prioritaire
                    </span>
                  </div>
                  <h4 className="font-bold text-[15px] text-[var(--accent-gold)]">
                    Module Spécialisé : {currentUser.matiere_lacune}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Puisque vous avez déclaré avoir des difficultés en **
                    {currentUser.matiere_lacune}**, l'administration vous a assigné un coach
                    particulier d'évaluation disponible ce vendredi.
                  </p>
                  <Link
                    to="/contact"
                    className="text-xs font-bold text-foreground hover:underline block mt-1"
                  >
                    Prendre rendez-vous avec un coach →
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile summary card */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-card p-6 shadow-sm">
              <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-muted-foreground mb-4">
                📋 Informations d'Inscription Validées
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <p className="text-muted-foreground/60 mb-0.5 font-mono text-[9px] uppercase">
                    Nom d'étudiant
                  </p>
                  <p className="font-medium text-foreground text-sm">{currentUser.nom}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/60 mb-0.5 font-mono text-[9px] uppercase">
                    Email validé
                  </p>
                  <p className="font-medium text-foreground text-sm font-mono">
                    {currentUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground/60 mb-0.5 font-mono text-[9px] uppercase">
                    Téléphone
                  </p>
                  <p className="font-medium text-foreground text-sm">{currentUser.telephone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/60 mb-0.5 font-mono text-[9px] uppercase">
                    Adresse fixe
                  </p>
                  <p className="font-medium text-foreground text-sm">{currentUser.adresse}</p>
                </div>
                <div>
                  <p className="text-muted-foreground/60 mb-0.5 font-mono text-[9px] uppercase">
                    Etablissement secondaire de provenance
                  </p>
                  <p className="font-medium text-foreground text-sm">
                    {currentUser.ancienne_ecole}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground/60 mb-0.5 font-mono text-[9px] uppercase">
                    Source d'Information
                  </p>
                  <p className="font-medium text-foreground text-sm">
                    {currentUser.source_alpha_prefac}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Notifications sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--card-border)] bg-card p-6 shadow-sm flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]/40 mb-4">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-[var(--accent-gold)] flex items-center gap-1.5">
                    <span>🔔</span> Notifications en direct
                  </h3>
                  <span className="rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 font-mono animate-pulse">
                    Live
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-muted-foreground italic">
                        Aucune nouvelle annonce.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="rounded-xl bg-black/25 border border-[var(--card-border)]/50 p-4 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-[13px] text-foreground">{notif.titre}</p>
                          <span className="text-[9px] text-[var(--accent-gold)] font-mono">
                            {notif.type === "globale" ? "📢 Annonce" : "✉️ Direct"}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[var(--card-border)]/40 text-center">
                <p className="text-[10px] text-muted-foreground">
                  ALPHA Préfac Platform 2026. <br />
                  <span className="text-[var(--accent-gold)] font-semibold">
                    Stay Focus. Atteins ton université de rêve.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
