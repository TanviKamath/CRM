// /app/lib/validators/brokerSchema.js
import { z } from "zod";

export const brokerSchema = z.object({
  name: z.string().min(1),
  company_name: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  commission_rate: z.string().optional().nullable(),
  bank_details: z.string().optional().nullable(),
  tax_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
