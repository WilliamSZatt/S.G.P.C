import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, type AuthTokenPayload } from '../lib/token.js';
import { prisma } from '../lib/prisma.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    response.status(401).json({ message: 'Token de autenticação ausente.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, active: true, storeId: true, role: true }
    });

    if (!user || !user.active || user.storeId !== payload.storeId || user.role !== payload.role) {
      response.status(401).json({ message: 'Conta encerrada, inativa ou token inválido.' });
      return;
    }

    request.auth = payload;
    next();
  } catch {
    response.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}
