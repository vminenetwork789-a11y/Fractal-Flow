import React, { useState, useMemo } from 'react';
import { MatrixNode, WalletAccount } from '../types';
import { MAX_RANK, RANKS, getRankInfo, REGISTRATION_FEE } from '../lib/matrixSimulator';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  RotateCcw,
  UserCheck,
  ArrowRightLeft,
  Coins,
  Cpu,
  Layers,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  Key,
  Flame,
  CheckCircle2,
  DollarSign,
  Crown,
  Search,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AdminPanelProps {
  nodes: MatrixNode[];
  wallets: WalletAccount[];
  currentWallet: WalletAccount;
  onSelectWallet: (address: string) => void;
  isPaused: boolean;
  onSetPause: (paused: boolean) => void;
  treasuryAddress: string;
  onSetTreasury: (address: string) => void;
  onForceSetRank: (nodeId: number, targetRank: number) => void;
  onAdjustVault: (nodeId: number, amount: number) => void;
  onTransferNodeOwner: (nodeId: number, newOwner: string) => void;
  onAirdrop: (walletAddress: string, amount: number) => void;
  onAddWallet: (address: string, name: string, balance: number) => void;
  onSweepRebirthPool: (recipientAddress: string) => void;
  onForceTriggerRebirth: (nodeId: number) => void;
  onBatchSimulate: (count: number) => void;
  onResetSimulation: () => void;
  onEmergencyWithdrawERC20?: (tokenAddress: string, toAddress: string, amount?: number) => { token: string; to: string; amount: number; txHash: string };
  rebirthPool: number;
  treasuryBalance: number;
  auditData: {
    totalNodes: number;
    paidRegistrationsCount: number;
    rebirthCount: number;
    totalRegistrationInflow: number;
    totalRebirthFunded: number;
    totalDirectBonuses: number;
    totalLevelBonuses: number;
    totalInUpgradeVaults: number;
    currentRebirthPool: number;
    treasuryBalance: number;
    totalOutflowAndLocked: number;
    discrepancy: number;
    isPerfect: boolean;
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  nodes,
  wallets,
  currentWallet,
  onSelectWallet,
  isPaused,
  onSetPause,
  treasuryAddress,
  onSetTreasury,
  onForceSetRank,
  onAdjustVault,
  onTransferNodeOwner,
  onAirdrop,
  onAddWallet,
  onSweepRebirthPool,
  onForceTriggerRebirth,
  onBatchSimulate,
  onResetSimulation,
  onEmergencyWithdrawERC20,
  rebirthPool,
  treasuryBalance,
  auditData,
}) => {
  const { t } = useLanguage();
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'control' | 'nodes' | 'wallets' | 'stress' | 'audit'>('control');
  const [selectedNodeId, setSelectedNodeId] = useState<number>(1);
  const [targetRank, setTargetRank] = useState<number>(2);
  const [vaultAdjustment, setVaultAdjustment] = useState<string>('10.0');
  const [transferTargetWallet, setTransferTargetWallet] = useState<string>(wallets[0]?.address || '');

  // Faucet state
  const [airdropWallet, setAirdropWallet] = useState<string>(currentWallet.address);
  const [airdropAmount, setAirdropAmount] = useState<number>(100);

  // New Wallet state
  const [newWalletName, setNewWalletName] = useState<string>('');
  const [newWalletAddress, setNewWalletAddress] = useState<string>('');
  const [newWalletBalance, setNewWalletBalance] = useState<number>(100);
  const [walletSearchQuery, setWalletSearchQuery] = useState<string>('');

  // Treasury update state
  const [newTreasuryInput, setNewTreasuryInput] = useState<string>(treasuryAddress);

  // Stress test state
  const [stressCount, setStressCount] = useState<number>(10);
  const [stressSuccessMsg, setStressSuccessMsg] = useState<string | null>(null);

  // Emergency Withdraw ERC20 state
  const [erc20TokenAddress, setErc20TokenAddress] = useState<string>('0x55d398326f99059fF775485246999027B3197955');
  const [erc20RecipientAddress, setErc20RecipientAddress] = useState<string>(treasuryAddress);
  const [erc20WithdrawAmount, setErc20WithdrawAmount] = useState<string>('');

  // Notification / Feedback banner
  const [actionFeedback, setActionFeedback] = useState<{ msg: string; isError?: boolean } | null>(null);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  const filteredWallets = useMemo(() => {
    if (!walletSearchQuery.trim()) return wallets;
    const q = walletSearchQuery.toLowerCase().trim();
    return wallets.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.address.toLowerCase().includes(q)
    );
  }, [wallets, walletSearchQuery]);

  const isOwnerCurrent = currentWallet.address.toLowerCase() === treasuryAddress.toLowerCase() ||
    currentWallet.address.toLowerCase() === '0x1111111111111111111111111111111111111111';

  const showFeedback = (msg: string, isError = false) => {
    setActionFeedback({ msg, isError });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleTogglePause = () => {
    try {
      onSetPause(!isPaused);
      showFeedback(!isPaused ? 'ระงับสัญญาฉุกเฉิน (Emergency Paused) เรียบร้อย' : 'ปลดการระงับสัญญา กลับสู่สถานะปกติเรียบร้อย');
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาด', true);
    }
  };

  const handleUpdateTreasury = () => {
    if (!newTreasuryInput.startsWith('0x') || newTreasuryInput.length < 10) {
      showFeedback('กรุณาระบุที่อยู่กระเป๋า Ethereum/EVM ที่ถูกต้อง', true);
      return;
    }
    try {
      onSetTreasury(newTreasuryInput);
      showFeedback(`อัปเดตกระเป๋า Treasury เป็น ${newTreasuryInput.slice(0, 10)}... เรียบร้อย`);
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาด', true);
    }
  };

  const handleEmergencyWithdrawERC20 = () => {
    try {
      if (!erc20TokenAddress.trim()) {
        showFeedback('กรุณาระบุที่อยู่สัญญา ERC-20 Token (Token Address is required)', true);
        return;
      }
      if (!erc20RecipientAddress.trim()) {
        showFeedback('กรุณาระบุที่อยู่กระเป๋าผู้รับเหรียญ (Recipient Address is required)', true);
        return;
      }
      const numAmount = erc20WithdrawAmount.trim() ? parseFloat(erc20WithdrawAmount) : undefined;
      if (numAmount !== undefined && (isNaN(numAmount) || numAmount < 0)) {
        showFeedback('จำนวนเงินต้องเป็นตัวเลขที่ถูกต้อง', true);
        return;
      }
      if (onEmergencyWithdrawERC20) {
        const res = onEmergencyWithdrawERC20(erc20TokenAddress, erc20RecipientAddress, numAmount);
        showFeedback(`🚨 เรียกใช้ emergencyWithdrawERC20 สำเร็จ! ถอนเหรียญ ${res.amount.toFixed(2)} tokens ไปยัง ${res.to.slice(0, 8)}... (Tx: ${res.txHash.slice(0, 16)}...)`);
        setErc20WithdrawAmount('');
      } else {
        showFeedback('ฟังก์ชัน emergencyWithdrawERC20 ยังไม่ได้เชื่อมต่อ', true);
      }
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาดในการถอนฉุกเฉิน', true);
    }
  };

  const handleApplyRankOverride = () => {
    try {
      onForceSetRank(selectedNodeId, targetRank);
      showFeedback(`ปรับ Rank ของรหัส #${selectedNodeId} เป็น Rank ${targetRank} (${getRankInfo(targetRank).name}) เรียบร้อย!`);
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาด', true);
    }
  };

  const handleApplyVaultAdjustment = () => {
    const val = parseFloat(vaultAdjustment);
    if (isNaN(val) || val < 0) {
      showFeedback('กรุณาระบุตัวเลขยอดเงินใน Vault ที่ถูกต้อง', true);
      return;
    }
    try {
      onAdjustVault(selectedNodeId, val);
      showFeedback(`ปรับยอด Upgrade Vault ของรหัส #${selectedNodeId} เป็น ${val.toFixed(2)} USDT เรียบร้อย!`);
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาด', true);
    }
  };

  const handleApplyOwnershipTransfer = () => {
    try {
      onTransferNodeOwner(selectedNodeId, transferTargetWallet);
      showFeedback(`โอนสิทธิ์รหัส #${selectedNodeId} ไปยังกระเป๋า ${transferTargetWallet.slice(0, 8)}... สำเร็จ`);
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาด', true);
    }
  };

  const handleApplyAirdrop = (amountToAdd?: number) => {
    const amt = amountToAdd ?? airdropAmount;
    try {
      onAirdrop(airdropWallet, amt);
      showFeedback(`Airdrop เติมเหรียญ +${amt} USDT ให้กระเป๋าเรียบร้อย`);
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาด', true);
    }
  };

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    let addr = newWalletAddress.trim();
    if (!addr) {
      addr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    const name = newWalletName.trim() || `User_${addr.slice(2, 6)}`;
    try {
      onAddWallet(addr, name, newWalletBalance);
      showFeedback(`สร้างกระเป๋าใหม่ ${name} (${addr.slice(0, 8)}...) พร้อมยอด ${newWalletBalance} USDT สำเร็จ`);
      setNewWalletName('');
      setNewWalletAddress('');
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาด', true);
    }
  };

  const handleRunStress = () => {
    try {
      onBatchSimulate(stressCount);
      setStressSuccessMsg(`จำลองการลงทะเบียน ${stressCount} รหัสแบบ Auto-Spillover สำเร็จ!`);
      showFeedback(`รันการทดสอบ ${stressCount} รหัสสำเร็จ`);
    } catch (err: any) {
      showFeedback(err.message || 'เกิดข้อผิดพลาด', true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Admin Authorization Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('adminTitle')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {t('adminRootDeployer')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {t('adminSubtitle')}
              </p>
            </div>
          </div>

          {/* Quick Status Pill & Switch to Admin button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
                isPaused
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-rose-400' : 'bg-emerald-400 animate-ping'}`} />
              <span>{isPaused ? t('adminStatusPausedLabel') : t('adminStatusActiveLabel')}</span>
            </div>

            {!isOwnerCurrent && (
              <button
                id="switch-to-admin-wallet-btn"
                onClick={() => onSelectWallet('0x1111111111111111111111111111111111111111')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{t('adminSwitchRootBtn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
              actionFeedback.isError
                ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
            }`}
          >
            <span>{actionFeedback.msg}</span>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white font-bold ml-2">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-md">
        <button
          id="admin-subtab-control"
          onClick={() => setActiveAdminSubTab('control')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'control'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t('adminSubtabControl')}</span>
        </button>

        <button
          id="admin-subtab-nodes"
          onClick={() => setActiveAdminSubTab('nodes')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'nodes'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span>{t('adminSubtabNodes')}</span>
        </button>

        <button
          id="admin-subtab-wallets"
          onClick={() => setActiveAdminSubTab('wallets')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'wallets'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-300" />
          <span>{t('adminSubtabWallets')}</span>
        </button>

        <button
          id="admin-subtab-stress"
          onClick={() => setActiveAdminSubTab('stress')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'stress'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          <span>{t('adminSubtabStress')}</span>
        </button>

        <button
          id="admin-subtab-audit"
          onClick={() => setActiveAdminSubTab('audit')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{t('adminSubtabAudit')}</span>
        </button>
      </div>

      {/* SUB-VIEW 1: CONTRACT & EMERGENCY CONTROL */}
      {activeAdminSubTab === 'control' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Emergency Pause Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
              <div className={`p-2 rounded-xl ${isPaused ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isPaused ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Emergency Circuit Breaker</h3>
                <p className="text-[11px] text-slate-400">ระงับการทำงานของระบบชั่วคราว (Pausable)</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              เมื่อเปิดใช้งานโหมดนี้ สมาชิกจะไม่สามารถลงทะเบียนรหัสใหม่หรืออัปเกรด Rank ได้ เหมาะสำหรับใช้ในกรณีตรวจสอบความปลอดภัยหรือปิดปรับปรุงระบบ
            </p>

            <div className="pt-2">
              <button
                id="emergency-pause-toggle-btn"
                onClick={handleTogglePause}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    <span>ปลดการระงับ (Unpause Contract)</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>เปิดระงับฉุกเฉิน (Emergency Pause)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Treasury Management Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">กระเป๋าคลัง Treasury</h3>
                <p className="text-[11px] text-slate-400">กระเป๋ารับเศษโบนัส 15 ชั้น และรหัส #1</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-medium">ที่อยู่กระเป๋า Treasury ปัจจุบัน:</label>
              <div className="font-mono text-xs bg-slate-950 p-2 rounded-xl border border-slate-800 text-amber-300 break-all">
                {treasuryAddress}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[11px] text-slate-400 font-medium">เปลี่ยนกระเป๋า Treasury ใหม่:</label>
              <input
                type="text"
                value={newTreasuryInput}
                onChange={(e) => setNewTreasuryInput(e.target.value)}
                placeholder="0x..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                id="update-treasury-btn"
                onClick={handleUpdateTreasury}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                บันทึกกระเป๋า Treasury ใหม่
              </button>
            </div>
          </div>

          {/* Sweep & Emergency Funds */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">กองกลาง & กวาดเงิน Rebirth</h3>
                <p className="text-[11px] text-slate-400">ยอดเงินในกองกลาง: {rebirthPool.toFixed(1)} USDT</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ในกรณีที่ต้องการเคลียร์กองกลางหรือโยกย้ายเงินฉุกเฉิน แอดมินสามารถสั่งกวาดเงินทั้งหมดใน Rebirth Pool เข้ากระเป๋า Treasury ได้ทันที
            </p>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Rebirth Pool ปัจจุบัน:</span>
                <span className="font-mono font-bold text-purple-400">{rebirthPool.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ยอดเงินคลัง Treasury:</span>
                <span className="font-mono font-bold text-amber-400">{treasuryBalance.toFixed(2)} USDT</span>
              </div>
            </div>

            <button
              id="sweep-rebirth-pool-btn"
              disabled={rebirthPool <= 0}
              onClick={() => {
                try {
                  onSweepRebirthPool(treasuryAddress);
                  showFeedback(`กวาดเงิน ${rebirthPool.toFixed(2)} USDT เข้า Treasury เรียบร้อย`);
                } catch (err: any) {
                  showFeedback(err.message, true);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-bold transition-colors"
            >
              กวาด Rebirth Pool เข้า Treasury
            </button>
          </div>

          {/* Emergency Withdraw ERC20 Recovery Card */}
          <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-500/20">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {t('emergencyWithdrawTitle')}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      onlyOwner
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      nonReentrant
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('emergencyWithdrawDesc')}
                  </p>
                </div>
              </div>
              <div className="text-right bg-slate-950/80 px-4 py-2.5 rounded-xl border border-rose-500/20 flex flex-col items-end">
                <span className="text-[10px] text-slate-400">Available In Contract Pool:</span>
                <span className="font-mono text-sm font-bold text-rose-300">
                  {rebirthPool.toFixed(2)} USDT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Token Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{t('tokenAddressLabel')}</span>
                  <span className="text-[10px] text-rose-400 font-mono">BEP-20 / ERC-20</span>
                </label>
                <input
                  type="text"
                  value={erc20TokenAddress}
                  onChange={(e) => setErc20TokenAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[10px] text-slate-500">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setErc20TokenAddress('0x55d398326f99059fF775485246999027B3197955')}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono"
                  >
                    USDT
                  </button>
                  <button
                    type="button"
                    onClick={() => setErc20TokenAddress('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d')}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono"
                  >
                    USDC
                  </button>
                  <button
                    type="button"
                    onClick={() => setErc20TokenAddress('0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3')}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                  >
                    DAI
                  </button>
                </div>
              </div>

              {/* Recipient Address */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{t('recipientAddressLabel')}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Destination</span>
                </label>
                <input
                  type="text"
                  value={erc20RecipientAddress}
                  onChange={(e) => setErc20RecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[10px] text-slate-500">Fast Set:</span>
                  <button
                    type="button"
                    onClick={() => setErc20RecipientAddress(treasuryAddress)}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono"
                  >
                    Treasury
                  </button>
                  <button
                    type="button"
                    onClick={() => setErc20RecipientAddress(currentWallet.address)}
                    className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono"
                  >
                    Current
                  </button>
                </div>
              </div>

              {/* Amount & Execute */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{t('withdrawAmountLabel')}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Tokens</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={erc20WithdrawAmount}
                    onChange={(e) => setErc20WithdrawAmount(e.target.value)}
                    placeholder={`All Available (${rebirthPool.toFixed(1)})`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-14 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setErc20WithdrawAmount(rebirthPool > 0 ? rebirthPool.toString() : '0')}
                    className="absolute right-1.5 top-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 border border-rose-500/40 transition-colors"
                  >
                    MAX
                  </button>
                </div>
                <div className="pt-1">
                  <button
                    id="emergency-withdraw-erc20-btn"
                    onClick={handleEmergencyWithdrawERC20}
                    disabled={rebirthPool <= 0 && (!erc20WithdrawAmount || parseFloat(erc20WithdrawAmount) <= 0)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{t('emergencyWithdrawBtn')}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Solidity Implementation: </span>
                <code className="text-amber-300 font-mono text-[10px]">
                  function emergencyWithdrawERC20(address token, address to, uint256 amount) external onlyOwner nonReentrant
                </code>
                <span className="block text-slate-400 text-[10px] mt-0.5">
                  ฟังก์ชันนี้ถูกออกแบบมาเพื่อป้องกันเงินจมในสัญญา (Rescue Trapped Tokens) โดยส่งผ่าน low-level <code className="text-slate-300 font-mono">_safeTransfer</code> เพื่อความปลอดภัยสูงสุดต่อมาตรฐาน ERC-20 ทุกประเภท
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: NODE & RANK ADMINISTRATION */}
      {activeAdminSubTab === 'nodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Node Selector & Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Search className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">เลือกรหัสสมาชิกที่จะจัดการ</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">รหัสสมาชิก (Node ID):</label>
              <select
                id="admin-node-selector"
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              >
                {nodes.map((n, idx) => (
                  <option key={`admin-node-${n.id}-${idx}`} value={n.id}>
                    รหัส #{n.id} (Rank {n.rank} | {n.owner.slice(0, 8)}... | Vault: {n.upgradeVault.toFixed(1)} U)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Node Details Card */}
            {selectedNode && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">หมายเลขรหัส:</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm">#{selectedNode.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ระดับ Rank ปัจจุบัน:</span>
                  <span className="font-bold text-amber-300">
                    {getRankInfo(selectedNode.rank).badge} Rank {selectedNode.rank} ({getRankInfo(selectedNode.rank).price} U)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Upgrade Vault:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedNode.upgradeVault.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">กระเป๋าเจ้าของ:</span>
                  <span className="font-mono text-slate-300 truncate max-w-[140px]" title={selectedNode.owner}>
                    {selectedNode.owner.slice(0, 8)}...{selectedNode.owner.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">คิวรอเกิดใหม่ (อ้างอิงกระเป๋า):</span>
                  <span className="font-mono font-bold text-purple-300">
                    {selectedNode.pendingRebirths} เม็ด (กระเป๋าเกิดสะสม {selectedNode.rebirthCount} รอบ)
                  </span>
                </div>
                {selectedNode.createdVia && (
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-2">
                    <span className="text-slate-400">แหล่งกำเนิดไอดี:</span>
                    <span className="font-semibold text-indigo-300">{selectedNode.createdVia}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Trigger Rebirth for this node */}
            <div className="pt-2 border-t border-slate-800">
              <button
                id="admin-force-rebirth-btn"
                onClick={() => {
                  try {
                    onForceTriggerRebirth(selectedNodeId);
                    showFeedback(`เพิ่มคิวเกิดใหม่ให้รหัส #${selectedNodeId} เรียบร้อย (+5 USDT เข้ากองกลาง)`);
                  } catch (err: any) {
                    showFeedback(err.message, true);
                  }
                }}
                className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>บังคับให้รหัส #${selectedNodeId} เกิดใหม่ (Force Rebirth)</span>
              </button>
            </div>
          </div>

          {/* Admin Override Rank (Rank 1 - 45) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Crown className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">ปรับ Rank โดยตรง (Rank 1 - {MAX_RANK})</h3>
                <p className="text-[11px] text-slate-400">แอดมินสามารถอัปหรือลดระดับ Rank ได้ทันที</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">เลือกระดับ Rank เป้าหมาย:</label>
              <select
                id="target-rank-selector"
                value={targetRank}
                onChange={(e) => setTargetRank(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500 max-h-48"
              >
                {RANKS.map((r) => (
                  <option key={r.rank} value={r.rank}>
                    {r.badge} Rank {r.rank}: {r.name} ({r.price.toLocaleString()} USDT) - {r.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview of target rank */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="text-slate-400 font-medium">ข้อมูล Rank ที่เลือก:</div>
              <div className="font-bold text-amber-300 text-sm">
                {getRankInfo(targetRank).badge} {getRankInfo(targetRank).name} ({getRankInfo(targetRank).title})
              </div>
              <div className="text-[11px] text-slate-400">
                ราคา: {getRankInfo(targetRank).price} USDT | Direct: {getRankInfo(targetRank).directBonus} U | Vault: {getRankInfo(targetRank).upgradeShare} U
              </div>
            </div>

            <button
              id="apply-force-rank-btn"
              onClick={handleApplyRankOverride}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>ยืนยันการตั้งค่า Rank #{selectedNodeId} -&gt; Rank {targetRank}</span>
            </button>
          </div>

          {/* Adjust Vault & Transfer Ownership */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">ปรับยอด Vault & โอนสิทธิ์รหัส</h3>
                <p className="text-[11px] text-slate-400">ปรับยอดเงินสะสม หรือเปลี่ยนเจ้าของรหัส</p>
              </div>
            </div>

            {/* Adjust Upgrade Vault */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">กำหนดยอด Upgrade Vault ใหม่ (USDT):</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={vaultAdjustment}
                  onChange={(e) => setVaultAdjustment(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                <button
                  id="apply-vault-adjust-btn"
                  onClick={handleApplyVaultAdjustment}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  ปรับยอด
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                ถ้ายอดที่กำหนดถึงราคา Rank ถัดไป ระบบจะ Auto-Upgrade ให้อัตโนมัติทันที
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">โอนสิทธิ์รหัสนี้ให้กระเป๋าอื่น:</label>
              <select
                id="transfer-target-wallet-selector"
                value={transferTargetWallet}
                onChange={(e) => setTransferTargetWallet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <optgroup label="👑 บัญชีหลัก (Core Wallets)">
                  {wallets.slice(0, 4).map((w) => (
                    <option key={w.address} value={w.address}>
                      {w.name} ({w.address.slice(0, 8)}...)
                    </option>
                  ))}
                </optgroup>
                {wallets.length > 4 && (
                  <optgroup label={`👥 กระเป๋าจำลอง #001 - #100 (${wallets.length - 4} บัญชี)`}>
                    {wallets.slice(4).map((w) => (
                      <option key={w.address} value={w.address}>
                        {w.name} ({w.address.slice(0, 8)}...)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                id="apply-transfer-owner-btn"
                onClick={handleApplyOwnershipTransfer}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors mt-1"
              >
                โอนสิทธิ์ความเป็นเจ้าของ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: WALLETS & FAUCET AIRDROP */}
      {activeAdminSubTab === 'wallets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Airdrop Faucet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Coins className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Airdrop Faucet (เติมเหรียญจำลอง)</h3>
                <p className="text-[11px] text-slate-400">เติมเหรียญ USDT ให้กระเป๋าเพื่อทดสอบระบบ</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">เลือกกระเป๋าเป้าหมาย:</label>
              <select
                id="airdrop-wallet-selector"
                value={airdropWallet}
                onChange={(e) => setAirdropWallet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <optgroup label="👑 บัญชีหลัก (Core Wallets)">
                  {wallets.slice(0, 4).map((w) => (
                    <option key={w.address} value={w.address}>
                      {w.name} (คงเหลือ: {w.balance.toFixed(0)} USDT)
                    </option>
                  ))}
                </optgroup>
                {wallets.length > 4 && (
                  <optgroup label={`👥 กระเป๋าจำลอง #001 - #100 (${wallets.length - 4} บัญชี)`}>
                    {wallets.slice(4).map((w) => (
                      <option key={w.address} value={w.address}>
                        {w.name} (คงเหลือ: {w.balance.toFixed(0)} USDT)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">จำนวนเงินที่ต้องการเติม (USDT):</label>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleApplyAirdrop(amt)}
                    className="py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-mono font-bold text-emerald-300 transition-colors border border-slate-700"
                  >
                    +{amt} U
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] text-slate-400 font-medium">หรือระบุจำนวนเอง:</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="1"
                  value={airdropAmount}
                  onChange={(e) => setAirdropAmount(Number(e.target.value))}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  id="custom-airdrop-btn"
                  onClick={() => handleApplyAirdrop()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  เติมเหรียญ
                </button>
              </div>
            </div>
          </div>

          {/* Add New Test Wallet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">สร้างกระเป๋าผู้ใช้ใหม่</h3>
                <p className="text-[11px] text-slate-400">เพิ่มบัญชีจำลองเข้าระบบเพื่อทดสอบผัง</p>
              </div>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">ชื่อกระเป๋า (Display Name):</label>
                <input
                  type="text"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="เช่น Dave (Leader 2)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">ที่อยู่กระเป๋า (ปล่อยว่างเพื่อสุ่ม):</label>
                <input
                  type="text"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  placeholder="0x... (ไม่กรอกระบบจะสุ่มให้อัตโนมัติ)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-medium">ยอดเงินเริ่มต้น (USDT):</label>
                <input
                  type="number"
                  min="0"
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                id="create-test-wallet-btn"
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                สร้างกระเป๋าใหม่
              </button>
            </form>
          </div>

          {/* Wallets Overview List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>รายชื่อกระเป๋าในระบบ ({wallets.length})</span>
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={walletSearchQuery}
                  onChange={(e) => setWalletSearchQuery(e.target.value)}
                  placeholder="ค้นหากระเป๋า (เช่น #025, 0x5555...)"
                  className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-52"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredWallets.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  ไม่พบกระเป๋าที่ตรงกับคำค้นหา "{walletSearchQuery}"
                </div>
              ) : (
                filteredWallets.map((w) => (
                  <div
                    key={w.address}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                      w.address.toLowerCase() === currentWallet.address.toLowerCase()
                        ? 'bg-indigo-950/60 border-indigo-600/60'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-200 truncate">{w.name}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">{w.address}</div>
                      <div className="text-[10px] text-indigo-300 mt-0.5">
                        ถือ {w.nodeIds.length} รหัส • รายได้รวม {w.totalEarned.toFixed(1)} U
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-400 text-xs block">
                        {w.balance.toFixed(1)} U
                      </span>
                      {w.address.toLowerCase() !== currentWallet.address.toLowerCase() && (
                        <button
                          onClick={() => onSelectWallet(w.address)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-200 font-semibold underline mt-1"
                        >
                          สลับใช้งาน
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: STRESS TEST & BATCH SIMULATOR */}
      {activeAdminSubTab === 'stress' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ทดสอบความจุและการแตกสายงานชุดใหญ่ (Stress Test Engine)</h3>
              <p className="text-xs text-slate-400">
                ระบบจะสร้างรหัสสมาชิกและต่อสายงาน 1 แตก 2 (Auto-Spillover BFS) อัตโนมัติ พร้อมกระจายโบนัส 15 ชั้นและคิวเกิดใหม่
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-xs text-slate-300 font-semibold block">
                เลือกจำนวนรหัสที่ต้องการสร้างอัตโนมัติ:
              </label>

              <div className="grid grid-cols-5 gap-2">
                {[5, 10, 25, 50, 100].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setStressCount(count)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      stressCount === count
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md scale-105'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    +{count} รหัส
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] text-slate-400">หรือกำหนดจำนวนเอง:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={stressCount}
                  onChange={(e) => setStressCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
                <div className="font-semibold text-slate-200">การคำนวณเงินที่จะถูกส่งเข้าระบบ:</div>
                <div className="flex justify-between text-[11px]">
                  <span>เงินหมุนเวียนที่จะเพิ่มขึ้น:</span>
                  <span className="font-mono font-bold text-emerald-400">{stressCount * 5} USDT</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>โบนัสผู้แนะนำ (30%):</span>
                  <span className="font-mono text-indigo-300">{(stressCount * 1.5).toFixed(1)} USDT</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>โบนัสสายงาน 15 ชั้น (30%):</span>
                  <span className="font-mono text-indigo-300">{(stressCount * 1.5).toFixed(1)} USDT</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Upgrade Vault (40%):</span>
                  <span className="font-mono text-amber-300">{(stressCount * 2.0).toFixed(1)} USDT</span>
                </div>
              </div>

              <button
                id="run-stress-test-btn"
                onClick={handleRunStress}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg transition-all active:scale-98 flex items-center justify-center space-x-2"
              >
                <Flame className="w-4 h-4" />
                <span>รันการจำลอง {stressCount} รหัสทันที</span>
              </button>
            </div>

            {/* Simulation Results and Factory Reset */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200">สถิติหลังรันระบบปัจจุบัน:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">จำนวนรหัสรวม</span>
                    <span className="font-mono font-bold text-white text-base">{nodes.length} รหัส</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">เงินหมุนเวียนรวม</span>
                    <span className="font-mono font-bold text-emerald-400 text-base">
                      {((nodes.length - 1) * 5).toFixed(0)} USDT
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">คิวรอเกิดใหม่</span>
                    <span className="font-mono font-bold text-purple-400 text-base">
                      {nodes.reduce((acc, n) => acc + n.pendingRebirths, 0)} คิว
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">กองกลาง Rebirth</span>
                    <span className="font-mono font-bold text-amber-400 text-base">{rebirthPool.toFixed(1)} U</span>
                  </div>
                </div>

                {stressSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{stressSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Reset simulator state */}
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 space-y-2">
                <div className="flex items-center space-x-2 text-rose-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold">ล้างระบบจำลองทั้งหมด (Reset Simulation)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  รีเซ็ตกลับสู่สถานะเริ่มต้น (มีเพียงรหัส Genesis #1 และ 4 กระเป๋าหลัก)
                </p>
                <button
                  id="admin-factory-reset-btn"
                  onClick={() => {
                    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตระบบจำลองทั้งหมด? ข้อมูลการสร้างรหัสจะกลับสู่จุดเริ่มต้น')) {
                      onResetSimulation();
                      showFeedback('รีเซ็ตระบบจำลองกลับสู่ค่าเริ่มต้นเรียบร้อย');
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-rose-900/50 hover:bg-rose-800/80 text-rose-200 text-xs font-semibold border border-rose-700/60 transition-colors"
                >
                  ล้างข้อมูลและเริ่มต้นใหม่
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: FINANCIAL AUDIT & RECONCILIATION */}
      {activeAdminSubTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  การตรวจสอบความถูกต้องทางบัญชี 100% (Real-Time Financial Audit)
                </h3>
                <p className="text-xs text-slate-400">
                  ตรวจสอบความสมบูรณ์ของสมการ: เงินเข้าทั้งหมด = เงินโบนัสที่จ่าย + เงินสะสมใน Vaults + กองกลาง Rebirth + คลัง Treasury
                </p>
              </div>
            </div>

            <div
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-2 shrink-0 ${
                auditData.isPerfect
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{auditData.isPerfect ? '100% สมดุลสมบูรณ์แบบ (Zero Slippage)' : 'พบผลต่างทางบัญชี'}</span>
            </div>
          </div>

          {/* Audit Metrics Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">เงินเข้าทั้งหมดจากการสมัคร (Inflow)</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {auditData.totalRegistrationInflow.toFixed(2)} USDT
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                {auditData.paidRegistrationsCount} รหัสที่ชำระเงิน × 5.0 USDT
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">โบนัสที่จ่ายออกจริง (Direct + Level)</span>
              <span className="text-lg font-mono font-bold text-indigo-400">
                {(auditData.totalDirectBonuses + auditData.totalLevelBonuses).toFixed(2)} USDT
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Direct: {auditData.totalDirectBonuses.toFixed(1)} U | 15 ชั้น: {auditData.totalLevelBonuses.toFixed(1)} U
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">เงินสะสมคงเหลือ (Vaults + Pools)</span>
              <span className="text-lg font-mono font-bold text-amber-400">
                {(auditData.totalInUpgradeVaults + auditData.currentRebirthPool).toFixed(2)} USDT
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Vaults: {auditData.totalInUpgradeVaults.toFixed(1)} U | Rebirth: {auditData.currentRebirthPool.toFixed(1)} U
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">ผลต่างการกระทบยอด (Discrepancy)</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {auditData.discrepancy.toFixed(4)} USDT
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                {auditData.isPerfect ? 'ยอดตรงกัน 100% ไม่มีการรั่วไหล' : 'เกิดส่วนต่าง'}
              </p>
            </div>
          </div>

          {/* Mathematical Equation Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2 text-slate-300">
            <div className="text-slate-400 font-sans font-semibold text-[11px]">
              สมการตรวจสอบความถูกต้อง (Mathematical Verification Equation):
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-indigo-300 leading-relaxed overflow-x-auto">
              <code>
                Total Inflow ({auditData.totalRegistrationInflow.toFixed(2)} USDT) == Direct ({auditData.totalDirectBonuses.toFixed(2)}) + Levels ({auditData.totalLevelBonuses.toFixed(2)}) + Vaults ({auditData.totalInUpgradeVaults.toFixed(2)}) + RebirthPool ({auditData.currentRebirthPool.toFixed(2)}) + Treasury ({auditData.treasuryBalance.toFixed(2)})
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
