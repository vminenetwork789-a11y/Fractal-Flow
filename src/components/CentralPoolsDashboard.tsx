import React, { useState } from 'react';
import { MatrixNode, WalletAccount } from '../types';
import { MatrixSimulator } from '../lib/matrixSimulator';
import {
  Sparkles,
  RefreshCw,
  Crown,
  Zap,
  Flame,
  Info,
  CheckCircle2,
  AlertCircle,
  Coins,
  Shield,
  Layers,
  Clock,
  Play,
  X,
  Timer,
  History,
} from 'lucide-react';
import { CentralPoolHistoryView } from './CentralPoolHistoryView';

interface CentralPoolsDashboardProps {
  simulator: MatrixSimulator;
  selectedNodeId: number;
  onSelectNodeId?: (id: number) => void;
  onExecuteRebirth?: (nodeId: number) => void;
  onBatchExecuteRebirths?: () => void;
  onExecuteMainIdRebirthFromExcessVault?: (mainId: number) => void;
  onExecuteCreateIDFromExcessVault?: (mainId: number) => void;
  onAddTestVaultToRank1To5?: (mainId: number, targetRank?: number, amount?: number) => void;
  onAddTestVaultToRank6To45?: (mainId: number, targetRank?: number, amount?: number) => void;
  onToggleAutoRebirth?: (enabled: boolean) => void;
  onToggleAutoExcessVaultNewMainId?: (enabled: boolean) => void;
  autoRebirth?: boolean;
  autoExcessVaultNewMainId?: boolean;
  autoDelaySec?: number;
  onSetAutoDelaySec?: (sec: number) => void;
  autoCountdown?: number;
  autoTaskType?: string | null;
  autoCurrentRound?: number;
  autoTotalRounds?: number;
  onExecuteAutoNow?: () => void;
  onExecuteAllAutoNow?: () => void;
  onCancelAuto?: () => void;
  onViewTab?: (tab: 'app' | 'contract' | 'math' | 'admin') => void;
  nodes: MatrixNode[];
  currentWallet?: WalletAccount;
}

export const CentralPoolsDashboard: React.FC<CentralPoolsDashboardProps> = ({
  simulator,
  selectedNodeId,
  onSelectNodeId,
  onExecuteRebirth,
  onBatchExecuteRebirths,
  onExecuteMainIdRebirthFromExcessVault,
  onExecuteCreateIDFromExcessVault,
  onAddTestVaultToRank1To5,
  onAddTestVaultToRank6To45,
  onToggleAutoRebirth,
  onToggleAutoExcessVaultNewMainId,
  autoRebirth,
  autoExcessVaultNewMainId,
  autoDelaySec = 2,
  onSetAutoDelaySec,
  autoCountdown = 0,
  autoTaskType,
  autoCurrentRound = 0,
  autoTotalRounds = 0,
  onExecuteAutoNow,
  onExecuteAllAutoNow,
  onCancelAuto,
  nodes,
}) => {
  const [activePoolTab, setActivePoolTab] = useState<'all' | 'cloning' | 'newMainId' | 'rank6to45' | 'history'>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const poolsData = simulator.getThreeCentralPoolsSummary(selectedNodeId);
  const mainNodes = nodes.filter((n) => !n.isRebirth);

  // Rebirth queue info
  const pendingRebirthCount = nodes.filter((n) => (n.pendingRebirths || 0) > 0).length;

  const clearMessages = () => {
    setActionSuccess(null);
    setActionError(null);
  };

  const handleAction = (fn: () => void, successText: string) => {
    clearMessages();
    try {
      fn();
      setActionSuccess(successText);
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err: any) {
      setActionError(err.message || 'เกิดข้อผิดพลาดในการดำเนินการ');
      setTimeout(() => setActionError(null), 6000);
    }
  };

  return (
    <div className="bg-slate-900/95 border-2 border-indigo-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>🏛️ ระบบ Auto โคลนนิ่ง & สมัครเปิด New Main ID จากส่วนเกิน Vault</span>
              </h2>
              <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-emerald-500/20 text-indigo-300 border border-indigo-500/40">
                ระบบอัตโนมัติเต็มรูปแบบ
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              ศูนย์ควบคุม Auto โคลนนิ่ง (Rebirth) และการสมัครเปิดไอดีหลักใหม่ (New Main ID) จากส่วนเกิน 40% Vault
            </p>
          </div>
        </div>

        {/* Selected ID Indicator & Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Main ID Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">ไอดีหลัก:</span>
            <select
              value={poolsData.selectedMainId}
              onChange={(e) => onSelectNodeId && onSelectNodeId(Number(e.target.value))}
              className="bg-slate-900 text-amber-300 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {mainNodes.map((mn) => (
                <option key={`central-pool-main-${mn.id}`} value={mn.id}>
                  #{mn.id} (ผัง {mn.rank || 1})
                </option>
              ))}
            </select>
          </div>

          {/* Tab Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActivePoolTab('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activePoolTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              แสดงทั้งหมด
            </button>
            <button
              onClick={() => setActivePoolTab('cloning')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activePoolTab === 'cloning'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:bg-purple-950/40'
              }`}
            >
              🟣 Auto โคลนนิ่ง
            </button>
            <button
              onClick={() => setActivePoolTab('newMainId')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activePoolTab === 'newMainId'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-300 hover:bg-indigo-950/40'
              }`}
            >
              🔵 New Main ID
            </button>
            <button
              onClick={() => setActivePoolTab('rank6to45')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activePoolTab === 'rank6to45'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300 hover:bg-emerald-950/40'
              }`}
            >
              🟢 ผัง 6-45
            </button>
            <button
              onClick={() => setActivePoolTab('history')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activePoolTab === 'history'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-300 hover:bg-amber-950/40'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>📜 ประวัตกองกลาง</span>
            </button>
          </div>
        </div>
      </div>

      {/* ⏱️ Auto Execution Delay & Throttle Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>⏱️ ตั้งเวลาหน่วง Auto โคลนนิ่ง & เกิดใหม่ (Auto Delay Timer)</span>
            </span>
            <p className="text-[11px] text-slate-400">
              กำหนดระยะเวลาหน่วงก่อนที่ระบบ Auto จะเข้าจัดวางตำแหน่งลงผังอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Delay Speed Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { sec: 0, label: 'ทันที (0s)' },
            { sec: 1, label: '1 วิ' },
            { sec: 2, label: '2 วิ' },
            { sec: 3, label: '3 วิ' },
            { sec: 5, label: '5 วิ' },
          ].map((item) => (
            <button
              key={`delay-${item.sec}`}
              type="button"
              onClick={() => onSetAutoDelaySec && onSetAutoDelaySec(item.sec)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                autoDelaySec === item.sec
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ⏳ Active Countdown Banner (เมื่อมีการหน่วงเวลารันงาน) */}
      {autoCountdown > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-slate-950 border-2 border-amber-500/70 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-pulse">
          <div className="flex items-center space-x-2.5">
            <Timer className="w-5 h-5 text-amber-400 shrink-0 animate-spin" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-amber-300">
                  ⏳ {autoTaskType || 'Auto โคลนนิ่ง & เกิดใหม่'}
                </span>
                {autoTotalRounds > 1 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/50">
                    รอบละ 1 รหัส (ไล่จากน้อยไปมาก)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                ระบบจะประมวลผลรอบนี้ในอีก <strong className="text-amber-400 font-mono text-sm font-bold">{autoCountdown}</strong> วินาที
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto flex-wrap">
            {onExecuteAutoNow && (
              <button
                type="button"
                onClick={onExecuteAutoNow}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                title="รันรอบปัจจุบัน 1 รหัสทันที"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>รันรอบนี้ทันที (1 รหัส)</span>
              </button>
            )}
            {onExecuteAllAutoNow && autoTotalRounds > 1 && (
              <button
                type="button"
                onClick={onExecuteAllAutoNow}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1 cursor-pointer border border-purple-400"
                title="รันทุกรอบให้เสร็จหมดทันที"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>รันหมดทุกรอบ ({autoTotalRounds})</span>
              </button>
            )}
            {onCancelAuto && (
              <button
                type="button"
                onClick={onCancelAuto}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border border-slate-700"
              >
                <X className="w-3.5 h-3.5" />
                <span>หยุด/ข้าม</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Notification Toasts */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* The Central Engine Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ============================================================== */}
        {/* คอลัมน์ 1: ระบบ Auto โคลนนิ่ง (Auto-Cloning / Rebirth Engine) */}
        {/* ============================================================== */}
        {(activePoolTab === 'all' || activePoolTab === 'cloning') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-950 border-2 border-purple-500/60 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              {/* Badge & Title */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Auto โคลนนิ่ง (Rebirth Engine)
                </span>
                <span className="text-[10px] text-purple-300/90 font-mono font-bold bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
                  {autoRebirth ? `⚡ Auto (หน่วง ${autoDelaySec}s)` : '⚪ ปิด Auto'}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>ระบบ Auto โคลนนิ่ง (Rebirth)</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  เมื่อมีสมาชิกต่อขาขวา (Right Child) ระบบจะนำยอด 100% (5.00 USDT) มาโคลนนิ่งรหัสใหม่ให้อัตโนมัติ (วนลูป 2 รอบ: สายงาน ➔ ชุมชน)
                </p>
              </div>

              {/* Amount Display & Status */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>คิวรอโคลนนิ่งทั้งระบบ:</span>
                  <span className="text-purple-300 font-mono font-bold">
                    {pendingRebirthCount} รหัส
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-extrabold text-purple-300 font-mono">
                    {simulator.rebirthPool.toFixed(2)} <span className="text-xs text-purple-400">USDT</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    กองกลาง Rebirth
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>สถานะ Auto Engine:</span>
                  <span className={`font-mono font-bold ${autoRebirth ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {autoRebirth ? `● กำลังทำงาน (หน่วง ${autoDelaySec}s)` : '○ รอสั่งการด้วยตนเอง'}
                  </span>
                </div>
              </div>

              {/* Auto Toggle Switch */}
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-200 block">⚡ สวิตช์ Auto โคลนนิ่ง</span>
                  <span className="text-[10px] text-slate-400">คลอดรหัสใหม่อัตโนมัติเมื่อครบขาขวา</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleAutoRebirth && onToggleAutoRebirth(!autoRebirth)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    autoRebirth ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-purple-900/60 relative z-10">
              <button
                type="button"
                onClick={() =>
                  handleAction(() => {
                    if (onBatchExecuteRebirths) {
                      onBatchExecuteRebirths();
                    } else if (onExecuteRebirth) {
                      onExecuteRebirth(poolsData.selectedMainId);
                    }
                  }, 'สั่งรันประมวลผล Auto โคลนนิ่งสำเร็จ!')
                }
                className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-purple-900/50 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ สั่งโคลนนิ่งทันที (Execute All)</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* คอลัมน์ 2: สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID Registration) จากส่วนเกิน 40% Vault (ผัง 1 ถึง 5) */}
        {/* ============================================================== */}
        {(activePoolTab === 'all' || activePoolTab === 'newMainId') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-indigo-500/60 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              {/* Badge & Title */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-indigo-400" />
                  New Main ID (ผัง 1 ถึง 5)
                </span>
                <span className="text-[10px] text-indigo-300/80 font-mono">
                  {autoExcessVaultNewMainId ? `⚡ Auto (หน่วง ${autoDelaySec}s)` : '⚪ ปิด Auto'}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>สมัครสมาชิกเปิดไอดีหลักใหม่</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  นำยอดส่วนเกิน 40% Vault (ผัง 1-5) ที่เกินจากสำรอง 5 ผัง มาสมัครเปิดเป็น <strong className="text-indigo-300">New Main ID ผัง 1 (5.00 USDT)</strong> (เป็นไอดีหลักใหม่แท้จริง)
                </p>
              </div>

              {/* Amount Display */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">ยอดส่วนเกินไอดี #{poolsData.selectedMainId}:</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl sm:text-2xl font-extrabold font-mono ${poolsData.pool2?.canRegisterNewMainId ? 'text-emerald-400' : 'text-indigo-300'}`}>
                    {(poolsData.pool2?.excessVault ?? 0).toFixed(2)} <span className="text-xs text-indigo-400">/ 5.00 U</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    เปิดได้: {poolsData.pool2?.newMainIdCountPossible ?? 0} ไอดี
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>ส่วนเกินรวมทั้งระบบ (ผัง 1-5):</span>
                  <span className="text-indigo-300 font-mono font-bold">{(poolsData.pool2?.systemTotal ?? 0).toFixed(2)} USDT</span>
                </div>
              </div>

              {/* Auto Toggle Switch */}
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-200 block">⚡ Auto สมัคร New Main ID</span>
                  <span className="text-[10px] text-slate-400">เปิดไอดีหลักอัตโนมัติเมื่อส่วนเกินครบ 5 U</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleAutoExcessVaultNewMainId && onToggleAutoExcessVaultNewMainId(!autoExcessVaultNewMainId)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                    autoExcessVaultNewMainId ? 'bg-indigo-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-indigo-900/60 relative z-10">
              <button
                type="button"
                onClick={() =>
                  handleAction(() => {
                    if (!onExecuteMainIdRebirthFromExcessVault) return;
                    onExecuteMainIdRebirthFromExcessVault(poolsData.selectedMainId);
                  }, `เปิด New Main ID ในผัง 1 จากส่วนเกิน 40% Vault ของไอดี #${poolsData.selectedMainId} สำเร็จ!`)
                }
                disabled={!poolsData.pool2?.canRegisterNewMainId}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md ${
                  poolsData.pool2?.canRegisterNewMainId
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-indigo-900/50 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>
                  {poolsData.pool2?.canRegisterNewMainId
                    ? `สมัครเปิด New Main ID ผัง 1 (ใช้ 5.00 USDT)`
                    : `รอสะสมส่วนเกินครบ 5.00 U (ขาด ${(Math.max(0, 5.0 - (poolsData.pool2?.excessVault ?? 0))).toFixed(2)} U)`}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleAction(() => {
                    onAddTestVaultToRank1To5 && onAddTestVaultToRank1To5(poolsData.selectedMainId, 1, 5.0);
                  }, `เติมยอดทดสอบ 40% Vault +5.00 USDT ให้ไอดี #${poolsData.selectedMainId} เรียบร้อย!`)
                }
                className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-indigo-300 hover:text-white hover:bg-indigo-950/60 transition-colors flex items-center justify-center space-x-1 border border-indigo-800/40 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>+ ทดสอบเติมส่วนเกิน Vault 5.00 U</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* คอลัมน์ 3: สร้าง New Member จากส่วนเกิน 40% Vault (ผัง 6 ถึง 45) */}
        {/* ============================================================== */}
        {(activePoolTab === 'all' || activePoolTab === 'rank6to45') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              {/* Badge & Title */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  New Member (ผัง 6 ถึง 45)
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">
                  สแกนผัง 45➔2
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>สร้าง New Member ผัง 6-45</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  ระบบสแกนส่วนเกินจากผัง 45 ลงมาถึงผัง 2 เมื่อยอดส่วนเกินครบตามราคาผังใด จะเปิดรหัส <strong className="text-emerald-300">New Member ในผังนั้นทันที (&quot;ไปต่อตัวเอง&quot;)</strong>
                </p>
              </div>

              {/* Amount Display */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">ยอดส่วนเกินไอดี #{poolsData.selectedMainId}:</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl sm:text-2xl font-extrabold font-mono ${poolsData.pool3?.canCreateNewID ? 'text-emerald-400' : 'text-emerald-300'}`}>
                    {(poolsData.pool3?.excessVault ?? 0).toFixed(2)} <span className="text-xs text-emerald-400">USDT</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {poolsData.pool3?.canCreateNewID ? '🌟 พร้อมเปิดรหัส' : 'รอสะสม'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>ส่วนเกินรวมทั้งระบบ (ผัง 6-45):</span>
                  <span className="text-emerald-300 font-mono font-bold">{(poolsData.pool3?.systemTotal ?? 0).toFixed(2)} USDT</span>
                </div>
              </div>

              {/* Eligible Ranks Summary */}
              <div className="text-[11px] space-y-1.5 text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-emerald-900/40">
                <div className="text-emerald-200 font-semibold flex items-center justify-between">
                  <span>เงื่อนไขการเปิดผัง:</span>
                  <span className="text-[10px] text-slate-400">ไล่ผัง 45 ➔ ผัง 2</span>
                </div>
                <div className="text-[10.5px] text-slate-300">
                  {(poolsData.pool3?.eligibleRanks || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {poolsData.pool3?.eligibleRanks.slice(0, 4).map((r) => (
                        <span key={`eligible-rank-${r.rank}`} className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-[10px]">
                          ผัง {r.rank} ({r.price} U)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">
                      สแกนยอดส่วนเกิน หากครบราคาผังใด (ผัง 2 = 10 USDT ขึ้นไป) จะสร้าง New Member ทันที
                    </p>
                  )}
                </div>
                <div className="pt-1 border-t border-slate-800 text-[10.5px] text-amber-300 font-semibold">
                  🎁 รับค่าแนะนำ 30% + ค่าชั้น 30% + Vault 40% กลับเข้าตัว 100%
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-emerald-900/60 relative z-10">
              <button
                type="button"
                onClick={() =>
                  handleAction(() => {
                    if (!onExecuteCreateIDFromExcessVault) return;
                    onExecuteCreateIDFromExcessVault(poolsData.selectedMainId);
                  }, `สร้าง New Member จากส่วนเกิน 40% Vault (ผัง 6-45) ของไอดี #${poolsData.selectedMainId} สำเร็จ!`)
                }
                disabled={!poolsData.pool3?.canCreateNewID}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md ${
                  poolsData.pool3?.canCreateNewID
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/50 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>
                  {poolsData.pool3?.canCreateNewID
                    ? `สร้าง New Member (ไล่ผัง 45 ➔ 2)`
                    : `รอส่วนเกินครบราคาผัง (ขั้นต่ำ 10 USDT)`}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleAction(() => {
                    onAddTestVaultToRank6To45 && onAddTestVaultToRank6To45(poolsData.selectedMainId, 6, 100);
                  }, `เติมยอดทดสอบ 40% Vault ผัง 6 (+100 USDT) ให้ไอดี #${poolsData.selectedMainId} เรียบร้อย!`)
                }
                className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-emerald-300 hover:text-white hover:bg-emerald-950/60 transition-colors flex items-center justify-center space-x-1 border border-emerald-800/40 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>+ ทดสอบเติม Vault ผัง 6 (100 U)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Tab View */}
      {activePoolTab === 'history' && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>สมุดบัญชีบันทึกประวัตกองกลาง (Central Pools Audit History)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                ประวัติธุรกรรมเงินเข้า-ออกจากทั้ง 3 กองกลาง ตรวจสอบความถูกต้องได้ทุกขั้นตอน
              </p>
            </div>
          </div>

          <CentralPoolHistoryView
            history={simulator.getCentralPoolHistory()}
            rebirthPoolBalance={poolsData.pool1?.amount || 0}
            totalSystemVaultRank1To5={poolsData.pool2?.systemTotal || 0}
            totalSystemVaultRank6To45={poolsData.pool3?.systemTotal || 0}
            selectedNodeId={selectedNodeId}
            onSelectNodeId={onSelectNodeId}
          />
        </div>
      )}

      {/* Footer Info Strip */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong className="text-slate-200">ระบบ Auto Delay Engine:</strong> สามารถหน่วงเวลา 0-5 วินาทีเพื่อให้มองเห็นการเกิดคิวและอนิเมชันการโคลนนิ่ง/เกิดใหม่อย่างราบรื่น
          </span>
        </div>
        <div className="flex items-center space-x-3 shrink-0 text-[11px]">
          <span className="text-purple-300">🟣 Auto โคลนนิ่ง</span>
          <span className="text-indigo-300">🔵 New Main ID (ผัง 1)</span>
          <span className="text-emerald-300">🟢 New Member (ผัง 6-45)</span>
        </div>
      </div>
    </div>
  );
};
