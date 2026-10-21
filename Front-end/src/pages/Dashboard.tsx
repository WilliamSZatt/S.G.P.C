import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { api } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import { TrendingUp, TrendingDown, AlertTriangle, Plus, ShoppingCart, Users, Package, BarChart } from '../components/Icons';

const PERIODS = ['Hoje', '7 dias', 'Este mês', 'Trimestre'];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ChartPoint { month: string; revenue: number; profit: number }
type DashboardData = {
  revenue: number; revenueChange: number; profit: number; profitChange: number;
  expenses: number; expensesChange: number; avgTicket: number; avgTicketChange: number;
  chart: ChartPoint[];
  paymentBreakdown: Record<string, number>;
  recentSales: Array<{ id: string; client: string; total: number; payment: string; status: string; date: string }>;
  criticalProducts: Array<{ status: string; quantity: number; minStock: number; name: string; sku: string }>;
};
const EMPTY_DATA: DashboardData = { revenue: 0, revenueChange: 0, profit: 0, profitChange: 0, expenses: 0, expensesChange: 0, avgTicket: 0, avgTicketChange: 0, chart: [], paymentBreakdown: {}, recentSales: [], criticalProducts: [] };

const paymentLabels: Record<string, string> = { CASH: 'Dinheiro', PIX: 'PIX', CREDIT: 'Crédito', DEBIT: 'Débito' };
const paymentColors: Record<string, string> = { CASH: '#4F8B69', PIX: '#4D7CA8', CREDIT: '#E8753D', DEBIT: '#8B6FA8' };

function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  if (!total) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400">
        Ainda não há vendas no período selecionado.
      </div>
    );
  }
  let offset = 0;
  const gradient = entries.map(([key, value]) => {
    const start = offset;
    offset += value / total * 100;
    return `${paymentColors[key] || '#9CA3AF'} ${start}% ${offset}%`;
  }).join(', ');
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
      <div className="relative w-48 h-48 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-8 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#1F2926]">{total}</span>
          <span className="text-xs text-gray-400">vendas concluídas</span>
        </div>
      </div>
      <div className="space-y-3 min-w-44">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-gray-600"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: paymentColors[key] || '#9CA3AF' }} />{paymentLabels[key] || key}</span>
            <span className="font-semibold text-[#1F2926]">{Math.round(value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, navigate } = useApp();
  const [period, setPeriod] = useState('Este mês');
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const periodKey = period === 'Hoje' ? 'today' : period === '7 dias' ? '7days' : period === 'Trimestre' ? 'quarter' : 'month';

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get<DashboardData>('/dashboard', { params: { period: periodKey } })
      .then(({ data: dashboard }) => setData(dashboard))
      .catch(() => setError('Não foi possível carregar os dados do painel.'))
      .finally(() => setLoading(false));
  }, [periodKey]);

  const criticalProducts = data.criticalProducts;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = currentUser?.name.split(' ')[0];

  const kpis = [
    { label: 'Receita total', value: fmt(data.revenue), change: data.revenueChange, icon: '💰', color: '#4F8B69' },
    { label: 'Lucro líquido', value: fmt(data.profit), change: data.profitChange, icon: '📈', color: '#4D7CA8' },
    { label: 'Ticket médio', value: fmt(data.avgTicket), change: data.avgTicketChange, icon: '🧾', color: '#E8753D' },
  ];


  return (
    <AuthLayout title={`${greeting}, ${firstName}!`}>
      <div className="p-4 lg:p-6 space-y-6">
        {error && <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
        {loading && <div className="text-sm text-gray-400">Atualizando dados do painel...</div>}
        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-[#1F2926] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {p}
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-auto">Mercado & Mercearia Silva — {period}</span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{kpi.icon}</div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.change >= 0 ? 'bg-[#4F8B69]/10 text-[#4F8B69]' : 'bg-[#C65B42]/10 text-[#C65B42]'}`}>
                  {kpi.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(kpi.change)}%
                </div>
              </div>
              <div className="font-display font-bold text-xl text-[#1F2926]">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-semibold text-[#1F2926]">Visão geral</h3>
                <div className="text-xs text-gray-400 mt-0.5">Distribuição das vendas por forma de pagamento</div>
              </div>
            </div>
            <DonutChart data={data.paymentBreakdown} />
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-display font-semibold text-[#1F2926] mb-4">Ações rápidas</h3>
            <div className="space-y-2">
              {[
                { label: 'Nova venda', icon: ShoppingCart, page: 'pos', color: 'bg-[#E8753D]' },
                { label: 'Novo cliente', icon: Users, page: 'clients', color: 'bg-[#4D7CA8]' },
                { label: 'Novo produto', icon: Package, page: 'stock', color: 'bg-[#4F8B69]' },
                { label: 'Consultar estoque', icon: Package, page: 'stock', color: 'bg-[#1F2926]' },
                { label: 'Abrir relatórios', icon: BarChart, page: 'reports', color: 'bg-gray-600' },
              ].map(({ label, icon: Icon, page, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(page as any)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent sales */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-semibold text-[#1F2926]">Vendas recentes</h3>
              <button onClick={() => navigate('reports')} className="text-xs text-[#E8753D] hover:underline">Ver todas</button>
            </div>
            <div className="divide-y divide-gray-50">
              {data.recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{sale.client}</div>
                    <div className="text-xs text-gray-400">{sale.id} · {sale.payment}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-semibold text-sm text-[#1F2926]">{fmt(sale.total)}</div>
                    <div className="text-[10px] text-gray-400">{sale.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-semibold text-[#1F2926]">Alertas de estoque</h3>
              <button onClick={() => navigate('stock')} className="text-xs text-[#E8753D] hover:underline">Gerenciar</button>
            </div>
            {criticalProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Nenhum produto com estoque crítico.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {criticalProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={16} className={p.quantity === 0 ? 'text-[#C65B42]' : 'text-amber-500'} />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-400">SKU: {p.sku}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${p.quantity === 0 ? 'text-[#C65B42]' : 'text-amber-600'}`}>
                        {p.quantity === 0 ? 'Sem estoque' : `${p.quantity} un.`}
                      </div>
                      <div className="text-[10px] text-gray-400">Mín: {p.minStock} un.</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-display font-semibold text-[#1F2926] mb-4">Atividades recentes</h3>
          <div className="space-y-3">
            {data.recentSales.map((sale, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#4F8B69]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{sale.status === 'COMPLETED' ? 'Venda finalizada' : 'Venda atualizada'}</div>
                <div className="text-xs text-gray-400 truncate">{sale.id} · {sale.client} · {fmt(sale.total)}</div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">{new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            ))}
            {!data.recentSales.length && <div className="text-sm text-gray-400">Nenhuma atividade no período selecionado.</div>}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
