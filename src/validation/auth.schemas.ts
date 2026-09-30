import { z } from "zod";

export const roleSchema = z.enum(["admin", "profissional", "recepcao"]);
export const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8),
  role: roleSchema,
});
// Senha curta é uma credencial inválida (401), não erro de formato (400).
export const loginSchema = z.object({ email: z.email(), password: z.string() });
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type Role = z.infer<typeof roleSchema>;
