const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email('Email invalide').max(200),
  password: z.string().min(8, 'Mot de passe trop court (8 caractères min)').max(128),
  // Honeypot : champ invisible pour un humain (masqué en CSS côté frontend), qu'un bot qui
  // remplit tous les champs d'un formulaire renseigne souvent — voir auth.controller.register.
  website: z.string().max(200).optional(),
  // Absent si TURNSTILE_SECRET_KEY n'est pas configuré côté serveur (vérification désactivée).
  turnstileToken: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide').max(200),
  password: z.string().min(1, 'Mot de passe requis').max(128),
});

module.exports = { registerSchema, loginSchema };
