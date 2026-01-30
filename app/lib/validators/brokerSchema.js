import { z } from "zod";

export const brokerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  aadhaar: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  native_address: z.string().optional().nullable(),
  broking_since: z.coerce.number().int().optional().nullable(),
  bdb_id: z.string().optional().nullable(),
  commission_rate: z.coerce.number().optional().nullable(),
  reference: z
    .array(
      z.object({
        company_name: z.string(),
        contact_person: z.string(),
      })
    )
    .optional()
    .nullable()
    .transform((val) => {
      // Filter out empty references and serialize to JSON string
      if (!val || val.length === 0) return null;
      const filtered = val.filter(r => r.company_name || r.contact_person);
      if (filtered.length === 0) return null;
      return JSON.stringify(filtered);
    }),
  bank_name: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  bank_address: z.string().optional().nullable(),
  account_type: z.string().optional().nullable(),
  account_no: z.string().optional().nullable(),
  ifsc_code: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
