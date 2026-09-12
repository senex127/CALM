const router = require('express').Router();
const ctrl = require('../controllers/offer.controller');
const reservationCtrl = require('../controllers/reservation.controller');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createOfferSchema, updateOfferSchema, offerStatusSchema } = require('../schemas/offer.schemas');
const { createReservationSchema } = require('../schemas/reservation.schemas');
const { reservationLimiter } = require('../middleware/rateLimiter.middleware');

// Public
router.get('/', ctrl.listPublic);
router.get('/:id', ctrl.getPublic);
router.post('/:offerId/reservations', auth, reservationLimiter, validate(createReservationSchema), reservationCtrl.create);

// Back-office (admin uniquement — un seul établissement, pas de notion de propriétaire)
router.post('/', auth, requireRole('ADMIN'), validate(createOfferSchema), ctrl.create);
router.patch('/:id', auth, requireRole('ADMIN'), validate(updateOfferSchema), ctrl.update);
router.patch('/:id/status', auth, requireRole('ADMIN'), validate(offerStatusSchema), ctrl.updateStatus);

module.exports = router;
