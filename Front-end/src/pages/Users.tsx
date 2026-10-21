import { useEffect, useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import { Plus, X, Check, Edit } from '../components/Icons';
import { api } from '../lib/api';
import { dateToIso, digitsOnly, formatCpf, formatDate, formatPhone } from '../lib/formatters';
import { useApp } from '../contexts/AppContext';

type Member = { id: string; name: string; cpf: string | null; email: string; phone: string | null; birthDate: string | null; role: 'admin' | 'operator'; status: 'active' | 'inactive'; createdAt: string };
type Form = { name: string; cpf: string; email: string; phone: string; birthDate: string; password: string; role: 'admin' | 'operator'; status: 'active' | 'inactive' };
type FormField = keyof Form;
const empty: Form = { name: '', cpf: '', email: '', phone: '', birthDate: '', password: '', role: 'operator', status: 'active' };

function validCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

export default function Users() {
  const { showToast } = useApp();
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState<Form>(empty);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Member | null>(null);

  const load = () => api.get<{ items: Member[] }>('/auth/team').then(({ data }) => setMembers(data.items.map(member => ({
    ...member,
    name: member.name || 'Sem nome',
    cpf: member.cpf || '',
    phone: member.phone || '',
    role: member.role === 'admin' ? 'admin' : 'operator',
    status: member.status === 'active' ? 'active' : 'inactive'
  }))));

  useEffect(() => {
    load().catch(() => showToast({ type: 'error', message: 'Não foi possível carregar a equipe.' }));
  }, [showToast]);

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Informe o nome completo.';
    if (!editing || form.cpf || editing.cpf) {
      if (!validCpf(form.cpf)) nextErrors.cpf = 'Informe um CPF válido.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Informe um e-mail válido.';
    if (!editing || form.phone || editing.phone) {
      if (![10, 11].includes(digitsOnly(form.phone).length)) nextErrors.phone = 'Informe um telefone com DDD.';
    }
    if (!editing || form.birthDate || editing.birthDate) {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.birthDate)) nextErrors.birthDate = 'Use o formato DD/MM/AAAA.';
    }
    if (!editing && form.password.length < 8) nextErrors.password = 'A senha deve ter pelo menos 8 caracteres.';
    if (editing && form.password && form.password.length < 8) nextErrors.password = 'A senha deve ter pelo menos 8 caracteres.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        ...(form.cpf ? { cpf: digitsOnly(form.cpf) } : {}),
        ...(form.phone ? { phone: digitsOnly(form.phone) } : {}),
        ...(form.birthDate ? { birthDate: dateToIso(form.birthDate) } : {}),
        status: form.status,
        ...(editing && !form.password ? { password: undefined } : {})
      };
      if (editing) await api.patch(`/auth/team/${editing.id}`, payload);
      else await api.post('/auth/team', payload);
      await load();
      setModal(false);
      setEditing(null);
      setForm(empty);
      setErrors({});
      showToast({ type: 'success', message: editing ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.' });
    } catch (error) {
      const data = (error as { response?: { data?: { message?: string; errors?: Array<{ field?: string; message?: string }> } } }).response?.data;
      const serverErrors = Object.fromEntries((data?.errors || []).map(item => [item.field || 'form', item.message || 'Valor inválido.']));
      setErrors(Object.keys(serverErrors).length ? serverErrors : { form: data?.message || 'Não foi possível cadastrar o usuário.' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({
      name: member.name,
      cpf: member.cpf ? formatCpf(member.cpf) : '',
      email: member.email,
      phone: member.phone ? formatPhone(member.phone) : '',
      birthDate: member.birthDate ? formatDate(new Date(member.birthDate).toLocaleDateString('pt-BR')) : '',
      password: '',
      role: member.role,
      status: member.status
    });
    setErrors({});
    setModal(true);
  };

  const toggle = async (member: Member) => {
    try {
      await api.patch(`/auth/team/${member.id}/status`, { status: member.status === 'active' ? 'inactive' : 'active' });
      await load();
    } catch (error) {
      showToast({ type: 'error', message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Não foi possível alterar o status.' });
    }
  };

  const fields: Array<{ field: Exclude<FormField, 'role'>; label: string; placeholder: string; type: string }> = [
    { field: 'name', label: 'Nome completo *', placeholder: 'Nome do usuário', type: 'text' },
    { field: 'cpf', label: 'CPF *', placeholder: '000.000.000-00', type: 'text' },
    { field: 'email', label: 'E-mail *', placeholder: 'usuario@exemplo.com', type: 'email' },
    { field: 'phone', label: 'Telefone *', placeholder: '(00) 00000-0000', type: 'tel' },
    { field: 'birthDate', label: 'Data de nascimento *', placeholder: 'DD/MM/AAAA', type: 'text' },
    { field: 'password', label: 'Senha *', placeholder: 'Mínimo de 8 caracteres', type: 'password' }
  ];

  return <AuthLayout title="Equipe"><div className="p-4 lg:p-6 space-y-5">
    <div className="flex justify-end"><button onClick={() => { setEditing(null); setForm(empty); setErrors({}); setModal(true); }} className="flex items-center gap-2 bg-[#E8753D] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#d4662e] transition-colors"><Plus size={16} /> Novo usuário</button></div>
    <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto"><table className="w-full"><thead className="bg-[#F6F7F8]"><tr>{['Usuário', 'CPF', 'Perfil', 'E-mail', 'Telefone', 'Status', 'Ações'].map(header => <th key={header} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{header}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{members.map(member => <tr key={member.id}><td className="px-4 py-3 text-sm font-medium">{member.name}</td><td className="px-4 py-3 text-sm">{member.cpf ? formatCpf(member.cpf) : 'Não informado'}</td><td className="px-4 py-3 text-sm">{member.role === 'admin' ? 'Administrador' : 'Operador'}</td><td className="px-4 py-3 text-sm">{member.email}</td><td className="px-4 py-3 text-sm">{member.phone ? formatPhone(member.phone) : 'Não informado'}</td><td className="px-4 py-3 text-sm">{member.status === 'active' ? 'Ativo' : 'Inativo'}</td><td className="px-4 py-3 flex gap-2"><button onClick={() => openEdit(member)} className="text-gray-500 hover:text-[#E8753D]" title="Editar usuário"><Edit size={16} /></button><button onClick={() => toggle(member)} className="text-gray-500">{member.status === 'active' ? <X size={16} /> : <Check size={16} />}</button></td></tr>)}</tbody></table></div>
    {modal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between px-6 py-5 border-b border-gray-100"><div><h2 className="font-display font-semibold text-[#1F2926]">{editing ? 'Editar usuário' : 'Cadastrar usuário'}</h2><p className="text-xs text-gray-400 mt-1">{editing ? 'Atualize os dados da pessoa da equipe.' : 'Preencha os dados da pessoa da equipe.'}</p></div><button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button></div><div className="p-6 space-y-4">
      {errors.form && <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">{errors.form}</p>}
        {fields.map(({ field, label, placeholder, type }) => <div key={field}><label className="text-sm font-medium text-gray-700 block mb-1.5">{field === 'password' && editing ? 'Nova senha (opcional)' : field === 'cpf' && editing && !editing.cpf ? 'CPF (opcional para registro antigo)' : field === 'phone' && editing && !editing.phone ? 'Telefone (opcional para registro antigo)' : label}</label><input required={!editing || (field !== 'password' && !(field === 'cpf' && !editing.cpf) && !(field === 'phone' && !editing.phone) && !(field === 'birthDate' && !editing.birthDate))} type={type} inputMode={field === 'cpf' || field === 'phone' || field === 'birthDate' ? 'numeric' : undefined} maxLength={field === 'cpf' ? 14 : field === 'phone' ? 15 : field === 'birthDate' ? 10 : undefined} value={form[field]} onChange={event => setForm({ ...form, [field]: field === 'cpf' ? formatCpf(event.target.value) : field === 'phone' ? formatPhone(event.target.value) : field === 'birthDate' ? formatDate(event.target.value) : event.target.value })} placeholder={placeholder} className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${errors[field] ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-[#E8753D]/20 focus:border-[#E8753D]'}`} />{errors[field] && <p className="text-red-600 text-xs mt-1">{errors[field]}</p>}</div>)}
      <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Perfil *</label><select value={form.role} onChange={event => setForm({ ...form, role: event.target.value as Form['role'] })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]"><option value="operator">Operador</option><option value="admin">Administrador</option></select></div>
        <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Status *</label><select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as Form['status'] })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
      <div className="flex gap-3 pt-2"><button onClick={() => setModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button><button disabled={saving} onClick={save} className="flex-1 bg-[#E8753D] text-white rounded-xl py-2.5 font-semibold hover:bg-[#d4662e] disabled:opacity-60">{saving ? 'Salvando...' : 'Cadastrar usuário'}</button></div>
    </div></div></div>}
  </div></AuthLayout>;
}
