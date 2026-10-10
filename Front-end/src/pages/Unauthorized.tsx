import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { Shield, ArrowLeft } from '../components/Icons';

export default function Unauthorized() {
  const { navigate } = useApp();

  return (
    <AuthLayout title="Acesso não autorizado">
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-[#C65B42]/10 flex items-center justify-center mx-auto mb-6">
            <Shield size={36} className="text-[#C65B42]" />
          </div>
          <h1 className="font-display font-bold text-2xl text-[#1F2926] mb-3">Acesso não autorizado</h1>
          <p className="text-gray-500 leading-relaxed mb-8">
            Seu perfil não possui permissão para acessar esta área. Entre em contato com o Administrador caso precise de acesso.
          </p>
          <button
            onClick={() => navigate('pos')}
            className="inline-flex items-center gap-2 bg-[#E8753D] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#d4662e] transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para Vendas/PDV
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
