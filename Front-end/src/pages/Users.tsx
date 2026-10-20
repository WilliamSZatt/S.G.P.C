import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { Search, Plus, Edit, X, Check } from '../components/Icons';

type Member = { id: string; name: string; email: string; phone: string; role: string; status: string; lastActivity: string; createdAt: string };

export default function Users() {
  const { showToast } = useApp();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'new' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'operator', status: 'active' });

  const filtered = members.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setForm({ name: '', email: '', phone: '', role: 'operator', status: 'active' }); setModal('new'); };
  const openEdit = (m: Member) => { setSelected(m); setForm({ name: m.name, email: m.email, phone: m.phone, role: m.role, status: m.status }); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      if (modal === 'new') {
        const nm: Member = { id: Date.now().toString(), ...form, lastActivity: '—', createdAt: new Date().toLocaleDateString('pt-BR') };
        setMembers(p => [...p, nm]);
        showToast({ type: 'success', message: 'Usuário cadastrado com sucesso!' });
      } else if (selected) {
        setMembers(p => p.map(m => m.id === selected.id ? { ...m, ...form } : m));
        showToast({ type: 'success', message: 'Usuário atualizado com sucesso!' });
      }
      setSaving(false);
      closeModal();
    }, 900);
  };

  const toggleStatus = (id: string) => {
    const member = members.find(m => m.id === id);
    const activeAdmins = members.filter(m => m.role === 'admin' && m.status === 'active');
    if (member?.role === 'admin' && member.status === 'active' && activeAdmins.length === 1) {
      showToast({ type: 'error', message: 'Não é possível desativar o último administrador ativo.' });
      setConfirmToggle(null);
      return;
    }
    setMembers(p => p.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m));
    setConfirmToggle(null);
    showToast({ type: 'success', message: 'Status do usuário atualizado.' });
  };

  const inpCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]';

  return (
    <AuthLayout title="Usuários e Equipe">
      <div className="p-4 lg:p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: members.length, color: 'text-[#1F2926]' },
            { label: 'Ativos', value: members.filter(m => m.status === 'active').length, color: 'text-[#4F8B69]' },
            { label: 'Inativos', value: members.filter(m => m.status === 'inactive').length, color: 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-[#E8753D] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#d4662e] transition-colors">
            <Plus size={16} />
            Novo usuário
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F6F7F8] border-b border-gray-100">
                <tr>
                  {['Usuário', 'Perfil', 'Última atividade', 'Cadastro', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1F2926] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-white">{m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{m.name}</div>
                          <div className="text-xs text-gray-400">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${m.role === 'admin' ? 'bg-[#1F2926]/10 text-[#1F2926]' : 'bg-[#E8753D]/10 text-[#E8753D]'}`}>
                        {m.role === 'admin' ? 'Administrador' : 'Operador'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{m.lastActivity}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{m.createdAt}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.status === 'active' ? 'bg-[#4F8B69]/10 text-[#4F8B69]' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'active' ? 'bg-[#4F8B69]' : 'bg-gray-400'}`} />
                        {m.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => setConfirmToggle(m.id)} className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${m.status === 'active' ? 'text-amber-500' : 'text-[#4F8B69]'}`} title={m.status === 'active' ? 'Desativar' : 'Ativar'}>
                          {m.status === 'active' ? <X size={15} /> : <Check size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-semibold text-[#1F2926]">{modal === 'new' ? 'Novo usuário' : 'Editar usuário'}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nome completo *', field: 'name', type: 'text', placeholder: 'Nome do usuário' },
                { label: 'E-mail *', field: 'email', type: 'email', placeholder: 'email@dominio.com' },
                { label: 'Telefone', field: 'phone', type: 'tel', placeholder: '(11) 99999-9999' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} className={inpCls} />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Perfil *</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={inpCls}>
                  <option value="admin">Administrador/Gerente</option>
                  <option value="operator">Operador/Funcionário</option>
                </select>
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
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#E8753D] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d4662e] disabled:opacity-70 flex items-center justify-center gap-2">
                {saving ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm toggle */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-display font-semibold text-[#1F2926] mb-2">Alterar status do usuário</h3>
            <p className="text-sm text-gray-500 mb-5">Deseja alterar o status deste usuário? Usuários inativos não poderão fazer login.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmToggle(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={() => toggleStatus(confirmToggle)} className="flex-1 bg-[#E8753D] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#d4662e]">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
