const router = require('express').Router();
const ctrl = require('../controllers/reservation.controller');
const auth = require('../middleware/auth.middleware');

// Actions du client sur ses propres réservations. Les actions admin (lister toutes les
// réservations, accepter/refuser/marquer non-présenté) vivent sous /api/admin/reservations.
router.get('/mine', auth, ctrl.listMine);
router.post('/:id/cancel', auth, ctrl.cancel);

module.exports = router;
