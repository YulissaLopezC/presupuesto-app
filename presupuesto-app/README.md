# Mi Presupuesto App

Aplicación de control financiero personal. Frontend estático en GitHub Pages + Firebase (Auth + Firestore).

## Stack

- **Frontend**: HTML + CSS + JS vanilla (módulos ES6)
- **Auth**: Firebase Authentication (email/password)
- **DB**: Cloud Firestore
- **Hosting**: GitHub Pages

## Estructura

```
presupuesto-app/
├── firebase-config.js       # Configuración Firebase (editar con tus credenciales)
├── firestore.rules          # Reglas de seguridad Firestore
├── index.html               # Redirige al login o dashboard según sesión
│
├── pages/
│   ├── login.html           # Login + Registro
│   ├── dashboard.html       # Resumen del mes actual
│   ├── expenses.html        # Registro diario de gastos
│   ├── budget.html          # Configurar presupuesto mensual
│   ├── comparison.html      # Presupuestado vs real
│   ├── envelopes.html       # Cajitas / sobres (hoja NU)
│   └── categories.html      # Gestión de categorías
│
├── modules/
│   ├── auth.js              # Login, registro, logout, guardia de sesión
│   ├── db.js                # Todas las operaciones con Firestore
│   ├── budget.js            # Lógica de presupuesto mensual
│   └── expenses.js          # Lógica de gastos
│
└── assets/
    ├── style.css            # Estilos globales + variables CSS
    ├── utils.js             # Formateo, fechas, cálculos puros
    └── ui.js                # Componentes UI reutilizables
```

## Setup inicial

### 1. Crear proyecto en Firebase
1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear proyecto nuevo
3. Activar **Authentication** → Sign-in method → Email/Password
4. Activar **Firestore Database** → Modo producción

### 2. Obtener credenciales
1. Firebase Console → Configuración del proyecto (⚙️) → Tu app web
2. Registrar app web → Copiar el objeto `firebaseConfig`
3. Pegar en `firebase-config.js`

### 3. Subir reglas de Firestore
1. Firebase Console → Firestore → Pestaña Reglas
2. Copiar y pegar el contenido de `firestore.rules`
3. Publicar

### 4. Desplegar en GitHub Pages
1. Crear repositorio en GitHub
2. Subir todos los archivos
3. Settings → Pages → Branch: main → Save
4. Tu app estará en `https://tu-usuario.github.io/presupuesto-app/`

## Módulos disponibles

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Login / Registro | ✅ Listo | Autenticación completa |
| Dashboard | 🔜 Próximo | Resumen del mes |
| Registro diario | 🔜 Próximo | Ingresar gastos |
| Presupuesto | 🔜 Próximo | Configurar por mes |
| Comparativo | 🔜 Próximo | Real vs presupuestado |
| Cajitas | 🔜 Próximo | Hoja NU |
| Categorías | 🔜 Próximo | Gestión propia |
| Metas de ahorro | ✅ Listo | Calculadora de metas |

## Convenciones del código

- Cada módulo en `/modules/` exporta funciones puras — sin manipulación de DOM
- Cada página importa solo los módulos que necesita
- Todo acceso a Firestore pasa por `db.js` — nunca directo desde la página
- Todo acceso a Auth pasa por `auth.js`
- Funciones de formato y cálculo en `utils.js`
