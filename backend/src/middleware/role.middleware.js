// À utiliser après auth.middleware. Exemple : router.get('/x', auth, requireRole('ADMIN'), ctrl)
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  next();
};

module.exports = { requireRole };
