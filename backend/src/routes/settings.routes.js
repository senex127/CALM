const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { updateSettingsSchema } = require('../schemas/settings.schemas');

router.get('/', ctrl.get); // public — utilisé par toutes les pages (nom, adresse, couleur...)
router.patch('/', auth, requireRole('ADMIN'), validate(updateSettingsSchema), ctrl.update);

module.exports = router;
