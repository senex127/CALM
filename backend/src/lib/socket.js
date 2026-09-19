const { Server } = require('socket.io');

// Socket.IO plutôt qu'une lib WebSocket "pure" (ws) : le Node.js Selector cPanel d'O2Switch
// tourne derrière Passenger/Apache, dont le support de l'upgrade WebSocket dépend de la
// configuration exacte de l'hébergement (voir README, section Déploiement) — pas garanti sur
// un mutualisé. Socket.IO retombe automatiquement en polling HTTP long si l'upgrade échoue,
// là où une connexion WebSocket pure casserait net. Aucune donnée sensible ne transite ici :
// uniquement des évènements publics (une offre a changé, sa disponibilité a bougé).
let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5174',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Un client ne reçoit les mises à jour fines de disponibilité (places restantes, complet…)
    // que pour l'offre qu'il regarde activement — pas un broadcast de tout à tout le monde.
    // Réponse immédiate à celui qui s'abonne (pas seulement aux prochains changements) : sans
    // ça la page resterait sans donnée de disponibilité jusqu'à la première réservation de
    // quelqu'un d'autre. `require` local plutôt qu'en haut du fichier : évite une dépendance
    // circulaire avec offerAvailability.js, qui a besoin de getIO() depuis ce même module.
    socket.on('offer:subscribe', async (offerId) => {
      if (typeof offerId !== 'string' || !offerId) return;
      socket.join(`offer:${offerId}`);
      const { getOfferAvailability } = require('./offerAvailability');
      const availability = await getOfferAvailability(offerId).catch(() => null);
      if (availability) socket.emit('offer:availability', availability);
    });
    socket.on('offer:unsubscribe', (offerId) => {
      if (typeof offerId === 'string' && offerId) socket.leave(`offer:${offerId}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
