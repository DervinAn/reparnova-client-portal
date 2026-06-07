import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApLyz9s1Gyrzd22zy-pAv-8Ls_txrfmgk",
  authDomain: "repair-nova.firebaseapp.com",
  projectId: "repair-nova",
  storageBucket: "repair-nova.firebasestorage.app",
  messagingSenderId: "535415057777",
  appId: "1:535415057777:android:52e24bf5450b829cb29ad0",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId,
  );
}

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  return getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig as {
        apiKey: string;
        authDomain: string;
        projectId: string;
        messagingSenderId: string;
        appId: string;
        storageBucket?: string;
      });
}

export function getFirebaseDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}
