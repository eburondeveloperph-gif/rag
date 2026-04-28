import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDjmcE7CiKrNpSnu20gFB2cG620HU36Zqg",
  authDomain: "gen-lang-client-0836251512.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0836251512-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0836251512",
  storageBucket: "gen-lang-client-0836251512.firebasestorage.app",
  messagingSenderId: "811711024905",
  appId: "1:811711024905:web:b805531d56342ba41b8dd8",
  measurementId: "G-CEGJCJ914Y"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const syncAuditLogToFirebase = async (log: any) => {
  try {
    const logsRef = collection(db, "auditLogs");
    await addDoc(logsRef, log);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

export const getFirebaseAuditLogs = async () => {
    try {
        const logsRef = collection(db, "auditLogs");
        const q = query(logsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting documents: ", error);
        return [];
    }
}
