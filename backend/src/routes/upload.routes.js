const router = require('express').Router();
const ctrl = require('../controllers/upload.controller');
const auth = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');

// Générique : renvoie juste { url }, à coller ensuite dans logoUrl / coverImageUrl / imageUrl
// via les routes PATCH existantes de shop/offer — pas besoin d'un endpoint par cas d'usage.
router.post('/', auth, uploadLimiter, uploadImage.single('image'), ctrl.upload);

module.exports = router;
