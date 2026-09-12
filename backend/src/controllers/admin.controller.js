const prisma = require('../lib/prisma');

exports.getStats = async (req, res, next) => {
  try {
    const [userCount, offerCounts, reservationCounts] = await Promise.all([
      prisma.user.count(),
      prisma.offer.groupBy({ by: ['status'], _count: true }),
      prisma.reservation.groupBy({ by: ['status'], _count: true }),
    ]);
    const toMap = (rows) => Object.fromEntries(rows.map((r) => [r.status, r._count]));

    res.json({
      users: userCount,
      offers: toMap(offerCounts),
      reservations: toMap(reservationCounts),
    });
  } catch (err) {
    next(err);
  }
};

// ?search= filtre sur le nom ou l'email (insensible à la casse).
exports.listUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const users = await prisma.user.findMany({
      where: search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
        : {},
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, role: true, active: true, createdAt: true,
        _count: { select: { reservations: true } },
      },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de modifier votre propre compte' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const updated = await prisma.user.update({ where: { id: user.id }, data: { active: !user.active } });
    res.json({ user: { id: updated.id, active: updated.active } });
  } catch (err) {
    next(err);
  }
};
