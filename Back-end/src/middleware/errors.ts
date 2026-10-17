import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof Error && 'status' in error && typeof (error as { status?: unknown }).status === 'number') {
    response.status((error as { status: number }).status).json({ message: error.message });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Dados inválidos.',
      errors: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    });
    return;
  }

  console.error(error);
  response.status(500).json({ message: 'Erro interno do servidor.' });
};
