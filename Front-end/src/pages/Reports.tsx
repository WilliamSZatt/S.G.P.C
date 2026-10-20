import { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import { Download, BarChart, Filter } from '../components/Icons';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const RECENT_SALES: Array<{ id: string; client: string; total: number; payment: string; status: string; date: string }> = [];

const RAW = [70,85,60,90,75,88,95,72,80,85,92,78,88,96,102,85,90,95,88,92,98,85,90,95,100,88,92,97,95,48];
const DAYS = RAW.map((v, i) => ({ day: i + 1, value: v * 500 }));

function RevenueBarChart() {
  const W = 700, H = 180;
  const PAD = { top: 16, right: 16, bottom: 36, left: 60 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxV = Math.max(...DAYS.map(d => d.value));
  const barW = innerW / DAYS.length;
  const gap = barW * 0.25;
  const gridLines = 4;
  const fmtK = (v: number) => `R$${(v / 1000).toFixed(0)}k`;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F8B69"/>
          <stop offset="100%" stopColor="#4F8B69" stopOpacity="0.6"/>
        </linearGradient>
        <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8753D"/>
          <stop offset="100%" stopColor="#E8753D" stopOpacity="0.7"/>
        </linearGradient>
      </defs>

      {/* Grid */}
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const y = PAD.top + (innerH / gridLines) * i;
        const v = maxV - (maxV / gridLines) * i;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#f3f4f6" strokeWidth="1"/>
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="9.5" fill="#9ca3af">{fmtK(v)}</text>
          </g>
        );
      })}

      {/* Baseline */}
      <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="#e5e7eb" strokeWidth="1"/>

      {/* Bars */}
      {DAYS.map(({ day, value }, i) => {
        const barH = (value / maxV) * innerH;
        const x = PAD.left + i * barW + gap / 2;
        const y = PAD.top + innerH - barH;
        const w = barW - gap;
        const isHovered = hovered === i;
        const isHigh = value > maxV * 0.88;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            {/* Hover bg */}
            {isHovered && (
              <rect x={x - 2} y={PAD.top} width={w + 4} height={innerH} fill="#f9fafb" rx="3"/>
            )}
            <rect
              x={x} y={y} width={w} height={barH}
              fill={isHovered ? 'url(#barGradHover)' : isHigh ? 'url(#barGrad)' : '#4F8B6980'}
              rx="3"
              style={{ transition: 'fill 0.15s' }}
            />
            {/* Tooltip */}
            {isHovered && (
              <g>
                <rect x={Math.min(x - 10, W - 100)} y={y - 34} width={84} height={26} rx="5" fill="#1F2926"/>
                <text x={Math.min(x - 10, W - 100) + 42} y={y - 17} textAnchor="middle" fontSize="10" fill="white" fontWeight="600">
                  {fmt(value)}
                </text>
                <text x={Math.min(x - 10, W - 100) + 42} y={y - 25} textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.6)">
                  Dia {day}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* X axis labels — only show every 5th day */}
      {DAYS.filter((_, idx) => idx % 5 === 0 || idx === DAYS.length - 1).map(({ day }) => {
        const idx = DAYS.findIndex(d => d.day === day);
        const x = PAD.left + idx * barW + barW / 2;
        return (
          <text key={day} x={x} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#9ca3af">{day} Set</text>
        );
      })}
    </svg>
  );
}

const REPORT_TYPES = [
  { id: 'vendas', label: 'Vendas', icon: '💰', desc: 'Histórico e análise de vendas realizadas.' },
  { id: 'clientes', label: 'Clientes', icon: '👥', desc: 'Frequência, ticket médio e perfil dos clientes.' },
  { id: 'produtos', label: 'Produtos', icon: '🏷️', desc: 'Produtos mais vendidos e rentáveis.' },
  { id: 'estoque', label: 'Estoque', icon: '📦', desc: 'Movimentações e posição atual do estoque.' },
  { id: 'caixa', label: 'Fluxo de caixa', icon: '📊', desc: 'Entradas e saídas do período selecionado.' },
  { id: 'fiscal', label: 'Fiscal', icon: '🧾', desc: 'Resumo tributário demonstrativo do período.' },
];

const PERIODS = ['Hoje', 'Últimos 7 dias', 'Este mês', 'Trimestre', 'Período personalizado'];

export default function Reports() {
  const [activeReport, setActiveReport] = useState('vendas');
  const [period, setPeriod] = useState('Este mês');
  const [loading, setLoading] = useState(false);

  const handleView = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <AuthLayout title="Relatórios">
      <div className="p-4 lg:p-6 space-y-5">
        {/* Report type */}
        <div>
          <div className="text-sm font-medium text-gray-600 mb-3">Tipo de relatório</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {REPORT_TYPES.map(r => (
              <button key={r.id} onClick={() => setActiveReport(r.id)} className={`p-4 rounded-xl border text-left transition-all ${activeReport === r.id ? 'border-[#E8753D] bg-[#E8753D]/5' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
                <div className="text-2xl mb-2">{r.icon}</div>
                <div className={`text-sm font-semibold ${activeReport === r.id ? 'text-[#E8753D]' : 'text-[#1F2926]'}`}>{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4">
          <Filter size={16} className="text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-[#1F2926] text-white' : 'border border-gray-200 text-gray-600 hover:border-gray-300'}`}>{p}</button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={handleView} disabled={loading} className="flex items-center gap-2 bg-[#1F2926] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2a3a36] transition-colors disabled:opacity-70">
              {loading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <BarChart size={15} />}
              Visualizar
            </button>
            <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download size={15} />
              PDF (demo)
            </button>
            <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download size={15} />
              Planilha (demo)
            </button>
          </div>
        </div>

        {/* Report content */}
        {activeReport === 'vendas' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Vendas no período', value: '47', sub: '+12% vs. anterior' },
                { label: 'Receita total', value: 'R$ 48.720', sub: 'Bruto' },
                { label: 'Ticket médio', value: 'R$ 89,40', sub: 'Por transação' },
                { label: 'PIX', value: '62%', sub: 'Forma mais usada' },
              ].map(k => (
                <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">{k.label}</div>
                  <div className="font-display font-bold text-xl text-[#1F2926]">{k.value}</div>
                  <div className="text-xs text-[#4F8B69] mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Sales table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-display font-semibold text-[#1F2926]">Vendas do período — {period}</h3>
                <div className="text-xs text-gray-400">{RECENT_SALES.length} registros</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F7F8] border-b border-gray-100">
                    <tr>
                      {['Nº Venda', 'Cliente', 'Total', 'Pagamento', 'Status', 'Data'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {RECENT_SALES.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-sm text-gray-600">{s.id}</td>
                        <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{s.client}</td>
                        <td className="px-4 py-3.5 font-display font-semibold text-sm text-[#1F2926]">{fmt(s.total)}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-600">{s.payment}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-[#4F8B69]/10 text-[#4F8B69] text-[11px] font-semibold px-2 py-0.5 rounded-full">Concluída</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-500">{s.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-semibold text-[#1F2926]">Gráfico de Receitas</h3>
                  <div className="text-xs text-gray-400 mt-0.5">Receita diária — {period}</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm bg-[#4F8B69] inline-block"/>
                  Receita bruta
                </div>
              </div>
              <RevenueBarChart />
            </div>
          </>
        )}

        {activeReport !== 'vendas' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-4">{REPORT_TYPES.find(r => r.id === activeReport)?.icon}</div>
            <div className="font-display font-semibold text-[#1F2926] text-lg mb-2">
              Relatório de {REPORT_TYPES.find(r => r.id === activeReport)?.label}
            </div>
            <div className="text-gray-500 text-sm mb-6">{REPORT_TYPES.find(r => r.id === activeReport)?.desc}</div>
            <button onClick={handleView} disabled={loading} className="bg-[#E8753D] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
              {loading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
              {loading ? 'Gerando...' : 'Gerar relatório'}
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
