import React, { useState } from 'react';
import { MatrixNode, WalletAccount, SlotTarget, ExcessRebirthVaultSummary } from '../types';
import { getRebirthNodeCount, getRebirthNodeIds, getAllMainIdRebirthStats, getNodeTypeCounts, getRebirthSeqForMain, formatNodeCloneBadgeParts, formatNodeCloneLabel } from '../lib/rebirthUtils';
import {
  Cpu,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Flame,
  Layers,
  Search,
  RefreshCw,
  Crown,
  Coins,
} from 'lucide-react';
import { REGISTRATION_FEE } from '../lib/matrixSimulator';
import { useLanguage } from '../i18n/LanguageContext';

interface RebirthManagerProps {
  nodes: MatrixNode[];
  wallets: WalletAccount[];
  rebirthPool: number;
  onExecuteRebirth: (nodeId: number, targetParentId?: number, isLeft?: boolean) => void;
  onBatchExecuteRebirths: () => void;
  findRebirthSlot: (nodeId: number) => SlotTarget | null;
  autoRebirth?: boolean;
  onToggleAutoRebirth?: (enabled: boolean) => void;
  autoExcessVaultNewMainId?: boolean;
  onToggleAutoExcessVaultNewMainId?: (enabled: boolean) => void;
  onFocusNode?: (nodeId: number) => void;
  getFamilyExcessRebirthVaultSummary?: (nodeId: number) => ExcessRebirthVaultSummary;
  onExecuteMainIdRebirthFromExcessVault?: (mainId: number) => void;
  onAddTestVaultToRank1To5?: (mainId: number, targetRank?: number, amount?: number) => void;
  getFamilyExcessVaultRank6To45Summary?: (nodeId: number) => {
    mainId: number;
    mainRank: number;
    vaultRank6To45: number;
    reserved5RanksVault: number;
    excessVault: number;
    eligibleRanks: { rank: number; price: number; name: string }[];
    canCreateNewID: boolean;
  };
  onExecuteExcessVaultIDCreation?: (mainId: number) => void;
  onAddTestVaultToRank6To45?: (mainId: number, targetRank?: number, amount?: number) => void;
}

export const RebirthManager: React.FC<RebirthManagerProps> = ({
  nodes,
  wallets,
  rebirthPool,
  onExecuteRebirth,
  onBatchExecuteRebirths,
  findRebirthSlot,
  autoRebirth = false,
  onToggleAutoRebirth,
  autoExcessVaultNewMainId = false,
  onToggleAutoExcessVaultNewMainId,
  onFocusNode,
  getFamilyExcessRebirthVaultSummary,
  onExecuteMainIdRebirthFromExcessVault,
  onAddTestVaultToRank1To5,
  getFamilyExcessVaultRank6To45Summary,
  onExecuteExcessVaultIDCreation,
  onAddTestVaultToRank6To45,
}) => {
  const { t } = useLanguage();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isBotScanning, setIsBotScanning] = useState<boolean>(false);
  const [idSearch, setIdSearch] = useState<string>('');
  const [selectedMainIdForRank1To5, setSelectedMainIdForRank1To5] = useState<number>(1);
  const [selectedMainIdForRank6To45, setSelectedMainIdForRank6To45] = useState<number>(1);
  const [centralPoolTab, setCentralPoolTab] = useState<'all' | 'pool1' | 'pool2' | 'pool3'>('all');

  const pendingNodes = nodes.filter((n) => n.pendingRebirths > 0);
  const rebornNodes = nodes.filter((n) => n.isRebirth);
  const allMainStats = getAllMainIdRebirthStats(nodes);
  const nodeCounts = getNodeTypeCounts(nodes);

  const getWalletName = (address: string) => {
    const w = wallets.find((item) => item.address.toLowerCase() === address.toLowerCase());
    return w ? w.name : `${address.slice(0, 6)}...`;
  };

  const handleExecuteSingle = (nodeId: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const targetSlot = findRebirthSlot(nodeId);
      if (!targetSlot) {
        throw new Error('ไม่พบตำแหน่งว่างในผังสำหรับโคลนนิ่ง');
      }
      onExecuteRebirth(nodeId, targetSlot.parentId, targetSlot.isLeft);
      setSuccessMsg(
        `โคลนนิ่งสำเร็จ! รหัส #${nodeId} ได้รับรหัสโคลนนิ่งไปต่อที่รหัส #${targetSlot.parentId} ฝั่ง${
          targetSlot.isLeft ? 'ซ้าย' : 'ขวา'
        }`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสั่งโคลนนิ่ง');
    }
  };

  const handleRunBotBatch = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsBotScanning(true);

    setTimeout(() => {
      try {
        onBatchExecuteRebirths();
        setSuccessMsg(
          `Keeper Bot ทำงานเสร็จสิ้น! สแกนและส่งคำสั่ง batchExecuteRebirth() ประมวลผลรหัสที่รอโคลนนิ่งทั้งหมดเรียบร้อยแล้ว`
        );
      } catch (err: any) {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการรันบอท');
      } finally {
        setIsBotScanning(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Distinction Card: Registration (Main ID) vs Rebirth / Cloning */}
      <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-800/80 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-950">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-sm font-bold text-slate-100">
              📌 สรุปความแตกต่าง: การสมัครสมาชิก (Main ID) vs การเกิดใหม่หรือโคลนนิ่ง (Rebirth Node)
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              👑 Main ID: {nodeCounts.mainCount} ไอดี
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
              🌱 Rebirth Node: {nodeCounts.rebirthCount} รหัส
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Card 1: Main ID Registration */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-emerald-400" />
                1. การสมัครไอดีหลัก (New Main ID)
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono font-bold">
                สมัครโดยสมาชิก
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              • <strong>การสร้าง:</strong> สมัครผ่านแบบฟอร์มลงทะเบียน (Single / Batch) ด้วยตนเอง<br />
              • <strong>การชำระเงิน:</strong> ตัดเงิน USDT ในกระเป๋า หรือใช้เงิน 40% Upgrade Vault<br />
              • <strong>สิทธิ์การไต่ผัง:</strong> เป็นไอดีหลัก มีสิทธิ์สะสมผลงาน และ <strong className="text-emerald-300">Auto-Upgrade ขึ้น Rank 2 ถึง 45</strong><br />
              • <strong>ตัวอย่างรหัส:</strong> #1, #2, #3, #5
            </p>
          </div>

          {/* Card 2: Rebirth / Cloning Node */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                2. การเกิดใหม่ / โคลนนิ่ง (Rebirth Node)
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40 font-mono font-bold">
                สร้างโดยระบบออโต้
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              • <strong>การสร้าง:</strong> เกิดขึ้นอัตโนมัติเมื่อครบขาขวาแน่น หรือ Vault ส่วนเกินครบ 5 USDT<br />
              • <strong>การชำระเงิน:</strong> ใช้เงินจากกองกลาง Rebirth Pool หรือส่วนเกิน Vault 5 USDT<br />
              • <strong>สิทธิ์การไต่ผัง:</strong> ไม่ขึ้น Rank 2–45 แยกเอง แต่อยู่เพื่อปั๊มยอด Vault 40% และโบนัส 30% ส่งคืนไอดีหลัก<br />
              • <strong>ตัวอย่างรหัส:</strong> #4 [Rebirth of #1]
            </p>
          </div>
        </div>
      </div>

      {/* Independent Auto Systems Control Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/70 to-purple-950/70 border-2 border-indigo-500/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-800/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>⚙️ แผงควบคุมระบบออโต้แยกอิสระ (Independent Auto System Controls)</span>
              </h3>
              <p className="text-xs text-slate-300">
                สวิตช์เปิด/ปิดระบบทำงานอัตโนมัติแยก 2 ระบบอิสระจากกันอย่างชัดเจน
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* System 1: Auto Rebirth & Keeper Bot */}
          <div className={`p-4 rounded-xl border transition-all ${
            autoRebirth
              ? 'bg-purple-950/80 border-purple-500 shadow-lg shadow-purple-950/50'
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-xs text-purple-200">
                    1. ระบบ Auto Rebirth & Keeper Bot (โคลนนิ่ง)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  สแกนคิวและคลอดรหัสโคลนนิ่ง (`Rebirth Node`) จากกองกลาง Rebirth Pool 100% เม็ดขวาโดยอัตโนมัติ
                </p>
              </div>

              {onToggleAutoRebirth && (
                <button
                  type="button"
                  onClick={() => onToggleAutoRebirth(!autoRebirth)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all shrink-0 flex items-center space-x-1.5 ${
                    autoRebirth
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/50 ring-2 ring-purple-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${autoRebirth ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  <span>{autoRebirth ? 'เปิดออโต้' : 'ปิดออโต้'}</span>
                </button>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-purple-800/40 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">สถานะระบบโคลนนิ่ง:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                autoRebirth
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {autoRebirth ? '🟢 ACTIVE (กำลังทำงาน)' : '⚪ INACTIVE (ปิด)'}
              </span>
            </div>
          </div>

          {/* System 2: Auto New Main ID from 40% Excess Vault */}
          <div className={`p-4 rounded-xl border transition-all ${
            autoExcessVaultNewMainId
              ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-950/50'
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-xs text-indigo-200">
                    2. ระบบ Auto New Main ID จากส่วนเกิน 40% Vault
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  สแกนส่วนเกิน 40% Vault และสมัครเปิดไอดีหลักใหม่ (`New Main ID` ผัง 1 ถึง 45) โดยอัตโนมัติ
                </p>
              </div>

              {onToggleAutoExcessVaultNewMainId && (
                <button
                  type="button"
                  onClick={() => onToggleAutoExcessVaultNewMainId(!autoExcessVaultNewMainId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all shrink-0 flex items-center space-x-1.5 ${
                    autoExcessVaultNewMainId
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/50 ring-2 ring-indigo-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${autoExcessVaultNewMainId ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  <span>{autoExcessVaultNewMainId ? 'เปิดออโต้' : 'ปิดออโต้'}</span>
                </button>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-800/40 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">สถานะระบบเปิดไอดีหลักใหม่:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                autoExcessVaultNewMainId
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {autoExcessVaultNewMainId ? '🟢 ACTIVE (กำลังทำงาน)' : '⚪ INACTIVE (ปิด)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Switcher: ระบบแยก 3 กองกลาง (The 3 Central Pools System) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 text-white shadow-md">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>ระบบแยก 3 กองกลาง (The 3 Central Pools System)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  แยกอิสระ 3 วัตถุประสงค์
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                เลือกดูและควบคุม 3 กองกลางตามข้อกำหนด: กองที่ 1 โคลนนิ่ง | กองที่ 2 New Main ID ผัง 1 | กองที่ 3 New Member ผัง 45 ➔ 2 ("ไปต่อตัวเอง")
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setCentralPoolTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                centralPoolTab === 'all'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>🌟 แสดงครบทั้ง 3 กองกลาง</span>
            </button>
            <button
              type="button"
              onClick={() => setCentralPoolTab('pool1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                centralPoolTab === 'pool1'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-purple-300 hover:bg-purple-950/40'
              }`}
            >
              <span>🟣 กอง 1 (โคลนนิ่ง)</span>
            </button>
            <button
              type="button"
              onClick={() => setCentralPoolTab('pool2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                centralPoolTab === 'pool2'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-indigo-300 hover:bg-indigo-950/40'
              }`}
            >
              <span>🔵 กอง 2 (ผัง 1-5 ➔ New Main ID)</span>
            </button>
            <button
              type="button"
              onClick={() => setCentralPoolTab('pool3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                centralPoolTab === 'pool3'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-emerald-300 hover:bg-emerald-950/40'
              }`}
            >
              <span>🟢 กอง 3 (ผัง 6-45 ➔ New Member)</span>
            </button>
          </div>
        </div>
      </div>

      {/* [กองที่ 1]: Rebirth Pool สำหรับโคลนนิ่ง */}
      {(centralPoolTab === 'all' || centralPoolTab === 'pool1') && (
        <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-2 border-purple-500/60 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-purple-800/40">
            <span className="px-2.5 py-1 rounded-md bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-400/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              กองที่ 1
            </span>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Rebirth Pool สำหรับโคลนนิ่ง</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/40 font-bold">
              100% เม็ดขวา (5.00 USDT)
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <Cpu className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-slate-100">
                  {t('keeperBotTitle')}
                </h2>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                {t('keeperBotDesc')}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="shrink-0 flex justify-between w-full sm:w-auto sm:flex-col gap-3 bg-slate-900/90 p-3 sm:p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block">{t('poolAvailable')}</span>
                <span className="font-mono font-bold text-base sm:text-lg text-purple-300">
                  {rebirthPool.toFixed(2)} USDT
                </span>
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block">{t('pendingRebirthQueue')}</span>
                <span className="font-mono font-bold text-base sm:text-lg text-amber-300">
                  {pendingNodes.length}
                </span>
              </div>
            </div>
          </div>

        {/* 2-Round Logic Cards & Rank 1 Not ID 1 Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-purple-800/40 text-xs">
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-emerald-300">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-300 border border-emerald-500/40">
                1
              </span>
              <span>🌱 รอบที่ 1 (Round 1 - ช่วยสายงานผู้แนะนำ)</span>
            </div>
            <div className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-emerald-500/20 space-y-2">
                <div className="space-y-1.5 text-slate-200">
                  <div className="text-emerald-300">
                    <strong className="text-emerald-400 font-bold">ขั้นที่ 1:</strong> รหัสโคลนนิ่งรอบ 1 ต้องไปวาง <strong className="text-emerald-300 underline underline-offset-2">ติดตัวขาตรงของผู้แนะนำ (Sponsor) ก่อน (ซ้ายหรือ ขวาก็ได้)</strong>
                  </div>
                  <div className="text-purple-300">
                    <strong className="text-purple-400 font-bold">ขั้นที่ 2 (เงื่อนไขสำคัญ):</strong> หากขาตรงของผู้แนะนำเต็มทั้ง 2 ขาแล้ว ➔ ระบบจะส่งลงไป <strong className="text-amber-300 underline underline-offset-2">&quot;ต่อใต้รหัสโคลนนิ่ง (Rebirth ID) ของผู้แนะนำ&quot;</strong> ที่ยังมีขาว่าง
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-800/80 text-[10.5px] text-slate-400">
                  <span className="text-amber-300 font-semibold">(เฉพาะ ID #1 รอบแรก):</span> จะวิ่งไปต่อตำแหน่งคนที่ว่างจากบนลงล่าง ซ้ายไปขวา (BFS) ทั่วทั้งผังทันที
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-indigo-300">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-300 border border-indigo-500/40">
                2
              </span>
              <span>🚀 รอบที่ 2 (Round 2 - กระจายช่วยชุมชนทั้งระบบ)</span>
            </div>
            <div className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-indigo-500/20">
                <p className="leading-relaxed">
                  <strong>บอทสแกนเนอร์ (BFS)</strong> จะค้นหาตำแหน่งว่างระดับบนสุด <strong className="text-emerald-400">จากบนลงล่าง ซ้ายไปขวา (ไปต่อใครก็ได้ในระบบ)</strong> เพื่อช่วยดันสมาชิกใหม่และคนในชุมชนที่ยังไม่มีลูก
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Round Loop Banner */}
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-purple-950/70 border border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2 text-amber-300 font-bold">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin-slow shrink-0" />
            <span>🔄 วนลูปต่อเนื่อง (2-Round Loop):</span>
          </div>
          <div className="text-purple-200 text-[11px] font-semibold flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-purple-900/80 border border-purple-600/50 text-white shadow-sm">
              ทำงานครบ 2 รอบแล้วจะวนกลับไปเริ่มรอบที่ 1 ใหม่เสมอ
            </span>
            <span className="text-amber-300 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
              (รอบ 1 ➔ รอบ 2 ➔ รอบ 1 ➔ รอบ 2)
            </span>
          </div>
        </div>

        {/* 100% Rebirth Payout Distribution Rule */}
        <div className="mt-4 pt-4 border-t border-purple-800/40">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>การกระจายเงิน 100% (5.00 USDT) เมื่อไอดีโคลนนิ่งลงตำแหน่งเม็ดซ้าย:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30">
              <span className="text-[10px] font-mono text-amber-400 block font-bold">40% (2.00 USDT)</span>
              <strong className="text-slate-100 block text-xs mt-0.5">เข้า Upgrade Vault</strong>
              <p className="text-[11px] text-slate-300 mt-1">
                เข้ากระเป๋า Upgrade Vault ของรหัสแม่ (เช่น รหัส #2 Alice กลายเป็น <code className="text-amber-300 font-mono">Vault: 2.0/10U</code> ทันที)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/30">
              <span className="text-[10px] font-mono text-indigo-400 block font-bold">30% (1.50 USDT)</span>
              <strong className="text-slate-100 block text-xs mt-0.5">โบนัส 15 ชั้น (เริ่มชั้น 0)</strong>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                • ชั้น 0 (รหัสแม่ Alice): รับทันที 0.10 USDT (2%)<br/>
                • ชั้น 1 (อัพไลน์ #1 Root): รับทันที 0.10 USDT (2%)<br/>
                • ชั้น 2–14: ส่งเข้า Root Treasury ชั้นละ 0.10 USDT (รวม 1.30 U)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30">
              <span className="text-[10px] font-mono text-emerald-400 block font-bold">30% (1.50 USDT)</span>
              <strong className="text-slate-100 block text-xs mt-0.5">Direct Upline</strong>
              <p className="text-[11px] text-slate-300 mt-1">
                <strong className="text-emerald-300">ให้ดึงจาก id หลัก</strong> (รหัสต้นกำเนิดของไอดีโคลนนิ่ง เช่น #1 Root Treasury) จ่ายเข้ากระเป๋าผู้แนะนำหลัก 1.50 USDT ทันที
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* [กองที่ 2]: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 1 ถึง 5) */}
      {(centralPoolTab === 'all' || centralPoolTab === 'pool2') && getFamilyExcessRebirthVaultSummary && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border-2 border-indigo-500/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/60">
            <div className="flex items-center space-x-2.5">
              <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm">
                <Crown className="w-5 h-5 text-indigo-400" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/30 text-indigo-200 text-[10px] font-mono font-bold uppercase tracking-wider border border-indigo-400/40 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-indigo-300" />
                    กองที่ 2
                  </span>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 1 ถึง 5)</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 font-bold">
                    เปิดเป็น New Main ID ในผัง 1 (5.00 USDT)
                  </span>
                </div>
                <p className="text-xs text-indigo-200/90 mt-1">
                  นำยอดส่วนเกินที่เหลือจากการสำรอง 5 ผัง มาสมัครเปิดเป็น <strong>New Main ID ในผัง 1 (5.00 USDT)</strong> [ไม่ใช่โคลนนิ่ง เป็นไอดีหลักใหม่]
                </p>
                <div className="text-xs text-purple-200/90 mt-1.5 leading-relaxed space-y-1">
                  <p>
                    <strong className="text-amber-300 font-semibold">สูตรการคำนวณยอดส่วนเกิน:</strong>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-950/70 border border-purple-500/30 text-purple-200">
                      • ถ้าผัง &lt; 10 (และ &lt; 11) : <strong className="text-amber-300">(40% Vault ผัง 1-5) − (40% Vault สำรองย้อนหลัง 5 ผัง)</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-950/70 border border-indigo-500/30 text-indigo-200">
                      • ถ้าผัง = 10 : <strong className="text-indigo-300">(40% Vault ผัง 1-5) − 0.00 U</strong> [สำรองผัง 6-10 อยู่นอกผัง 1-5]
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-950/70 border border-emerald-500/30 text-emerald-200">
                      • ถ้าผัง ≥ 11 ขึ้นไป : <strong className="text-emerald-300">(40% Vault ยอดสะสม ผัง 1 ถึง 5)</strong> [รับเต็ม 100%]
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Select Main ID for Rank 1-5 (แยกเป็นของตัวเอง) */}
            <div className="flex items-center space-x-2 shrink-0 bg-slate-950/60 p-2 rounded-xl border border-purple-500/30">
              <span className="text-xs text-purple-300 font-medium">ไอดีหลักผัง 1-5:</span>
              <select
                value={selectedMainIdForRank1To5}
                onChange={(e) => setSelectedMainIdForRank1To5(Number(e.target.value))}
                className="bg-slate-900 text-purple-200 border border-purple-500/50 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {nodes.filter((n) => !n.isRebirth).map((mn) => (
                  <option key={`excess-select-rank1-${mn.id}`} value={mn.id}>
                    ไอดี #{mn.id} (ผัง {mn.rank}) - {getWalletName(mn.owner)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const rank1Summary = getFamilyExcessRebirthVaultSummary(selectedMainIdForRank1To5);
            const countPossible = rank1Summary.newMainIdCountPossible ?? rank1Summary.rebirthCountPossible;
            const canRegister = rank1Summary.canRegisterNewMainId ?? rank1Summary.canRebirthRank1;
            const vRank1To5 = rank1Summary.vaultRank1To5 ?? rank1Summary.totalAllVault;
            const isRank11 = rank1Summary.isRank11OrAbove ?? (rank1Summary.mainRank >= 11);
            const isRank10 = (rank1Summary.mainRank === 10);

            return (
              <div className="space-y-3 text-xs">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium block">1. (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 5)</span>
                    <span className="font-mono text-base font-bold text-amber-300">
                      {vRank1To5.toFixed(2)} USDT
                    </span>
                    <span className="text-[9.5px] text-slate-400 block">ยอดสะสม 40% Upgrade Vault ผัง 1-5 รวมทุกโหนดในตระกูล</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        2. 40% Upgrade Vault สำรองย้อนหลัง 5 ผัง
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${isRank11 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : isRank10 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'}`}>
                        ผัง #{rank1Summary.mainRank} {isRank11 ? '≥ 11' : isRank10 ? '= 10' : '< 10'}
                      </span>
                    </div>
                    <span className="font-mono text-base font-bold text-indigo-300">
                      {isRank11 ? '0.00 USDT' : isRank10 ? '0.00 USDT' : `${rank1Summary.reserved5RanksVault.toFixed(2)} USDT`}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block">
                      {isRank11
                        ? '✅ ผ่านผัง 11 ขึ้นไปแล้ว รับเต็ม 100% ไม่ต้องสำรอง'
                        : isRank10
                        ? '✅ ผัง 10 สำรองผัง 6-10 (อยู่นอกผัง 1-5) รับเต็ม 100% ผัง 1-5'
                        : `สำรองย้อนหลัง: ${rank1Summary.reservedRanksText}`}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/40 space-y-1 bg-purple-950/30">
                    <span className="text-[10px] text-purple-300 font-bold block">3. ยอดส่วนเกินสะสมสุทธิ (ลงผัง 1 มูลค่า 5.00 U)</span>
                    <span className={`font-mono text-base font-bold ${rank1Summary.excessVault >= 5 ? 'text-emerald-400' : 'text-purple-300'}`}>
                      {rank1Summary.excessVault.toFixed(2)} / 5.00 USDT
                    </span>
                    <span className="text-[9.5px] text-emerald-400 font-medium block">
                      {countPossible > 0 ? `✨ พร้อมสมัครเปิดไอดีหลักใหม่ได้ ${countPossible} รหัส` : 'รอสะสมครบ 5.00 USDT'}
                    </span>
                  </div>
                </div>

                {/* Formula Breakdown Banner */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-purple-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-purple-300 font-bold">สูตรคำนวณจริง:</span>
                    <span className="text-emerald-300 font-sans font-semibold">
                      {rank1Summary.formulaText}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {isRank11 ? 'รับเต็ม 100% ผัง 1-5' : isRank10 ? 'ผัง 10 ปลดล็อกผัง 1-5' : `สำรองย้อนหลัง 5 ผัง`}
                  </span>
                </div>

                {/* Test Vault Quick Injector for Function 1 */}
                {onAddTestVaultToRank1To5 && (
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚡ ปุ่มทดสอบเติมยอด 40% Vault (ผัง 1-5 / ผัง 6-10):</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          onAddTestVaultToRank1To5(selectedMainIdForRank1To5, 1, 5.0);
                          setSuccessMsg(`เติมยอดทดสอบ 40% Vault +5.00 USDT ลงผังที่ 1 ให้ไอดี #${selectedMainIdForRank1To5} เรียบร้อยแล้ว`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[11px] font-mono font-bold transition-all"
                      >
                        +5.0 U (ผัง 1)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAddTestVaultToRank1To5(selectedMainIdForRank1To5, 3, 5.0);
                          setSuccessMsg(`เติมยอดทดสอบ 40% Vault +5.00 USDT ลงผังที่ 3 ให้ไอดี #${selectedMainIdForRank1To5} เรียบร้อยแล้ว`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[11px] font-mono font-bold transition-all"
                      >
                        +5.0 U (ผัง 3)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAddTestVaultToRank1To5(selectedMainIdForRank1To5, 5, 5.0);
                          setSuccessMsg(`เติมยอดทดสอบ 40% Vault +5.00 USDT ลงผังที่ 5 ให้ไอดี #${selectedMainIdForRank1To5} เรียบร้อยแล้ว`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 text-[11px] font-mono font-bold transition-all"
                      >
                        +5.0 U (ผัง 5)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAddTestVaultToRank1To5(selectedMainIdForRank1To5, 1, 10.0);
                          setSuccessMsg(`เติมยอดทดสอบ 40% Vault +10.00 USDT ลงผังที่ 1 ให้ไอดี #${selectedMainIdForRank1To5} เรียบร้อยแล้ว`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-[11px] font-mono font-bold transition-all"
                      >
                        +10.0 U (ผัง 1)
                      </button>
                    </div>
                  </div>
                )}

                {/* Priority Rule Badge */}
                <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-[11px] text-purple-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    <strong className="text-amber-300">กฎบุริมสิทธิ์ระบบ (Priority Rule):</strong> หากมีสิทธิ์รอโคลนนิ่ง (Rebirth) ค้างอยู่ ระบบจะดำเนินการ<strong>โคลนนิ่งให้เสร็จสิ้นก่อนเปิดไอดีหลักใหม่จากส่วนเกิน 40% Vault เสมอ</strong>
                  </span>
                </div>

                {/* Status & Action */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-purple-200 block">
                      📌 สิทธิ์สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID) ในผัง 1 ของไอดี #{selectedMainIdForRank1To5}:
                    </span>
                    {canRegister ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold inline-block">
                        ✨ พร้อมสมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID) ได้ {countPossible} รหัส (ส่วนเกิน {rank1Summary.excessVault.toFixed(2)} USDT)
                      </span>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        ยอดส่วนเกินสะสมยังไม่ถึง 5.00 USDT (ปัจจุบันมี {rank1Summary.excessVault.toFixed(2)} USDT / ขาดอีก {(Math.max(0, 5 - rank1Summary.excessVault)).toFixed(2)} USDT)
                      </p>
                    )}
                    <p className="text-[10px] text-purple-300/80 leading-tight">
                      🌳 <strong>เงื่อนไขจัดวาง:</strong> ไปต่อใต้ตัวเอง (ซ้ายก่อน ขวา) หากเต็ม 2 ขาแล้ว ให้ไปหาไอดีโคลนนิ่งตัวเองจากบนลงล่างซ้ายไปขวา (เช่น ตัวเราคือ #1 เต็ม 2 ขาแล้ว ตัวโคลนนิ่งคือ #4 ก็ไปต่อใต้ #4)
                    </p>
                  </div>

                  {onExecuteMainIdRebirthFromExcessVault && (
                    <button
                      onClick={() => {
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        try {
                          onExecuteMainIdRebirthFromExcessVault(selectedMainIdForRank1To5);
                          setSuccessMsg(
                            `สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID Registration) จากส่วนเกิน 40% Vault (ผัง 1-5) ของไอดี #${selectedMainIdForRank1To5} ลงผัง 1 สำเร็จ! [ไม่ใช่โคลนนิ่ง]`
                          );
                        } catch (err: any) {
                          setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิกเปิดไอดีหลักใหม่จากส่วนเกิน 40% Vault');
                        }
                      }}
                      disabled={!canRegister}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-lg shadow-purple-900/40 shrink-0 flex items-center justify-center space-x-1.5 active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4 text-amber-300" />
                      <span>สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID) ทันที (5.00 U)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* [กองที่ 3]: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 6 ถึง 45) */}
      {(centralPoolTab === 'all' || centralPoolTab === 'pool3') && getFamilyExcessVaultRank6To45Summary && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border-2 border-emerald-500/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/60">
            <div className="flex items-center space-x-2.5">
              <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                <Zap className="w-5 h-5 text-emerald-400" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/30 text-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-400/40 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-300" />
                    กองที่ 3
                  </span>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 6 ถึง 45)</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 font-bold">
                    สแกนผัง 45 ➔ 2 ("ไปต่อตัวเอง")
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
                  ระบบสแกนส่วนเกินจากผัง 45 ลงมาถึงผัง 2 เมื่อยอดส่วนเกินครบตามราคาผังใด จะเปิดรหัส <strong>New Member ในผังนั้นทันที ("ไปต่อตัวเอง")</strong> [รับค่าแนะนำ 30%, โบนัส 15 ชั้น 30%, Vault 40% ส่งกลับให้ไอดีผู้สร้าง 100%]
                </p>
                <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  สูตรคำนวณ: <strong>(40% Vault ผัง 6 ถึง 45)</strong> − <strong>(40% Vault สำรองย้อนหลัง 5 ผัง)</strong> = <strong>ยอดส่วนเกิน</strong>
                </p>
              </div>
            </div>

            {/* Select Main ID for Rank 6-45 (แยกเป็นของตัวเอง) */}
            <div className="flex items-center space-x-2 shrink-0 bg-slate-950/60 p-2 rounded-xl border border-emerald-500/30">
              <span className="text-xs text-emerald-300 font-medium">ไอดีหลักผัง 6-45:</span>
              <select
                value={selectedMainIdForRank6To45}
                onChange={(e) => setSelectedMainIdForRank6To45(Number(e.target.value))}
                className="bg-slate-900 text-emerald-200 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {nodes.filter((n) => !n.isRebirth).map((mn) => (
                  <option key={`excess-select-rank6-${mn.id}`} value={mn.id}>
                    ไอดี #{mn.id} ({getWalletName(mn.owner)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const excessSummary = getFamilyExcessVaultRank6To45Summary(selectedMainIdForRank6To45);
            return (
              <div className="space-y-3 text-xs">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium block">1. 40% Vault (ผัง 6 ถึง 45)</span>
                    <span className="font-mono text-base font-bold text-purple-300">
                      {excessSummary.vaultRank6To45.toFixed(2)} USDT
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium block">2. สำรองอัปเกรด 5 ผังย้อนหลัง</span>
                    <span className="font-mono text-base font-bold text-amber-300">
                      {excessSummary.reserved5RanksVault.toFixed(2)} USDT
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-1 bg-emerald-950/30">
                    <span className="text-[10px] text-emerald-300 font-bold block">3. ยอดส่วนเกินคงเหลือ</span>
                    <span className="font-mono text-base font-bold text-emerald-300">
                      {excessSummary.excessVault.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                {/* Priority Rule Badge */}
                <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-[11px] text-purple-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    <strong className="text-amber-300">กฎบุริมสิทธิ์ระบบ (Priority Rule):</strong> หากมีสิทธิ์รอโคลนนิ่ง (Rebirth) ค้างอยู่ ระบบจะดำเนินการ<strong>โคลนนิ่งให้เสร็จสิ้นก่อนสร้าง New Memberจากส่วนเกิน 40% Vault เสมอ</strong>
                  </span>
                </div>

                {excessSummary.mainRank < 6 && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 flex items-center justify-between gap-2">
                    <span>
                      💡 ไอดี #{selectedMainIdForRank6To45} อยู่ที่ Rank {excessSummary.mainRank}: ยอด 40% Vault ผัง 6 ถึง 45 จะเริ่มสะสมเมื่อไอดีขึ้นสู่ผัง 6 ขึ้นไป (สำหรับผัง 1 ถึง 5 สามารถสร้างได้ที่ฟังก์ชันที่ 1)
                    </span>
                  </div>
                )}

                {/* Eligible Ranks Banner & Action */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-200 block">
                      📌 ผังที่สแกนพบค่อนข้างพร้อมลง (ไล่จากผัง 45 ลงมาถึงผัง 2 ของไอดี #{selectedMainIdForRank6To45}):
                    </span>
                    {excessSummary.eligibleRanks.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {excessSummary.eligibleRanks.map((item) => (
                          <span
                            key={`eligible-rank-${item.rank}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold"
                          >
                            🌟 Rank {item.rank} ({item.price.toFixed(0)} USDT)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        ยังไม่มีผังที่มียอดส่วนเกินครบตามราคาผัง (ระบบจะสแกนผัง 45 ลงมาถึงผัง 2 ทันทีเมื่อยอดส่วนเกินสะสมถึง)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onAddTestVaultToRank6To45 && (
                      <button
                        type="button"
                        onClick={() => {
                          onAddTestVaultToRank6To45(selectedMainIdForRank6To45, 6, 100);
                          setSuccessMsg(`⚡ เติมยอดทดสอบ 40% Vault ผัง 6 จำนวน 100 USDT ให้ไอดี #${selectedMainIdForRank6To45} สำเร็จ!`);
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
                        title="เติมยอด 40% Vault จำลองในผัง 6 เพื่อทดสอบการสร้าง New Member"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>+100 U ทดสอบผัง 6</span>
                      </button>
                    )}

                    {onExecuteExcessVaultIDCreation && (
                      <button
                        onClick={() => {
                          setErrorMsg(null);
                          setSuccessMsg(null);
                          try {
                            onExecuteExcessVaultIDCreation(selectedMainIdForRank6To45);
                            setSuccessMsg(
                              `สร้าง New Member จากส่วนเกิน 40% Vault (ผัง 6-45) ของไอดี #${selectedMainIdForRank6To45} สำเร็จ! [ไม่ใช่โคลนนิ่ง, กรอบสีเหลืองเข้ม]`
                            );
                          } catch (err: any) {
                            setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้าง New Memberจากส่วนเกิน 40% Vault');
                          }
                        }}
                        disabled={!excessSummary.canCreateNewID}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-900/40 shrink-0 flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>สร้าง New Member ลงผัง 2-45 ทันที</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Rules Summary */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>30% Direct Bonus:</strong> จ่ายตรงเข้ากระเป๋าไอดีผู้สร้าง (#{selectedMainIdForRank6To45})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span><strong>30% Level Bonus (15 ชั้น):</strong> จ่ายตรงเข้ากระเป๋าไอดีผู้สร้าง (#{selectedMainIdForRank6To45})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>40% Upgrade Vault:</strong> รวมให้ไอดีหลักสะสมเลื่อนผังสูงขึ้น (ดึงรวมได้ย้อนหลัง 5 ผัง)</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Auto-Rebirth Status & Mode Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/40 shadow-xl">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2.5 rounded-xl border transition-colors ${
              autoRebirth
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                ระบบโคลนนิ่งอัตโนมัติ (Auto-Cloning Engine)
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  autoRebirth
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoRebirth ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                {autoRebirth ? '⚡ เปิดออโต้ (Active)' : 'ปิด (Manual Mode)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {autoRebirth
                ? 'เมื่อสมาชิกลงตำแหน่งลูกขาขวาเต็ม ระบบจะสั่งคลอดรหัสโคลนนิ่งให้ทันทีอัตโนมัติ (ทั้ง Rank 1 และ Rank 2–45)'
                : 'โหมดปัจจุบันเป็นแบบ Manual: ท่านสามารถกดโคลนนิ่งรายรหัส หรือกดรันบอท Keeper Scanner ได้เองตามต้องการ'}
            </p>
          </div>
        </div>

        {onToggleAutoRebirth && (
          <button
            onClick={() => onToggleAutoRebirth(!autoRebirth)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 shadow-md ${
              autoRebirth
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRebirth ? 'text-slate-400' : 'text-white animate-spin-slow'}`} />
            <span>{autoRebirth ? 'สลับเป็น Manual' : '⚡ เปิดโคลนนิ่งออโต้'}</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Rebirth Actions & Queue List (กองที่ 1: Rebirth Pool สำหรับโคลนนิ่ง) */}
      {(centralPoolTab === 'all' || centralPoolTab === 'pool1') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-800 gap-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>คิวรอโคลนนิ่ง (กองที่ 1: Rebirth Pool Queue)</span>
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-mono font-bold">
                    {pendingNodes.length} รหัส
                  </span>
                </h3>
              </div>
            </div>

          {/* Keeper Bot Batch Button */}
          {pendingNodes.length > 0 && (
            <button
              onClick={handleRunBotBatch}
              disabled={isBotScanning}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {isBotScanning
                  ? 'Batch Processing...'
                  : `${t('btnBatchRebirth')} (${pendingNodes.length})`}
              </span>
            </button>
          )}
        </div>

        {pendingNodes.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">{t('noPendingRebirths')}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              เมื่อรหัสใดๆ มีดาวน์ไลน์ฝั่งขวา (เม็ดที่ 2) ครบ ระบบจะเก็บ 5.0 USDT เข้ากองกลาง Rebirth และส่งรหัสนั้นเข้าสู่คิวนี้ทันที
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingNodes.map((node, idx) => {
              const suggestedSlot = findRebirthSlot(node.id);
              const mainId = node.originalAncestorId || node.id;
              const ancestorNode = nodes.find((n) => n.id === mainId);
              const directUplineId = node.sponsorNodeId || ancestorNode?.sponsorNodeId || 1;
              const isDirectUplineNot1 = directUplineId !== 1;
              const isNotId1 = node.id !== 1 && mainId !== 1;
              const existingRebirthIds = getRebirthNodeIds(mainId, nodes);
              const totalRebirthsDone = existingRebirthIds.length;
              const currentRoundInCycle = (totalRebirthsDone % 2) + 1; // 1 or 2
              const currentCycleNumber = Math.floor(totalRebirthsDone / 2) + 1;
              const isRoundOne = currentRoundInCycle === 1;
              const currentRoundNumber = totalRebirthsDone + 1;

              return (
                <div
                  key={`rebirth-active-node-${node.id}-${idx}`}
                  className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-indigo-300 flex items-center space-x-1">
                          {node.isRebirth ? (() => {
                            const cloneBadge = formatNodeCloneBadgeParts(node, nodes, node.rank);
                            return (
                              <div className="flex items-center space-x-1">
                                <span className="text-amber-300 font-extrabold" title={`ไอดีหลัก #${cloneBadge.mainId}`}>
                                  #{cloneBadge.mainId}
                                </span>
                                <span className="text-indigo-200 font-bold" title={`รหัสโคลนนิ่ง #${cloneBadge.nodeId}`}>
                                  #{cloneBadge.nodeId}
                                </span>
                                <span className="text-emerald-300 font-bold" title={`จำนวนการเกิดโคลนนิ่ง #${cloneBadge.vaultCloneIndex}`}>
                                  #{cloneBadge.vaultCloneIndex}
                                </span>
                                <span className="text-purple-300 font-bold bg-purple-900/60 px-1 rounded text-[10px]" title={`โคลนนิ่งรอบ ${cloneBadge.round}`}>
                                  โคลนรอบ {cloneBadge.round}
                                </span>
                                <span className="text-slate-400 text-[10px] font-mono">
                                  ({cloneBadge.fullLabel})
                                </span>
                              </div>
                            );
                          })() : (
                            `รหัส #${node.id}`
                          )}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                          🌱 โคลนนิ่งลงผัง 1 (5 USDT)
                        </span>
                        {node.rank > 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            ไอดีหลัก: Rank {node.rank}
                          </span>
                        )}
                        {node.isRebirth && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/50 flex items-center space-x-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            <span>เกิดมาจาก #{node.rebornFromNodeId || node.originalAncestorId}</span>
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isRoundOne
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          {isNotId1
                            ? isRoundOne
                              ? currentCycleNumber > 1
                                ? `🌱 รอบที่ 1 (วนกลับมารอบ 1 ใหม่ รอบสะสมที่ ${currentRoundNumber}): แนะนำโดยไอดี #${directUplineId} (หากเต็ม 2 ขา โยนต่อให้รหัสเกิดใหม่ของ Sponsor ID #${directUplineId} ทันที ฝั่งซ้าย/ขวา)`
                                : `🌱 รอบที่ 1: ช่วยสายงานผู้แนะนำ Sponsor ID #${directUplineId} (หากเต็ม 2 ขา โยนต่อให้รหัสเกิดใหม่ของ Sponsor ID #${directUplineId} ทันที ฝั่งซ้าย/ขวา)`
                              : `🚀 รอบที่ 2 (รอบสะสมที่ ${currentRoundNumber}): กระจายช่วยชุมชนทั้งระบบ (BFS จากบนลงล่าง ซ้ายไปขวา) [ครบ 2 รอบแล้ววนกลับไปเริ่มรอบ 1 ใหม่]`
                            : isRoundOne
                            ? `🌱 รอบที่ 1 (รอบสะสมที่ ${currentRoundNumber}): กรณี ID #1 สูงสุด ติดตัว ID #1 หรือโยนต่อให้รหัสเกิดใหม่ของ ID #1 ทันที`
                            : `🚀 รอบที่ 2 (รอบสะสมที่ ${currentRoundNumber}): กระจายช่วยชุมชนทั้งระบบ (BFS จากบนลงล่าง ซ้ายไปขวา) [ครบ 2 รอบแล้ววนกลับไปเริ่มรอบ 1 ใหม่]`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                        <span>เจ้าของ: {getWalletName(node.owner)}</span>
                        <span className="text-[10px] font-mono text-purple-300">({node.owner.slice(0, 6)}...{node.owner.slice(-4)})</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="text-slate-400">Direct Upline:</span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            isDirectUplineNot1
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
                              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80'
                          }`}
                        >
                          #{directUplineId} {isDirectUplineNot1 ? '(ไม่ใช่ ID #1)' : '(ID #1)'}
                        </span>
                        <span className="text-[10px] text-purple-300/90">
                          (เกิดสะสม: {node.rebirthCount} รอบ)
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded shrink-0">
                      รอเกิด {node.pendingRebirths} เม็ด
                    </span>
                  </div>

                  {/* Slot Prediction from Scanner */}
                  {suggestedSlot ? (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center space-x-1 text-slate-300">
                          <Search className="w-3 h-3 text-indigo-400" />
                          <span>ตำแหน่งว่างที่บอทสแกนพบ:</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          ต่อใต้รหัส #{suggestedSlot.parentId} ({suggestedSlot.isLeft ? 'ฝั่งซ้าย' : 'ฝั่งขวา'})
                        </span>
                      </div>
                      {suggestedSlot.reason && (
                        <div className="text-[10px] text-amber-300/95 font-medium bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                          ⚡ {suggestedSlot.reason}
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>เจ้าของอัพไลน์ใหม่: {getWalletName(suggestedSlot.parentOwner)}</span>
                        <span>ความลึก: ชั้น {suggestedSlot.depth}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-rose-400">ยังไม่พบตำแหน่งว่างในผัง</p>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleExecuteSingle(node.id)}
                    className="w-full py-2 px-3 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {t('btnExecuteRebirth')}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Directory of Executed Reborn Nodes - All Rebirth Rounds Table */}
      {(centralPoolTab === 'all' || centralPoolTab === 'pool1') && rebornNodes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  ตารางสรุปประวัติรอบเกิดใหม่ทั้งหมดในระบบ (All System Rebirth Rounds Directory)
                </h3>
                <p className="text-xs text-slate-400">
                  แสดงลำดับรอบเกิดใหม่ (Rebirth Rounds) ทั้งหมดในระบบ แยกตามรหัสหลัก และตำแหน่งการติดตั้ง
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-950/80 border border-purple-700/80 px-3 py-1 rounded-xl shadow-inner shrink-0">
              เกิดใหม่แล้วรวม {rebornNodes.length} รอบ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950/60">
                  <th className="p-2.5">รหัสเกิดใหม่ / Global ID</th>
                  <th className="p-2.5">รหัสหลัก (Origin)</th>
                  <th className="p-2.5">รอบที่เกิดใหม่</th>
                  <th className="p-2.5">ผัง Rank</th>
                  <th className="p-2.5">กฎรอบ / วงจร</th>
                  <th className="p-2.5">ตำแหน่งเข้าต่อ</th>
                  <th className="p-2.5">ผู้ถือครอง (Owner)</th>
                  <th className="p-2.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {(() => {
                  const ancestorCounts = new Map<number, number>();
                  const sortedReborns = [...rebornNodes].sort((a, b) => a.id - b.id);

                  return sortedReborns.map((rNode) => {
                    const originId = rNode.rebornFromNodeId || rNode.originalAncestorId || rNode.id;
                    const roundNum = (ancestorCounts.get(originId) || 0) + 1;
                    ancestorCounts.set(originId, roundNum);

                    const cycleNum = Math.floor((roundNum - 1) / 2) + 1;
                    const roundInCycle = ((roundNum - 1) % 2) + 1;

                    const parentNode = nodes.find((n) => n.id === rNode.parentId);
                    const isLeft = parentNode ? parentNode.leftChild === rNode.id : true;

                    return (
                      <tr
                        key={`rebirth-round-row-${rNode.id}`}
                        className="hover:bg-purple-950/30 transition-colors text-slate-200"
                      >
                        <td className="p-2.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1 font-bold">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span className="text-purple-300">#{rNode.id}</span>
                            <span className="text-indigo-200 text-[10px] font-normal">
                              ({rNode.queueNumber || rNode.id})
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="font-extrabold text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded text-xs">
                            #{originId}
                          </span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50 text-[10px] font-bold">
                            รอบที่ {roundNum}
                          </span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-amber-300 font-bold">
                          Rank {rNode.rank || 1}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-[10px] font-sans">
                          {originId === 1 ? (
                            <span className="text-emerald-300 font-semibold">กรณี ID #1: วนกลับต่อผังตนเอง</span>
                          ) : roundInCycle === 1 ? (
                            <span className="text-purple-300 font-semibold">
                              🌱 รอบ 1: วางติดตัวผู้แนะนำ (วัฏจักร {cycleNum})
                            </span>
                          ) : (
                            <span className="text-indigo-300 font-semibold">
                              🌐 รอบ 2: กระจายช่วยชุมชน (วัฏจักร {cycleNum})
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-[10px] text-slate-300">
                          ต่อใต้ #{rNode.parentId} ({isLeft ? 'ขาซ้าย' : 'ขาขวา'})
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-[10px] text-slate-400 font-sans">
                          {getWalletName(rNode.owner)}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (onFocusNode) {
                                onFocusNode(rNode.id);
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                          >
                            ดูในผัง
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-ID Rebirth Summary Table */}
      <div className="bg-slate-900/80 border border-purple-800/60 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
                <span>{t('idRebirthCountPerId')}</span>
                <span className="text-xs font-mono font-bold bg-purple-900/80 text-amber-300 border border-purple-700 px-2 py-0.5 rounded-full">
                  {allMainStats.length} ไอดีหลัก
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                นับยอดรวมรหัสเกิดใหม่ (Rebirth IDs) ที่แต่ละ ID สร้างขึ้น พร้อมแสดงรายการหมายเลขรหัสเกิดใหม่ในผังเมทริกซ์
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="ค้นหาตาม ID หรือ กระเป๋า..."
              value={idSearch}
              onChange={(e) => setIdSearch(e.target.value)}
              className="bg-slate-950 border border-purple-800/80 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono w-48 sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] bg-slate-950/40">
                <th className="py-2.5 px-3">ไอดีหลัก (Main ID)</th>
                <th className="py-2.5 px-3">ผู้ถือครอง (Owner)</th>
                <th className="py-2.5 px-3 text-center">ระดับ (Rank)</th>
                <th className="py-2.5 px-3 text-center">ยอดรหัสเกิดใหม่</th>
                <th className="py-2.5 px-3">รายการรหัสเกิดใหม่ (Rebirth IDs)</th>
                <th className="py-2.5 px-3 text-center">สถานะคิวรอเกิด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allMainStats
                .filter((s) => {
                  if (!idSearch.trim()) return true;
                  const q = idSearch.toLowerCase().trim();
                  return (
                    s.id.toString().includes(q) ||
                    getWalletName(s.owner).toLowerCase().includes(q) ||
                    s.spawnedIds.some((id) => id.toString().includes(q))
                  );
                })
                .map((stat, sIdx) => (
                  <tr key={`stat-row-${stat.id}-${sIdx}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono font-bold text-indigo-300 text-sm">#{stat.id}</span>
                        {stat.id === 1 && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            Root
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-medium">
                      <span className="truncate max-w-[140px] block" title={stat.owner}>
                        {getWalletName(stat.owner)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded text-[10px]">
                        Rank {stat.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-mono font-extrabold px-2.5 py-1 rounded-lg text-xs inline-flex items-center space-x-1 ${
                          stat.spawnedCount > 0
                            ? 'bg-purple-950/80 text-amber-300 border border-purple-600/70 shadow-sm'
                            : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{stat.spawnedCount} รหัส</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {stat.spawnedIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {stat.spawnedIds.map((sId, subIdx) => (
                            <span
                              key={`table-sub-${sId}-${subIdx}`}
                              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/60 flex items-center space-x-0.5"
                            >
                              <span>#{sId}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">- ยังไม่มีรหัสเกิดใหม่ -</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {stat.pendingRebirths > 0 ? (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/60 animate-pulse">
                          รอเกิด {stat.pendingRebirths} เม็ด
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">ครบถ้วน</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical FAQ on Security & Gas */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
        <h4 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>มาตรการความปลอดภัยและประหยัด Gas ระดับ Senior Web3</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200 block">1. ป้องกัน Reentrancy Attack</span>
            <p className="text-[11px] text-slate-400">
              ใช้ <code>nonReentrant</code> modifier พร้อมยึดหลัก Checks-Effects-Interactions (CEI) อย่างเคร่งครัด อัปเดตสถานะใน Contract ให้เสร็จสิ้นก่อนเรียก external transfer
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200 block">2. Custom Errors แทน Require</span>
            <p className="text-[11px] text-slate-400">
              ใช้ Solidity 0.8.20 Custom Errors เช่น <code>revert SlotAlreadyOccupied()</code> แทน String require() ช่วยลดขนาด Bytecode และประหยัดค่า Gas ทุก Transaction
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200 block">3. Batch Processing</span>
            <p className="text-[11px] text-slate-400">
              มีฟังก์ชัน <code>batchRegister</code> และ <code>batchExecuteRebirth</code> รองรับการทำรายการพร้อมกันหลายรายการใน 1 บล็อก ช่วยลด Base Gas overhead ได้อย่างมหาศาล
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
