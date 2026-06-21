import { useEffect, useState } from "react";
import { auth, db, UserProfile } from "@/lib/firebase";
import { onSnapshot, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen,
  PhoneCall,
  Loader2,
  RefreshCw,
} from "lucide-react";
import logo from "@/assets/alpha-prefac-logo.asset.json";

interface ApplicationStatusProps {
  userId?: string;
  className?: string;
}

export function ApplicationStatus({ userId, className = "" }: ApplicationStatusProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    const setupListener = (uid: string) => {
      if (!db) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const userDocRef = doc(db, "users", uid);

      unsubscribe = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setCurrentUser(data);
            setError(null);
            setLastUpdated(new Date());

            // Trigger visual pulse to show real-time update has occurred
            setPulseActive(true);
            const timer = setTimeout(() => setPulseActive(false), 1200);
            return () => clearTimeout(timer);
          } else {
            setError("Profil utilisateur introuvable dans la base de données.");
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error subscribing to account status:", err);
          setError("Erreur de connexion en temps réel avec la base de données.");
          setLoading(false);
        },
      );
    };

    // If userId prop is passed, listen to that user. Otherwise use active auth user
    if (userId) {
      setupListener(userId);
    } else {
      if (!auth) {
        setLoading(false);
        return;
      }

      const authUnsub = auth.onAuthStateChanged((user) => {
        if (user) {
          setupListener(user.uid);
        } else {
          setCurrentUser(null);
          setLoading(false);
        }
      });

      return () => {
        authUnsub();
        unsubscribe();
      };
    }

    return () => {
      unsubscribe();
    };
  }, [userId]);

  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-[var(--card-border)] bg-card/45 p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[220px] ${className}`}
      >
        <Loader2 className="h-8 w-8 text-[var(--accent-gold)] animate-spin" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Chargement de votre dossier...</p>
          <p className="text-xs text-muted-foreground">
            Consultation sécurisée des données d'inscription
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-3 ${className}`}
      >
        <div className="flex items-center gap-2.5 text-rose-400">
          <AlertTriangle className="h-5 w-5" />
          <h4 className="font-bold text-sm">Échec du suivi en temps réel</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
        <p className="text-[10px] text-muted-foreground/60">
          Vérifiez votre connexion internet ou reconnectez-vous.
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground text-xs ${className}`}
      >
        Aucune donnée d'évaluation disponible. Veuillez vous connecter pour suivre votre
        admissibilité.
      </div>
    );
  }

  const status = currentUser.statut_compte || "en_attente";

  // Define steps based on current status
  const steps = [
    {
      id: 1,
      title: "Candidature Reçue",
      description: "Formulaire d'inscription rempli et validé.",
      status: "complete", // Always completed if they exist here
    },
    {
      id: 2,
      title: "Analyse du Dossier",
      description: "Examen académique des objectifs et des lacunes.",
      status: status === "approuve" ? "complete" : status === "en_attente" ? "active" : "failed",
    },
    {
      id: 3,
      title: "Décision Finale",
      description:
        status === "approuve"
          ? "Admission accordée et accès de pointe débloqué !"
          : status === "suspendu"
            ? "Accès temporairement suspendu."
            : status === "refuse"
              ? "Candidature non retenue."
              : "Décisions académiques en cours d'attribution.",
      status:
        status === "approuve"
          ? "complete"
          : status === "suspendu" || status === "refuse"
            ? "failed"
            : "upcoming",
    },
  ];

  // Map status values to visual styling properties
  const statusConfig = {
    en_attente: {
      colorClass:
        "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border-[var(--accent-gold)]/25",
      dotClass: "bg-[var(--accent-gold)]",
      title: "Dossier en attente d'approbation",
      badgeText: "⌛ ÉVALUATON EN COURS",
      icon: <Clock className="h-6 w-6 text-[var(--accent-gold)]" />,
      tagline: "Des conseillers d'admission vérifient actuellement vos données de dossier.",
      helpText:
        "Note : l'évaluation dure généralement moins de 48 heures ouvrables. Dès approbation administrative, vos cours s'ouvriront automatiquement en temps réel sur cet écran.",
    },
    approuve: {
      colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      dotClass: "bg-emerald-400",
      title: "Inscription approuvée et complète !",
      badgeText: "✓ ACCÈS ACADÉMIQUE DE BLOQUÉ",
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      tagline: "Félicitations ! Vous êtes officiellement admis dans la cohorte ALPHA Préfac.",
      helpText:
        "Vos outils d'apprentissage de pointe, fiches, dissertations corrigées ainsi que l'assistance des coachs sont entièrement accessibles.",
    },
    suspendu: {
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/25",
      dotClass: "bg-amber-500",
      title: "Compte suspendu d'urgence",
      badgeText: "⛔ ACCÈS RESTREINT",
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      tagline: "L'accès à votre espace a été temporairement gelé par l'administration ALPHA.",
      helpText:
        "Cette décision peut être due à une absence d'entretien académique de validation, un ajustement administratif de dossier ou à un défaut de contact. Veuillez solliciter immédiatement le secrétariat.",
    },
    refuse: {
      colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/25",
      dotClass: "bg-rose-400",
      title: "Candidature non retenue",
      badgeText: "✕ ADMISSION NON RETENUE",
      icon: <XCircle className="h-6 w-6 text-rose-400" />,
      tagline:
        "L'évaluation de votre dossier n'a pas permis de valider votre inscription cette année.",
      helpText:
        "Nos cohortes de préparation ont un nombre de places extrêmement restreint pour maintenir un suivi haut de gamme. Nous vous remercions chaleureusement pour votre intérêt envers ALPHA Préfac.",
    },
  };

  const currentConfig =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.en_attente;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`rounded-2xl border border-[var(--card-border)] bg-gradient-to-b from-card to-card/90 p-6 md:p-8 relative overflow-hidden shadow-xl ${className}`}
    >
      {/* Real-time sync tracker in the corner */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full border border-[var(--card-border)]/60">
        <span className={`relative flex h-2 w-2`}>
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseActive ? "bg-cyan-400" : currentConfig.dotClass} opacity-75`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-300 ${pulseActive ? "bg-cyan-300" : currentConfig.dotClass}`}
          ></span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          {pulseActive ? (
            <>
              <RefreshCw className="h-2 w-2 animate-spin text-cyan-400" />
              Mise à jour directe...
            </>
          ) : (
            `Écoute en direct `
          )}
        </span>
      </div>

      {/* Primary header status */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5 pb-6 border-b border-[var(--card-border)]/50">
        <div className={`p-3 rounded-2xl w-fit border ${currentConfig.colorClass}`}>
          {currentConfig.icon}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-widest font-mono uppercase ${currentConfig.colorClass} border`}
            >
              {currentConfig.badgeText}
            </span>
            <span className="text-muted-foreground text-[10px] font-mono">
              Mis à jour : {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-sans mt-1">
            {currentConfig.title}
          </h3>
          <p className="text-xs text-muted-foreground">{currentConfig.tagline}</p>
        </div>
      </div>

      {/* Progress timeline visualization */}
      <div className="py-8">
        <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 mb-6">
          Suivi de progression de votre dossier
        </p>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connector line for large screens */}
          <div className="hidden md:block absolute top-[18px] left-[15%] right-[15%] h-0.5 bg-[var(--card-border)]/40 z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--accent-gold)] to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: status === "approuve" ? "100%" : "50%" }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>

          {steps.map((step, idx) => {
            const isLatestActive =
              (step.id === 1 && status === "en_attente") ||
              (step.id === 2 && status === "en_attente") ||
              (step.id === 3 &&
                (status === "approuve" || status === "suspendu" || status === "refuse"));

            return (
              <div
                key={step.id}
                className="relative z-10 flex md:flex-col items-start gap-4 md:gap-3 group"
              >
                {/* Step indicator circle */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold transition-all duration-300 ${
                    step.status === "complete"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                      : step.status === "active"
                        ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border-[var(--accent-gold)]/40 animate-pulse shadow-[0_0_12px_rgba(212,175,55,0.2)]"
                        : step.status === "failed"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                          : "bg-black/30 text-muted-foreground border-[var(--card-border)]/80"
                  }`}
                >
                  {step.status === "complete"
                    ? "✓"
                    : step.status === "failed"
                      ? "✕"
                      : `0${step.id}`}
                </div>

                <div className="space-y-1">
                  <h4
                    className={`text-sm font-bold tracking-tight ${
                      isLatestActive ? "text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-snug">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanatory dynamic content and actions depending on status */}
      <div className="rounded-xl bg-black/30 border border-[var(--card-border)]/55 p-4 md:p-5 space-y-4">
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p className="font-mono text-[9px] uppercase text-muted-foreground/60 tracking-wider mb-2">
            Notesadministratives importantes :
          </p>
          {currentConfig.helpText}
        </div>

        {/* Action button triggers dynamically */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {status === "approuve" && (
            <a
              href="#cours"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-black px-5 py-2.5 text-xs font-extrabold hover:bg-emerald-400 shadow-md transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Accéder à mes cours débloqués
              <ArrowRight className="h-3 w-3" />
            </a>
          )}

          {status === "en_attente" && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-white/5 border border-white/10 px-3 py-2 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-gold)] animate-ping shrink-0" />
              <span>Dossier prioritaire d'admission. Suivi d'urgence disponible.</span>
            </div>
          )}

          {status === "suspendu" && (
            <a
              href="tel:+509" // Custom standard Haitian representative tag or generic contact link
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-black px-4 py-2.5 text-xs font-extrabold hover:bg-amber-400 shadow-md transition-all"
            >
              <PhoneCall className="h-4 w-4" />
              Appeler un administrateur ALPHA
            </a>
          )}

          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--card-border)]/80 bg-transparent hover:bg-white/5 text-muted-foreground hover:text-white px-4 py-2.5 text-xs font-semibold select-none cursor-pointer transition-colors"
          >
            Contacter le support d'admission
          </Link>
        </div>
      </div>

      {/* Personal educational info preview card */}
      <div className="mt-6 pt-5 border-t border-[var(--card-border)]/40 flex flex-wrap gap-x-6 gap-y-2.5 text-[11px] text-muted-foreground/80">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span>
            Filière visée :{" "}
            <b className="text-foreground font-mono">
              {currentUser.faculte_visee || "Non définie"}
            </b>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span>
            Créé le :{" "}
            <b className="text-foreground">{currentUser.createdAt ? "Inscrit" : "En cours"}</b>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span>
            Identifiant étudiant :{" "}
            <b className="text-foreground text-[10px] font-mono break-all">{currentUser.uid}</b>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
