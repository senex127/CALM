const { z } = require('zod');

const createOfferSchema = z.object({
  type: z.enum(['PRODUCT', 'TOURNAMENT']),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4000).optional(),
  imageUrl: z.string().url().optional(),
  price: z.coerce.number().min(0).optional(),
  startAt: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
  location: z.string().trim().min(2).max(200),
  limitPerPerson: z.coerce.number().int().min(1).max(999).default(1),
  totalCapacity: z.coerce.number().int().min(1).optional(),
  requiresValidation: z.coerce.boolean().default(false),
});

const updateOfferSchema = createOfferSchema.partial().extend({
  // nullable : le frontend envoie explicitement null pour retirer une image déjà en place
  imageUrl: z.string().url().nullable().optional(),
});

const offerStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']),
});

module.exports = { createOfferSchema, updateOfferSchema, offerStatusSchema };
