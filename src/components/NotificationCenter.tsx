import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  UserPlus,
  Sparkles,
  ArrowUpCircle,
  X,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification, NotificationType } from '../types';
import {
  isSoundMuted,
  setSoundMuted,
  playRegistrationSound,
  playRebirthSound,
  playUpgradeSound,
} from '../lib/soundEffects';
import { useLanguage } from '../i18n/LanguageContext';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectNodeId?: (nodeId: number) => void;
  onTriggerTestNotification?: (type: NotificationType) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onSelectNodeId,
  onTriggerTestNotification,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | NotificationType>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(!isSoundMuted());
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const lastProcessedIdRef = useRef<string | null>(null);

  // Monitor incoming notifications to trigger toasts and audio effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (notifications.length === 0) return;
    const newest = notifications[0];

    // If it's a new notification we haven't popped a toast for yet
    if (newest && newest.id !== lastProcessedIdRef.current) {
      lastProcessedIdRef.current = newest.id;

      // Play matching sound
      if (soundEnabled) {
        if (newest.type === 'REGISTRATION') {
          playRegistrationSound();
        } else if (newest.type === 'REBIRTH') {
          playRebirthSound();
        } else if (newest.type === 'UPGRADE') {
          playUpgradeSound();
        }
      }

      // Add to active toasts (limit max 3 concurrent floating toasts)
      setToasts((prev) => [newest, ...prev.filter((item) => item.id !== newest.id)].slice(0, 3));
    }
  }, [notifications, soundEnabled]);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    setSoundMuted(!nextState);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true;
    return n.type === activeFilter;
  });

  const getNotificationTheme = (type: NotificationType) => {
    switch (type) {
      case 'REGISTRATION':
        return {
          icon: <UserPlus className="w-4 h-4 text-indigo-400" />,
          badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          cardBg: 'from-indigo-950/40 via-slate-900/60 to-slate-900/80 border-indigo-500/30',
          accent: 'text-indigo-400',
          label: t('notifRegister'),
        };
      case 'REBIRTH':
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          cardBg: 'from-emerald-950/40 via-slate-900/60 to-slate-900/80 border-emerald-500/30',
          accent: 'text-emerald-400',
          label: t('notifRebirth'),
        };
      case 'UPGRADE':
        return {
          icon: <ArrowUpCircle className="w-4 h-4 text-amber-400" />,
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          cardBg: 'from-amber-950/40 via-slate-900/60 to-slate-900/80 border-amber-500/30',
          accent: 'text-amber-400',
          label: t('notifUpgrade'),
        };
    }
  };

  return (
    <>
      {/* Navbar Bell Button */}
      <div className="relative inline-block">
        <button
          id="notification-bell-btn"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-1.5 sm:p-2 rounded-lg border transition-all ${
            isOpen
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60 shadow-md shadow-indigo-500/20'
              : unreadCount > 0
              ? 'bg-slate-800/90 text-amber-300 border-amber-500/40 hover:bg-slate-800'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-800'
          }`}
          title={`${t('notificationsTitle')} (${unreadCount})`}
        >
          {unreadCount > 0 ? (
            <BellRing className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-bounce text-amber-300" />
          ) : (
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          )}

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border border-slate-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Floating Notification Drawer Modal / Overlay */}
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-end p-3 sm:p-5 pt-16 sm:pt-20 bg-black/60 backdrop-blur-sm pointer-events-auto">
              {/* Backdrop dismiss */}
              <div
                className="fixed inset-0 -z-10"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-[420px] bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[82vh] ring-1 ring-white/10"
              >
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center space-x-1.5">
                      <span>{t('notificationsTitle')}</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                          {unreadCount} ใหม่
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400">{t('notificationsDesc')}</p>
                  </div>
                </div>

                {/* Sound & Close Buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleToggleSound}
                    className={`p-1.5 rounded-lg border transition-all text-xs flex items-center space-x-1 ${
                      soundEnabled
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                    title={soundEnabled ? t('notifSoundOn') : t('notifSoundOff')}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs & Action Bar */}
              <div className="px-3 pt-2.5 pb-2 bg-slate-950/40 border-b border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  {/* Filter Chips */}
                  <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setActiveFilter('ALL')}
                      className={`px-2 py-1 rounded-lg font-medium transition-all ${
                        activeFilter === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t('notifAll')} ({notifications.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('REGISTRATION')}
                      className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                        activeFilter === 'REGISTRATION'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-indigo-300'
                      }`}
                    >
                      <span>📝</span>
                      <span className="hidden sm:inline">สมัคร</span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('REBIRTH')}
                      className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                        activeFilter === 'REBIRTH'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      <span>🌱</span>
                      <span className="hidden sm:inline">เกิดใหม่</span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('UPGRADE')}
                      className={`px-2 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                        activeFilter === 'UPGRADE'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      <span>⭐</span>
                      <span className="hidden sm:inline">อัพเกรด</span>
                    </button>
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex items-center space-x-1 ml-auto">
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllRead}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center space-x-1"
                        title={t('markAllRead')}
                      >
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span className="hidden xs:inline">{t('markAllRead')}</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearAll}
                        className="p-1 rounded-lg text-[10px] bg-slate-800/60 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/40 hover:border-rose-700/50"
                        title={t('clearAllNotifs')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Simulation Test Triggers */}
                {onTriggerTestNotification && (
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px]">
                    <span className="text-slate-400 flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{t('testAlerts')}:</span>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onTriggerTestNotification('REGISTRATION')}
                        className="px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
                      >
                        +สมัคร
                      </button>
                      <button
                        onClick={() => onTriggerTestNotification('REBIRTH')}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-medium transition-colors"
                      >
                        +เกิดใหม่
                      </button>
                      <button
                        onClick={() => onTriggerTestNotification('UPGRADE')}
                        className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium transition-colors"
                      >
                        +อัพเกรด
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification List Body */}
              <div className="overflow-y-auto max-h-[380px] p-2 space-y-2 divide-y divide-slate-800/40">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-3 text-slate-500">
                      <Bell className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-slate-300">{t('notifEmpty')}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      เมื่อมีการสมัคร, การแตกหน่อเกิดใหม่ หรือการซื้อผังอัพเกรด จะมีการแจ้งเตือนแบบ Realtime ที่นี่
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const theme = getNotificationTheme(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) onMarkRead(notif.id);
                        }}
                        className={`pt-2 first:pt-0 group relative p-2.5 rounded-xl border bg-gradient-to-r transition-all ${
                          theme.cardBg
                        } ${
                          notif.read
                            ? 'opacity-70 hover:opacity-100'
                            : 'ring-1 ring-indigo-500/30 shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Type Icon & Badge */}
                          <div className="flex items-start space-x-2">
                            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 shrink-0 mt-0.5">
                              {theme.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${theme.badgeBg}`}
                                >
                                  {theme.label}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {new Date(notif.timestamp).toLocaleTimeString()}
                                </span>
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-slate-100 mt-1 line-clamp-1">
                                {notif.title}
                              </h4>
                              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                {notif.message}
                              </p>

                              {/* Details Meta Tags */}
                              <div className="flex items-center space-x-2 mt-2 flex-wrap gap-y-1 text-[10px]">
                                {notif.nodeId > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-700 font-mono font-bold">
                                    ID #{notif.nodeId}
                                  </span>
                                )}
                                {notif.rank && notif.rank > 1 && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-bold">
                                    ผัง {notif.rank}
                                  </span>
                                )}
                                {notif.amount && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold">
                                    {notif.amount.toLocaleString()} USDT
                                  </span>
                                )}
                                {notif.walletName && (
                                  <span className="text-slate-400 truncate max-w-[120px]">
                                    โดย {notif.walletName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Jump to Node in Tree Button */}
                          {onSelectNodeId && notif.nodeId > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkRead(notif.id);
                                onSelectNodeId(notif.nodeId);
                                setIsOpen(false);
                              }}
                              className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-[10px] font-medium flex items-center space-x-1 shrink-0 transition-colors"
                              title={t('notifViewTree')}
                            >
                              <span>{t('notifViewTree')}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* Floating Real-Time Toast Notifications (Top-Right Screen Overlay) */}
      <div className="fixed top-20 right-3 sm:right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-[360px] sm:max-w-[420px] w-full">
        <AnimatePresence>
          {toasts.map((toast) => {
            const theme = getNotificationTheme(toast.type);
            return (
              <ToastItem
                key={toast.id}
                toast={toast}
                theme={theme}
                onDismiss={() => handleDismissToast(toast.id)}
                onSelectNodeId={onSelectNodeId}
                viewTreeLabel={t('notifViewTree')}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
};

interface ToastItemProps {
  toast: AppNotification;
  theme: {
    icon: React.ReactNode;
    badgeBg: string;
    cardBg: string;
    accent: string;
    label: string;
  };
  onDismiss: () => void;
  onSelectNodeId?: (nodeId: number) => void;
  viewTreeLabel: string;
}

const ToastItem: React.FC<ToastItemProps> = ({
  toast,
  theme,
  onDismiss,
  onSelectNodeId,
  viewTreeLabel,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const DURATION = 5000; // 5 seconds auto-dismiss

  useEffect(() => {
    if (isPaused) return;

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isPaused, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl bg-slate-900/95 text-slate-100 ${theme.cardBg}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start space-x-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-700/80 shadow-inner shrink-0 mt-0.5">
            {theme.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                {theme.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(toast.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white mt-1 line-clamp-1">
              {toast.title}
            </h4>
            <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
              {toast.message}
            </p>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 mt-2">
              {onSelectNodeId && toast.nodeId > 0 && (
                <button
                  onClick={() => {
                    onSelectNodeId(toast.nodeId);
                    onDismiss();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center space-x-1 shadow-sm transition-colors"
                >
                  <span>{viewTreeLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto Dismiss Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
        <div
          className={`h-full transition-all duration-75 ${
            toast.type === 'REGISTRATION'
              ? 'bg-indigo-500'
              : toast.type === 'REBIRTH'
              ? 'bg-emerald-500'
              : 'bg-amber-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};
