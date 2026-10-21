import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();
const productSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(2, 'Descrição obrigatória.'),
  sku: z.string().trim().min(1),
  ean: z.string().trim().regex(/^\d{8}(\d{5})?$/, 'EAN deve ter 8 ou 13 dígitos.'),
  category: z.string().trim().min(2),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative(),
  status: z.enum(['active', 'inactive']).default('active')
});
const movementSchema = z.object({
  type: z.enum(['entrada', 'baixa', 'ajuste']),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(2, 'Motivo obrigatório.'),
  notes: z.string().trim().min(2, 'Observação obrigatória.')
});
const publicProduct = (product: { status: string; [key: string]: unknown }) => ({ ...product, status: product.status.toLowerCase() });

router.use(requireAuth);

router.get('/products', async (request, response) => {
  const query = z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    status: z.enum(['all', 'active', 'inactive', 'low', 'out']).default('all')
  }).parse(request.query);
  const searchText = typeof query.search === 'string' ? query.search : undefined;
  const search = searchText ? { OR: [{ name: { contains: searchText } }, { sku: { contains: searchText } }, { ean: { contains: searchText } }] } : {};
  const category = typeof query.category === 'string' ? query.category : undefined;
  const base = {
    storeId: request.auth!.storeId,
    ...search,
    ...(category ? { category } : {})
  };
  const products = await prisma.product.findMany({ where: base, orderBy: { name: 'asc' } });
  const filtered = products.filter((product) => query.status === 'all'
    || (query.status === 'active' && product.status === 'ACTIVE')
    || (query.status === 'inactive' && product.status === 'INACTIVE')
    || (query.status === 'low' && product.quantity > 0 && product.quantity < product.minStock)
    || (query.status === 'out' && product.quantity === 0));
  response.json({ items: filtered.map(publicProduct) });
});

router.post('/products', requireAdmin, async (request, response) => {
  const data = productSchema.parse(request.body);
  try {
    const product = await prisma.$transaction(async (transaction) => {
      const created = await transaction.product.create({
        data: {
          ...data,
          status: data.status === 'active' ? 'ACTIVE' : 'INACTIVE',
          storeId: request.auth!.storeId,
          createdById: request.auth!.sub
        }
      });
      if (data.quantity > 0) {
        await transaction.stockMovement.create({
          data: { type: 'IN', quantity: data.quantity, previousQty: 0, newQty: data.quantity, reason: 'Estoque inicial', productId: created.id, storeId: request.auth!.storeId, userId: request.auth!.sub }
        });
      }
      return created;
    });
    response.status(201).json({ product: publicProduct(product) });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      response.status(409).json({ message: 'SKU ou EAN já cadastrado neste comércio.' });
      return;
    }
    throw error;
  }
});

router.patch('/products/:id', requireAdmin, async (request, response) => {
  const data = productSchema.partial().parse(request.body);
  const productId = String(request.params.id);
  const existing = await prisma.product.findFirst({ where: { id: productId, storeId: request.auth!.storeId } });
  if (!existing) {
    response.status(404).json({ message: 'Produto não encontrado.' });
    return;
  }
  const product = await prisma.$transaction(async (transaction) => {
    const { status, ...fields } = data;
    const updated = await transaction.product.update({
      where: { id: existing.id },
      data: { ...fields, ...(status ? { status: status === 'active' ? 'ACTIVE' : 'INACTIVE' } : {}) }
    });
    if (data.quantity !== undefined && data.quantity !== existing.quantity) {
      await transaction.stockMovement.create({
        data: { type: 'ADJUSTMENT', quantity: Math.abs(data.quantity - existing.quantity), previousQty: existing.quantity, newQty: data.quantity, reason: 'Edição do produto', productId: existing.id, storeId: request.auth!.storeId, userId: request.auth!.sub }
      });
    }
    return updated;
  });
  response.json({ product: publicProduct(product) });
});

router.post('/products/:id/movements', requireAdmin, async (request, response) => {
  const data = movementSchema.parse(request.body);
  const productId = String(request.params.id);
  const existing = await prisma.product.findFirst({ where: { id: productId, storeId: request.auth!.storeId } });
  if (!existing) {
    response.status(404).json({ message: 'Produto não encontrado.' });
    return;
  }
  const newQuantity = data.type === 'entrada' ? existing.quantity + data.quantity : data.type === 'baixa' ? existing.quantity - data.quantity : data.quantity;
  if (newQuantity < 0) {
    response.status(409).json({ message: 'A movimentação não pode deixar o estoque negativo.' });
    return;
  }
  const result = await prisma.$transaction([
    prisma.product.update({ where: { id: existing.id }, data: { quantity: newQuantity } }),
    prisma.stockMovement.create({ data: { type: data.type === 'entrada' ? 'IN' : data.type === 'baixa' ? 'OUT' : 'ADJUSTMENT', quantity: data.quantity, previousQty: existing.quantity, newQty: newQuantity, reason: data.reason, notes: data.notes, productId: existing.id, storeId: request.auth!.storeId, userId: request.auth!.sub } })
  ]);
  response.status(201).json({ product: publicProduct(result[0]), movement: result[1] });
});

router.get('/products/:id/movements', async (request, response) => {
  const productId = String(request.params.id);
  const product = await prisma.product.findFirst({ where: { id: productId, storeId: request.auth!.storeId }, select: { id: true } });
  if (!product) {
    response.status(404).json({ message: 'Produto não encontrado.' });
    return;
  }
  const movements = await prisma.stockMovement.findMany({ where: { productId: product.id, storeId: request.auth!.storeId }, orderBy: { createdAt: 'desc' } });
  response.json({ items: movements });
});

export const inventoryRouter = router;
