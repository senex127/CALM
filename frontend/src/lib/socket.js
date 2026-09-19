import { io } from 'socket.io-client';

// Une seule connexion partagée par toute l'app (pas une par composant) : plusieurs pages
// peuvent s'abonner/désabonner à des évènements sans rouvrir une connexion à chaque
// changement de route. `autoConnect: true` — pas besoin d'auth, ce ne sont que des évènements
// publics (voir backend/src/lib/socket.js).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
// Le client socket.io se connecte à la racine du serveur, pas au préfixe /api de l'API REST.
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export const socket = io(SOCKET_URL, { autoConnect: true, withCredentials: true });
