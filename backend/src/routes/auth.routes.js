const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../schemas/auth.schemas');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/google', authLimiter, ctrl.google);
router.get('/me', auth, ctrl.me);

module.exports = router;
