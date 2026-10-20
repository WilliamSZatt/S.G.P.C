import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Check, ChevronRight } from '../components/Icons';
import { api } from '../lib/api';

const STEPS = [
  { title: 'Confirmar dados do comércio', desc: 'Verifique as informações do seu estabelecimento.' },
  { title: 'Confirmar administrador', desc: 'Revise os dados do responsável pelo sistema.' },
  { title: 'Cadastrar primeiro produto', desc: 'Adicione o primeiro produto ao catálogo.' },
  { title: 'Configurar estoque inicial', desc: 'Defina as quantidades iniciais em estoque.' },
  { title: 'Conhecer o PDV', desc: 'Uma rápida visão do ponto de venda.' },
  { title: 'Concluir configuração', desc: 'Você está pronto para começar!' },
];

type StoreData = {
  document: string;
  legalName: string;
  fantasyName: string;
  segment: string;
  address: string;
  number: string;
  city: string;
  state: string;
};

type StoreUser = {
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

export default function Onboarding() {
  const { navigate, showToast } = useApp();
  const [step, setStep] = useState(0);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQty, setProductQty] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<StoreData | null>(null);
  const [user, setUser] = useState<StoreUser | null>(null);

  useEffect(() => {
    api.get<{ store: StoreData; user: StoreUser }>('/auth/store')
      .then(({ data }) => {
        setStore(data.store);
        setUser(data.user);
      })
      .catch(() => showToast({ type: 'error', message: 'Não foi possível carregar os dados reais do cadastro.' }));
  }, [showToast]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setSaving(true);
      setTimeout(() => { setSaving(false); setStep(s => s + 1); }, 600);
    }
  };

  const handleFinish = (target: 'dashboard' | 'pos') => {
    navigate(target);
  };

  return (
    <div className="min-h-full bg-[#FFF9F4] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="font-display font-bold text-2xl text-[#1F2926]">ComércioOS</div>
          <div className="text-gray-500 text-sm mt-1">Configuração inicial</div>
        </div>

        {/* Steps bar */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${i < step ? 'bg-[#4F8B69] text-white' : i === step ? 'bg-[#E8753D] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 sm:w-10 mx-1 transition-colors ${i < step ? 'bg-[#4F8B69]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="mb-6">
            <div className="text-sm font-medium text-[#E8753D] mb-1">Etapa {step + 1} de {STEPS.length}</div>
            <h2 className="font-display font-bold text-xl text-[#1F2926]">{STEPS[step].title}</h2>
            <p className="text-gray-500 text-sm mt-1">{STEPS[step].desc}</p>
          </div>

          {/* Step 0 - Store data */}
          {step === 0 && (
            <div className="bg-[#F6F7F8] rounded-xl p-5 space-y-3">
              {[
                ['Nome fantasia', store?.fantasyName || 'Carregando...'],
                ['Razão social', store?.legalName || 'Carregando...'],
                ['CNPJ', store?.document || 'Carregando...'],
                ['Segmento', store?.segment || 'Carregando...'],
                ['Endereço', store ? `${store.address}, ${store.number} - ${store.city}/${store.state}` : 'Carregando...'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-gray-500 flex-shrink-0">{label}</span>
                  <span className="font-medium text-[#1F2926] text-right">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 1 - Admin data */}
          {step === 1 && (
            <div className="bg-[#F6F7F8] rounded-xl p-5 space-y-3">
              {[
                ['Nome', user?.name || 'Carregando...'],
                ['E-mail', user?.email || 'Carregando...'],
                ['Telefone', user?.phone || 'Não informado'],
                ['Perfil', user?.role === 'admin' ? 'Administrador' : 'Operador'],
                ['Status', 'Ativo'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-gray-500 flex-shrink-0">{label}</span>
                  <span className="font-medium text-[#1F2926] text-right">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 2 - First product */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nome do produto *</label>
                <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ex: Arroz Branco 5kg" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Preço (R$) *</label>
                  <input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="0,00" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Quantidade</label>
                  <input type="number" value={productQty} onChange={e => setProductQty(e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
                </div>
              </div>
              <p className="text-xs text-gray-400">Você pode cadastrar mais produtos depois em Estoque &gt; Produtos.</p>
            </div>
          )}

          {/* Step 3 - Initial stock */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                <strong>Dica:</strong> Configure um estoque mínimo para receber alertas quando o produto estiver acabando.
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Quantidade inicial em estoque</label>
                <input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="Ex: 50" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Estoque mínimo para alerta</label>
                <input type="number" defaultValue="10" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
              </div>
            </div>
          )}

          {/* Step 4 - PDV preview */}
          {step === 4 && (
            <div>
              <div className="bg-[#1F2926] rounded-xl p-5 text-white">
              <div className="font-display font-semibold mb-3">Vendas / PDV</div>
              <div className="bg-white/10 rounded-lg p-5 text-center text-sm opacity-80">
                Seus produtos aparecerão aqui depois que forem cadastrados.
              </div>
              </div>
              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <p>✓ Busque produtos por nome, SKU ou código de barras</p>
                <p>✓ Adicione clientes e aplique descontos</p>
                <p>✓ Pague com dinheiro, cartão ou PIX</p>
              </div>
            </div>
          )}

          {/* Step 5 - Done */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-[#4F8B69]/10 flex items-center justify-center mx-auto mb-5">
                <Check size={36} className="text-[#4F8B69]" />
              </div>
              <h3 className="font-display font-bold text-xl text-[#1F2926] mb-2">Tudo pronto!</h3>
              <p className="text-gray-500 text-sm mb-8">Seu comércio está configurado. Por onde deseja começar?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleFinish('dashboard')} className="py-3 bg-[#1F2926] text-white rounded-xl text-sm font-semibold hover:bg-[#2a3a36] transition-colors">
                  Ir para o Painel
                </button>
                <button onClick={() => handleFinish('pos')} className="py-3 bg-[#E8753D] text-white rounded-xl text-sm font-semibold hover:bg-[#d4662e] transition-colors">
                  Abrir o PDV
                </button>
              </div>
            </div>
          )}

          {step < 5 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Voltar
                </button>
              )}
              {step < 4 && (
                <button onClick={() => setStep(s => s + 1)} className="text-sm text-gray-500 hover:text-gray-700 px-4">
                  Pular esta etapa
                </button>
              )}
              <button onClick={handleNext} disabled={saving} className="ml-auto bg-[#E8753D] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70 flex items-center gap-2">
                {saving ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <>Continuar <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
