import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { STORE } from '../data/mockData';
import { Check, X } from '../components/Icons';

const TABS_ADMIN = ['Dados do comércio', 'Perfil do admin', 'PDV', 'Estoque', 'Notificações', 'Integrações'];

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

  const [storeForm, setStoreForm] = useState({
    fantasyName: STORE.fantasyName,
    legalName: STORE.legalName,
    cnpj: STORE.cnpjMasked,
    phone: STORE.phone,
    email: STORE.email,
    address: STORE.address,
  });

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
              {[
                { label: 'Nome fantasia', field: 'fantasyName' },
                { label: 'Razão social', field: 'legalName' },
                { label: 'CNPJ', field: 'cnpj', disabled: true },
                { label: 'Telefone', field: 'phone' },
                { label: 'E-mail', field: 'email', type: 'email' },
                { label: 'Endereço', field: 'address' },
              ].map(({ label, field, type, disabled }) => (
                <div key={field}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input
                    type={type || 'text'}
                    value={(storeForm as any)[field]}
                    onChange={e => setStoreForm(p => ({ ...p, [field]: e.target.value }))}
                    disabled={disabled}
                    className={`${inpCls} ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                  />
                  {disabled && <p className="text-xs text-gray-400 mt-1">Este campo não pode ser alterado.</p>}
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                Plano atual: <strong>{STORE.plan}</strong> — Protótipo demonstrativo. Dados fictícios.
              </div>
            </div>
          )}

          {/* Profile (admin) */}
          {tab === 1 && isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-display font-semibold text-[#1F2926] mb-4">Perfil do Administrador</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#E8753D] flex items-center justify-center text-white font-display font-bold text-xl">LS</div>
                <div>
                  <div className="font-semibold text-[#1F2926]">Letícia Souza</div>
                  <div className="text-sm text-[#4F8B69]">Administrador</div>
                  <button className="text-xs text-[#4D7CA8] mt-1 hover:underline">Alterar foto</button>
                </div>
              </div>
              {[['Nome completo', 'Letícia Souza'], ['E-mail', 'leticia.souza@mercadosilva.com.br'], ['Telefone', '(11) 99876-5432']].map(([label, value]) => (
                <div key={label}>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <input defaultValue={value} className={inpCls} />
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
