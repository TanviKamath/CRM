// /app/lib/validators/clientSchema.js
import { z } from "zod";

export const clientSchema = z.object({
  company_name: z.string().min(1),
  contact_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  owner_name: z.string().min(1),
  reg_address: z.string().optional().nullable(),
  bdb_address: z.string().optional().nullable(),
  organisation_nature: z.string().optional().nullable(),
  gst_no: z.string().optional().nullable(),
  udyam_reg: z.string().optional().nullable(),
  pan_no: z.string().optional().nullable(),
  nature_of_business: z.string().optional().nullable(),
  bank_name: z.string().min(1),
  branch: z.string().min(1),
  bank_address: z.string().min(1),
  account_type: z.string().min(1),
  account_number: z.string().min(1),
  ifsc_code: z.string().min(1),
});
