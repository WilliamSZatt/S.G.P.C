import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AuthLayout from '../components/AuthLayout';
import { Download, Filter, Printer } from '../components/Icons';
import { api } from '../lib/api';

type ReportPeriod = 'today' | '7days' | 'month' | 'quarter' | 'custom';
type ReportStatus = 'all' | 'completed' | 'pending' | 'cancelled';
type PaymentFilter = 'all' | 'dinheiro' | 'pix' | 'credito' | 'debito';
type Sale = {
  id: string;
  number: string;
  total: number;
  paymentMethod: 'CASH' | 'PIX' | 'CREDIT' | 'DEBIT';
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  createdAt: string;
  client: { name: string } | null;
};

const fmt = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const paymentLabels: Record<Sale['paymentMethod'], string> = { CASH: 'Dinheiro', PIX: 'PIX', CREDIT: 'Crédito', DEBIT: 'Débito' };
const statusLabels: Record<Sale['status'], string> = { COMPLETED: 'Concluída', PENDING: 'Pendente', CANCELLED: 'Cancelada' };
const periods: Array<[ReportPeriod, string]> = [['today', 'Hoje'], ['7days', 'Últimos 7 dias'], ['month', 'Este mês'], ['quarter', 'Trimestre'], ['custom', 'Personalizado']];

function rangeFor(period: ReportPeriod, start: string, end: string) {
  if (period === 'custom') {
    return {
      start: start ? new Date(`${start}T00:00:00`).toISOString() : '',
      end: end ? new Date(`${end}T23:59:59.999`).toISOString() : ''
    };
  }
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  if (period === '7days') from.setDate(from.getDate() - 6);
  if (period === 'month') from.setDate(1);
  if (period === 'quarter') from.setMonth(from.getMonth() - 2, 1);
  return { start: from.toISOString(), end: now.toISOString() };
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [status, setStatus] = useState<ReportStatus>('all');
  const [payment, setPayment] = useState<PaymentFilter>('all');
  const [search, setSearch] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const range = rangeFor(period, start, end);
      const { data } = await api.get<{ items: Sale[] }>('/sales', {
        params: { search: search.trim() || undefined, status, paymentMethod: payment, limit: 1000, startDate: range.start || undefined, endDate: range.end || undefined }
      });
      setSales(data.items);
    } catch {
      setError('Não foi possível carregar o relatório.');
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [end, payment, period, search, start, status]);

  useEffect(() => { void load(); }, [load]);

  const completed = sales.filter(sale => sale.status === 'COMPLETED');
  const revenue = completed.reduce((sum, sale) => sum + sale.total, 0);
  const average = completed.length ? revenue / completed.length : 0;
  const paymentCount = completed.filter(sale => sale.paymentMethod === 'PIX').length;
  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();
    completed.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      grouped.set(date, (grouped.get(date) || 0) + sale.total);
    });
    return [...grouped].map(([date, total]) => ({ date, total }));
  }, [completed]);

  const exportCsv = () => {
    const rows = [['Número', 'Cliente', 'Total', 'Pagamento', 'Status', 'Data'], ...sales.map(sale => [
      sale.number, sale.client?.name || 'Consumidor não informado', sale.total.toFixed(2).replace('.', ','),
      paymentLabels[sale.paymentMethod], statusLabels[sale.status], new Date(sale.createdAt).toLocaleString('pt-BR')
    ])];
    download('relatorio-vendas.csv', rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(';')).join('\n'), 'text/csv;charset=utf-8');
  };

  return (
    <AuthLayout title="Relatórios">
      <div className="print-report p-4 lg:p-6 space-y-5">
        <div className="report-controls bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2926]"><Filter size={16} /> Filtros do relatório</div>
          <div className="flex flex-wrap gap-2">
            {periods.map(([value, label]) => <button key={value} onClick={() => setPeriod(value)} className={`px-3 py-1.5 rounded-lg text-sm ${period === value ? 'bg-[#1F2926] text-white' : 'border border-gray-200 text-gray-600'}`}>{label}</button>)}
          </div>
          {period === 'custom' && <div className="flex flex-wrap gap-3"><label className="text-xs text-gray-500">De<input type="date" value={start} onChange={event => setStart(event.target.value)} className="block border rounded-lg p-2 text-sm" /></label><label className="text-xs text-gray-500">Até<input type="date" value={end} onChange={event => setEnd(event.target.value)} className="block border rounded-lg p-2 text-sm" /></label></div>}
          <div className="flex flex-wrap gap-3">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nº da venda, cliente, produto ou SKU..." className="min-w-64 flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
            <select value={status} onChange={event => setStatus(event.target.value as ReportStatus)} className="border rounded-lg px-3 py-2 text-sm"><option value="all">Todos os status</option><option value="completed">Concluídas</option><option value="pending">Pendentes</option><option value="cancelled">Canceladas</option></select>
            <select value={payment} onChange={event => setPayment(event.target.value as PaymentFilter)} className="border rounded-lg px-3 py-2 text-sm"><option value="all">Todas as formas</option><option value="pix">PIX</option><option value="dinheiro">Dinheiro</option><option value="credito">Crédito</option><option value="debito">Débito</option></select>
            <button onClick={() => void load()} className="bg-[#E8753D] text-white rounded-lg px-4 py-2 text-sm font-semibold">Atualizar</button>
            <button onClick={exportCsv} disabled={!sales.length} className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50"><Download size={14} className="inline mr-1" /> CSV</button>
            <button onClick={() => window.print()} className="border rounded-lg px-3 py-2 text-sm"><Printer size={14} className="inline mr-1" /> PDF / imprimir</button>
          </div>
        </div>
        {error && <div className="report-controls bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Vendas concluídas', completed.length.toString(), 'Quantidade de vendas concluídas no filtro.'],
            ['Receita total', fmt(revenue), 'Soma dos valores das vendas concluídas.'],
            ['Ticket médio', fmt(average), 'Receita total dividida pela quantidade de vendas concluídas.'],
            ['Participação PIX', completed.length ? `${Math.round(paymentCount / completed.length * 100)}%` : '0%', 'Percentual de vendas concluídas pagas via PIX.']
          ].map(([label, value, description]) => <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100"><div className="text-xs text-gray-500">{label}</div><div className="font-display font-bold text-xl text-[#1F2926] mt-1">{value}</div><div className="text-[11px] text-gray-400 mt-1">{description}</div></div>)}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-display font-semibold text-[#1F2926] mb-4">Receita por dia</h3>
          {loading ? <div className="h-64 flex items-center justify-center text-sm text-gray-400">Carregando relatório...</div> : chartData.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" /><YAxis tickFormatter={value => `R$${value}`} /><Tooltip formatter={value => fmt(Number(value))} /><Bar dataKey="total" name="Receita" fill="#4F8B69" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="h-64 flex items-center justify-center text-sm text-gray-400">Não há vendas concluídas no período.</div>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 font-display font-semibold text-[#1F2926]">Vendas filtradas ({sales.length})</div>
          <div className="overflow-x-auto"><table className="w-full"><thead className="bg-[#F6F7F8]"><tr>{['Nº Venda', 'Cliente', 'Total', 'Pagamento', 'Status', 'Data'].map(header => <th key={header} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{header}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{sales.map(sale => <tr key={sale.id}><td className="px-4 py-3 text-sm">{sale.number}</td><td className="px-4 py-3 text-sm">{sale.client?.name || 'Consumidor não informado'}</td><td className="px-4 py-3 text-sm font-semibold">{fmt(sale.total)}</td><td className="px-4 py-3 text-sm">{paymentLabels[sale.paymentMethod]}</td><td className="px-4 py-3 text-sm">{statusLabels[sale.status]}</td><td className="px-4 py-3 text-sm text-gray-500">{new Date(sale.createdAt).toLocaleString('pt-BR')}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </AuthLayout>
  );
}
