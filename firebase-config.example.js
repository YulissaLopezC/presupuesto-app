// ============================================================
// firebase-config.example.js
// ↑ Este archivo SÍ está en el repo — es solo la plantilla.
//
// INSTRUCCIONES PARA CONFIGURAR:
//   1. Copia este archivo y renómbralo a: firebase-config.js
//   2. Ve a Firebase Console → Configuración del proyecto → Tu app web
//   3. Reemplaza cada valor con los de tu proyecto
//   4. firebase-config.js está en .gitignore — nunca se subirá
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "REEMPLAZA_CON_TU_API_KEY",
  authDomain:        "REEMPLAZA_CON_TU_PROJECT.firebaseapp.com",
  projectId:         "REEMPLAZA_CON_TU_PROJECT_ID",
  storageBucket:     "REEMPLAZA_CON_TU_PROJECT.appspot.com",
  messagingSenderId: "REEMPLAZA_CON_TU_SENDER_ID",
  appId:             "REEMPLAZA_CON_TU_APP_ID"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
