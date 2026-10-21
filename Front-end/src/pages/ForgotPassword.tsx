import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Mail, Eye, EyeOff, Check } from '../components/Icons';
import { api } from '../lib/api';
import axios from 'axios';

type Step = 'forgot' | 'verify' | 'reset' | 'success' | 'error-expired' | 'error-invalid';

function pwStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function ForgotPassword() {
  const { navigate } = useApp();
  const [step, setStep] = useState<Step>('forgot');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setPassError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setLoading(false);
      setStep('verify');
      startResendTimer();
    } catch (error) {
      setLoading(false);
      setPassError(axios.isAxiosError(error) ? error.response?.data?.message ?? 'Falha de conexão.' : 'Falha de conexão.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) { setPassError('As senhas não coincidem.'); return; }
    if (pwStrength(newPass) < 2) { setPassError('Senha muito fraca. Use letras, números e símbolos.'); return; }
    setPassError('');
    setLoading(true);
    try {
      if (!resetToken) {
        setPassError('Abra o link recebido no e-mail para redefinir sua senha.');
        return;
      }
      await api.post('/auth/reset-password', {
        token: resetToken.trim(),
        password: newPass,
        confirmPassword: confirmPass
      });
      setStep('success');
    } catch (error) {
      setPassError(axios.isAxiosError(error) ? error.response?.data?.message ?? 'Token inválido ou expirado.' : 'Token inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const strength = pwStrength(newPass);
  const strengthColors = ['', 'bg-[#C65B42]', 'bg-amber-400', 'bg-amber-400', 'bg-[#4F8B69]'];
  const strengthLabels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c) : '***@***.com';

  return (
    <div className="min-h-full bg-[#FFF9F4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={() => step === 'forgot' ? navigate('login') : setStep('forgot')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1F2926] mb-8">
          <ArrowLeft size={16} />
          {step === 'forgot' ? 'Voltar para Login' : 'Voltar'}
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* Forgot */}
          {step === 'forgot' && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#E8753D]/10 flex items-center justify-center mx-auto mb-4">
                  <Mail size={22} className="text-[#E8753D]" />
                </div>
                <h2 className="font-display font-bold text-xl text-[#1F2926]">Esqueci minha senha</h2>
                <p className="text-gray-500 text-sm mt-2">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
                  {passError && <p className="text-[#C65B42] text-xs mt-1">{passError}</p>}
                </div>
                <button type="submit" disabled={loading} className="w-full bg-[#E8753D] text-white font-semibold py-3 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enviando...</> : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          )}

          {/* Verify email */}
          {step === 'verify' && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#4D7CA8]/10 flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-[#4D7CA8]" />
              </div>
              <h2 className="font-display font-bold text-xl text-[#1F2926] mb-3">Verifique seu e-mail</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                Se o e-mail <strong className="text-gray-700">{maskedEmail}</strong> estiver cadastrado, enviaremos as instruções para recuperação de acesso.
              </p>
              <p className="text-gray-400 text-xs mb-6">Verifique também a pasta de spam ou lixo eletrônico.</p>
              {passError && <p className="text-[#C65B42] text-xs mb-4">{passError}</p>}

              <input
                value={resetToken}
                onChange={e => setResetToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="Digite o código de 6 dígitos"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs mb-3 focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]"
              />
              <button onClick={() => setStep('reset')} disabled={!resetToken} className="w-full bg-[#1F2926] text-white font-semibold py-2.5 rounded-xl hover:bg-[#2a3a36] transition-colors mb-3 text-sm disabled:opacity-50">
                Continuar para redefinição
              </button>

              <button
                onClick={async () => {
                  if (resendTimer > 0 || loading) return;
                  setLoading(true);
                  setPassError('');
                  try {
                    await api.post('/auth/forgot-password', { email });
                    startResendTimer();
                  } catch (error) {
                    setPassError(axios.isAxiosError(error) ? error.response?.data?.message ?? 'Falha de conexão.' : 'Falha de conexão.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={resendTimer > 0 || loading}
                className="text-sm text-[#E8753D] hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar link'}
              </button>

              <button onClick={() => navigate('login')} className="block mt-4 text-sm text-gray-500 hover:text-gray-700 mx-auto">
                Voltar para Login
              </button>
            </div>
          )}

          {/* Reset */}
          {step === 'reset' && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#4F8B69]/10 flex items-center justify-center mx-auto mb-4">
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#4F8B69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h2 className="font-display font-bold text-xl text-[#1F2926]">Redefinir senha</h2>
                <p className="text-gray-500 text-sm mt-1">Crie uma nova senha para sua conta.</p>
              </div>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Nova senha</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 8 caracteres" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                  {newPass && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${s <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />)}
                      </div>
                      <div className="text-xs text-gray-500">Força: <span className="font-medium">{strengthLabels[strength]}</span></div>
                    </div>
                  )}
                  <ul className="mt-2 space-y-0.5">
                    {[['Mínimo 8 caracteres', newPass.length >= 8], ['Letra maiúscula', /[A-Z]/.test(newPass)], ['Número', /[0-9]/.test(newPass)]].map(([r, ok]) => (
                      <li key={r as string} className={`text-xs flex items-center gap-1.5 ${ok ? 'text-[#4F8B69]' : 'text-gray-400'}`}>
                        <Check size={11} />
                        {r as string}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirmar nova senha</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repita a senha" required className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${passError ? 'border-[#C65B42] focus:ring-[#C65B42]/20' : 'border-gray-200 focus:ring-[#E8753D]/20 focus:border-[#E8753D]'}`} />
                  {passError && <p className="text-[#C65B42] text-xs mt-1">{passError}</p>}
                </div>
                <button type="submit" disabled={loading} className="w-full bg-[#E8753D] text-white font-semibold py-3 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</> : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#4F8B69]/10 flex items-center justify-center mx-auto mb-5">
                <Check size={28} className="text-[#4F8B69]" />
              </div>
              <h2 className="font-display font-bold text-xl text-[#1F2926] mb-2">Senha redefinida!</h2>
              <p className="text-gray-500 text-sm mb-6">Sua senha foi alterada com sucesso. Acesse o sistema com sua nova senha.</p>
              <button onClick={() => navigate('login')} className="w-full bg-[#E8753D] text-white font-semibold py-3 rounded-xl hover:bg-[#d4662e] transition-colors">
                Ir para Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
