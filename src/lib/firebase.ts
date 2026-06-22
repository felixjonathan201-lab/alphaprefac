import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  FieldValue,
  enableMultiTabIndexedDbPersistence,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import configData from "../../firebase-applet-config.json";

// Dynamic configuration from firebase-applet-config.json to work seamlessly on any connected Firebase project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? configData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? configData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? configData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? configData.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? configData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? configData.appId,
};

const isProduction = import.meta.env.PROD;

export const databaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ??
  import.meta.env.VITE_FIREBASE_DATABASE ??
  configData.firestoreDatabaseId ??
  (isProduction ? undefined : "ai-studio-7d1a1e88-5337-4396-8b6d-ee1ddad47660");

export const ADMIN_EMAIL = "felixjonathan201@gmail.com";

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = typeof window !== "undefined" ? getAuth(firebaseApp) : null;
export const storage = typeof window !== "undefined" ? getStorage(firebaseApp) : null;

// Initialize Firestore targeting the specific provisioned database ID or falling back to default for custom projects
const targetDatabaseId = databaseId && databaseId !== "(default)" ? databaseId : undefined;

export const db =
  typeof window !== "undefined"
    ? targetDatabaseId
      ? getFirestore(firebaseApp, targetDatabaseId)
      : getFirestore(firebaseApp)
    : null;

// Enable Local Offline Persistence to handle connection drops or sandboxed frames silently
if (typeof window !== "undefined" && db) {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      enableIndexedDbPersistence(db).catch((e) => {
        console.warn("Firestore offline persistence fallback failed: ", e);
      });
    } else if (err.code === "unimplemented") {
      // The current browser does not support all of the features required to enable persistence
      console.warn("Firestore offline persistence is unimplemented in this browser: ", err);
    } else {
      console.warn("Could not enable Firestore persistence: ", err);
    }
  });
}

export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  uid: string;
  nom: string;
  email: string;
  telephone: string;
  role: "etudiant" | "moderateur" | "admin" | "super_admin";
  statut_compte: "en_attente" | "approuve" | "suspendu" | "refuse";
  universite: string;
  createdAt: Timestamp | FieldValue | null;
  lastLogin: Timestamp | FieldValue | null;
  formulaire_rempli?: boolean;
  date_naissance?: string;
  adresse?: string;
  ancienne_ecole?: string;
  faculte_visee?: string;
  matiere_lacune?: string;
  source_alpha_prefac?: string;
}

export interface AppNotification {
  id?: string;
  titre: string;
  message: string;
  destinataire: string; // user UID or "all"
  type: "personnelle" | "groupe" | "globale";
  lu: boolean;
  createdAt: Timestamp | FieldValue | null;
  createdBy?: string;
}

export interface ActivityLog {
  id?: string;
  adminUid: string;
  adminEmail: string;
  action:
    | "connexion"
    | "validation_compte"
    | "suppression_utilisateur"
    | "changement_role"
    | "envoi_notification"
    | "suppression_notification"
    | "modification_donnees";
  details: string;
  createdAt: Timestamp | FieldValue | null;
}

/**
 * Récupérer le profil utilisateur depuis Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil utilisateur:", error);
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    throw error;
  }
}

/**
 * Créer un nouveau profil utilisateur dans Firestore lors de l'inscription.
 */
export async function createUserProfile(
  uid: string,
  data: {
    nom: string;
    email: string;
    telephone?: string;
    universite?: string;
    role?: "etudiant" | "moderateur" | "admin" | "super_admin";
  },
): Promise<UserProfile> {
  if (!db) throw new Error("Firestore n'est pas initialisé");
  try {
    const docRef = doc(db, "users", uid);
    const now = serverTimestamp();
    const isDefaultAdmin =
      data.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      data.email.toLowerCase() === "devhaitian@gmail.com";

    const profile: UserProfile = {
      uid,
      nom: data.nom,
      email: data.email,
      telephone: data.telephone || "",
      role: data.role || (isDefaultAdmin ? "admin" : "etudiant"),
      statut_compte: isDefaultAdmin ? "approuve" : "en_attente",
      universite: data.universite || "",
      createdAt: now,
      lastLogin: now,
    };

    await setDoc(docRef, profile);
    return profile;
  } catch (error) {
    console.error("Erreur lors de la création du profil utilisateur:", error);
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    throw error;
  }
}

/**
 * Modifier le profil utilisateur dans Firestore.
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil utilisateur:", error);
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    throw error;
  }
}

/**
 * Supprimer un profil utilisateur de Firestore
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, "users", uid);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erreur lors de la suppression du profil utilisateur:", error);
    throw error;
  }
}

/**
 * Mettre à jour la date de la dernière connexion de l'utilisateur.
 */
export async function updateLastLogin(uid: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la dernière connexion:", error);
    throw error;
  }
}

/**
 * Creates an audit log of admin activity
 */
export async function logAdminActivity(
  adminUid: string,
  adminEmail: string,
  action: ActivityLog["action"],
  details: string,
): Promise<void> {
  if (!db) return;
  try {
    const colRef = collection(db, "activity_logs");
    await addDoc(colRef, {
      adminUid,
      adminEmail,
      action,
      details,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erreur lors de la journalisation de l'activité:", error);
  }
}

/**
 * Send a notification to one, multiple, or all users
 */
export async function sendNotification(
  adminUid: string,
  adminEmail: string,
  data: {
    titre: string;
    message: string;
    type: AppNotification["type"];
    destinataires: string[]; // UID list, or ['all'] for global
  },
): Promise<void> {
  if (!db) return;
  try {
    const colRef = collection(db, "notifications");

    if (data.type === "globale" || data.destinataires.includes("all")) {
      // Send a single global broadcast
      await addDoc(colRef, {
        titre: data.titre,
        message: data.message,
        destinataire: "all",
        type: "globale",
        lu: false,
        createdAt: serverTimestamp(),
        createdBy: adminUid,
      });
    } else {
      // For personal or group, we write an individual doc for each UID to support individual "lu" status tracking!
      for (const uid of data.destinataires) {
        await addDoc(colRef, {
          titre: data.titre,
          message: data.message,
          destinataire: uid,
          type: data.type,
          lu: false,
          createdAt: serverTimestamp(),
          createdBy: adminUid,
        });
      }
    }

    // Log the notifications dispatch activity
    const targetDesc =
      data.type === "globale"
        ? "tous les utilisateurs"
        : `${data.destinataires.length} utilisateur(s)`;
    await logAdminActivity(
      adminUid,
      adminEmail,
      "envoi_notification",
      `Notification envoyée à ${targetDesc} : "${data.titre}"`,
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    throw error;
  }
}

/**
 * Delete a notification from Firestore (only allowed for administrators)
 */
export async function deleteNotification(
  adminUid: string,
  adminEmail: string,
  notificationId: string,
): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, "notifications", notificationId);
    await deleteDoc(docRef);

    // Document activities log
    await logAdminActivity(
      adminUid,
      adminEmail,
      "suppression_notification",
      `Suppression de la notification ID: ${notificationId}`,
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    throw error;
  }
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error logged: ", JSON.stringify(errInfo));
}

// Gallery integration types and services

export interface GalleryPhoto {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Timestamp | FieldValue | null;
  uploadedBy: string;
}

export async function uploadGalleryImage(file: File): Promise<string> {
  const storageInstance = getStorage(firebaseApp);
  if (!storageInstance) throw new Error("Le service de stockage n'est pas prêt.");
  const storageRef = ref(storageInstance, `gallery/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export async function addGalleryPhoto(
  adminUid: string,
  adminEmail: string,
  photo: { title: string; description: string; imageUrl: string },
) {
  if (!db) throw new Error("Le service de base de données n'est pas prêt.");
  try {
    const docRef = await addDoc(collection(db, "gallery"), {
      title: photo.title,
      description: photo.description,
      imageUrl: photo.imageUrl,
      uploadedBy: adminEmail || adminUid,
      createdAt: serverTimestamp(),
    });

    await logAdminActivity(
      adminUid,
      adminEmail,
      "modification_donnees",
      `Ajout de la photo dans la Galerie : ${photo.title} (${docRef.id})`,
    );

    return docRef.id;
  } catch (error) {
    console.error("Erreur d'ajout de photo:", error);
    handleFirestoreError(error, OperationType.WRITE, "gallery");
    throw error;
  }
}

export async function updateGalleryPhoto(
  adminUid: string,
  adminEmail: string,
  photoId: string,
  updatedData: { title: string; description: string },
) {
  if (!db) throw new Error("Le service de base de données n'est pas prêt.");
  try {
    const docRef = doc(db, "gallery", photoId);
    await updateDoc(docRef, {
      title: updatedData.title,
      description: updatedData.description,
    });

    await logAdminActivity(
      adminUid,
      adminEmail,
      "modification_donnees",
      `Modification de la photo ID Galerie: ${photoId} -> ${updatedData.title}`,
    );
  } catch (error) {
    console.error("Erreur de modification de la photo:", error);
    handleFirestoreError(error, OperationType.WRITE, `gallery/${photoId}`);
    throw error;
  }
}

export async function deleteGalleryPhoto(adminUid: string, adminEmail: string, photoId: string) {
  if (!db) throw new Error("Le service de base de données n'est pas prêt.");
  try {
    const docRef = doc(db, "gallery", photoId);
    await deleteDoc(docRef);

    await logAdminActivity(
      adminUid,
      adminEmail,
      "modification_donnees",
      `Suppression de la photo ID Galerie: ${photoId}`,
    );
  } catch (error) {
    console.error("Erreur de suppression de la photo:", error);
    handleFirestoreError(error, OperationType.WRITE, `gallery/${photoId}`);
    throw error;
  }
}
