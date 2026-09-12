const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  message: { error: 'Limite de requêtes atteinte.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Formulaire de réservation : évite qu'un client (ou un bot) sature une offre très demandée
const reservationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: { error: 'Trop de tentatives de réservation, réessayez dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload d'image : opération plus coûteuse (écriture disque) qu'un appel API classique
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 30,
  message: { error: 'Trop d\'envois d\'images, réessayez dans 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter, reservationLimiter, uploadLimiter };
