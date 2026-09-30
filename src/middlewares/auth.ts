/**
 * ============================================================
 * TRILHA AUTH — o guarda na porta
 * ------------------------------------------------------------
 * Na Arquitetura Hexagonal, este arquivo é um ADAPTER DE ENTRADA:
 * o guarda fica na PORTA (middleware), nunca dentro da cozinha
 * (service). O service recebe "quem é o usuário" já resolvido.
 * ============================================================
 */
import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthenticatedUser } from "../services/auth.service";
import { UnauthorizedError, ForbiddenError } from "../errors/HttpError";

/** O que o token comprova sobre quem chamou. */
export type { AuthenticatedUser } from "../services/auth.service";

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.authorization ?? "");
  if (!match?.[1]) throw new UnauthorizedError();
  request.user = verifyToken(match[1]);
  next();
}

export function requireRole(...roles: AuthenticatedUser["role"][]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) throw new UnauthorizedError();
    if (!roles.includes(request.user.role)) throw new ForbiddenError();
    next();
  };
}

// Anexamos o usuário autenticado ao Request para os controllers lerem.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
