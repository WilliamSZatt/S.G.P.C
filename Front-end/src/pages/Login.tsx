import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from '../components/Icons';

type LoginState = 'idle' | 'loading' | 'error-email' | 'error-password' | 'error-inactive' | 'error-network';

export default function Login() {
  const { navigate, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [state, setState] = useState<LoginState>('idle');

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) { setState('error-email'); return; }
    if (password.length < 6) { setState('error-password'); return; }
    setState('loading');
    setTimeout(() => { setState('error-password'); }, 1500);
  };

  const handleDemo = (role: 'admin' | 'operator') => {
    setState('loading');
    setTimeout(() => login(role), 1000);
  };

  const errors: Record<string, string> = {
    'error-email': 'Informe um e-mail válido.',
    'error-password': 'Senha incorreta. Verifique seus dados.',
    'error-inactive': 'Sua conta está inativa. Entre em contato com o administrador.',
    'error-network': 'Falha de conexão. Tente novamente em instantes.',
  };

  return (
    <div className="min-h-full bg-[#FFF9F4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back */}
        <button onClick={() => navigate('home')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1F2926] transition-colors mb-8">
          <ArrowLeft size={16} />
          Voltar para o início
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="font-display font-bold text-2xl text-[#1F2926] mb-1">ComércioOS</div>
            <div className="text-gray-500 text-sm">Entre no sistema</div>
          </div>

          {/* Demo buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleDemo('admin')}
              disabled={state === 'loading'}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-[#1F2926] bg-[#1F2926] text-white hover:bg-[#2a3a36] transition-colors disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8753D] flex items-center justify-center text-sm font-bold">LS</div>
              <div className="text-xs font-semibold">Letícia Souza</div>
              <div className="text-[10px] opacity-70">Administradora</div>
            </button>
            <button
              onClick={() => handleDemo('operator')}
              disabled={state === 'loading'}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-gray-200 hover:border-[#1F2926] transition-colors disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-full bg-[#4F8B69] flex items-center justify-center text-sm font-bold text-white">CO</div>
              <div className="text-xs font-semibold text-gray-800">Carlos Oliveira</div>
              <div className="text-[10px] text-gray-500">Operador</div>
            </button>
          </div>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">ou entre com seus dados</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Error */}
          {errors[state] && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-[#C65B42] flex items-center gap-2">
              <span>⚠</span>
              {errors[state]}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setState('idle'); }}
                  placeholder="seu@email.com"
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${state === 'error-email' ? 'border-[#C65B42] focus:ring-[#C65B42]/20' : 'border-gray-200 focus:ring-[#E8753D]/20 focus:border-[#E8753D]'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setState('idle'); }}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${state === 'error-password' ? 'border-[#C65B42] focus:ring-[#C65B42]/20' : 'border-gray-200 focus:ring-[#E8753D]/20 focus:border-[#E8753D]'}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-[#E8753D]" />
                <span className="text-sm text-gray-600">Lembrar deste computador</span>
              </label>
              <button type="button" onClick={() => navigate('forgot-password')} className="text-sm text-[#E8753D] hover:underline">
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={state === 'loading'}
              className="w-full bg-[#E8753D] text-white font-semibold py-3 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {state === 'loading' ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Entrando...
                </>
              ) : 'Entrar no sistema'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            Não tem uma conta?{' '}
            <button onClick={() => navigate('register')} className="text-[#E8753D] font-medium hover:underline">
              Criar um comércio
            </button>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-gray-400">
          Protótipo demonstrativo — dados fictícios
        </div>
      </div>
    </div>
  );
}
