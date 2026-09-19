const prisma = require('../lib/prisma');
const { sendMail } = require('../lib/mailer');
const { runQueued } = require('../lib/offerQueue');
const { notify, notifyAdmins } = require('./notification.service');
const { broadcastAvailability } = require('../lib/offerAvailability');

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'WAITLISTED'];
const HOLDS_CAPACITY = ['PENDING', 'CONFIRMED'];

const STATUS_LABELS = {
  PENDING: 'en attente de validation',
  CONFIRMED: 'confirmée',
  REFUSED: 'refusée',
  CANCELLED: 'annulée',
  WAITLISTED: 'en liste d’attente',
  NO_SHOW: 'marquée non-présentée',
};

// Double canal à chaque changement de statut : email (pour être prévenu même hors du site)
// + notification in-app (cloche dans la navbar). Les deux sont best-effort — un échec de
// l'un ne doit jamais empêcher l'autre ni casser la requête HTTP en cours (voir appels `.catch`).
function notifyStatus(reservation, offer, user) {
  const content = `${offer.title} — réservation ${STATUS_LABELS[reservation.status]}`;
  return Promise.all([
    sendMail({
      to: user.email,
      subject: content,
      html: `<p>Bonjour ${user.name},</p><p>Votre réservation pour <strong>${offer.title}</strong> est désormais <strong>${STATUS_LABELS[reservation.status]}</strong>.</p>`,
    }),
    notify(user.id, 'RESERVATION_STATUS', content),
  ]);
}

/**
 * Crée une réservation en appliquant les trois vérifications en cascade
 * décrites dans le cahier technique (section 4) :
 *   1. limite par personne dépassée → rejet
 *   2. capacité totale atteinte → liste d'attente
 *   3. validation requise → en attente, sinon confirmée directement
 *
 * Le verrou posé sur la ligne Offer sérialise les tentatives concurrentes
 * sur la même offre : deux clients ne peuvent pas obtenir la dernière place
 * en même temps. `runQueued` sérialise déjà ces tentatives en amont, en mémoire,
 * pour ne pas ouvrir une transaction Postgres par requête reçue lors d'un pic
 * (voir lib/offerQueue.js).
 */
async function createReservation({ offerId, userId, quantity, comment }) {
  return runQueued(offerId, () => prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Offer" WHERE id = ${offerId} FOR UPDATE`;

    const offer = await tx.offer.findUnique({ where: { id: offerId } });
    if (!offer || offer.status !== 'PUBLISHED') {
      const err = new Error('Offre indisponible');
      err.status = 404;
      throw err;
    }
    if (offer.registrationDeadline && offer.registrationDeadline < new Date()) {
      const err = new Error('Le délai de réservation est dépassé');
      err.status = 409;
      throw err;
    }

    // 1. Limite par personne (agrégée sur les réservations actives de ce client pour cette offre)
    const mine = await tx.reservation.aggregate({
      where: { offerId, userId, status: { in: ACTIVE_STATUSES } },
      _sum: { quantity: true },
    });
    const alreadyHeld = mine._sum.quantity || 0;
    if (alreadyHeld + quantity > offer.limitPerPerson) {
      const err = new Error(`Limite atteinte : ${offer.limitPerPerson} par personne maximum sur cette offre`);
      err.status = 409;
      throw err;
    }

    // 2. Capacité totale
    let status;
    let waitlistRank = null;
    if (offer.totalCapacity != null) {
      const held = await tx.reservation.aggregate({
        where: { offerId, status: { in: HOLDS_CAPACITY } },
        _sum: { quantity: true },
      });
      const taken = held._sum.quantity || 0;
      if (taken + quantity > offer.totalCapacity) {
        const waitlisted = await tx.reservation.count({ where: { offerId, status: 'WAITLISTED' } });
        status = 'WAITLISTED';
        waitlistRank = waitlisted + 1;
      }
    }

    // 3. Validation manuelle (si pas déjà mis en liste d'attente à l'étape précédente)
    if (!status) status = offer.requiresValidation ? 'PENDING' : 'CONFIRMED';

    const reservation = await tx.reservation.create({
      data: { offerId, userId, quantity, status, waitlistRank, formAnswers: comment ? JSON.stringify({ comment }) : null },
      include: { offer: true, user: true },
    });

    return reservation;
  }).then(async (reservation) => {
    await notifyStatus(reservation, reservation.offer, reservation.user).catch(() => {});
    // En attente de validation manuelle : les admins doivent le savoir pour agir, contrairement
    // aux statuts CONFIRMED/WAITLISTED qui ne demandent rien de leur part.
    if (reservation.status === 'PENDING') {
      await notifyAdmins(
        'RESERVATION_PENDING',
        `${reservation.user.name} demande « ${reservation.offer.title} » — à valider.`
      ).catch(() => {});
    }
    // Diffuse en direct aux autres clients qui regardent cette offre : places restantes,
    // liste d'attente, complet — sans qu'ils aient à recharger la page (voir OfferPage.jsx).
    await broadcastAvailability(reservation.offerId);
    return reservation;
  }));
}

/**
 * Promeut le premier de la liste d'attente quand une place se libère
 * (annulation, refus, no-show). Le nouveau statut suit la même règle de
 * validation que la création initiale.
 */
async function promoteWaitlist(offerId) {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.offer.findUnique({ where: { id: offerId } });
    if (!offer) return null;

    const next = await tx.reservation.findFirst({
      where: { offerId, status: 'WAITLISTED' },
      orderBy: { waitlistRank: 'asc' },
      include: { user: true },
    });
    if (!next) return null;

    const status = offer.requiresValidation ? 'PENDING' : 'CONFIRMED';
    const updated = await tx.reservation.update({
      where: { id: next.id },
      data: { status, waitlistRank: null },
      include: { offer: true, user: true },
    });
    return updated;
    // Note MVP : pas encore de délai de confirmation avec expiration automatique
    // (cf. cahier technique section 4) — à ajouter via un cron dédié en V2.
  }).then(async (updated) => {
    if (updated) {
      await notifyStatus(updated, updated.offer, updated.user).catch(() => {});
      await broadcastAvailability(offerId);
    }
    return updated;
  });
}

async function decideReservation(reservationId, actorId, decision) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { offer: true, user: true },
  });
  if (!reservation) return null; // droit d'agir déjà vérifié par requireRole('ADMIN') sur la route
  if (reservation.status !== 'PENDING') {
    const err = new Error('Cette réservation a déjà été traitée');
    err.status = 409;
    throw err;
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: decision, processedAt: new Date(), processedBy: actorId },
    include: { offer: true, user: true },
  });
  await notifyStatus(updated, updated.offer, updated.user).catch(() => {});
  await broadcastAvailability(reservation.offerId);

  if (decision === 'REFUSED') await promoteWaitlist(reservation.offerId);
  return updated;
}

async function cancelReservation(reservationId, userId) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation || reservation.userId !== userId) return null;
  if (!['PENDING', 'CONFIRMED', 'WAITLISTED'].includes(reservation.status)) {
    const err = new Error('Cette réservation ne peut plus être annulée');
    err.status = 409;
    throw err;
  }

  const wasHoldingCapacity = HOLDS_CAPACITY.includes(reservation.status);
  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'CANCELLED' },
    include: { offer: true, user: true },
  });
  await notifyStatus(updated, updated.offer, updated.user).catch(() => {});
  await broadcastAvailability(reservation.offerId);

  if (wasHoldingCapacity) await promoteWaitlist(reservation.offerId);
  return updated;
}

async function markNoShow(reservationId, actorId) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) return null; // droit d'agir déjà vérifié par requireRole('ADMIN') sur la route
  if (reservation.status !== 'CONFIRMED') {
    const err = new Error('Seule une réservation confirmée peut être marquée non-présentée');
    err.status = 409;
    throw err;
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'NO_SHOW', processedAt: new Date(), processedBy: actorId },
  });
  // NO_SHOW sort du calcul de capacité (voir HOLDS_CAPACITY) : la place se libère réellement,
  // même si personne n'est auto-promu depuis la liste d'attente pour l'instant (limitation
  // déjà documentée sur promoteWaitlist — pas quelque chose que ce changement doit corriger).
  await broadcastAvailability(reservation.offerId);
  return updated;
}

module.exports = { createReservation, decideReservation, cancelReservation, markNoShow, promoteWaitlist };
