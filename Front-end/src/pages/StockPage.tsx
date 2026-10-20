import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { Search, Plus, Edit, X, AlertTriangle, Filter } from '../components/Icons';
import { api } from '../lib/api';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CATEGORIES = ['Todos', 'Grãos', 'Laticínios', 'Mercearia', 'Massas', 'Conservas', 'Bebidas', 'Limpeza', 'Snacks', 'Carnes'];
type Product = { id: string; name: string; description: string; sku: string; ean?: string; category: string; price: number; quantity: number; minStock: number; status: 'active' | 'inactive' };

function stockStatus(p: Product): { label: string; cls: string } {
  if (p.status === 'inactive') return { label: 'Inativo', cls: 'bg-gray-100 text-gray-500' };
  if (p.quantity === 0) return { label: 'Sem estoque', cls: 'bg-[#C65B42]/10 text-[#C65B42]' };
  if (p.quantity < p.minStock) return { label: 'Estoque baixo', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'Em estoque', cls: 'bg-[#4F8B69]/10 text-[#4F8B69]' };
}

export default function StockPage() {
  const { currentUser, showToast } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState<'detail' | 'new' | 'edit' | 'entrada' | 'baixa' | 'ajuste' | 'history' | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', sku: '', ean: '', category: 'Grãos', price: '', quantity: '', minStock: '10', status: 'active' });
  const [movForm, setMovForm] = useState({ qty: '', reason: '', notes: '' });

  const loadProducts = () => api.get<{ items: Product[] }>('/inventory/products', { params: { status: 'all' } })
    .then(({ data }) => setProducts(data.items.map(product => ({ ...product, status: product.status.toLowerCase() as Product['status'] }))));

  useEffect(() => {
    loadProducts().catch(() => showToast({ type: 'error', message: 'Não foi possível carregar o estoque.' }));
  }, [showToast]);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.ean || '').includes(q);
    const matchCat = category === 'Todos' || p.category === category;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && p.status === 'active') || (statusFilter === 'inactive' && p.status === 'inactive') || (statusFilter === 'low' && p.quantity > 0 && p.quantity < p.minStock) || (statusFilter === 'out' && p.quantity === 0);
    return matchSearch && matchCat && matchStatus;
  });

  const openDetail = (p: Product) => { setSelected(p); setModal('detail'); };
  const openEdit = (p: Product) => { setSelected(p); setForm({ name: p.name, description: p.description, sku: p.sku, ean: p.ean || '', category: p.category, price: String(p.price), quantity: String(p.quantity), minStock: String(p.minStock), status: p.status }); setModal('edit'); };
  const openNew = () => { setForm({ name: '', description: '', sku: '', ean: '', category: 'Grãos', price: '', quantity: '', minStock: '10', status: 'active' }); setModal('new'); };
  const openMov = (p: Product, type: 'entrada' | 'baixa' | 'ajuste') => { setSelected(p); setMovForm({ qty: '', reason: '', notes: '' }); setModal(type); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSaveProduct = async () => {
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity), minStock: Number(form.minStock) };
      if (modal === 'new') await api.post('/inventory/products', payload);
      else if (selected) await api.patch(`/inventory/products/${selected.id}`, payload);
      await loadProducts();
      showToast({ type: 'success', message: modal === 'new' ? 'Produto cadastrado com sucesso!' : 'Produto atualizado com sucesso!' });
      closeModal();
    } catch {
      showToast({ type: 'error', message: 'Não foi possível salvar o produto.' });
    } finally {
      setSaving(false);
    }
  };

  const handleMovimento = async (type: 'entrada' | 'baixa' | 'ajuste') => {
    const qty = parseInt(movForm.qty) || 0;
    if (!qty) return;
    setSaving(true);
    try {
      await api.post(`/inventory/products/${selected?.id}/movements`, { type, quantity: qty, reason: movForm.reason, notes: movForm.notes });
      await loadProducts();
      showToast({ type: 'success', message: `Movimentação registrada com sucesso!` });
      closeModal();
    } catch {
      showToast({ type: 'error', message: 'Não foi possível registrar a movimentação.' });
    } finally {
      setSaving(false);
    }
  };

  const StockBadge = ({ p }: { p: Product }) => {
    const s = stockStatus(p);
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
  };

  const inpCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]';

  const alerts = products.filter(p => p.status === 'active' && (p.quantity === 0 || p.quantity < p.minStock));

  return (
    <AuthLayout title="Estoque e Produtos">
      <div className="p-4 lg:p-6 space-y-4">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-800">{alerts.length} produto{alerts.length > 1 ? 's' : ''} com estoque crítico</div>
              <div className="text-xs text-amber-700 mt-0.5">{alerts.map(p => p.name).join(', ')}</div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, SKU ou código..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D] bg-white">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D] bg-white">
            <option value="all">Todos os status</option>
            <option value="active">Em estoque</option>
            <option value="low">Estoque baixo</option>
            <option value="out">Sem estoque</option>
            <option value="inactive">Inativos</option>
          </select>
          {isAdmin && (
            <button onClick={openNew} className="flex items-center gap-2 bg-[#E8753D] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#d4662e] transition-colors">
              <Plus size={16} />
              Novo produto
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-4xl mb-3">📦</div>
              <div className="font-semibold text-gray-600 mb-1">Nenhum produto encontrado</div>
              <div className="text-sm text-gray-400">Ajuste os filtros ou cadastre um novo produto.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F6F7F8] border-b border-gray-100">
                  <tr>
                    {['Produto', 'SKU', 'Categoria', 'Preço', 'Estoque', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        {p.ean && <div className="text-[11px] text-gray-400 font-mono">{p.ean}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-mono text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{p.category}</td>
                      <td className="px-4 py-3.5 font-display font-semibold text-sm text-[#1F2926]">{fmt(p.price)}</td>
                      <td className="px-4 py-3.5">
                        <div className={`font-display font-bold text-sm ${p.quantity === 0 ? 'text-[#C65B42]' : p.quantity < p.minStock ? 'text-amber-600' : 'text-gray-800'}`}>{p.quantity} un.</div>
                        <div className="text-[11px] text-gray-400">Mín: {p.minStock}</div>
                      </td>
                      <td className="px-4 py-3.5"><StockBadge p={p} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetail(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Detalhes">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          {isAdmin && (
                            <>
                              <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Editar">
                                <Edit size={15} />
                              </button>
                              <button onClick={() => openMov(p, 'entrada')} className="p-1.5 rounded-lg hover:bg-[#4F8B69]/10 text-[#4F8B69] transition-colors text-xs font-bold" title="Entrada">E</button>
                              <button onClick={() => openMov(p, 'baixa')} className="p-1.5 rounded-lg hover:bg-[#C65B42]/10 text-[#C65B42] transition-colors text-xs font-bold" title="Baixa">B</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {modal === 'detail' && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-semibold text-[#1F2926]">Detalhes do produto</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#F6F7F8] rounded-xl p-4 space-y-3">
                {[['Nome', selected.name], ['Descrição', selected.description], ['SKU', selected.sku], ['EAN/GTIN', selected.ean || '—'], ['Categoria', selected.category], ['Preço', fmt(selected.price)], ['Quantidade', `${selected.quantity} unidades`], ['Estoque mínimo', `${selected.minStock} unidades`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-800 text-right max-w-[200px]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <StockBadge p={selected} />
              </div>
            </div>
            {isAdmin && (
              <div className="grid grid-cols-3 gap-2 px-6 pb-6">
                <button onClick={() => openMov(selected, 'entrada')} className="py-2 bg-[#4F8B69] text-white rounded-xl text-xs font-semibold hover:bg-[#3d6e54]">+ Entrada</button>
                <button onClick={() => openMov(selected, 'baixa')} className="py-2 bg-[#C65B42] text-white rounded-xl text-xs font-semibold hover:bg-[#a84836]">− Baixa</button>
                <button onClick={() => openMov(selected, 'ajuste')} className="py-2 bg-[#4D7CA8] text-white rounded-xl text-xs font-semibold hover:bg-[#3e6389]">⚖ Ajuste</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New/Edit product modal */}
      {(modal === 'new' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-semibold text-[#1F2926]">{modal === 'new' ? 'Novo produto' : 'Editar produto'}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {[
                { label: 'Nome *', field: 'name', placeholder: 'Nome do produto' },
                { label: 'Descrição', field: 'description', placeholder: 'Descrição breve' },
                { label: 'SKU *', field: 'sku', placeholder: 'ARR-001' },
                { label: 'EAN/GTIN (opcional)', field: 'ean', placeholder: '7891000000000' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} className={inpCls} />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Categoria</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inpCls}>
                  {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Preço (R$)</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0,00" className={inpCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Quantidade</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="0" className={inpCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Mínimo</label>
                  <input type="number" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))} placeholder="10" className={inpCls} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inpCls}>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSaveProduct} disabled={saving} className="flex-1 bg-[#E8753D] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d4662e] disabled:opacity-70 flex items-center justify-center gap-2">
                {saving ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movement modals */}
      {(modal === 'entrada' || modal === 'baixa' || modal === 'ajuste') && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-semibold text-[#1F2926]">
                {modal === 'entrada' ? 'Registrar entrada' : modal === 'baixa' ? 'Registrar baixa' : 'Ajustar estoque'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#F6F7F8] rounded-xl p-3 text-sm">
                <div className="font-medium text-gray-800">{selected.name}</div>
                <div className="text-gray-500">Estoque atual: <strong className="text-[#1F2926]">{selected.quantity} un.</strong></div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  {modal === 'ajuste' ? 'Nova quantidade total' : 'Quantidade'}
                </label>
                <input type="number" value={movForm.qty} onChange={e => setMovForm(p => ({ ...p, qty: e.target.value }))} placeholder="0" className={inpCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  {modal === 'baixa' ? 'Motivo da baixa *' : modal === 'ajuste' ? 'Justificativa *' : 'Observações'}
                </label>
                <input value={movForm.reason} onChange={e => setMovForm(p => ({ ...p, reason: e.target.value }))} placeholder={modal === 'entrada' ? 'Compra de fornecedor, devolução...' : 'Vencimento, perda, furto...'} className={inpCls} />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button
                onClick={() => handleMovimento(modal as any)}
                disabled={saving || !movForm.qty}
                className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-70 flex items-center justify-center gap-2 ${modal === 'entrada' ? 'bg-[#4F8B69] hover:bg-[#3d6e54]' : modal === 'baixa' ? 'bg-[#C65B42] hover:bg-[#a84836]' : 'bg-[#4D7CA8] hover:bg-[#3e6389]'}`}
              >
                {saving ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
