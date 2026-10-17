import type { NextFunction, Request, Response } from 'express';

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (request.auth?.role !== 'ADMIN') {
    response.status(403).json({ message: 'Apenas administradores podem executar esta operação.' });
    return;
  }
  next();
}
