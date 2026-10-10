import { useState } from 'react';
import { useApp, Page } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { NOTIFICATIONS } from '../data/mockData';
import { Bell, Check, AlertTriangle, Info, X } from '../components/Icons';

type Notif = { id: string; type: string; title: string; message: string; date: string; read: boolean; link: string };

export default function Notifications() {
  const { currentUser, navigate, showToast } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const raw = isAdmin ? NOTIFICATIONS.admin : NOTIFICATIONS.operator;

  const [notifs, setNotifs] = useState<Notif[]>(raw);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const displayed = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;
  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = (id: string) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => {
    setNotifs(p => p.map(n => ({ ...n, read: true })));
    showToast({ type: 'success', message: 'Todas as notificações marcadas como lidas.' });
  };

  const handleOpen = (n: Notif) => {
    markRead(n.id);
    navigate(n.link as Page);
  };

  const typeIcon = (type: string) => {
    if (type === 'success') return <Check size={16} className="text-[#4F8B69]" />;
    if (type === 'warning') return <AlertTriangle size={16} className="text-amber-500" />;
    if (type === 'error') return <X size={16} className="text-[#C65B42]" />;
    return <Info size={16} className="text-[#4D7CA8]" />;
  };

  const typeBg = (type: string) => {
    if (type === 'success') return 'bg-[#4F8B69]/10';
    if (type === 'warning') return 'bg-amber-100';
    if (type === 'error') return 'bg-[#C65B42]/10';
    return 'bg-[#4D7CA8]/10';
  };

  return (
    <AuthLayout title="Notificações">
      <div className="p-4 lg:p-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {[['all', 'Todas'], ['unread', 'Não lidas']].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'bg-[#1F2926] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                  {v === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 bg-[#E8753D] text-white text-[10px] font-bold w-4 h-4 rounded-full inline-flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-[#E8753D] hover:underline">Marcar todas como lidas</button>
          )}
        </div>

        {/* List */}
        {displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
            <Bell size={40} className="mx-auto mb-3 text-gray-200" />
            <div className="font-semibold text-gray-500">Nenhuma notificação</div>
            <div className="text-sm text-gray-400 mt-1">{filter === 'unread' ? 'Você está em dia!' : 'As notificações aparecerão aqui.'}</div>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(n => (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${n.read ? 'border-gray-100' : 'border-[#E8753D]/30 shadow-sm'}`}
                onClick={() => handleOpen(n)}
              >
                <div className="flex items-start gap-4 p-4">
                  <div className={`w-9 h-9 rounded-xl ${typeBg(n.type)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-[#1F2926]'}`}>{n.title}</div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[#E8753D] flex-shrink-0 mt-1" />}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-2">{n.date}</div>
                  </div>
                </div>
                {!n.read && (
                  <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs text-[#4D7CA8]">Clique para abrir</span>
                    <button
                      onClick={e => { e.stopPropagation(); markRead(n.id); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Marcar como lida
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
