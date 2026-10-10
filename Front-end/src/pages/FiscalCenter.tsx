import { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import { FISCAL_DATA, STORE } from '../data/mockData';
import { Download, Filter } from '../components/Icons';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FiscalCenter() {
  const [period, setPeriod] = useState('Todos');

  return (
    <AuthLayout title="Centro Fiscal">
      <div className="p-4 lg:p-6 space-y-5">
        {/* Demo badge */}
        <div className="bg-[#4D7CA8]/10 border border-[#4D7CA8]/30 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4D7CA8] flex items-center justify-center flex-shrink-0 text-white text-sm">ℹ</div>
          <div>
            <div className="font-semibold text-[#4D7CA8] text-sm">Dados demonstrativos — integração fiscal futura</div>
            <div className="text-xs text-[#4D7CA8]/70 mt-0.5">Este painel é demonstrativo. As informações fiscais reais serão disponibilizadas com a integração futura à SEFAZ e emissão de NFC-e.</div>
          </div>
        </div>

        {/* Store info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-display font-semibold text-[#1F2926] mb-4">Dados do estabelecimento</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ['Razão social', STORE.legalName],
              ['Nome fantasia', STORE.fantasyName],
              ['CNPJ', STORE.cnpjMasked],
              ['Inscrição estadual', STORE.ie],
              ['Segmento', STORE.segment],
              ['Regime tributário', 'Simples Nacional (Demonstrativo)'],
            ].map(([k, v]) => (
              <div key={k} className="text-sm">
                <div className="text-gray-500 text-xs mb-0.5">{k}</div>
                <div className="font-medium text-gray-800">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <div className="flex gap-2 flex-wrap">
            {['Todos', '2026', 'Últimos 6 meses'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-[#1F2926] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>{p}</button>
            ))}
          </div>
          <button className="ml-auto flex items-center gap-2 text-sm text-[#4D7CA8] border border-[#4D7CA8]/30 px-3 py-1.5 rounded-lg hover:bg-[#4D7CA8]/5 transition-colors">
            <Download size={15} />
            Exportar (demo)
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F6F7F8] border-b border-gray-100">
                <tr>
                  {['Competência', 'Receita bruta', 'Despesas', 'Impostos est.', 'DAS (demo)', 'Vencimento', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {FISCAL_DATA.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-display font-semibold text-sm text-[#1F2926]">{row.competence}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{fmt(row.revenue)}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{fmt(row.expenses)}</td>
                    <td className="px-4 py-4 text-sm text-[#C65B42] font-medium">{fmt(row.taxes)}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-[#4D7CA8]">{fmt(row.das)}</div>
                      <div className="text-[10px] text-gray-400">Simples Nacional (demo)</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{row.dueDate}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${row.status === 'pago' ? 'bg-[#4F8B69]/10 text-[#4F8B69]' : 'bg-amber-100 text-amber-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'pago' ? 'bg-[#4F8B69]' : 'bg-amber-500'}`} />
                        {row.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fiscal documents */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-display font-semibold text-[#1F2926] mb-4">Documentos fiscais demonstrativos</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { name: 'NFC-e', status: 'Futuro', desc: 'Nota Fiscal do Consumidor eletrônica' },
              { name: 'NF-e', status: 'Futuro', desc: 'Nota Fiscal eletrônica para fornecedores' },
              { name: 'DAS', status: 'Demo', desc: 'Documento de Arrecadação do Simples' },
            ].map(doc => (
              <div key={doc.name} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-display font-semibold text-[#1F2926]">{doc.name}</div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${doc.status === 'Demo' ? 'bg-[#4D7CA8]/10 text-[#4D7CA8]' : 'bg-gray-100 text-gray-500'}`}>{doc.status}</span>
                </div>
                <div className="text-xs text-gray-500">{doc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
