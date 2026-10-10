import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Eye, EyeOff, ArrowLeft, Check } from '../components/Icons';

const SEGMENTS = ['Mercado e Mercearia', 'Padaria e Confeitaria', 'Açougue', 'Farmácia', 'Vestuário', 'Eletrônicos', 'Pet Shop', 'Outro'];
const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

function pwStrength(p: string) {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
}

export default function Register() {
  const { navigate } = useApp();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [form1, setForm1] = useState({ cnpj: '', legalName: '', fantasyName: '', ie: '', segment: '', cep: '', address: '', number: '', city: '', state: 'SP' });
  const [form2, setForm2] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [form3, setForm3] = useState({ terms: false, privacy: false });

  const strength = pwStrength(form2.password);
  const strengthColors = ['', 'bg-[#C65B42]', 'bg-amber-400', 'bg-amber-400', 'bg-[#4F8B69]'];
  const strengthLabels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form1.cnpj) e.cnpj = 'CNPJ/CPF obrigatório';
    if (!form1.legalName) e.legalName = 'Razão social obrigatória';
    if (!form1.fantasyName) e.fantasyName = 'Nome fantasia obrigatório';
    if (!form1.segment) e.segment = 'Selecione um segmento';
    if (!form1.cep) e.cep = 'CEP obrigatório';
    if (!form1.address) e.address = 'Endereço obrigatório';
    if (!form1.city) e.city = 'Cidade obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form2.name) e.name = 'Nome obrigatório';
    if (!form2.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form2.email)) e.email = 'E-mail inválido';
    if (strength < 2) e.password = 'Senha muito fraca. Use pelo menos 8 caracteres.';
    if (form2.password !== form2.confirmPassword) e.confirmPassword = 'As senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form3.terms) e.terms = 'Aceite os Termos de Uso';
    if (!form3.privacy) e.privacy = 'Aceite a Política de Privacidade';
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep(4);
    }, 2000);
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-[#C65B42] text-xs mt-1">{errors[field]}</p> : null;

  const inputCls = (field: string) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${errors[field] ? 'border-[#C65B42] focus:ring-[#C65B42]/20' : 'border-gray-200 focus:ring-[#E8753D]/20 focus:border-[#E8753D]'}`;

  return (
    <div className="min-h-full bg-[#FFF9F4] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('home')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1F2926] mb-6">
          <ArrowLeft size={16} />
          {step > 1 ? 'Voltar' : 'Início'}
        </button>

        {step < 4 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="font-display font-bold text-xl text-[#1F2926] mb-1">Criar seu comércio</div>
              <div className="text-sm text-gray-500">Etapa {step} de 3</div>
              {/* Progress */}
              <div className="flex gap-2 mt-4">
                {[1,2,3].map(s => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#E8753D]' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-[#1F2926]">Dados do comércio</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">CNPJ ou CPF *</label>
                    <input value={form1.cnpj} onChange={e => setForm1(p => ({...p, cnpj: e.target.value}))} placeholder="00.000.000/0000-00" className={inputCls('cnpj')} />
                    <FieldError field="cnpj" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Razão social *</label>
                    <input value={form1.legalName} onChange={e => setForm1(p => ({...p, legalName: e.target.value}))} placeholder="Razão Social Ltda." className={inputCls('legalName')} />
                    <FieldError field="legalName" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Nome fantasia *</label>
                    <input value={form1.fantasyName} onChange={e => setForm1(p => ({...p, fantasyName: e.target.value}))} placeholder="Meu Comércio" className={inputCls('fantasyName')} />
                    <FieldError field="fantasyName" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Inscrição estadual</label>
                    <input value={form1.ie} onChange={e => setForm1(p => ({...p, ie: e.target.value}))} placeholder="Opcional" className={inputCls('ie')} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Segmento *</label>
                    <select value={form1.segment} onChange={e => setForm1(p => ({...p, segment: e.target.value}))} className={inputCls('segment')}>
                      <option value="">Selecionar</option>
                      {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <FieldError field="segment" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">CEP *</label>
                    <input value={form1.cep} onChange={e => setForm1(p => ({...p, cep: e.target.value}))} placeholder="00000-000" className={inputCls('cep')} />
                    <FieldError field="cep" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Número *</label>
                    <input value={form1.number} onChange={e => setForm1(p => ({...p, number: e.target.value}))} placeholder="123" className={inputCls('number')} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Endereço *</label>
                    <input value={form1.address} onChange={e => setForm1(p => ({...p, address: e.target.value}))} placeholder="Rua, Avenida..." className={inputCls('address')} />
                    <FieldError field="address" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Cidade *</label>
                    <input value={form1.city} onChange={e => setForm1(p => ({...p, city: e.target.value}))} placeholder="São Paulo" className={inputCls('city')} />
                    <FieldError field="city" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Estado</label>
                    <select value={form1.state} onChange={e => setForm1(p => ({...p, state: e.target.value}))} className={inputCls('state')}>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-[#1F2926]">Dados do Administrador</h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nome completo *</label>
                  <input value={form2.name} onChange={e => setForm2(p => ({...p, name: e.target.value}))} placeholder="Seu nome completo" className={inputCls('name')} />
                  <FieldError field="name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Telefone</label>
                  <input value={form2.phone} onChange={e => setForm2(p => ({...p, phone: e.target.value}))} placeholder="(11) 99999-9999" className={inputCls('phone')} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">E-mail *</label>
                  <input type="email" value={form2.email} onChange={e => setForm2(p => ({...p, email: e.target.value}))} placeholder="seu@email.com" className={inputCls('email')} />
                  <FieldError field="email" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Senha *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form2.password} onChange={e => setForm2(p => ({...p, password: e.target.value}))} placeholder="Mínimo 8 caracteres" className={inputCls('password')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form2.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(s => (
                          <div key={s} className={`h-1 flex-1 rounded-full ${s <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">Força: <span className="font-medium">{strengthLabels[strength]}</span></div>
                    </div>
                  )}
                  <FieldError field="password" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Confirmar senha *</label>
                  <div className="relative">
                    <input type={showPass2 ? 'text' : 'password'} value={form2.confirmPassword} onChange={e => setForm2(p => ({...p, confirmPassword: e.target.value}))} placeholder="Repita a senha" className={inputCls('confirmPassword')} />
                    <button type="button" onClick={() => setShowPass2(!showPass2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FieldError field="confirmPassword" />
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="font-display font-semibold text-[#1F2926]">Termos e privacidade</h3>
                <p className="text-sm text-gray-500">Para finalizar o cadastro, leia e aceite os documentos abaixo.</p>
                <div className={`border rounded-xl p-4 ${errors.terms ? 'border-[#C65B42] bg-red-50' : 'border-gray-200'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form3.terms} onChange={e => setForm3(p => ({...p, terms: e.target.checked}))} className="mt-0.5 accent-[#E8753D]" />
                    <span className="text-sm text-gray-700">Declaro que li e aceito os <span className="text-[#E8753D] underline cursor-pointer">Termos de Uso</span> do ComércioOS.</span>
                  </label>
                  <FieldError field="terms" />
                </div>
                <div className={`border rounded-xl p-4 ${errors.privacy ? 'border-[#C65B42] bg-red-50' : 'border-gray-200'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form3.privacy} onChange={e => setForm3(p => ({...p, privacy: e.target.checked}))} className="mt-0.5 accent-[#E8753D]" />
                    <span className="text-sm text-gray-700">Declaro que li e aceito a <span className="text-[#E8753D] underline cursor-pointer">Política de Privacidade</span> e o tratamento de dados conforme a LGPD.</span>
                  </label>
                  <FieldError field="privacy" />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Voltar
                </button>
              )}
              {step < 3 ? (
                <button onClick={handleNext} className="flex-1 bg-[#E8753D] text-white font-semibold py-2.5 rounded-xl hover:bg-[#d4662e] transition-colors">
                  Continuar
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-[#E8753D] text-white font-semibold py-2.5 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  {submitting ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Criando...</> : 'Criar meu comércio'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#4F8B69]/10 flex items-center justify-center mx-auto mb-5">
              <Check size={28} className="text-[#4F8B69]" />
            </div>
            <h2 className="font-display font-bold text-2xl text-[#1F2926] mb-2">Comércio criado com sucesso!</h2>
            <p className="text-gray-500 text-sm mb-8">Agora vamos configurar o seu sistema para que você possa começar a vender.</p>
            <button onClick={() => navigate('onboarding')} className="w-full bg-[#E8753D] text-white font-semibold py-3 rounded-xl hover:bg-[#d4662e] transition-colors">
              Começar configuração
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
