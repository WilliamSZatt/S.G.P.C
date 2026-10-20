import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { Check, X } from '../components/Icons';
import { api } from '../lib/api';

const TABS_ADMIN = ['Dados do comércio', 'Perfil do admin', 'PDV', 'Estoque', 'Notificações', 'Integrações'];

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
  const { currentUser, showToast } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [storeUser, setStoreUser] = useState<StoreUser | null>(null);

  useEffect(() => {
    api.get<{ store: StoreData; user: StoreUser }>('/auth/store')
      .then(({ data }) => {
        setStoreData(data.store);
        setStoreUser(data.user);
      })
      .catch(() => showToast({ type: 'error', message: 'Não foi possível carregar os dados do comércio.' }));
  }, [showToast]);

  const [notifSettings, setNotifSettings] = useState({
    stockCritical: true,
    saleDone: true,
    paymentFail: true,
    fiscalDoc: false,
    das: true,
    userChanged: true,
    passwordRecovery: false,
  });

  const [pdvSettings, setPdvSettings] = useState({
    requireClient: false,
    allowDiscount: true,
    printReceipt: false,
    stockWarning: true,
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast({ type: 'success', message: 'Configurações salvas com sucesso!' });
    }, 1000);
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
          {tab === 0 && isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-display font-semibold text-[#1F2926] mb-4">Dados do comércio</h3>
              {!storeData ? (
                <p className="text-sm text-gray-500">Carregando dados do cadastro...</p>
              ) : [
                ['Nome fantasia', storeData.fantasyName],
                ['Razão social', storeData.legalName],
                ['CPF/CNPJ', storeData.document],
                ['Inscrição estadual', storeData.stateTaxId || 'Não informada'],
                ['Segmento', storeData.segment],
                ['CEP', storeData.zipCode],
                ['Endereço', storeData.address],
                ['Número', storeData.number],
                ['Cidade', storeData.city],
                ['Estado', storeData.state],
              ].map(([label, value]) => (
                <div key={label}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input value={value} readOnly className={`${inpCls} bg-gray-50 text-gray-700`} />
                </div>
              ))}
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
                  <button className="text-xs text-[#4D7CA8] mt-1 hover:underline">Alterar foto</button>
                </div>
              </div>
              {[
                ['Nome completo', storeUser?.name || ''],
                ['E-mail', storeUser?.email || ''],
                ['Telefone', storeUser?.phone || 'Não informado'],
                ['Data de nascimento', storeUser?.birthDate ? new Date(storeUser.birthDate).toLocaleDateString('pt-BR') : 'Não informada'],
              ].map(([label, value]) => (
                <div key={label}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input value={value} readOnly className={`${inpCls} bg-gray-50 text-gray-700`} />
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Segurança</div>
                <button className="text-sm text-[#E8753D] hover:underline">Alterar senha</button>
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
                  <input type="number" defaultValue="10" className={inpCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Alertar quando estoque atingir (%)</label>
                  <input type="number" defaultValue="20" className={inpCls} />
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
                    { label: 'Documento demonstrativo', desc: 'Novos documentos fiscais disponíveis.', field: 'fiscalDoc' },
                    { label: 'DAS demonstrativo', desc: 'Vencimento do DAS se aproximando.', field: 'das' },
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

          {/* Integrations */}
          {tab === 5 && isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-display font-semibold text-[#1F2926] mb-2">Integrações</h3>
              <p className="text-sm text-gray-500 mb-5">Conecte ferramentas externas ao ComércioOS.</p>
              <div className="space-y-3">
                {[
                  { name: 'SEFAZ / NFC-e', desc: 'Emissão de nota fiscal eletrônica', status: 'Futuro' },
                  { name: 'TEF / Máquina de cartão', desc: 'Integração com terminais de pagamento', status: 'Futuro' },
                  { name: 'WhatsApp Business', desc: 'Envio de comprovantes e notificações', status: 'Futuro' },
                  { name: 'Google Sheets', desc: 'Exportação automática de relatórios', status: 'Demonstrativo' },
                  { name: 'E-mail SMTP', desc: 'Envio de e-mails transacionais', status: 'Não configurado' },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${item.status === 'Demonstrativo' ? 'bg-[#4D7CA8]/10 text-[#4D7CA8]' : item.status === 'Não configurado' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          {tab < 5 && (
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
