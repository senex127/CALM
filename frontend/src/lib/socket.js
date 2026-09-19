import { io } from 'socket.io-client';

// Une seule connexion partagée par toute l'app (pas une par composant) : plusieurs pages
// peuvent s'abonner/désabonner à des évènements sans rouvrir une connexion à chaque
// changement de route. `autoConnect: true` — pas besoin d'auth, ce ne sont que des évènements
// publics (voir backend/src/lib/socket.js).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
// Le client socket.io se connecte à la racine du serveur, pas au préfixe /api de l'API REST.
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  // Polling seulement : sur cet hébergement (O2Switch/Passenger), la tentative d'upgrade vers
  // un vrai WebSocket échoue avec des frames corrompues ("reserved bits are on") — un
  // intermédiaire sur le chemin (proxy/Apache) altère le flux binaire au lieu de le laisser
  // passer tel quel. Le polling HTTP long fonctionne correctement ; l'upgrade automatique de
  // socket.io ne faisait que produire une erreur en boucle sans jamais aboutir.
  transports: ['polling'],
});
