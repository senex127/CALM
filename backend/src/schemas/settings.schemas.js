const { z } = require('zod');

const hexColor = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide (format #rrggbb attendu)');

const updateSettingsSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().min(5).max(300).optional(),
  phone: z.string().trim().max(30).optional(),
  openingHours: z.string().trim().max(300).optional(),
  accentColor: hexColor.optional(),
  // nullable : le frontend envoie explicitement null pour retirer une image déjà en place
  logoUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
});

module.exports = { updateSettingsSchema };
