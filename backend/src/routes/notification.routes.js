const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, ctrl.listMine);
router.post('/read-all', auth, ctrl.markAllRead);
router.post('/:id/read', auth, ctrl.markRead);

module.exports = router;
