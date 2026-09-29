import React from 'react';
import { Wallet, ShieldCheck, ShieldAlert, Cpu, RefreshCw, Layers, ArrowLeftRight } from 'lucide-react';
import { WalletAccount, MatrixNode, AppNotification, NotificationType } from '../types';
import { MAX_RANK } from '../lib/matrixSimulator';
import { useLanguage, LanguageSelector } from '../i18n/LanguageContext';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  currentWallet: WalletAccount;
  wallets: WalletAccount[];
  onSelectWallet: (address: string) => void;
  isWeb3Connected: boolean;
  web3Address: string | null;
  onConnectWeb3: () => void;
  onDisconnectWeb3: () => void;
  rebirthPool: number;
  totalNodes: number;
  activeTab: 'app' | 'contract' | 'math' | 'keeper' | 'admin';
  setActiveTab: (tab: 'app' | 'contract' | 'math' | 'keeper' | 'admin') => void;
  onResetSimulation: () => void;
  isPaused?: boolean;
  selectedNodeId?: number;
  onSelectNodeId?: (id: number) => void;
  nodes?: MatrixNode[];
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onTriggerTestNotification?: (type: NotificationType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentWallet,
  wallets,
  onSelectWallet,
  isWeb3Connected,
  web3Address,
  onConnectWeb3,
  onDisconnectWeb3,
  rebirthPool,
  totalNodes,
  activeTab,
  setActiveTab,
  onResetSimulation,
  isPaused = false,
  selectedNodeId,
  onSelectNodeId,
  nodes = [],
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onTriggerTestNotification,
}) => {

  const { t } = useLanguage();

  const getWalletName = (address: string) => {
    const w = wallets.find((item) => item.address.toLowerCase() === address.toLowerCase());
    if (w) return w.name;
    return `${address.slice(0, 4)}...`;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* Top bar: Brand & Controls */}
        <div className="flex items-center justify-between py-2 sm:h-16 gap-1.5 sm:gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink min-w-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Layers className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <span className="font-bold text-xs sm:text-lg tracking-tight bg-gradient-to-r from-indigo-300 via-purple-200 to-emerald-300 bg-clip-text text-transparent truncate">
                  {t('brandName')}
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  {t('solidityVersion')}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden xs:block">
                {t('brandSubtitle')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="tab-network-btn"
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'app'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {t('tabMatrixTree')}
            </button>
            <button
              id="tab-contract-btn"
              onClick={() => setActiveTab('contract')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'contract'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {t('tabContract')}
            </button>
            <button
              id="tab-math-btn"
              onClick={() => setActiveTab('math')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'math'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {t('tabMath')}
            </button>
            <button
              id="tab-admin-btn"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 relative ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md font-bold'
                  : isPaused
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900/40'
                  : 'text-rose-400 hover:text-rose-200 hover:bg-slate-700/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('tabAdmin')}</span>
              {isPaused && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute -top-1 -right-1" />
              )}
            </button>
          </nav>

          {/* Controls: Language Mode Switcher + Notification Bell + ID Selector + Wallet Selector & Web3 Connect */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Language Mode Selector */}
            <LanguageSelector />

            {/* Real-time Event Notification Center */}
            <NotificationCenter
              notifications={notifications}
              onMarkRead={onMarkNotificationRead || (() => {})}
              onMarkAllRead={onMarkAllNotificationsRead || (() => {})}
              onClearAll={onClearNotifications || (() => {})}
              onSelectNodeId={onSelectNodeId}
              onTriggerTestNotification={onTriggerTestNotification}
            />

            {/* Compact ID Switcher Dropdown (ดึงเฉพาะไอดีหลักเท่านั้น) */}
            {nodes.length > 0 && selectedNodeId !== undefined && onSelectNodeId && (
              <div
                id="navbar-id-switcher-container"
                className="flex items-center space-x-1.5 bg-slate-800 text-slate-200 text-[11px] sm:text-xs rounded-lg border border-indigo-700/60 px-1.5 sm:px-2 py-1.5 shrink-0"
                title="สลับรหัส ID (ดึงเฉพาะไอดีหลักเท่านั้น)"
              >
                <ArrowLeftRight className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="text-indigo-300 font-mono font-bold text-[10px] sm:text-[11px] hidden xs:inline">
                  ID:
                </span>
                <select
                  id="navbar-id-selector"
                  value={
                    nodes.find((n) => n.id === selectedNodeId)?.isRebirth
                      ? (nodes.find((n) => n.id === selectedNodeId)?.originalAncestorId || selectedNodeId)
                      : selectedNodeId
                  }
                  onChange={(e) => {
                    const targetId = Number(e.target.value);
                    const targetNode = nodes.find((n) => n.id === targetId);
                    const mainId = targetNode?.isRebirth
                      ? (targetNode.originalAncestorId || targetNode.rebornFromNodeId || targetId)
                      : targetId;
                    onSelectNodeId(mainId);
                  }}
                  className="bg-transparent text-slate-100 font-mono text-[11px] sm:text-xs font-bold focus:outline-none cursor-pointer max-w-[70px] xs:max-w-[95px] sm:max-w-[130px] truncate"
                >
                  {nodes
                    .filter((n) => !n.isRebirth)
                    .map((n, idx) => (
                      <option key={`nav-node-${n.id}-${idx}`} value={n.id} className="bg-slate-900 text-slate-200">
                        #{n.id} (ผัง {n.rank || 1}) - {getWalletName(n.owner)}
                      </option>
                    ))}
                </select>
                {(() => {
                  const activeNode = nodes.find((n) => n.id === selectedNodeId);
                  const userRank = activeNode?.rank || 1;
                  return (
                    <span className="bg-indigo-950 text-indigo-300 border border-indigo-500/50 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                      ผัง {userRank}
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Wallet Dropdown */}
            <select
              id="wallet-selector"
              value={currentWallet.address}
              onChange={(e) => onSelectWallet(e.target.value)}
              className="bg-slate-800 text-slate-200 text-[11px] sm:text-xs rounded-lg border border-slate-700 px-1.5 sm:px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[90px] xs:max-w-[125px] sm:max-w-[190px] md:max-w-[210px] truncate"
            >
              <optgroup label={t('optCoreWallets')}>
                {wallets.slice(0, 4).map((w) => (
                  <option key={w.address} value={w.address}>
                    {w.name} ({w.balance.toFixed(0)} U)
                  </option>
                ))}
              </optgroup>
              {wallets.length > 4 && (
                <optgroup label={`Simulated Wallets (id5 - id${wallets.length})`}>
                  {wallets.slice(4).map((w) => (
                    <option key={w.address} value={w.address}>
                      {w.name} ({w.balance.toFixed(0)} U)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Real Web3 Connect Button */}
            {isWeb3Connected ? (
              <button
                id="web3-disconnect-btn"
                onClick={onDisconnectWeb3}
                className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] sm:text-xs font-medium hover:bg-emerald-500/30 transition-colors shrink-0"
                title={t('disconnect')}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">
                  {web3Address ? `${web3Address.slice(0, 6)}...` : t('connected')}
                </span>
              </button>
            ) : (
              <button
                id="web3-connect-btn"
                onClick={onConnectWeb3}
                className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-medium transition-colors shadow-sm shrink-0"
                title={t('connectWeb3')}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('connectWeb3')}</span>
              </button>
            )}

            {/* Reset Sim Button */}
            <button
              id="reset-sim-btn"
              onClick={onResetSimulation}
              title={t('resetSimTitle')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Touch-friendly & Horizontal Scroll) */}
        <div className="lg:hidden flex items-center space-x-1.5 overflow-x-auto py-2 border-t border-slate-800/80 text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('app')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              activeTab === 'app'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800/60 text-slate-300 border border-slate-700/60'
            }`}
          >
            {t('tabMatrixTree')}
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              activeTab === 'contract'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800/60 text-slate-300 border border-slate-700/60'
            }`}
          >
            {t('tabContract')}
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              activeTab === 'math'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800/60 text-slate-300 border border-slate-700/60'
            }`}
          >
            {t('tabMath')}
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all flex items-center space-x-1 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm font-bold'
                : 'bg-slate-800/60 text-rose-300 border border-rose-800/50'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>{t('tabAdmin')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

