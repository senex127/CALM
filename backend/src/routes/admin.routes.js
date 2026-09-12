const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const reservationCtrl = require('../controllers/reservation.controller');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(auth, requireRole('ADMIN'));

router.get('/stats', ctrl.getStats);

router.get('/users', ctrl.listUsers);
router.post('/users/:id/toggle-active', ctrl.toggleUserActive);

// Offres : la lecture complète (tous statuts) vit ici ; création/édition restent sous
// /api/offers pour partager les mêmes schémas de validation avec le reste de la route.
router.get('/offers', require('../controllers/offer.controller').listAll);
router.get('/offers/:id', require('../controllers/offer.controller').getAdmin);

router.get('/reservations', reservationCtrl.listAll);
router.post('/reservations/:id/accept', reservationCtrl.accept);
router.post('/reservations/:id/refuse', reservationCtrl.refuse);
router.post('/reservations/:id/no-show', reservationCtrl.markNoShow);

module.exports = router;
