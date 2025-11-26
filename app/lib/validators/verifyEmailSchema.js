import { z } from "zod";

export const verifyEmailSchema = z.object({
  id: z.string().min(1),
  expires: z.string().min(1),
  signature: z.string().min(1),
});
