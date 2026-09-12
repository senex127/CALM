const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  try {
    const payload = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);

    // Revérifié en base à chaque requête, pas seulement la signature du JWT (valable 30 jours) :
    // un compte désactivé/supprimé ou un rôle changé depuis l'émission du jeton ne doit pas
    // rester utilisable, et une base réinitialisée (seed en dev) ne doit pas planter en pleine
    // requête sur une contrainte de clé étrangère (Reservation.userId → User inexistant).
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, active: true },
    });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Session expirée, reconnectez-vous.' });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};
