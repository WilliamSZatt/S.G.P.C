import { useApp } from '../contexts/AppContext';
import { Page } from '../contexts/AppContext';
import {
  Home, ShoppingCart, Users, Package, BarChart, X,
} from './Icons';

interface NavItem {
  label: string;
  page: Page;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Painel', page: 'dashboard', icon: Home },
  { label: 'Vendas / PDV', page: 'pos', icon: ShoppingCart },
  { label: 'Clientes', page: 'clients', icon: Users },
  { label: 'Estoque', page: 'stock', icon: Package },
  { label: 'Relatórios', page: 'reports', icon: BarChart },
  { label: 'Equipe', page: 'users', icon: Users },
];

const OPERATOR_NAV: NavItem[] = [
  { label: 'Vendas / PDV', page: 'pos', icon: ShoppingCart },
  { label: 'Clientes', page: 'clients', icon: Users },
  { label: 'Estoque', page: 'stock', icon: Package },
];

export default function Sidebar() {
  const { currentUser, currentPage, navigate, sidebarOpen, setSidebarOpen } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : OPERATOR_NAV;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-[#1F2926] text-white
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div>
            <div className="font-display font-bold text-lg text-white leading-tight">ComércioOS</div>
            <div className="text-[10px] text-white/50 mt-0.5 leading-tight truncate max-w-[160px]">Dados do comércio</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8753D] flex items-center justify-center flex-shrink-0">
              <span className="font-display font-semibold text-sm text-white">
                {currentUser?.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{currentUser?.name}</div>
              <div className={`text-[11px] font-medium mt-0.5 ${isAdmin ? 'text-[#4F8B69]' : 'text-[#E8753D]'}`}>
                {isAdmin ? 'Administrador' : 'Operador'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {nav.map(({ label, page, icon: Icon }) => {
              const active = currentPage === page;
              return (
                <button
                  key={page}
                  onClick={() => navigate(page)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all
                    ${active
                      ? 'bg-[#E8753D] text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon size={17} />
                  {label}
                </button>
              );
            })}
          </div>

        </nav>
      </aside>
    </>
  );
}
