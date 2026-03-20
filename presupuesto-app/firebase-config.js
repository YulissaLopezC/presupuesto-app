// ============================================================
// firebase-config.js
// Configuración central de Firebase.
// INSTRUCCIONES: Reemplaza los valores con los de tu proyecto
// en Firebase Console > Configuración del proyecto > Tu app web
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyD7TDp9_6h-mVSVKyHVsjeP1VQULDsARWU",
  authDomain:        "presupuesto-app-c5a34.firebaseapp.com",
  projectId:         "presupuesto-app-c5a34",
  storageBucket:     "presupuesto-app-c5a34.firebasestorage.app",
  messagingSenderId: "67281067536",
  appId:             "1:67281067536:web:fc593a695f0edb8da17495"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
