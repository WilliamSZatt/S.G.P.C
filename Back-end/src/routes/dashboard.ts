import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const periodSchema = z.enum(['today', '7days', 'month', 'quarter']).default('month');

function periodRange(period: z.infer<typeof periodSchema>) {
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  if (period === 'today') return { start, end };
  if (period === '7days') start.setDate(start.getDate() - 6);
  if (period === 'month') start.setDate(1);
  if (period === 'quarter') start.setMonth(start.getMonth() - 2, 1);
  return { start, end };
}

function percentage(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

router.use(requireAuth);

router.get('/', async (request, response) => {
  const period = periodSchema.parse(request.query.period);
  const { start, end } = periodRange(period);
  const duration = end.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - duration);
  const previousEnd = new Date(start.getTime() - 1);
  const storeId = request.auth!.storeId;

  const [sales, previousSales, expenses, previousExpenses, products] = await prisma.$transaction([
    prisma.sale.findMany({ where: { storeId, createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' }, take: 1000, include: { client: { select: { name: true } } } }),
    prisma.sale.findMany({ where: { storeId, createdAt: { gte: previousStart, lte: previousEnd } }, select: { total: true, status: true } }),
    prisma.expense.findMany({ where: { storeId, createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } }, select: { amount: true, createdAt: true } }),
    prisma.expense.findMany({ where: { storeId, createdAt: { gte: previousStart, lte: previousEnd }, status: { not: 'CANCELLED' } }, select: { amount: true } }),
    prisma.product.findMany({ where: { storeId }, orderBy: { quantity: 'asc' }, take: 100 })
  ]);

  const completed = sales.filter(sale => sale.status === 'COMPLETED');
  const previousCompleted = previousSales.filter(sale => sale.status === 'COMPLETED');
  const revenue = completed.reduce((sum, sale) => sum + sale.total, 0);
  const previousRevenue = previousCompleted.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousTotalExpenses = previousExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paymentBreakdown = completed.reduce<Record<string, number>>((breakdown, sale) => {
    breakdown[sale.paymentMethod] = (breakdown[sale.paymentMethod] || 0) + 1;
    return breakdown;
  }, {});

  const buckets = new Map<string, { revenue: number; expenses: number }>();
  [...completed.map(sale => ({ date: sale.createdAt, amount: sale.total, type: 'revenue' as const })),
    ...expenses.map(expense => ({ date: expense.createdAt, amount: expense.amount, type: 'expenses' as const }))]
    .forEach(item => {
      const key = period === 'quarter'
        ? item.date.toLocaleDateString('pt-BR', { month: 'short' })
        : item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const bucket = buckets.get(key) || { revenue: 0, expenses: 0 };
      bucket[item.type] += item.amount;
      buckets.set(key, bucket);
    });

  response.json({
    period,
    revenue,
    expenses: totalExpenses,
    profit: revenue - totalExpenses,
    avgTicket: completed.length ? revenue / completed.length : 0,
    revenueChange: percentage(revenue, previousRevenue),
    expensesChange: percentage(totalExpenses, previousTotalExpenses),
    profitChange: percentage(revenue - totalExpenses, previousRevenue - previousTotalExpenses),
    avgTicketChange: percentage(completed.length ? revenue / completed.length : 0, previousCompleted.length ? previousRevenue / previousCompleted.length : 0),
    paymentBreakdown,
    chart: [...buckets].map(([month, values]) => ({ month, revenue: values.revenue, profit: values.revenue - values.expenses })),
    recentSales: sales.slice(0, 5).map(sale => ({
      id: sale.number,
      client: sale.client?.name || 'Consumidor não informado',
      total: sale.total,
      payment: sale.paymentMethod,
      status: sale.status,
      date: sale.createdAt
    })),
    criticalProducts: products
      .filter(product => product.status === 'ACTIVE' && (product.quantity === 0 || product.quantity < product.minStock))
      .slice(0, 5)
      .map(product => ({ name: product.name, sku: product.sku, quantity: product.quantity, minStock: product.minStock, status: product.status.toLowerCase() }))
  });
});

export { router as dashboardRouter };
