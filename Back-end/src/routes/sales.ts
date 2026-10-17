import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const saleSchema = z.object({
  clientId: z.string().cuid().optional(),
  discount: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.enum(['dinheiro', 'pix', 'credito', 'debito']),
  cashReceived: z.coerce.number().nonnegative().optional(),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.coerce.number().int().positive()
  })).min(1)
});

const paymentMap = {
  dinheiro: 'CASH',
  pix: 'PIX',
  credito: 'CREDIT',
  debito: 'DEBIT'
} as const;

router.use(requireAuth);

router.get('/', async (request, response) => {
  const query = z.object({
    status: z.enum(['all', 'completed', 'cancelled', 'pending']).default('all'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }).parse(request.query);
  const where = {
    storeId: request.auth!.storeId,
    ...(query.status === 'all' ? {} : { status: query.status === 'completed' ? 'COMPLETED' as const : query.status === 'cancelled' ? 'CANCELLED' as const : 'PENDING' as const })
  };
  const [items, total] = await prisma.$transaction([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { client: { select: { id: true, name: true } }, items: { include: { product: { select: { name: true } } } } }
    }),
    prisma.sale.count({ where })
  ]);
  response.json({ items, page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) });
});

router.get('/:id', async (request, response) => {
  const sale = await prisma.sale.findFirst({
    where: { id: request.params.id, storeId: request.auth!.storeId },
    include: { client: true, items: { include: { product: true } }, user: { select: { id: true, name: true, email: true } } }
  });
  if (!sale) {
    response.status(404).json({ message: 'Venda não encontrada.' });
    return;
  }
  response.json({ sale });
});

router.post('/', async (request, response) => {
  const data = saleSchema.parse(request.body);
  if (data.paymentMethod === 'dinheiro' && (data.cashReceived ?? 0) < data.discount) {
    response.status(400).json({ message: 'Valor recebido inválido.' });
    return;
  }

  const uniqueProductIds = new Set(data.items.map((item) => item.productId));
  if (uniqueProductIds.size !== data.items.length) {
    response.status(400).json({ message: 'O mesmo produto não pode aparecer mais de uma vez na venda.' });
    return;
  }

  const sale = await prisma.$transaction(async (transaction) => {
    const products = await transaction.product.findMany({
      where: { id: { in: data.items.map((item) => item.productId) }, storeId: request.auth!.storeId, status: 'ACTIVE' }
    });
    if (products.length !== data.items.length) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const lines = data.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      if (item.quantity > product.quantity) throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
      return { product, quantity: item.quantity, subtotal: product.price * item.quantity };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    if (data.discount > subtotal) throw new Error('DISCOUNT_EXCEEDS_TOTAL');
    const total = subtotal - data.discount;
    if (data.paymentMethod === 'dinheiro' && (data.cashReceived ?? 0) < total) throw new Error('INSUFFICIENT_CASH');

    if (data.clientId) {
      const client = await transaction.client.findFirst({ where: { id: data.clientId, storeId: request.auth!.storeId, status: 'ACTIVE' } });
      if (!client) throw new Error('CLIENT_NOT_FOUND');
    }

    const created = await transaction.sale.create({
      data: {
        number: `VND-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        subtotal,
        discount: data.discount,
        total,
        paymentMethod: paymentMap[data.paymentMethod],
        cashReceived: data.cashReceived,
        change: data.paymentMethod === 'dinheiro' ? (data.cashReceived ?? 0) - total : 0,
        storeId: request.auth!.storeId,
        userId: request.auth!.sub,
        clientId: data.clientId,
        items: { create: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity, unitPrice: line.product.price, subtotal: line.subtotal })) }
      },
      include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } }, client: { select: { id: true, name: true } } }
    });

    for (const line of lines) {
      const updated = await transaction.product.updateMany({ where: { id: line.product.id, storeId: request.auth!.storeId, quantity: { gte: line.quantity } }, data: { quantity: { decrement: line.quantity } } });
      if (updated.count !== 1) throw new Error(`INSUFFICIENT_STOCK:${line.product.name}`);
      await transaction.stockMovement.create({
        data: { type: 'SALE', quantity: line.quantity, previousQty: line.product.quantity, newQty: line.product.quantity - line.quantity, reason: `Venda ${created.number}`, productId: line.product.id, storeId: request.auth!.storeId, userId: request.auth!.sub, saleId: created.id }
      });
    }

    if (data.clientId) {
      await transaction.client.update({ where: { id: data.clientId }, data: { totalSpent: { increment: total }, lastPurchase: new Date() } });
    }
    return created;
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : '';
    if (message === 'PRODUCT_NOT_FOUND') throw new HttpError(404, 'Um ou mais produtos não foram encontrados ou estão inativos.');
    if (message.startsWith('INSUFFICIENT_STOCK:')) throw new HttpError(409, `Estoque insuficiente para ${message.slice(19)}.`);
    if (message === 'DISCOUNT_EXCEEDS_TOTAL') throw new HttpError(400, 'O desconto não pode superar o subtotal.');
    if (message === 'INSUFFICIENT_CASH') throw new HttpError(400, 'Valor recebido insuficiente.');
    if (message === 'CLIENT_NOT_FOUND') throw new HttpError(404, 'Cliente não encontrado ou inativo.');
    throw error;
  });

  response.status(201).json({ sale });
});

class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export const salesRouter = router;
