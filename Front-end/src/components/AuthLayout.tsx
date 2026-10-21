import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { useApp, Page } from '../contexts/AppContext';
import Sidebar from './Sidebar';
import { Bell, Menu, X, Check, AlertTriangle, Info, Settings, LogOut } from './Icons';
import { AppNotification, loadNotifications, markAllNotificationsRead, markNotificationRead, SETTINGS_CHANGED_EVENT } from '../lib/notifications';

interface Props {
  children: ReactNode;
  title?: string;
}

export default function AuthLayout({ children, title }: Props) {
  const { currentUser, navigate, setSidebarOpen, sidebarOpen } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [profileOpen, setProfileOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  const refreshNotifications = useCallback(() => {
    loadNotifications().then(setNotifs).catch(() => setNotifs([]));
  }, []);

  useEffect(() => {
    refreshNotifications();
    window.addEventListener(SETTINGS_CHANGED_EVENT, refreshNotifications);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, refreshNotifications);
  }, [currentUser?.id, refreshNotifications]);

  // Close notifications on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node) &&
          profileBtnRef.current && !profileBtnRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const markRead = (id: string) => {
    markNotificationRead(id);
    setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllRead = () => {
    markAllNotificationsRead(notifs);
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };

  const handleOpen = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
    navigate(n.link === 'reports' && !isAdmin ? 'pos' : n.link as Page);
  };

  return (
    <div className="flex h-full bg-[#F6F7F8]">
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-3 sticky top-0 z-20 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="font-display font-semibold text-gray-900 text-base lg:text-lg truncate">{title}</h1>
            )}
            <div className="text-xs text-gray-400 hidden sm:block">{currentUser?.name ?? 'Comércio'}</div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bell + dropdown */}
            <div className="relative">
              <button
                ref={bellRef}
                onClick={() => {
                  refreshNotifications();
                  setOpen(o => !o);
                }}
                className={`relative p-2 rounded-lg transition-colors ${open ? 'bg-gray-100 text-[#1F2926]' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#E8753D] rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unread}
                  </span>
                )}
              </button>

              {open && (
                <div
                  ref={dropRef}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 pt-3 pb-0 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-display font-semibold text-[#1F2926] text-sm">Notificações</span>
                      <div className="flex items-center gap-2">
                        {unread > 0 && (
                          <button onClick={markAllRead} className="text-xs text-[#E8753D] hover:underline">
                            Marcar todas
                          </button>
                        )}
                        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Filter tabs */}
                    <div className="flex gap-1 mb-0">
                      {(['all', 'unread'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                            filter === f
                              ? 'border-[#E8753D] text-[#E8753D]'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {f === 'all' ? 'Todas' : 'Não lidas'}
                          {f === 'unread' && unread > 0 && (
                            <span className="bg-[#E8753D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                              {unread}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {(filter === 'unread' ? notifs.filter(n => !n.read) : notifs).length === 0 ? (
                      <div className="py-10 text-center text-gray-400 text-sm">
                        {filter === 'unread' ? 'Nenhuma notificação não lida.' : 'Nenhuma notificação.'}
                      </div>
                    ) : (
                      (filter === 'unread' ? notifs.filter(n => !n.read) : notifs).map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleOpen(n)}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-[#FFF9F4]' : ''}`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            n.type === 'success' ? 'bg-[#4F8B69]/10' :
                            n.type === 'warning' ? 'bg-amber-100' :
                            n.type === 'error'   ? 'bg-[#C65B42]/10' :
                                                   'bg-[#4D7CA8]/10'
                          }`}>
                            {n.type === 'success' && <Check size={13} className="text-[#4F8B69]" />}
                            {n.type === 'warning' && <AlertTriangle size={13} className="text-amber-500" />}
                            {n.type === 'error'   && <X size={13} className="text-[#C65B42]" />}
                            {n.type === 'info'    && <Info size={13} className="text-[#4D7CA8]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-xs font-semibold leading-tight ${n.read ? 'text-gray-700' : 'text-[#1F2926]'}`}>
                                {n.title}
                              </span>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#E8753D] flex-shrink-0 mt-1" />}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">{n.date}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative pl-2 border-l border-gray-200">
              <button
                ref={profileBtnRef}
                onClick={() => setProfileOpen(o => !o)}
                className={`flex items-center gap-2 rounded-xl px-2 py-1 transition-colors ${profileOpen ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#E8753D] flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-semibold text-xs text-white">
                    {currentUser?.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-800 leading-tight">{currentUser?.name.split(' ')[0]}</div>
                  <div className={`text-[11px] leading-tight ${isAdmin ? 'text-[#4F8B69]' : 'text-[#E8753D]'}`}>
                    {isAdmin ? 'Administrador' : 'Operador'}
                  </div>
                </div>
                <svg className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </button>

              {profileOpen && (
                <div
                  ref={profileRef}
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1"
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-semibold text-[#1F2926] truncate">{currentUser?.name}</div>
                    <div className={`text-xs mt-0.5 ${isAdmin ? 'text-[#4F8B69]' : 'text-[#E8753D]'}`}>
                      {isAdmin ? 'Administrador' : 'Operador'}
                    </div>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={15} className="text-gray-400" />
                    Configurações
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { setProfileOpen(false); navigate('logout-confirm'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C65B42] hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} className="text-[#C65B42]" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Toast */}
      <ToastContainer />

      {/* Logout confirm modal */}
      <LogoutConfirm />
    </div>
  );
}

function ToastContainer() {
  const { toast } = useApp();
  if (!toast) return null;

  const colors: Record<string, string> = {
    success: 'bg-[#4F8B69] text-white',
    error: 'bg-[#C65B42] text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-[#4D7CA8] text-white',
  };

  const icons: Record<string, string> = {
    success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`${colors[toast.type]} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium max-w-sm`}>
        <span className="font-bold">{icons[toast.type]}</span>
        {toast.message}
      </div>
    </div>
  );
}

function LogoutConfirm() {
  const { currentPage, currentUser, navigate, logout } = useApp();
  if (currentPage !== 'logout-confirm') return null;

  const goBack = () => navigate(currentUser?.role === 'admin' ? 'dashboard' : 'pos');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👋</span>
          </div>
          <h2 className="font-display font-semibold text-gray-900 text-lg">Sair do sistema?</h2>
          <p className="text-gray-500 text-sm mt-2">Você será redirecionado para a tela de login. Todas as sessões serão encerradas.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={goBack} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={logout} className="flex-1 py-2.5 bg-[#C65B42] rounded-xl text-sm font-medium text-white hover:bg-red-700 transition-colors">
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
