// /app/lib/validators/saleSchema.js
import { z } from "zod";

export const saleSchema = z.object({
  diamond_id: z.number().int().positive(),
  client_id: z.number().int().positive(),
  broker_id: z.number().int().positive().nullable().optional(),
  sale_amount: z.preprocess(Number, z.number()),
  conversion_rate: z.preprocess(Number, z.number()).optional().nullable(),
  sale_amount_inr: z.preprocess(Number, z.number()).optional().nullable(),
  sale_rap_discount: z.preprocess(Number, z.number()).optional().nullable(),
  brokerage_rate: z.preprocess(Number, z.number()).optional().nullable(),
  brokerage_amount: z.preprocess(Number, z.number()).optional().nullable(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  notes: z.string().optional().nullable(),
});
