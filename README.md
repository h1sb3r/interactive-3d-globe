# 🌍 Quiz des Capitales - Interactive 3D Globe

Un globe interactif en 3D, développé avec [React](https://reactjs.org/) et [Vite](https://vitejs.dev/), déployé automatiquement sur [GitHub Pages](https://h1sb3r.github.io/interactive-3d-globe/).

## 🚀 Démo en ligne

👉 [Accéder à l’application](https://h1sb3r.github.io/interactive-3d-globe/)

---

## ✨ Fonctionnalités principales

- Visualisation interactive d’un globe terrestre
- Zoom, rotation, interaction à la souris/tactile
- Données cartographiques en D3/TopoJSON
- (Ajouter ici d’autres fonctionnalités si besoin : markers, overlays, animations…)

---

## 🛠️ Installation & développement local

1. **Clone ce dépôt :**

   ```bash
   git clone https://github.com/h1sb3r/interactive-3d-globe.git
   cd interactive-3d-globe
Installe les dépendances :

bash
Copier
Modifier
npm install
Démarre le serveur de développement :

bash
Copier
Modifier
npm run dev
Ouvre http://localhost:5173 dans ton navigateur.

📦 Déploiement sur GitHub Pages
Ce projet utilise gh-pages pour déployer le site dans la branche gh-pages.

Pour générer puis déployer :

bash
Copier
Modifier
npm run build
npm run deploy
L’application sera accessible à https://h1sb3r.github.io/interactive-3d-globe/

📁 Structure du projet
bash
Copier
Modifier
.
├── components/        # Composants React du globe
├── data/              # Données cartographiques et JSON
├── services/          # Services et utilitaires
├── index.html
├── App.tsx
├── vite.config.ts
└── ...
🧰 Dépendances principales
React

Vite

d3

topojson-client

(Ajoute ici Three.js, react-three-fiber, Tailwind, etc. selon ton code)
