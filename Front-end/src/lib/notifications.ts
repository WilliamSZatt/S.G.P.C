import { api } from './api';

export type AppNotification = {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  date: string;
  read: boolean;
  link: 'stock' | 'reports';
};

type Product = { id: string; name: string; quantity: number; minStock: number; status: string };
type Sale = { id: string; number: string; total: number; status: string; createdAt: string; client: { name: string } | null };

export const NOTIFICATION_READ_KEY = 'sgpc_read_notifications';
export const SETTINGS_CHANGED_EVENT = 'sgpc-settings-changed';
const SETTINGS_KEY = 'sgpc_settings';

export async function loadNotifications(): Promise<AppNotification[]> {
  const [productsResponse, salesResponse] = await Promise.all([
    api.get<{ items: Product[] }>('/inventory/products', { params: { status: 'all' } }),
    api.get<{ items: Sale[] }>('/sales', { params: { status: 'all', limit: 20 } })
  ]);
  const now = new Date();
  const stockNotifications = productsResponse.data.items
    .filter(product => product.status.toLowerCase() === 'active' && (product.quantity === 0 || product.quantity < product.minStock))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)
    .map(product => ({
      id: `stock-${product.id}-${product.quantity}`,
      type: 'warning' as const,
      title: product.quantity === 0 ? 'Produto sem estoque' : 'Estoque baixo',
      message: product.quantity === 0
        ? `${product.name} está sem unidades disponíveis.`
        : `${product.name} está com ${product.quantity} unidade(s); mínimo recomendado: ${product.minStock}.`,
      date: now.toISOString(),
      read: false,
      link: 'stock' as const
    }));
  const saleNotifications = salesResponse.data.items.slice(0, 5).map(sale => ({
    id: `sale-${sale.id}`,
    type: sale.status === 'COMPLETED' ? 'success' as const : 'info' as const,
    title: sale.status === 'COMPLETED' ? 'Venda concluída' : 'Venda atualizada',
    message: `${sale.number} · ${sale.client?.name || 'Cliente não informado'} · ${sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
    date: sale.createdAt,
    read: false,
    link: 'reports' as const
  }));
  const readIds = new Set<string>(JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || '[]'));
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') as { notifSettings?: { stockCritical?: boolean; saleDone?: boolean } };
  const notifSettings = settings.notifSettings || {};
  return [...stockNotifications, ...saleNotifications]
    .filter(notification => notification.link === 'stock' ? notifSettings.stockCritical !== false : notifSettings.saleDone !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(notification => ({ ...notification, read: readIds.has(notification.id) }));
}

export function markNotificationRead(id: string) {
  const readIds = new Set<string>(JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || '[]'));
  readIds.add(id);
  localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify([...readIds]));
}

export function markAllNotificationsRead(notifications: AppNotification[]) {
  const readIds = new Set<string>(JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || '[]'));
  notifications.forEach(notification => readIds.add(notification.id));
  localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify([...readIds]));
}
