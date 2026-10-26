import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { Check } from '../components/Icons';
import { api } from '../lib/api';
import { SETTINGS_CHANGED_EVENT } from '../lib/notifications';

const TABS_ADMIN = ['Dados do comércio', 'Perfil do admin', 'PDV', 'Estoque', 'Notificações'];
const SETTINGS_KEY = 'sgpc_settings';

type StoreData = {
  document: string;
  legalName: string;
  fantasyName: string;
  stateTaxId: string | null;
  segment: string;
  zipCode: string;
  address: string;
  number: string;
  city: string;
  state: string;
  requireClient: boolean;
  allowDiscount: boolean;
  printReceipt: boolean;
  stockWarning: boolean;
  defaultMinStock: number;
  warningPercentage: number;
  stockCriticalNotifications: boolean;
  saleNotifications: boolean;
  paymentFailureNotifications: boolean;
  userChangeNotifications: boolean;
  passwordRecoveryNotifications: boolean;
};

type StoreUser = {
  name: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  role: string;
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[#4F8B69]' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function Settings() {
  const { currentUser, showToast, updateCurrentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [storeUser, setStoreUser] = useState<StoreUser | null>(null);
  const [editingStore, setEditingStore] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profilePassword, setProfilePassword] = useState('');
  const [originalStore, setOriginalStore] = useState<StoreData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<StoreUser | null>(null);

  useEffect(() => {
    api.get<{ store: StoreData; user: StoreUser }>('/auth/store')
      .then(({ data }) => {
        setStoreData(data.store);
        setStoreUser(data.user);
        setOriginalStore(data.store);
        setOriginalProfile(data.user);
        setPdvSettings({
          requireClient: data.store.requireClient,
          allowDiscount: data.store.allowDiscount,
          printReceipt: data.store.printReceipt,
          stockWarning: data.store.stockWarning,
        });
        setStockSettings({
          defaultMinStock: String(data.store.defaultMinStock),
          warningPercentage: String(data.store.warningPercentage),
        });
        setNotifSettings({
          stockCritical: data.store.stockCriticalNotifications,
          saleDone: data.store.saleNotifications,
          paymentFail: data.store.paymentFailureNotifications,
          userChanged: data.store.userChangeNotifications,
          passwordRecovery: data.store.passwordRecoveryNotifications,
        });
      })
      .catch(() => showToast({ type: 'error', message: 'Não foi possível carregar os dados do comércio.' }));
  }, [showToast]);

  const [notifSettings, setNotifSettings] = useState({
    stockCritical: true,
    saleDone: true,
    paymentFail: true,
    userChanged: true,
    passwordRecovery: false,
  });

  const [pdvSettings, setPdvSettings] = useState({
    requireClient: true,
    allowDiscount: true,
    printReceipt: false,
    stockWarning: true,
  });
  const [stockSettings, setStockSettings] = useState({ defaultMinStock: '10', warningPercentage: '20' });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        requireClient: pdvSettings.requireClient,
        allowDiscount: pdvSettings.allowDiscount,
        printReceipt: pdvSettings.printReceipt,
        stockWarning: pdvSettings.stockWarning,
        defaultMinStock: Number(stockSettings.defaultMinStock),
        warningPercentage: Number(stockSettings.warningPercentage),
        stockCriticalNotifications: notifSettings.stockCritical,
        saleNotifications: notifSettings.saleDone,
        paymentFailureNotifications: notifSettings.paymentFail,
        userChangeNotifications: notifSettings.userChanged,
        passwordRecoveryNotifications: notifSettings.passwordRecovery,
      };
      const { data } = await api.patch<{ store: StoreData }>('/auth/settings', payload);
      setStoreData(data.store);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ notifSettings, pdvSettings, stockSettings }));
      window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT, { detail: { notifSettings, pdvSettings, stockSettings } }));
      showToast({ type: 'success', message: 'Configurações salvas com sucesso!' });
    } catch (error) {
      showToast({ type: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar as configurações.' });
    } finally {
      setSaving(false);
    }
  };

  const saveStore = async () => {
    if (!storeData) return;
    setSaving(true);
    try {
      const { data } = await api.patch<{ store: StoreData }>('/auth/store', storeData);
      setStoreData(data.store);
      setOriginalStore(data.store);
      setEditingStore(false);
      showToast({ type: 'success', message: 'Dados do comércio atualizados.' });
    } catch {
      showToast({ type: 'error', message: 'Não foi possível atualizar os dados do comércio.' });
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!storeUser) return;
    setSaving(true);
    try {
      const { data } = await api.patch<{ user: StoreUser }>('/auth/profile', {
        name: storeUser.name,
        email: storeUser.email,
        phone: storeUser.phone || '',
        birthDate: storeUser.birthDate ? storeUser.birthDate.slice(0, 10) : '',
        ...(profilePassword ? { password: profilePassword } : {})
      });
      setStoreUser({ ...storeUser, ...data.user });
      setOriginalProfile({ ...storeUser, ...data.user });
      updateCurrentUser({ name: data.user.name, email: data.user.email });
      setProfilePassword('');
      setEditingProfile(false);
      showToast({ type: 'success', message: 'Perfil atualizado.' });
    } catch {
      showToast({ type: 'error', message: 'Não foi possível atualizar o perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const startStoreEditing = () => {
    if (storeData) setOriginalStore({ ...storeData });
    setEditingStore(true);
  };

  const cancelStoreEditing = () => {
    setStoreData(originalStore ? { ...originalStore } : storeData);
    setEditingStore(false);
  };

  const startProfileEditing = () => {
    if (storeUser) setOriginalProfile({ ...storeUser });
    setEditingProfile(true);
  };

  const cancelProfileEditing = () => {
    setStoreUser(originalProfile ? { ...originalProfile } : storeUser);
    setProfilePassword('');
    setEditingProfile(false);
  };

  const inpCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]';

  const tabs = isAdmin ? TABS_ADMIN : ['Meu perfil', 'Notificações'];

  return (
    <AuthLayout title="Configurações">
      <div className="p-4 lg:p-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#F6F7F8] rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === i ? 'bg-white shadow text-[#1F2926]' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="max-w-2xl">
          {/* Store data */}
          {((tab === 0 && isAdmin) || (tab === 0 && !isAdmin)) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              {isAdmin ? <h3 className="font-display font-semibold text-[#1F2926] mb-4">Dados do comércio</h3> : <h3 className="font-display font-semibold text-[#1F2926] mb-4">Meu perfil</h3>}
              {!storeData || !storeUser ? (
                <p className="text-sm text-gray-500">Carregando dados do cadastro...</p>
              ) : isAdmin ? <>
                <div className="flex justify-end">
                  {!editingStore ? <button onClick={startStoreEditing} className="text-sm text-[#E8753D] hover:underline">Editar dados</button> : <div className="flex gap-2"><button onClick={cancelStoreEditing} className="text-sm text-gray-500">Cancelar</button><button onClick={saveStore} disabled={saving} className="text-sm font-semibold text-[#4F8B69] disabled:opacity-50">Salvar</button></div>}
                </div>
                {[
                ['Nome fantasia', storeData.fantasyName],
                ['Razão social', storeData.legalName],
                ['CPF/CNPJ', storeData.document],
                ['Inscrição estadual', storeData.stateTaxId || ''],
                ['Segmento', storeData.segment],
                ['CEP', storeData.zipCode],
                ['Endereço', storeData.address],
                ['Número', storeData.number],
                ['Cidade', storeData.city],
                ['Estado', storeData.state],
                ].map(([label, value]) => (
                <div key={label}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input value={value} readOnly={label === 'CPF/CNPJ' || !editingStore} onChange={e => setStoreData({ ...storeData, [({ 'Nome fantasia': 'fantasyName', 'Razão social': 'legalName', 'Inscrição estadual': 'stateTaxId', Segmento: 'segment', CEP: 'zipCode', Endereço: 'address', Número: 'number', Cidade: 'city', Estado: 'state' } as Record<string, string>)[label]]: e.target.value })} className={`${editingStore && label !== 'CPF/CNPJ' ? 'bg-white' : 'bg-gray-50'} ${inpCls} text-gray-700`} />
                </div>
                ))}
              </> : <>
                <div className="flex justify-end">
                  {!editingProfile ? <button onClick={startProfileEditing} className="text-sm text-[#E8753D] hover:underline">Editar perfil</button> : <div className="flex gap-2"><button onClick={cancelProfileEditing} className="text-sm text-gray-500">Cancelar</button><button onClick={saveProfile} disabled={saving} className="text-sm font-semibold text-[#4F8B69] disabled:opacity-50">Salvar</button></div>}
                </div>
                {[
                  ['Nome completo', 'name', storeUser.name],
                  ['E-mail', 'email', storeUser.email],
                  ['Telefone', 'phone', storeUser.phone || ''],
                  ['Data de nascimento', 'birthDate', storeUser.birthDate ? storeUser.birthDate.slice(0, 10) : ''],
                ].map(([label, field, value]) => <div key={label}><label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label><input type={field === 'birthDate' ? 'date' : 'text'} value={value} readOnly={!editingProfile} onChange={e => setStoreUser({ ...storeUser, [field]: e.target.value })} className={`${inpCls} ${editingProfile ? 'bg-white' : 'bg-gray-50'} text-gray-700`} /></div>)}
                {editingProfile && <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Nova senha (opcional)</label><input type="password" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} className={inpCls} placeholder="Deixe vazio para manter a senha atual" /></div>}
              </>}
            </div>
          )}

          {/* Profile (admin) */}
          {tab === 1 && isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-display font-semibold text-[#1F2926] mb-4">Perfil do Administrador</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#E8753D] flex items-center justify-center text-white font-display font-bold text-xl">
                  {storeUser?.name.split(' ').map(n => n[0]).slice(0, 2).join('') || '--'}
                </div>
                <div>
                  <div className="font-semibold text-[#1F2926]">{storeUser?.name || 'Carregando...'}</div>
                  <div className="text-sm text-[#4F8B69]">Administrador</div>
                </div>
              </div>
              <div className="flex justify-end">
                {!editingProfile ? <button onClick={startProfileEditing} className="text-sm text-[#E8753D] hover:underline">Editar perfil</button> : <div className="flex gap-2"><button onClick={cancelProfileEditing} className="text-sm text-gray-500">Cancelar</button><button onClick={saveProfile} disabled={saving} className="text-sm font-semibold text-[#4F8B69] disabled:opacity-50">Salvar</button></div>}
              </div>
              {[
                ['Nome completo', 'name', storeUser?.name || ''],
                ['E-mail', 'email', storeUser?.email || ''],
                ['Telefone', 'phone', storeUser?.phone || ''],
                ['Data de nascimento', 'birthDate', storeUser?.birthDate ? storeUser.birthDate.slice(0, 10) : ''],
              ].map(([label, field, value]) => (
                <div key={label}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input type={field === 'birthDate' ? 'date' : 'text'} value={value} readOnly={!editingProfile} onChange={e => storeUser && setStoreUser({ ...storeUser, [field]: e.target.value })} className={`${inpCls} ${editingProfile ? 'bg-white' : 'bg-gray-50'} text-gray-700`} />
                </div>
              ))}
              {editingProfile && <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Nova senha (opcional)</label><input type="password" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} className={inpCls} placeholder="Deixe vazio para manter a senha atual" /></div>}
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Segurança</div>
                <span className="text-xs text-gray-500">A senha pode ser alterada ao editar o perfil.</span>
              </div>
            </div>
          )}

          {/* PDV */}
          {tab === 2 && isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-display font-semibold text-[#1F2926] mb-5">Preferências do PDV</h3>
              <div className="space-y-5">
                {[
                  { label: 'Exigir cliente na venda', desc: 'Operador deve selecionar um cliente para finalizar.', field: 'requireClient' },
                  { label: 'Permitir desconto', desc: 'Operadores podem aplicar descontos nas vendas.', field: 'allowDiscount' },
                  { label: 'Imprimir comprovante automaticamente', desc: 'Abre diálogo de impressão após finalizar venda.', field: 'printReceipt' },
                  { label: 'Alertar estoque insuficiente no PDV', desc: 'Exibe aviso quando o produto está abaixo do mínimo.', field: 'stockWarning' },
                ].map(({ label, desc, field }) => (
                  <div key={field} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </div>
                    <Toggle checked={(pdvSettings as any)[field]} onChange={v => setPdvSettings(p => ({ ...p, [field]: v }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          {tab === 3 && isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-display font-semibold text-[#1F2926] mb-5">Configurações de estoque</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Estoque mínimo padrão (novas entradas)</label>
                  <input type="number" min="0" value={stockSettings.defaultMinStock} onChange={e => setStockSettings(p => ({ ...p, defaultMinStock: e.target.value }))} className={inpCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Alertar quando estoque atingir (%)</label>
                  <input type="number" min="0" max="100" value={stockSettings.warningPercentage} onChange={e => setStockSettings(p => ({ ...p, warningPercentage: e.target.value }))} className={inpCls} />
                  <p className="text-xs text-gray-400 mt-1">Exemplo: 20% do estoque mínimo dispara o alerta.</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {(tab === 4 && isAdmin) || (tab === 1 && !isAdmin) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-display font-semibold text-[#1F2926] mb-5">Notificações</h3>
              <div className="space-y-5">
                {[
                  { label: 'Estoque crítico', desc: 'Quando um produto atinge o estoque mínimo.', field: 'stockCritical' },
                  { label: 'Venda concluída', desc: 'Notificar a cada venda finalizada.', field: 'saleDone' },
                  { label: 'Falha de pagamento', desc: 'Alertar sobre erros no processamento.', field: 'paymentFail' },
                  ...(isAdmin ? [
                    { label: 'Usuário alterado', desc: 'Mudanças em usuários do sistema.', field: 'userChanged' },
                  ] : []),
                ].map(({ label, desc, field }) => (
                  <div key={field} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </div>
                    <Toggle checked={(notifSettings as any)[field]} onChange={v => setNotifSettings(p => ({ ...p, [field]: v }))} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Save button */}
          {((isAdmin && tab >= 2) || (!isAdmin && tab === 1)) && (
            <div className="mt-5">
              <button onClick={handleSave} disabled={saving} className="bg-[#E8753D] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70 flex items-center gap-2">
                {saving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</> : <><Check size={16} />Salvar configurações</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
