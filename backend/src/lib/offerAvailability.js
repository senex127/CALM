const prisma = require('./prisma');
const { getIO } = require('./socket');

const HOLDS_CAPACITY = ['PENDING', 'CONFIRMED'];

/**
 * Recalcule la disponibilité courante d'une offre — mêmes règles que la cascade de
 * réservation.service.js (section 4 du cahier technique), en lecture seule.
 */
async function getOfferAvailability(offerId) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) return null;

  const [held, waitlisted] = await Promise.all([
    prisma.reservation.aggregate({ where: { offerId, status: { in: HOLDS_CAPACITY } }, _sum: { quantity: true } }),
    prisma.reservation.count({ where: { offerId, status: 'WAITLISTED' } }),
  ]);
  const taken = held._sum.quantity || 0;

  return {
    offerId,
    totalCapacity: offer.totalCapacity,
    taken,
    remaining: offer.totalCapacity != null ? Math.max(0, offer.totalCapacity - taken) : null,
    waitlisted,
    full: offer.totalCapacity != null && taken >= offer.totalCapacity,
  };
}

// Diffusée uniquement aux clients qui regardent activement cette offre (room `offer:<id>`,
// voir lib/socket.js) — pas un broadcast global à chaque réservation sur le site entier.
// Best-effort : ne doit jamais faire échouer l'action déclenchante (réservation, décision
// admin...) si l'émission échoue ou si aucun client n'est connecté.
async function broadcastAvailability(offerId) {
  try {
    const io = getIO();
    if (!io) return;
    const availability = await getOfferAvailability(offerId);
    if (availability) io.to(`offer:${offerId}`).emit('offer:availability', availability);
  } catch (err) {
    console.error('[socket] Échec de diffusion de la disponibilité :', err.message);
  }
}

module.exports = { getOfferAvailability, broadcastAvailability };
