import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { TrendingUp, TrendingDown, AlertTriangle, Plus, ShoppingCart, Users, Package, BarChart } from '../components/Icons';

const PERIODS = ['Hoje', '7 dias', 'Este mês', 'Trimestre'];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ChartPoint { month: string; revenue: number; expenses: number }
const DASHBOARD_DATA = { revenue: 0, revenueChange: 0, profit: 0, profitChange: 0, expenses: 0, expensesChange: 0, avgTicket: 0, avgTicketChange: 0, chart: [] as ChartPoint[] };
const RECENT_SALES: Array<{ id: string; client: string; total: number; payment: string; status: string; date: string }> = [];
const PRODUCTS: Array<{ status: string; quantity: number; minStock: number; name: string; price: number }> = [];

function LineChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-gray-400">
        Ainda não há dados suficientes para exibir o gráfico.
      </div>
    );
  }

  const W = 560, H = 160, PAD = { top: 16, right: 16, bottom: 28, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const allVals = data.flatMap(d => [d.revenue, d.expenses]);
  const minV = Math.min(...allVals) * 0.9;
  const maxV = Math.max(...allVals) * 1.05;
  const xStep = innerW / (data.length - 1);
  const yScale = (v: number) => innerH - ((v - minV) / (maxV - minV)) * innerH;

  const pts = (key: 'revenue' | 'expenses') =>
    data.map((d, i) => [PAD.left + i * xStep, PAD.top + yScale(d[key])]);

  const toPath = (points: number[][]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  const toArea = (points: number[][], base: number) =>
    `${toPath(points)} L${points[points.length - 1][0].toFixed(1)},${base} L${points[0][0].toFixed(1)},${base} Z`;

  const gridLines = 4;
  const revPts = pts('revenue');
  const expPts = pts('expenses');
  const baseY = PAD.top + innerH;

  const fmtK = (v: number) => `R$${(v / 1000).toFixed(0)}k`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      <defs>
        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F8B69" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#4F8B69" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C65B42" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#C65B42" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const y = PAD.top + (innerH / gridLines) * i;
        const v = maxV - ((maxV - minV) / gridLines) * i;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#f0f0f0" strokeWidth="1"/>
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{fmtK(v)}</text>
          </g>
        );
      })}

      {/* Area fills */}
      <path d={toArea(expPts, baseY)} fill="url(#gradExp)"/>
      <path d={toArea(revPts, baseY)} fill="url(#gradRev)"/>

      {/* Lines */}
      <path d={toPath(expPts)} fill="none" stroke="#C65B42" strokeWidth="1.8" strokeDasharray="5 3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={toPath(revPts)} fill="none" stroke="#4F8B69" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Dots */}
      {revPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#4F8B69" stroke="white" strokeWidth="1.5"/>
      ))}
      {expPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#C65B42" stroke="white" strokeWidth="1.5"/>
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={PAD.left + i * xStep} y={H - 6} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.month}</text>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const { currentUser, navigate } = useApp();
  const [period, setPeriod] = useState('Este mês');
  const data = DASHBOARD_DATA;
  const criticalProducts = PRODUCTS.filter(p => p.status === 'active' && (p.quantity === 0 || p.quantity < p.minStock));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = currentUser?.name.split(' ')[0];

  const kpis = [
    { label: 'Receita total', value: fmt(data.revenue), change: data.revenueChange, icon: '💰', color: '#4F8B69' },
    { label: 'Lucro líquido', value: fmt(data.profit), change: data.profitChange, icon: '📈', color: '#4D7CA8' },
    { label: 'Gastos totais', value: fmt(data.expenses), change: data.expensesChange, icon: '💸', color: '#C65B42' },
    { label: 'Ticket médio', value: fmt(data.avgTicket), change: data.avgTicketChange, icon: '🧾', color: '#E8753D' },
  ];


  return (
    <AuthLayout title={`${greeting}, ${firstName}!`}>
      <div className="p-4 lg:p-6 space-y-6">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <h3 className="font-display font-semibold text-[#1F2926]">Receitas e Despesas</h3>
                <div className="text-xs text-gray-400 mt-0.5">Últimos 7 meses</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 bg-[#4F8B69] inline-block rounded-full"/>
                  <span className="text-gray-500">Receita</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 bg-[#C65B42] inline-block rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#C65B42 0,#C65B42 4px,transparent 4px,transparent 8px)' }}/>
                  <span className="text-gray-500">Despesas</span>
                </span>
              </div>
            </div>
            <LineChart data={data.chart} />
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
              {RECENT_SALES.map(sale => (
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
            {[
              { action: 'Venda finalizada', detail: 'VND-2609001 · Ana Paula Ferreira · R$ 87,40', time: '14:32', type: 'success' },
              { action: 'Venda finalizada', detail: 'VND-2609002 · Consumidor Final · R$ 43,20', time: '13:58', type: 'success' },
              { action: 'Alerta de estoque', detail: 'Feijão Carioca abaixo do mínimo (3 un.)', time: '13:30', type: 'warning' },
              { action: 'Venda finalizada', detail: 'VND-2609003 · Roberto Nascimento · R$ 156,80', time: '12:41', type: 'success' },
              { action: 'Produto consultado', detail: 'Carlos Oliveira consultou o estoque de Café Torrado', time: '11:52', type: 'info' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'success' ? 'bg-[#4F8B69]' : a.type === 'warning' ? 'bg-amber-500' : 'bg-[#4D7CA8]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{a.action}</div>
                  <div className="text-xs text-gray-400 truncate">{a.detail}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
