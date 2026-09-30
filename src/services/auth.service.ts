import "dotenv/config";
import argon2 from "argon2";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { usersRepository, type User, type UsersRepository } from "../repositories/users.repository";
import { UnauthorizedError } from "../errors/HttpError";
import { roleSchema, type RegisterInput, type LoginInput } from "../validation/auth.schemas";

const identitySchema = z.object({ id: z.number().int().positive(), name: z.string().min(1), role: roleSchema });
export type AuthenticatedUser = z.infer<typeof identitySchema>;
const payloadSchema = identitySchema.extend({ exp: z.number().int(), iat: z.number().int() });

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value?.trim()) throw new Error("Configure JWT_SECRET no ambiente.");
  return value;
}

function expiresIn(): SignOptions["expiresIn"] {
  const value = process.env.JWT_EXPIRES_IN ?? "15m";
  if (/^[1-9]\d*$/.test(value)) return Number(value);
  if (!/^[1-9]\d*(ms|s|m|h|d|w|y)$/.test(value)) throw new Error("JWT_EXPIRES_IN inválido.");
  return value as SignOptions["expiresIn"];
}

const publicUser = (user: User) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

export function createAuthService(repository: UsersRepository) {
  return {
    async register(input: RegisterInput) {
      const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
      const user = await repository.create({ name: input.name, email: input.email, role: input.role, passwordHash });
      return publicUser(user);
    },
    async login(input: LoginInput) {
      const user = await repository.findByEmail(input.email);
      if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
        throw new UnauthorizedError("Credenciais inválidas.");
      }
      const token = jwt.sign(identitySchema.parse(user), secret(), { algorithm: "HS256", expiresIn: expiresIn() });
      return { token, user: publicUser(user) };
    },
  };
}
export const { register, login } = createAuthService(usersRepository);

export function verifyToken(token: string): AuthenticatedUser {
  const key = secret();
  try {
    const payload = payloadSchema.parse(jwt.verify(token, key, { algorithms: ["HS256"] }));
    return identitySchema.parse(payload);
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado.");
  }
}
