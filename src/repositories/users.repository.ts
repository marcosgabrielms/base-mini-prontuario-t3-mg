import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ConflictError } from "../errors/HttpError";
import { roleSchema, type Role } from "../validation/auth.schemas";

export type User = { id: number; name: string; email: string; passwordHash: string; role: Role };
export interface UsersRepository {
  findByEmail(email: string): Promise<User | null>;
  create(input: Omit<User, "id">): Promise<User>;
}
export class PrismaUsersRepository implements UsersRepository {
  async findByEmail(email: string) {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? { ...row, role: roleSchema.parse(row.role) } : null;
  }
  async create(input: Omit<User, "id">) {
    try {
      const row = await prisma.user.create({ data: input });
      return { ...row, role: roleSchema.parse(row.role) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Já existe um usuário com este e-mail.");
      }
      throw error;
    }
  }
}
export const usersRepository: UsersRepository = new PrismaUsersRepository();
