const prisma = require('../lib/prisma');
const reservationService = require('../services/reservation.service');
const { verifyTurnstile } = require('../lib/turnstile');

exports.create = async (req, res, next) => {
  try {
    const { quantity, comment, turnstileToken } = req.body;

    // Même garde anti-bot qu'à l'inscription : les précommandes/réservations sont la cible la
    // plus probable de bots (accaparer un stock ou des places limitées avant les vrais clients).
    if (!(await verifyTurnstile(turnstileToken, req.ip))) {
      return res.status(400).json({ error: 'Vérification anti-bot échouée, réessayez.' });
    }

    const reservation = await reservationService.createReservation({
      offerId: req.params.offerId,
      userId: req.user.id,
      quantity,
      comment,
    });
    res.status(201).json({ reservation });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { offer: { select: { title: true } } },
    });
    res.json({ reservations });
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const reservation = await reservationService.cancelReservation(req.params.id, req.user.id);
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json({ reservation });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

// Back-office admin : toutes les réservations, filtrables par offre / statut.
exports.listAll = async (req, res, next) => {
  try {
    const { offerId, status } = req.query;
    const reservations = await prisma.reservation.findMany({
      where: { ...(offerId ? { offerId } : {}), ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { offer: { select: { title: true, type: true } }, user: { select: { name: true, email: true } } },
    });
    res.json({ reservations });
  } catch (err) {
    next(err);
  }
};

exports.accept = async (req, res, next) => {
  try {
    const reservation = await reservationService.decideReservation(req.params.id, req.user.id, 'CONFIRMED');
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json({ reservation });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

exports.refuse = async (req, res, next) => {
  try {
    const reservation = await reservationService.decideReservation(req.params.id, req.user.id, 'REFUSED');
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json({ reservation });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

exports.markNoShow = async (req, res, next) => {
  try {
    const reservation = await reservationService.markNoShow(req.params.id, req.user.id);
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json({ reservation });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};
