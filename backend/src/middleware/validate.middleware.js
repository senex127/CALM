// Valide req.body contre un schéma zod ; renvoie 400 avec le détail sinon.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Requête invalide',
      details: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
