const prisma = require('../lib/prisma');

const SETTINGS_ID = 'main';

// Une seule ligne en base : upsert au lieu de create/update séparés, pour ne jamais avoir
// à se demander si la ligne existe déjà (le seed la crée, mais on ne veut pas en dépendre).
async function getOrCreateSettings() {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

exports.get = async (req, res, next) => {
  try {
    res.json({ settings: await getOrCreateSettings() });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    await getOrCreateSettings(); // garantit que la ligne existe avant le update ci-dessous
    const settings = await prisma.settings.update({ where: { id: SETTINGS_ID }, data: req.body });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
};
