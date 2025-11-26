import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(1),
    password: z.string().min(8),
    password_confirmation: z.string().min(8)
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });
