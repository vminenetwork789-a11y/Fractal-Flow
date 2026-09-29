import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Crown,
  Sparkles,
  Wallet,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { MatrixNode, WalletAccount } from '../types';
import { getRankInfo } from '../lib/matrixSimulator';
import { getRebirthNodeCount, getRebirthNodeIds, getAllMainIdRebirthStats } from '../lib/rebirthUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { RebirthModal } from './RebirthModal';

interface IdSwitcherProps {
  nodes: MatrixNode[];
  wallets: WalletAccount[];
  selectedNodeId: number;
  onSelectNodeId: (id: number) => void;
  currentWallet: WalletAccount;
  onSelectWallet: (address: string) => void;
  onViewInTree?: (id: number) => void;
}

export const IdSwitcher: React.FC<IdSwitcherProps> = ({
  nodes,
  wallets,
  selectedNodeId,
  onSelectNodeId,
  currentWallet,
  onSelectWallet,
  onViewInTree,
}) => {
  const { t } = useLanguage();
  const [jumpInput, setJumpInput] = useState<string>('');
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [jumpInfo, setJumpInfo] = useState<string | null>(null);
  const [autoSyncWallet, setAutoSyncWallet] = useState<boolean>(false);
  const [isRebirthModalOpen, setIsRebirthModalOpen] = useState<boolean>(false);
  const [showRebirthStats, setShowRebirthStats] = useState<boolean>(false);
  const [statsSearch, setStatsSearch] = useState<string>('');

  const nodeMap = new Map<number, MatrixNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const currentNode = nodeMap.get(selectedNodeId) || nodes[0];

  // คัดกรองเฉพาะไอดีหลักเท่านั้น (Main IDs only: !n.isRebirth)
  const mainNodes = nodes.filter((n) => !n.isRebirth);
  const sortedMainNodeIds = mainNodes.map((n) => n.id).sort((a, b) => a - b);

  // คำนวณไอดีหลักที่มีผล (หาก selectedNodeId เป็นไอดีเกิดใหม่ ให้ใช้ originalAncestorId)
  const currentEffectiveMainId = currentNode?.isRebirth
    ? (currentNode.originalAncestorId || currentNode.rebornFromNodeId || 1)
    : selectedNodeId;
  const currentMainIndex = sortedMainNodeIds.indexOf(currentEffectiveMainId);

  // คำนวณยอดรหัสเกิดใหม่ของ ID ปัจจุบัน
  const activeMainSpawnedCount = getRebirthNodeCount(currentEffectiveMainId, nodes);
  const activeMainSpawnedIds = getRebirthNodeIds(currentEffectiveMainId, nodes);
  const allMainStats = getAllMainIdRebirthStats(nodes);

  const getWalletName = (address: string) => {
    const w = wallets.find((item) => item.address.toLowerCase() === address.toLowerCase());
    if (w) return w.name;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Find all MAIN node IDs belonging to the current active wallet
  const myWalletMainNodeIds = mainNodes
    .filter((n) => n.owner.toLowerCase() === currentWallet.address.toLowerCase())
    .map((n) => n.id);

  const handleSelectId = (targetId: number) => {
    const targetNode = nodeMap.get(targetId);
    if (!targetNode) return;

    // ดึงไอดีหลักเท่านั้น: หากระบุรหัสเกิดใหม่ ให้ดึงไอดีหลักของรหัสนี้เสมอ
    const effectiveMainId = targetNode.isRebirth
      ? (targetNode.originalAncestorId || targetNode.rebornFromNodeId || targetId)
      : targetId;

    onSelectNodeId(effectiveMainId);
    setJumpError(null);

    // If auto-sync wallet is enabled, switch wallet to match this node's owner
    if (autoSyncWallet) {
      const effectiveNode = nodeMap.get(effectiveMainId) || targetNode;
      if (effectiveNode && effectiveNode.owner.toLowerCase() !== currentWallet.address.toLowerCase()) {
        onSelectWallet(effectiveNode.owner);
      }
    }
  };

  const handlePrevId = () => {
    if (sortedMainNodeIds.length === 0) return;
    if (currentMainIndex > 0) {
      handleSelectId(sortedMainNodeIds[currentMainIndex - 1]);
    } else {
      // Loop to end of main IDs
      handleSelectId(sortedMainNodeIds[sortedMainNodeIds.length - 1]);
    }
  };

  const handleNextId = () => {
    if (sortedMainNodeIds.length === 0) return;
    if (currentMainIndex < sortedMainNodeIds.length - 1 && currentMainIndex >= 0) {
      handleSelectId(sortedMainNodeIds[currentMainIndex + 1]);
    } else {
      // Loop to start of main IDs
      handleSelectId(sortedMainNodeIds[0]);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(jumpInput.trim(), 10);
    if (isNaN(idNum)) {
      setJumpError('กรุณาระบุตัวเลขรหัส ID');
      setJumpInfo(null);
      return;
    }
    const target = nodeMap.get(idNum);
    if (!target) {
      setJumpError(`ไม่พบรหัส #${idNum} ในระบบ`);
      setJumpInfo(null);
      return;
    }

    if (target.isRebirth) {
      const mainId = target.originalAncestorId || target.rebornFromNodeId || 1;
      handleSelectId(mainId);
      setJumpInfo(`รหัส #${idNum} เป็นไอดีโคลนนิ่ง ➔ ระบบดึงไอดีหลัก #${mainId} ให้เรียบร้อย`);
      setJumpInput('');
      setJumpError(null);
      return;
    }

    handleSelectId(idNum);
    setJumpInput('');
    setJumpError(null);
    setJumpInfo(null);
  };

  const currentRankInfo = currentNode ? getRankInfo(currentNode.rank || 1) : null;
  const isOwnerCurrentWallet = currentNode?.owner.toLowerCase() === currentWallet.address.toLowerCase();

  return (
    <div
      id="id-switcher-card"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-sm space-y-3 w-full max-w-full min-w-0 overflow-hidden"
    >
      {/* Top Title & Active ID Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{t('switchId')}</span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 flex items-center gap-1 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>👥 {t('registeredUsers')}: <strong className="text-amber-300 font-extrabold text-xs">{mainNodes.length}</strong> {t('unitUsers')}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('switchIdDesc')}
            </p>
          </div>
        </div>

        {/* Current Active ID Display */}
        {currentNode && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-slate-400">{t('currentActiveId')}:</span>
              <span className="font-mono text-sm font-extrabold text-indigo-300 bg-indigo-950/80 border border-indigo-700/80 px-2 py-0.5 rounded-lg">
                #{currentNode.id}
              </span>
            </div>

            {currentNode.isRebirth ? (
              <button
                type="button"
                onClick={() => setIsRebirthModalOpen(true)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/60 flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                title="คลิกเพื่อเปิดหน้าต่างป๊อปอัพข้อมูลรหัสโคลนนิ่ง"
              >
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>{t('rebornFrom')} #{currentNode.originalAncestorId || currentNode.rebornFromNodeId}</span>
                <span className="text-[8px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/40 ml-0.5">
                  {currentNode.cloneSource === 'VAULT_EXCESS' ? 'จากส่วนเกิน 40% Vault (ผัง 6-45)' : 'ผังขาว'}
                </span>
                <span className="text-[8px] bg-purple-900 text-purple-200 px-1 py-0.2 rounded border border-purple-700 ml-0.5">เปิดป๊อปอัพ ⇲</span>
              </button>
            ) : (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>{currentNode.id === 1 ? 'id1' : t('mainId')}</span>
              </span>
            )}

            {currentRankInfo && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
                {currentRankInfo.badge} {currentRankInfo.name}
              </span>
            )}

            {/* ยอดรหัสโคลนนิ่งของ ID นี้ */}
            <button
              type="button"
              onClick={() => {
                if (activeMainSpawnedCount > 0) {
                  setIsRebirthModalOpen(true);
                } else {
                  setShowRebirthStats(true);
                }
              }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 border transition-all cursor-pointer ${
                activeMainSpawnedCount > 0
                  ? 'bg-purple-950/70 text-purple-200 border-purple-600/70 hover:bg-purple-900 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
              }`}
              title={`ยอดรหัสโคลนนิ่งของ ID #${currentEffectiveMainId}: ${activeMainSpawnedCount} รหัส ${
                activeMainSpawnedIds.length > 0 ? `(ได้แก่ #${activeMainSpawnedIds.join(', #')})` : '(ยังไม่มีรหัสโคลนนิ่ง)'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{t('idRebirthCount')}:</span>
              <span className="font-mono font-extrabold text-amber-300 bg-purple-900/60 px-1.5 py-0.2 rounded">
                {activeMainSpawnedCount} รหัส
              </span>
            </button>

            <span className="text-[11px] text-slate-300 font-medium">
              {t('ownerLabel')}: <strong className="text-white">{getWalletName(currentNode.owner)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Banner if viewing a Rebirth Node (Quick pull Main ID button) */}
      {currentNode?.isRebirth && (
        <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-600/70 text-purple-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
            <span>
              ขณะนี้กำลังดูรหัสโคลนนิ่ง <strong className="text-amber-300">#{currentNode.id}</strong> (โคลนจากไอดีหลัก <strong className="text-white">#{currentNode.originalAncestorId || currentNode.rebornFromNodeId || 1}</strong> | ที่มา: <strong className="text-amber-300">{currentNode.cloneSource === 'VAULT_EXCESS' ? `จากส่วนเกิน 40% Vault ผัง 6 ถึง ผัง 45 [${currentNode.cloneLabel || `#${currentNode.originalAncestorId || currentNode.rebornFromNodeId || 1} #${currentNode.id} #${currentNode.vaultCloneRankCount ?? 0} รอบ ${currentNode.vaultCloneRound || 1}`}]` : 'ผังขาว'}</strong>)
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectId(currentNode.originalAncestorId || currentNode.rebornFromNodeId || 1)}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all flex items-center space-x-1 cursor-pointer shrink-0 shadow-sm"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>สลับไปยังไอดีหลัก #{currentNode.originalAncestorId || currentNode.rebornFromNodeId || 1}</span>
          </button>
        </div>
      )}

      {/* Main Switching Controls: Prev/Next, Dropdown, and Jump Input */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
        {/* Quick Stepper: Prev, Select Dropdown, Next, Root #1 */}
        <div className="md:col-span-7 flex items-center space-x-1.5">
          {/* Previous ID Button */}
          <button
            id="btn-prev-id"
            type="button"
            onClick={handlePrevId}
            title={t('prevId')}
            className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('prevId')}</span>
          </button>

          {/* Core ID Selector Dropdown (ดึงเฉพาะไอดีหลักเท่านั้น พร้อมยอดรหัสเกิดใหม่ของแต่ละ ID) */}
          <div className="relative flex-1 min-w-0">
            <select
              id="global-id-switcher-select"
              value={currentEffectiveMainId}
              onChange={(e) => handleSelectId(Number(e.target.value))}
              className="w-full bg-slate-800/90 text-slate-100 font-mono text-xs sm:text-sm rounded-xl border border-indigo-700/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium cursor-pointer"
            >
              {/* My Wallet's Main Nodes Group */}
              {myWalletMainNodeIds.length > 0 && (
                <optgroup label={`⭐ ${t('myWalletIds')} (${getWalletName(currentWallet.address)}) - ${t('mainIdsOnly')}`}>
                  {myWalletMainNodeIds.map((id, idx) => {
                    const n = nodeMap.get(id);
                    if (!n) return null;
                    const rCount = getRebirthNodeCount(id, nodes);
                    return (
                      <option key={`my-wallet-node-${id}-${idx}`} value={id}>
                        ⭐ #{id} [ไอดีหลัก] • เกิดใหม่: {rCount} รหัส • Rank {n.rank || 1} • {getWalletName(n.owner)}
                      </option>
                    );
                  })}
                </optgroup>
              )}

              {/* All Main Nodes Group */}
              <optgroup label={`👑 ${t('allMainIds')} (${mainNodes.length} รหัส)`}>
                {mainNodes.map((n, idx) => {
                  const rCount = getRebirthNodeCount(n.id, nodes);
                  return (
                    <option key={`all-main-node-${n.id}-${idx}`} value={n.id}>
                      #{n.id} {n.id === 1 ? '👑 [Root]' : '👑 [ไอดีหลัก]'} • เกิดใหม่: {rCount} รหัส • Rank {n.rank || 1} • {getWalletName(n.owner)}
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          {/* Next ID Button */}
          <button
            id="btn-next-id"
            type="button"
            onClick={handleNextId}
            title={t('nextId')}
            className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <span className="hidden sm:inline">{t('nextId')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset to Root #1 Button */}
          {selectedNodeId !== 1 && (
            <button
              id="btn-root-id-1"
              type="button"
              onClick={() => handleSelectId(1)}
              title={t('backToRoot1')}
              className="px-2 sm:px-2.5 py-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/80 text-xs font-semibold transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">#1 Root</span>
            </button>
          )}
        </div>

        {/* Jump Directly by ID Number Input */}
        <div className="md:col-span-5">
          <form onSubmit={handleJumpSubmit} className="flex items-center space-x-1.5">
            <div className="relative flex-1 min-w-0">
              <input
                id="input-jump-id"
                type="number"
                min="1"
                placeholder={t('jumpPlaceholder')}
                value={jumpInput}
                onChange={(e) => {
                  setJumpInput(e.target.value);
                  setJumpError(null);
                  setJumpInfo(null);
                }}
                className="w-full bg-slate-800 text-slate-200 placeholder-slate-500 font-mono text-xs rounded-xl border border-slate-700 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              id="btn-jump-submit"
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 shrink-0 flex items-center space-x-1 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t('jumpBtn')}</span>
            </button>
          </form>
          {jumpError && (
            <p className="text-[10px] text-rose-400 mt-1 font-medium">{jumpError}</p>
          )}
          {jumpInfo && (
            <p className="text-[10px] text-emerald-300 mt-1 font-medium">{jumpInfo}</p>
          )}
        </div>
      </div>

      {/* Bottom Sub-row: Quick "My IDs" chips, Auto-switch Wallet, and Tab Shortcuts */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Quick Chips for Current Wallet's Main IDs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
            {t('myWalletIds')} {currentWallet.name} ({t('mainIdsOnly')}):
          </span>
          {myWalletMainNodeIds.length > 0 ? (
            myWalletMainNodeIds.map((id, idx) => {
              const isSelected = id === selectedNodeId;
              const n = nodeMap.get(id);
              const rCount = getRebirthNodeCount(id, nodes);
              return (
                <button
                  key={`quick-chip-${id}-${idx}`}
                  type="button"
                  onClick={() => handleSelectId(id)}
                  title={`ID #${id} (${t('idRebirthCount')}: ${rCount} รหัส)`}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700'
                  }`}
                >
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>#{id}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                    isSelected ? 'bg-indigo-800 text-amber-300' : 'bg-slate-900 text-purple-300'
                  }`}>
                    🌱{rCount}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-[11px] text-slate-500">
              {t('noIdsInWallet')}
            </span>
          )}
        </div>

        {/* Sync Wallet Toggle & View Shortcuts */}
        <div className="flex flex-wrap items-center space-x-2 sm:space-x-3 text-[11px]">
          {/* Checkbox: Auto-switch Wallet with ID */}
          <label
            htmlFor="toggle-auto-sync-wallet"
            className="flex items-center space-x-1.5 cursor-pointer text-slate-300 select-none hover:text-white"
            title={t('autoSwitchWallet')}
          >
            <input
              id="toggle-auto-sync-wallet"
              type="checkbox"
              checked={autoSyncWallet}
              onChange={(e) => setAutoSyncWallet(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span>{t('autoSwitchWallet')}</span>
          </label>

          {/* If current node belongs to someone else and auto-sync is off, provide 1-click switch wallet button */}
          {!isOwnerCurrentWallet && currentNode && !autoSyncWallet && (
            <button
              type="button"
              onClick={() => onSelectWallet(currentNode.owner)}
              className="px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 hover:bg-purple-900 border border-purple-800 text-[10px] font-semibold transition-colors cursor-pointer"
            >
              {t('switchId')} ➔ {getWalletName(currentNode.owner)}
            </button>
          )}

          {/* Button to toggle Per-ID Rebirth Count Summary Panel */}
          <button
            id="btn-toggle-id-rebirth-stats"
            type="button"
            onClick={() => setShowRebirthStats(!showRebirthStats)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center space-x-1 cursor-pointer shadow-sm ${
              showRebirthStats
                ? 'bg-purple-600 text-white border border-purple-400 ring-1 ring-purple-300'
                : 'bg-purple-950/70 text-purple-200 hover:bg-purple-900 border border-purple-800'
            }`}
            title="เปิด/ปิด สรุปนับยอดรหัสเกิดใหม่ของแต่ละ ID"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>{t('idRebirthCountPerId')}</span>
            <span className="bg-purple-900/90 text-amber-300 text-[9px] px-1 py-0.2 rounded font-mono font-bold ml-0.5">
              {allMainStats.length} IDs
            </span>
          </button>

          {/* Quick tab jump: View in Tree */}
          {onViewInTree && (
            <button
              type="button"
              onClick={() => onViewInTree(selectedNodeId)}
              className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900 border border-indigo-800 text-[10px] font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Layers className="w-3 h-3" />
              <span>{t('viewInTree')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Per-ID Rebirth Count Table/Grid */}
      {showRebirthStats && (
        <div
          id="per-id-rebirth-stats-panel"
          className="mt-3 p-3.5 rounded-xl bg-slate-950/95 border border-purple-700/70 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>{t('idRebirthCountPerId')} (Rebirth IDs Count per ID)</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-900/80 text-amber-300 font-mono font-bold border border-purple-700">
                    {allMainStats.length} ไอดีหลัก
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  นับยอดรวมรหัสเกิดใหม่ (Rebirth IDs) ที่แตกหน่อมาจากแต่ละ ID หลัก พร้อมรายการหมายเลขรหัสเกิดใหม่ทั้งหมด
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="ค้นหา ID หรือชื่อกระเป๋า..."
                value={statsSearch}
                onChange={(e) => setStatsSearch(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowRebirthStats(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>
          </div>

          {/* Stats Grid of all Main IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {allMainStats
              .filter((stat) => {
                if (!statsSearch.trim()) return true;
                const q = statsSearch.toLowerCase().trim();
                return (
                  stat.id.toString().includes(q) ||
                  getWalletName(stat.owner).toLowerCase().includes(q) ||
                  stat.spawnedIds.some((sId) => sId.toString().includes(q))
                );
              })
              .map((stat, statIdx) => {
                const isSelected = stat.id === currentEffectiveMainId;
                const isMyWallet = stat.owner.toLowerCase() === currentWallet.address.toLowerCase();

                return (
                  <div
                    key={`main-stat-${stat.id}-${statIdx}`}
                    className={`p-3 rounded-xl border text-xs transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50'
                        : isMyWallet
                        ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-sm text-indigo-300">
                          #{stat.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                          {stat.id === 1 ? 'Root' : 'Main'}
                        </span>
                        {stat.rank > 1 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                            Rank {stat.rank}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectId(stat.id)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ เลือกอยู่' : 'เลือก ID'}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">เจ้าของ:</span>
                      <span className="font-medium text-purple-200 truncate max-w-[130px]" title={stat.owner}>
                        {getWalletName(stat.owner)}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">ยอดรหัสเกิดใหม่:</span>
                      <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-purple-950/80 text-amber-300 border border-purple-700/60 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{stat.spawnedCount} รหัส</span>
                      </span>
                    </div>

                    {stat.spawnedIds.length > 0 ? (
                      <div className="pt-1 text-[10px] space-y-1">
                        <span className="text-slate-400 block font-medium">หมายเลขรหัสเกิดใหม่ ({stat.spawnedIds.length}):</span>
                        <div className="flex flex-wrap gap-1">
                          {stat.spawnedIds.map((sId, subIdx) => (
                            <button
                              key={`stat-sub-${sId}-${subIdx}`}
                              type="button"
                              onClick={() => {
                                handleSelectId(stat.id);
                                if (onViewInTree) onViewInTree(sId);
                              }}
                              className="px-1.5 py-0.2 rounded font-mono font-bold bg-purple-900/60 text-purple-200 border border-purple-700/60 hover:bg-purple-700/60 transition-colors cursor-pointer"
                              title={`รหัสเกิดใหม่ #${sId} (คลิกเพื่อดูในผัง)`}
                            >
                              #{sId}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic block">
                        ยังไม่มีรหัสเกิดใหม่
                      </span>
                    )}

                    {stat.pendingRebirths > 0 && (
                      <div className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-700/40 px-2 py-0.5 rounded flex items-center justify-between">
                        <span>รอเกิดใหม่:</span>
                        <span className="font-mono font-bold">{stat.pendingRebirths} เม็ด</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Rebirth Modal Popup */}
      <RebirthModal
        isOpen={isRebirthModalOpen}
        onClose={() => setIsRebirthModalOpen(false)}
        selectedNodeId={selectedNodeId}
        nodes={nodes}
        wallets={wallets}
        onFocusNodeInTree={(id) => {
          handleSelectId(id);
          if (onViewInTree) onViewInTree(id);
        }}
      />
    </div>
  );
};
