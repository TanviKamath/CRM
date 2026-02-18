import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  subscription: z.enum(["Basic", "Basic+", "Pro"]).optional().default("Basic"),
});
