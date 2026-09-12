const prisma = require('../lib/prisma');

exports.listMine = async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({ where: { userId: req.user.id, readAt: null } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// updateMany avec userId dans le where plutôt qu'un findUnique + update : on n'a jamais besoin
// de charger la notification pour vérifier qu'elle appartient au demandeur, et ça empêche
// silencieusement de marquer lue la notification de quelqu'un d'autre en devinant un id.
exports.markRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
