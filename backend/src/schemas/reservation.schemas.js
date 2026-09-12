const { z } = require('zod');

const createReservationSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  comment: z.string().trim().max(1000).optional(),
  turnstileToken: z.string().optional(),
});

module.exports = { createReservationSchema };
