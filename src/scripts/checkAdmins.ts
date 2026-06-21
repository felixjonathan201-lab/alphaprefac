import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const q = await getDocs(collection(db, "admins"));
  q.forEach((d) => console.log(d.id, d.data()));
  process.exit(0);
}

run();
