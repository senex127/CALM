import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5174, host: true },
    // Sous-chemin de déploiement — quand l'app est servie depuis un sous-dossier d'un
    // domaine existant (ex. "https://exemple.fr/reservation") plutôt qu'un sous-domaine
    // dédié, les URLs des fichiers JS/CSS générés doivent inclure ce préfixe, sinon le
    // navigateur les cherche à la racine du domaine et récupère autre chose (ou un 404).
    // Racine ("/") par défaut, comme en développement. Voir VITE_BASE_PATH dans .env.example
    // et main.jsx (React Router lit ce même préfixe via import.meta.env.BASE_URL).
    base: env.VITE_BASE_PATH || '/',
  };
});
