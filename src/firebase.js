import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  limit
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHlFCVAbw_76Dh5hgpldp0hxR7g7DoYpY",
  authDomain: "dewa-1df85.firebaseapp.com",
  projectId: "dewa-1df85",
  storageBucket: "dewa-1df85.firebasestorage.app",
  messagingSenderId: "245717678681",
  appId: "1:245717678681:web:409d208f35000329e38f48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Document reference for smart fan status
export const FAN_DOC_PATH = "smart_fan/status";
export const fanDocRef = doc(db, "smart_fan", "status");
export const logsCollectionRef = collection(db, "smart_fan_logs");

// Subscribe to real-time fan status updates
export const subscribeToFanStatus = (callback, onError) => {
  return onSnapshot(
    fanDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        // Initialize default document if it doesn't exist yet
        const defaultData = {
          power: false,
          mode: "auto", // "auto" | "manual"
          speed: 2,     // 1 (Low), 2 (Medium), 3 (High)
          faceDetected: false,
          lastFaceSeen: null,
          espOnline: false,
          lastHeartbeat: null,
          streamUrl: "",
          updatedAt: new Date().toISOString()
        };
        setDoc(fanDocRef, defaultData, { merge: true }).catch(console.error);
        callback(defaultData);
      }
    },
    (error) => {
      console.warn("Firestore listener error (falling back to local state):", error);
      if (onError) onError(error);
    }
  );
};

// Update fan state in Firestore
export const updateFanState = async (updates) => {
  try {
    await setDoc(
      fanDocRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
        lastClientUpdate: serverTimestamp()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Gagal update Firestore:", error);
    return { success: false, error };
  }
};

// Log activity event
export const logActivity = async (message, type = "info") => {
  try {
    await addDoc(logsCollectionRef, {
      message,
      type, // 'info' | 'warning' | 'success' | 'danger'
      timestamp: serverTimestamp(),
      createdAt: new Date().toLocaleTimeString("id-ID")
    });
  } catch (err) {
    console.warn("Could not write log to Firestore:", err);
  }
};

export { app, db };
