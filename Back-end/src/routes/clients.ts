import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { isValidCpf } from '../lib/validation.js';

const router = Router();
const clientSchema = z.object({
  name: z.string().trim().min(2),
  cpf: z.string().trim().optional().refine((value) => !value || isValidCpf(value), 'CPF inválido.'),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  status: z.enum(['active', 'inactive']).optional()
});

const clientSelect = {
  id: true, name: true, cpf: true, phone: true, email: true,
  totalSpent: true, lastPurchase: true, status: true, createdAt: true, updatedAt: true
} as const;

router.use(requireAuth);

router.get('/', async (request, response) => {
  const query = z.object({
    search: z.string().trim().optional(),
    status: z.enum(['all', 'active', 'inactive']).default('all'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }).parse(request.query);
  const search = query.search ? { OR: [
    { name: { contains: query.search } },
    { email: { contains: query.search } },
    { phone: { contains: query.search } }
  ] } : {};
  const status = query.status === 'all' ? {} : { status: query.status === 'active' ? 'ACTIVE' as const : 'INACTIVE' as const };
  const where = { storeId: request.auth!.storeId, ...search, ...status };
  const [items, total] = await prisma.$transaction([
    prisma.client.findMany({ where, select: clientSelect, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.client.count({ where })
  ]);
  response.json({ items, page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) });
});

router.post('/', async (request, response) => {
  const data = clientSchema.parse(request.body);
  try {
    const client = await prisma.client.create({
      data: {
        ...data,
        status: data.status === 'inactive' ? 'INACTIVE' : 'ACTIVE',
        storeId: request.auth!.storeId,
        createdById: request.auth!.sub
      },
      select: clientSelect
    });
    response.status(201).json({ client });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      response.status(409).json({ message: 'Já existe um cliente com este e-mail neste comércio.' });
      return;
    }
    throw error;
  }
});

router.get('/:id', async (request, response) => {
  const client = await prisma.client.findFirst({
    where: { id: request.params.id, storeId: request.auth!.storeId },
    select: { ...clientSelect, sales: { orderBy: { createdAt: 'desc' }, take: 20, select: { number: true, total: true, paymentMethod: true, status: true, createdAt: true } } }
  });
  if (!client) {
    response.status(404).json({ message: 'Cliente não encontrado.' });
    return;
  }
  response.json({ client });
});

router.patch('/:id', async (request, response) => {
  const data = clientSchema.partial().parse(request.body);
  const existing = await prisma.client.findFirst({ where: { id: request.params.id, storeId: request.auth!.storeId } });
  if (!existing) {
    response.status(404).json({ message: 'Cliente não encontrado.' });
    return;
  }
  try {
    const { status, ...fields } = data;
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: { ...fields, ...(status ? { status: status === 'active' ? 'ACTIVE' : 'INACTIVE' } : {}) },
      select: clientSelect
    });
    response.json({ client });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      response.status(409).json({ message: 'Já existe um cliente com este e-mail neste comércio.' });
      return;
    }
    throw error;
  }
});

export const clientsRouter = router;
