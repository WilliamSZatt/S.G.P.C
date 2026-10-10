import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { CLIENTS, Client } from '../data/mockData';
import { Search, Plus, Edit, X, Check, ChevronLeft, ChevronRight } from '../components/Icons';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type ModalMode = 'new' | 'edit' | 'view' | null;

const EMPTY: Omit<Client, 'id' | 'totalSpent' | 'lastPurchase' | 'purchases'> = { name: '', cpf: '', phone: '', email: '', status: 'active' };

export default function Clients() {
  const { showToast } = useApp();
  const [clients, setClients] = useState(CLIENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openNew = () => { setForm(EMPTY); setErrors({}); setModal('new'); };
  const openEdit = (c: Client) => { setSelectedClient(c); setForm({ name: c.name, cpf: c.cpf, phone: c.phone, email: c.email, status: c.status }); setErrors({}); setModal('edit'); };
  const openView = (c: Client) => { setSelectedClient(c); setModal('view'); };
  const closeModal = () => { setModal(null); setSelectedClient(null); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name) e.name = 'Nome obrigatório';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      if (modal === 'new') {
        const newClient: Client = { ...form, id: Date.now().toString(), totalSpent: 0, lastPurchase: '—' };
        setClients(p => [newClient, ...p]);
        showToast({ type: 'success', message: 'Cliente cadastrado com sucesso!' });
      } else if (modal === 'edit' && selectedClient) {
        setClients(p => p.map(c => c.id === selectedClient.id ? { ...c, ...form } : c));
        showToast({ type: 'success', message: 'Cliente atualizado com sucesso!' });
      }
      setSaving(false);
      closeModal();
    }, 1000);
  };

  const toggleStatus = (id: string) => {
    setClients(p => p.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c));
    setConfirmDeactivate(null);
    showToast({ type: 'success', message: 'Status do cliente atualizado.' });
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${status === 'active' ? 'bg-[#4F8B69]/10 text-[#4F8B69]' : 'bg-gray-100 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-[#4F8B69]' : 'bg-gray-400'}`} />
      {status === 'active' ? 'Ativo' : 'Inativo'}
    </span>
  );

  const inputCls = (field: string) => `w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${errors[field] ? 'border-[#C65B42] focus:ring-[#C65B42]/20' : 'border-gray-200 focus:ring-[#E8753D]/20 focus:border-[#E8753D]'}`;

  return (
    <AuthLayout title="Clientes">
      <div className="p-4 lg:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]"
            />
          </div>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {[['all', 'Todos'], ['active', 'Ativos'], ['inactive', 'Inativos']].map(([v, l]) => (
              <button key={v} onClick={() => { setStatusFilter(v as any); setPage(1); }} className={`px-3 py-2 text-sm font-medium transition-colors ${statusFilter === v ? 'bg-[#1F2926] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-[#E8753D] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#d4662e] transition-colors">
            <Plus size={16} />
            Novo cliente
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {visible.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-4xl mb-3">👥</div>
              <div className="font-semibold text-gray-600 mb-1">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</div>
              <div className="text-sm text-gray-400">{search ? 'Tente outros termos de busca.' : 'Clique em "Novo cliente" para começar.'}</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F7F8] border-b border-gray-100">
                    <tr>
                      {['Cliente', 'CPF', 'Contato', 'Total gasto', 'Última compra', 'Status', 'Ações'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {visible.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1F2926] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-white">{c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{c.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">{c.cpf}</td>
                        <td className="px-4 py-3.5">
                          <div className="text-sm text-gray-700">{c.phone}</div>
                          <div className="text-xs text-gray-400">{c.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-display font-semibold text-sm text-[#1F2926]">{fmt(c.totalSpent)}</div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-500">{c.lastPurchase}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openView(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Ver ficha">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Editar">
                              <Edit size={15} />
                            </button>
                            <button onClick={() => setConfirmDeactivate(c.id)} className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${c.status === 'active' ? 'text-amber-500' : 'text-[#4F8B69]'}`} title={c.status === 'active' ? 'Desativar' : 'Ativar'}>
                              {c.status === 'active' ? <X size={15} /> : <Check size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">{filtered.length} clientes · Página {page} de {pages}</div>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal: new/edit */}
      {(modal === 'new' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-semibold text-[#1F2926]">{modal === 'new' ? 'Novo cliente' : 'Editar cliente'}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nome completo *', field: 'name', placeholder: 'Nome do cliente', type: 'text' },
                { label: 'CPF', field: 'cpf', placeholder: '***.***.***-**', type: 'text' },
                { label: 'Telefone', field: 'phone', placeholder: '(11) 99999-9999', type: 'tel' },
                { label: 'E-mail *', field: 'email', placeholder: 'cliente@email.com', type: 'email' },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className={inputCls(field)}
                  />
                  {errors[field] && <p className="text-[#C65B42] text-xs mt-1">{errors[field]}</p>}
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className={inputCls('status')}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#E8753D] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d4662e] disabled:opacity-70 flex items-center justify-center gap-2">
                {saving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: view */}
      {modal === 'view' && selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-semibold text-[#1F2926]">Ficha do cliente</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#1F2926] flex items-center justify-center">
                  <span className="font-display font-bold text-lg text-white">{selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                </div>
                <div>
                  <div className="font-display font-semibold text-[#1F2926] text-lg">{selectedClient.name}</div>
                  <StatusBadge status={selectedClient.status} />
                </div>
              </div>
              <div className="space-y-3 bg-[#F6F7F8] rounded-xl p-4">
                {[['CPF', selectedClient.cpf], ['Telefone', selectedClient.phone], ['E-mail', selectedClient.email], ['Total gasto', fmt(selectedClient.totalSpent)], ['Última compra', selectedClient.lastPurchase]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => { closeModal(); openEdit(selectedClient); }} className="w-full bg-[#1F2926] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2a3a36]">
                Editar cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm deactivate */}
      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-display font-semibold text-[#1F2926] mb-2">Confirmar alteração</h3>
            <p className="text-sm text-gray-500 mb-5">Deseja alterar o status deste cliente? Esta ação pode ser revertida a qualquer momento.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeactivate(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={() => toggleStatus(confirmDeactivate)} className="flex-1 bg-[#E8753D] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d4662e]">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
