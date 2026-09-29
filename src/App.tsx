import React, { useState, useEffect, useMemo } from 'react';
import { MatrixSimulator } from './lib/matrixSimulator';
import { MatrixNode, WalletAccount, SlotTarget, RegistrationPaymentSource, AppNotification, NotificationType, ActivityLog } from './types';
import { Navbar } from './components/Navbar';
import { TreeVisualizer } from './components/TreeVisualizer';
import { RegistrationCard } from './components/RegistrationCard';
import { RebirthManager } from './components/RebirthManager';
import { MathExplainer } from './components/MathExplainer';
import { SolidityCodeViewer } from './components/SolidityCodeViewer';
import { ActivityLogs } from './components/ActivityLogs';
import { AdminPanel } from './components/AdminPanel';
import { IdSwitcher } from './components/IdSwitcher';
import { CentralPoolsDashboard } from './components/CentralPoolsDashboard';
import { useLanguage } from './i18n/LanguageContext';
import { ethers } from 'ethers';
import {
  Layers,
  Sparkles,
  Coins,
  Shield,
  Zap,
  TrendingUp,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Crown,
  ShieldAlert,
  Users,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const { t } = useLanguage();

  // Initialize Simulator Engine
  const simulator = useMemo(() => new MatrixSimulator(), []);
  const [nodes, setNodes] = useState<MatrixNode[]>([]);
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>('0x2222222222222222222222222222222222222222');
  const [selectedNodeId, setSelectedNodeId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'app' | 'contract' | 'math' | 'keeper' | 'admin'>('app');
  const [quickTarget, setQuickTarget] = useState<{ parentId: number; isLeft: boolean } | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [treasuryAddress, setTreasuryAddress] = useState<string>('0x1111111111111111111111111111111111111111');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Auto Delay & Countdown State
  const [autoCountdown, setAutoCountdown] = useState<number>(0);
  const [autoTaskType, setAutoTaskType] = useState<string | null>(null);
  const [autoCurrentRound, setAutoCurrentRound] = useState<number>(0);
  const [autoTotalRounds, setAutoTotalRounds] = useState<number>(0);
  const [autoDelaySec, setAutoDelaySec] = useState<number>(simulator.autoExecutionDelaySec);

  // Real Web3 / MetaMask Connection State via Ethers.js
  const [isWeb3Connected, setIsWeb3Connected] = useState<boolean>(false);
  const [web3Address, setWeb3Address] = useState<string | null>(null);
  const [web3StatusMsg, setWeb3StatusMsg] = useState<string | null>(null);

  const isInIframe = useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  // Sync state from simulator
  const refreshSimulatorState = () => {
    setNodes(simulator.getAllNodes());
    setWallets(simulator.getWallets());
    setIsPaused(simulator.isPaused);
    setTreasuryAddress(simulator.treasuryAddress);
    setNotifications([...simulator.getNotifications()]);
    setLogs([...simulator.logs]);
  };

  useEffect(() => {
    simulator.topUpAllWallets(100000000000000);
    // Auto fix if node 8 is under node 3 and node 7 left child is free
    const n8 = simulator.nodes.get(8);
    const n7 = simulator.nodes.get(7);
    if (n8 && n8.parentId === 3 && n7 && n7.leftChild === 0) {
      try {
        simulator.relocateNode(8, 7, true);
      } catch (e) {
        console.warn('Auto relocate #8 -> #7:', e);
      }
    }
    refreshSimulatorState();
    const unsubscribe = simulator.onNotification(() => {
      setNotifications([...simulator.getNotifications()]);
    });
    const unsubState = simulator.addStateChangeListener(() => {
      refreshSimulatorState();
      setAutoDelaySec(simulator.autoExecutionDelaySec);
    });
    const unsubCountdown = simulator.addCountdownListener((count, taskType, currentRound, totalRounds) => {
      setAutoCountdown(count);
      setAutoTaskType(taskType);
      setAutoCurrentRound(currentRound || 0);
      setAutoTotalRounds(totalRounds || 0);
    });
    return () => {
      unsubscribe();
      unsubState();
      unsubCountdown();
    };
  }, [simulator]);


  const currentWallet = useMemo(() => {
    return (
      wallets.find((w) => w.address.toLowerCase() === selectedWalletAddress.toLowerCase()) ||
      wallets[1] || {
        address: selectedWalletAddress,
        name: 'User Wallet',
        nodeIds: [],
        balance: 100,
        totalEarned: 0,
      }
    );
  }, [wallets, selectedWalletAddress]);

  // เมื่อสลับกระเป๋า ให้เชื่อมโยงไปยังไอดีหลักของกระเป๋านั้น (หากไอดีปัจจุบันไม่ได้เป็นของกระเป๋านั้น)
  const handleSelectWallet = (address: string) => {
    setSelectedWalletAddress(address);
    setSelectedNodeId((prevId) => {
      const current = nodes.find((n) => n.id === prevId);
      if (current && current.owner.toLowerCase() === address.toLowerCase()) {
        if (current.isRebirth) {
          const main = nodes.find((n) => n.owner.toLowerCase() === address.toLowerCase() && !n.isRebirth);
          return main ? main.id : prevId;
        }
        return prevId;
      }
      const walletMainNode = nodes.find(
        (n) => n.owner.toLowerCase() === address.toLowerCase() && !n.isRebirth
      );
      return walletMainNode ? walletMainNode.id : prevId;
    });
  };

  // Handle Web3 Connect using Ethers.js
  const handleConnectWeb3 = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          const addr = accounts[0];
          setWeb3Address(addr);
          setIsWeb3Connected(true);

          // If this wallet is not in simulator, register it
          let existing = simulator.getWallet(addr);
          if (!existing) {
            const newW: WalletAccount = {
              address: addr.toLowerCase(),
              name: `MetaMask (${addr.slice(0, 6)})`,
              nodeIds: [],
              balance: 100,
              totalEarned: 0,
            };
            simulator.wallets.set(addr.toLowerCase(), newW);
            refreshSimulatorState();
          }
          handleSelectWallet(addr);
          setWeb3StatusMsg(`เชื่อมต่อ MetaMask (${addr.slice(0, 6)}...${addr.slice(-4)}) ผ่าน Ethers.js สำเร็จ!`);
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err || '');
        if (
          errMsg.includes('Blocked a frame') ||
          errMsg.includes('origin') ||
          errMsg.includes('cross-origin') ||
          errMsg.includes('Location')
        ) {
          setWeb3StatusMsg(
            'เบราว์เซอร์จำกัดการเข้าถึง MetaMask ใน iFrame Sandbox — สามารถกดปุ่ม "เปิดในแท็บใหม่" เพื่อเชื่อมต่อ MetaMask โดยตรง หรือใช้งานระบบจำลอง EVM ในหน้านี้ได้ทันที'
          );
        } else {
          setWeb3StatusMsg(`การเชื่อมต่อ MetaMask: ${errMsg}`);
        }
      }
    } else {
      setWeb3StatusMsg(
        'ไม่พบ MetaMask บนเบราว์เซอร์ กำลังจำลองสภาพแวดล้อม Web3 EVM ใน Sandbox อย่างสมบูรณ์'
      );
    }
  };

  const handleDisconnectWeb3 = () => {
    setIsWeb3Connected(false);
    setWeb3Address(null);
    setWeb3StatusMsg(null);
  };

  // Actions
  const handleRegister = (
    parentId: number,
    isLeft: boolean,
    sponsorId?: number,
    paymentSource?: RegistrationPaymentSource,
    rank: number = 1
  ) => {
    simulator.register(
      currentWallet.address,
      parentId,
      isLeft,
      false,
      0,
      sponsorId,
      rank,
      undefined,
      paymentSource
    );
    refreshSimulatorState();
  };

  const handleBatchRegister = (
    count: number,
    paymentSource?: RegistrationPaymentSource,
    sponsorId: number = 1,
    rank: number = 1
  ) => {
    simulator.batchRegister(currentWallet.address, count, sponsorId, paymentSource, rank);
    refreshSimulatorState();
  };

  const handleQuickRegisterUnder = (parentId: number, isLeft: boolean) => {
    setQuickTarget({ parentId, isLeft });
    setSelectedNodeId(parentId);
    // Smooth scroll to register form
    const el = document.getElementById('registration-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExecuteRebirth = (nodeId: number, targetParentId?: number, isLeft?: boolean, rank?: number) => {
    simulator.executeRebirth(nodeId, targetParentId, isLeft, rank);
    refreshSimulatorState();
  };

  const handleBatchExecuteRebirths = () => {
    simulator.batchExecuteAllRebirths();
    refreshSimulatorState();
  };

  const handleUpgradeRank = (nodeId: number) => {
    simulator.upgradeNodeRank(nodeId);
    refreshSimulatorState();
  };

  const handlePurchaseRank = (targetRank: number, nodeId?: number) => {
    const targetNode = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;
    const walletAddress = targetNode ? targetNode.owner : currentWallet.address;
    const res = simulator.purchaseRank(targetRank, nodeId, walletAddress);
    refreshSimulatorState();
    return res;
  };

  const handlePurchaseNextRank = (nodeId?: number) => {
    const targetNode = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;
    const walletAddress = targetNode ? targetNode.owner : currentWallet.address;
    const res = simulator.purchaseNextRank(nodeId, walletAddress);
    refreshSimulatorState();
    return res;
  };

  const handlePurchaseNextRanksBatch = (maxSteps?: number, nodeId?: number) => {
    const targetNode = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;
    const walletAddress = targetNode ? targetNode.owner : currentWallet.address;
    const res = simulator.purchaseNextRanksBatch(maxSteps, nodeId, walletAddress);
    refreshSimulatorState();
    return res;
  };

  const handleTopupWallet = (address: string, amount: number) => {
    simulator.fundWallet(address, amount);
    refreshSimulatorState();
  };

  const handleUpgradeRankWithTopup = (nodeId: number) => {
    simulator.upgradeNodeRankWithTopup(nodeId, currentWallet.address);
    refreshSimulatorState();
  };

  const handleBatchUpgradeRanks = (nodeIds: number[]) => {
    simulator.batchUpgradeRanks(nodeIds);
    refreshSimulatorState();
  };

  const handleSimulateRankMatrix = (rank: number) => {
    simulator.simulateRankQueueRun(rank);
    refreshSimulatorState();
  };

  const handleAddMemberToRankMatrix = (rank: number) => {
    simulator.addMemberToRankQueue(rank, currentWallet.address);
    refreshSimulatorState();
  };

  const handleExecuteRankRebirth = (rank: number, nodeId: number) => {
    simulator.executeRankRebirth(rank, nodeId);
    refreshSimulatorState();
  };

  const handleExecuteMainIdRebirthFromExcessVault = (mainId: number) => {
    const res = simulator.executeMainIdRebirthFromExcessVault(mainId);
    refreshSimulatorState();
    return res;
  };

  const handleExecuteCreateIDFromExcessVault = (mainId: number) => {
    const res = simulator.executeCreateIDFromExcessVault(mainId);
    refreshSimulatorState();
    return res;
  };

  const handleAddTestVaultToRank6To45 = (mainId: number, targetRank: number = 6, amount: number = 100) => {
    simulator.addTestVaultToRank6To45(mainId, targetRank, amount);
    refreshSimulatorState();
  };

  const handleAddTestVaultToRank1To5 = (mainId: number, targetRank: number = 1, amount: number = 5) => {
    simulator.addTestVaultToRank1To5(mainId, targetRank, amount);
    refreshSimulatorState();
  };

  const handleResetSimulation = () => {
    simulator.reset();
    setSelectedNodeId(1);
    refreshSimulatorState();
  };

  // Admin Action Handlers
  const handleAdminSetPause = (paused: boolean) => {
    simulator.adminSetPause(paused);
    refreshSimulatorState();
  };

  const handleAdminSetTreasury = (address: string) => {
    simulator.adminSetTreasury(address);
    refreshSimulatorState();
  };

  const handleAdminForceSetRank = (nodeId: number, targetRank: number) => {
    simulator.adminForceSetRank(nodeId, targetRank);
    refreshSimulatorState();
  };

  const handleAdminAdjustVault = (nodeId: number, amount: number) => {
    simulator.adminAdjustVault(nodeId, amount);
    refreshSimulatorState();
  };

  const handleAdminTransferNodeOwner = (nodeId: number, newOwner: string) => {
    simulator.adminTransferNodeOwner(nodeId, newOwner);
    refreshSimulatorState();
  };

  const handleAdminAirdrop = (walletAddress: string, amount: number) => {
    simulator.adminAirdrop(walletAddress, amount);
    refreshSimulatorState();
  };

  const handleAdminAddWallet = (address: string, name: string, balance: number) => {
    simulator.adminAddWallet(address, name, balance);
    refreshSimulatorState();
  };

  const handleAdminSweepRebirthPool = (recipientAddress: string) => {
    simulator.adminSweepRebirthPool(recipientAddress);
    refreshSimulatorState();
  };

  const handleAdminEmergencyWithdrawERC20 = (tokenAddress: string, toAddress: string, amount?: number) => {
    const res = simulator.emergencyWithdrawERC20(tokenAddress, toAddress, amount);
    refreshSimulatorState();
    return res;
  };

  const handleAdminForceTriggerRebirth = (nodeId: number) => {
    simulator.adminForceTriggerRebirth(nodeId);
    refreshSimulatorState();
  };

  const handleAdminBatchSimulate = (count: number) => {
    simulator.adminBatchSimulate(count);
    refreshSimulatorState();
  };

  const handleMarkNotificationRead = (id: string) => {
    simulator.markNotificationAsRead(id);
    setNotifications([...simulator.getNotifications()]);
  };

  const handleMarkAllNotificationsRead = () => {
    simulator.markAllNotificationsAsRead();
    setNotifications([...simulator.getNotifications()]);
  };

  const handleClearNotifications = () => {
    simulator.clearNotifications();
    setNotifications([]);
  };

  const handleTriggerTestNotification = (type: NotificationType) => {
    if (type === 'REGISTRATION') {
      simulator.emitNotification({
        type: 'REGISTRATION',
        title: '🎉 มีการสมัครสมาชิกใหม่ (ทดสอบ)',
        message: `รหัส #${nodes.length + 1 || 99} (${currentWallet.name}) สมัครสมาชิกต่อใต้ #${selectedNodeId || 1} ฝั่งซ้าย [5.00 USDT]`,
        nodeId: nodes.length + 1 || 99,
        rank: 1,
        amount: 5.0,
        walletName: currentWallet.name,
        walletAddress: currentWallet.address,
      });
    } else if (type === 'REBIRTH') {
      simulator.emitNotification({
        type: 'REBIRTH',
        title: '🌱 รหัสเกิดใหม่ทำงานสำเร็จ (ทดสอบ)',
        message: `รหัสเกิดใหม่ #${nodes.length + 1 || 99} คลอดจากไอดีหลัก #${selectedNodeId || 1} สู่ผังต้นไม้ [5.00 USDT]`,
        nodeId: nodes.length + 1 || 99,
        rank: 1,
        amount: 5.0,
        walletName: currentWallet.name,
        walletAddress: currentWallet.address,
      });
    } else if (type === 'UPGRADE') {
      simulator.emitNotification({
        type: 'UPGRADE',
        title: '⭐ เลื่อนขั้นผังสำเร็จ (ทดสอบ)',
        message: `รหัสหลัก #${selectedNodeId || 1} (${currentWallet.name}) อัพเกรดสู่ ผัง 2 (Bronze Member) [10.00 USDT]`,
        nodeId: selectedNodeId || 1,
        rank: 2,
        amount: 10.0,
        walletName: currentWallet.name,
        walletAddress: currentWallet.address,
      });
    }
    setNotifications([...simulator.getNotifications()]);
  };

  const auditData = useMemo(() => {
    return simulator.getFinancialAudit();
  }, [nodes, wallets, simulator.rebirthPool, isPaused, simulator]);

  const findRebirthSlot = (nodeId: number): SlotTarget | null => {
    return simulator.findRebirthSlot(nodeId);
  };

  const handleRelocateNode = (nodeId: number, targetParentId: number, isLeft: boolean) => {
    try {
      simulator.relocateNode(nodeId, targetParentId, isLeft);
      setNodes([...simulator.getAllNodes()]);
      setWallets([...simulator.getWallets()]);
      setNotifications([...simulator.getNotifications()]);
    } catch (err: any) {
      console.error('Relocate error:', err);
    }
  };

  // Quick Network Stats
  const totalVolume = (nodes.length - 1) * 5.0; // 5 USDT per registered node
  const totalUpgradesInVaults = nodes.reduce((acc, n) => acc + n.upgradeVault, 0);
  const totalRebirthsExecuted = nodes.filter((n) => n.isRebirth).length;
  const registeredMainUsersCount = nodes.filter((n) => !n.isRebirth).length;
  const registeredWalletsCount = new Set(nodes.filter((n) => !n.isRebirth).map((n) => n.owner.toLowerCase())).size;

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Navigation Bar */}
      <Navbar
        currentWallet={currentWallet}
        wallets={wallets}
        onSelectWallet={handleSelectWallet}
        isWeb3Connected={isWeb3Connected}
        web3Address={web3Address}
        onConnectWeb3={handleConnectWeb3}
        onDisconnectWeb3={handleDisconnectWeb3}
        rebirthPool={simulator.rebirthPool}
        totalNodes={nodes.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetSimulation={handleResetSimulation}
        isPaused={isPaused}
        selectedNodeId={selectedNodeId}
        onSelectNodeId={setSelectedNodeId}
        nodes={nodes}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onTriggerTestNotification={handleTriggerTestNotification}
      />


      {/* Emergency Paused Banner */}
      {isPaused && (
        <div className="bg-rose-950/90 border-b border-rose-800 text-rose-200 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span className="font-semibold">
                {t('emergencyAlertTitle')}
              </span>
            </div>
            {activeTab !== 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors shrink-0"
              >
                {t('goToAdmin')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Web3 Notification Toast */}
      {web3StatusMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full">
          <div className="p-3 rounded-xl bg-indigo-950/70 border border-indigo-800/70 text-xs text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg">
            <span className="flex-1">{web3StatusMsg}</span>
            <div className="flex items-center space-x-2 shrink-0">
              {isInIframe && (
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{t('openNewTab')}</span>
                </a>
              )}
              <button
                onClick={() => setWeb3StatusMsg(null)}
                className="text-indigo-400 hover:text-white font-bold px-1.5 py-0.5"
                title={t('close')}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 w-full min-w-0">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium truncate">{t('registeredUsers')}</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-base sm:text-lg font-extrabold text-amber-300 font-mono">{registeredMainUsersCount}</span>
                <span className="text-xs text-indigo-200 font-semibold">{t('unitUsers')}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate mt-0.5" title={`กระเป๋าผู้สมัคร ${registeredWalletsCount} | โคลนนิ่ง ${totalRebirthsExecuted} | รวมรหัสทั้งหมด ${nodes.length}`}>
                กระเป๋า: {registeredWalletsCount} | โคลน: {totalRebirthsExecuted} (รวม {nodes.length})
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium truncate">{t('totalVolume')}</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                {totalVolume.toFixed(1)} USDT
              </span>
            </div>
          </div>

          {/* Card 3: Total Upgrade Vault */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium truncate">{t('totalUpgradeVault')}</span>
              <span className="text-base sm:text-lg font-bold text-amber-300 font-mono">
                {totalUpgradesInVaults.toFixed(1)} USDT
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate mt-0.5">
                40% สะสมย้อนหลัง 5 ผัง
              </span>
            </div>
          </div>

          {/* Card 4: กองที่ 1: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 1 ถึง 5) */}
          {(() => {
            const summary1to5 = simulator.getFamilyExcessRebirthVaultSummary(selectedNodeId);
            return (
              <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center space-x-2.5 sm:space-x-3 bg-indigo-950/20">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-indigo-300 font-bold block truncate" title={`กองที่ 1: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 1 ถึง 5): นำยอดส่วนเกินที่เหลือจากการสำรอง 5 ผัง มาสมัครเปิดเป็น New Main ID ในผัง 1 (5.00 USDT) | สูตร: ${summary1to5.formulaText}`}>
                    🔵 กอง 1: ส่วนเกิน (ผัง 1-5)
                  </span>
                  <div className="flex items-baseline space-x-1">
                    <span className={`text-base sm:text-lg font-bold font-mono ${summary1to5.canRegisterNewMainId ?? summary1to5.canRebirthRank1 ? 'text-emerald-400' : 'text-indigo-300'}`}>
                      {summary1to5.excessVault.toFixed(2)}
                    </span>
                    <span className="text-xs text-indigo-300 font-semibold">/ 5.0 U</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate mt-0.5" title={summary1to5.formulaText}>
                    {(summary1to5.canRegisterNewMainId ?? summary1to5.canRebirthRank1) ? `✨ พร้อมเปิด Main ID ${summary1to5.newMainIdCountPossible ?? summary1to5.rebirthCountPossible} รหัส` : `➔ New Main ID ผัง 1`}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Card 5: กองที่ 2: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 6 ถึง 45) */}
          {(() => {
            const summary6to45 = simulator.getFamilyExcessVaultRank6To45Summary(selectedNodeId);
            return (
              <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center space-x-2.5 sm:space-x-3 bg-emerald-950/20">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-emerald-300 font-bold block truncate" title={`กองที่ 2: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 6 ถึง 45): ระบบสแกนส่วนเกินจากผัง 45 ลงมาถึงผัง 2 เมื่อยอดส่วนเกินครบตามราคาผังใด จะเปิดรหัส New Member ในผังนั้นทันที ("ไปต่อตัวเอง")`}>
                    🟢 กอง 2: ส่วนเกิน (ผัง 6-45)
                  </span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-base sm:text-lg font-bold text-emerald-300 font-mono">
                      {summary6to45.excessVault.toFixed(2)}
                    </span>
                    <span className="text-xs text-emerald-200 font-semibold">USDT</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate mt-0.5">
                    {summary6to45.canCreateNewID ? '🌟 พร้อมสร้างผัง 45➔2' : `➔ New Member ผัง 45➔2`}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Dedicated 3 Central Pools Dashboard */}
        <CentralPoolsDashboard
          simulator={simulator}
          selectedNodeId={selectedNodeId}
          onSelectNodeId={setSelectedNodeId}
          onExecuteRebirth={handleExecuteRebirth}
          onBatchExecuteRebirths={handleBatchExecuteRebirths}
          onExecuteMainIdRebirthFromExcessVault={handleExecuteMainIdRebirthFromExcessVault}
          onExecuteCreateIDFromExcessVault={handleExecuteCreateIDFromExcessVault}
          onAddTestVaultToRank1To5={handleAddTestVaultToRank1To5}
          onAddTestVaultToRank6To45={handleAddTestVaultToRank6To45}
          onToggleAutoRebirth={(enabled) => {
            simulator.setAutoRebirth(enabled);
            refreshSimulatorState();
          }}
          autoRebirth={simulator.autoRebirthEnabled}
          onToggleAutoExcessVaultNewMainId={(enabled) => {
            simulator.setAutoExcessVaultNewMainId(enabled);
            refreshSimulatorState();
          }}
          autoExcessVaultNewMainId={simulator.autoExcessVaultNewMainIdEnabled}
          autoDelaySec={autoDelaySec}
          onSetAutoDelaySec={(sec) => {
            simulator.setAutoExecutionDelay(sec);
            setAutoDelaySec(sec);
            refreshSimulatorState();
          }}
          autoCountdown={autoCountdown}
          autoTaskType={autoTaskType}
          autoCurrentRound={autoCurrentRound}
          autoTotalRounds={autoTotalRounds}
          onExecuteAutoNow={() => simulator.executeNextPendingAutoActionNow()}
          onExecuteAllAutoNow={() => simulator.executeAllPendingAutoActions()}
          onCancelAuto={() => simulator.cancelScheduledAutoActions()}
          onViewTab={setActiveTab}
          nodes={nodes}
          currentWallet={currentWallet}
        />

        {/* Global ID Switcher (ฟังก์ชันสลับ ID) */}
        {activeTab === 'app' && (
          <IdSwitcher
            nodes={nodes}
            wallets={wallets}
            selectedNodeId={selectedNodeId}
            onSelectNodeId={setSelectedNodeId}
            currentWallet={currentWallet}
            onSelectWallet={handleSelectWallet}
            onViewInTree={(id) => {
              setSelectedNodeId(id);
              setActiveTab('app');
            }}
          />
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'app' && (
          <div className="space-y-6">
            {/* Interactive Tree View with 45 Matrix Selection */}
            <TreeVisualizer
              nodes={nodes}
              wallets={wallets}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onQuickRegisterUnder={handleQuickRegisterUnder}
              onExecuteRebirth={handleExecuteRebirth}
              findRebirthSlot={(nodeId) => simulator.findRebirthSlot(nodeId)}
              rebirthPool={simulator.rebirthPool}
              getRankMatrixNodes={(rank) => simulator.getMatrixTreeNodes(rank)}
              getRankRebirthPool={(rank) => simulator.getRankRebirthPool(rank)}
              onSimulateRankMatrix={handleSimulateRankMatrix}
              onAddMemberToRankMatrix={handleAddMemberToRankMatrix}
              onExecuteRankRebirth={handleExecuteRankRebirth}
              currentWallet={currentWallet}
              onPurchaseRank={handlePurchaseRank}
              onPurchaseNextRank={handlePurchaseNextRank}
              onPurchaseNextRanksBatch={handlePurchaseNextRanksBatch}
              getNextEligibleRankSummary={(nodeId) => simulator.getNextEligibleRankSummary(nodeId, currentWallet.address)}
              getNodeFamilyUpgradeVault={(nodeId) => simulator.getNodeFamilyUpgradeVault(nodeId)}
              getRankVaultSummary={(rank, nodeId) => simulator.getRankVaultSummary(rank, nodeId, currentWallet.address)}
              onTopupWallet={handleTopupWallet}
              getFamilyExcessRebirthVaultSummary={(nodeId) => simulator.getFamilyExcessRebirthVaultSummary(nodeId)}
              onExecuteMainIdRebirthFromExcessVault={handleExecuteMainIdRebirthFromExcessVault}
              getFamilyExcessVaultRank6To45Summary={(nodeId) => simulator.getFamilyExcessVaultRank6To45Summary(nodeId)}
              onExecuteExcessVaultIDCreation={handleExecuteCreateIDFromExcessVault}
              getTotalFamilyAllUpgradeVault={(nodeId) => simulator.getTotalFamilyAllUpgradeVault(nodeId)}
              onRelocateNode={handleRelocateNode}
              logs={logs}
              onBatchExecuteRebirths={handleBatchExecuteRebirths}
              autoCountdown={autoCountdown}
              autoTaskType={autoTaskType}
              autoCurrentRound={autoCurrentRound}
              autoTotalRounds={autoTotalRounds}
              onExecuteAutoNow={() => simulator.executeNextPendingAutoActionNow()}
              onExecuteAllAutoNow={() => simulator.executeAllPendingAutoActions()}
              onCancelAuto={() => simulator.cancelScheduledAutoActions()}
              autoDelaySec={autoDelaySec}
              onSetAutoDelaySec={(sec) => {
                simulator.setAutoExecutionDelay(sec);
                setAutoDelaySec(sec);
                refreshSimulatorState();
              }}
            />

            {/* Registration & Actions Section */}
            <div id="registration-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RegistrationCard
                  currentWallet={currentWallet}
                  nodes={nodes}
                  wallets={wallets}
                  onSelectWallet={handleSelectWallet}
                  onRegister={handleRegister}
                  onBatchRegister={handleBatchRegister}
                  quickTarget={quickTarget}
                  onClearQuickTarget={() => setQuickTarget(null)}
                  getFamilyExcessRebirthVaultSummary={(mainId) => simulator.getFamilyExcessRebirthVaultSummary(mainId)}
                  onExecuteMainIdRebirthFromExcessVault={handleExecuteMainIdRebirthFromExcessVault}
                  getRankMatrixNodes={(rank) => simulator.getMatrixTreeNodes(rank)}
                  autoRebirth={simulator.autoRebirthEnabled}
                  onToggleAutoRebirth={(enabled) => {
                    simulator.setAutoRebirth(enabled);
                    refreshSimulatorState();
                  }}
                  autoExcessVaultNewMainId={simulator.autoExcessVaultNewMainIdEnabled}
                  onToggleAutoExcessVaultNewMainId={(enabled) => {
                    simulator.setAutoExcessVaultNewMainId(enabled);
                    refreshSimulatorState();
                  }}
                  onBatchExecuteRebirths={handleBatchExecuteRebirths}
                  autoDelaySec={autoDelaySec}
                  onSetAutoDelaySec={(sec) => {
                    simulator.setAutoExecutionDelay(sec);
                    setAutoDelaySec(sec);
                    refreshSimulatorState();
                  }}
                  autoCountdown={autoCountdown}
                  autoTaskType={autoTaskType}
                  autoCurrentRound={autoCurrentRound}
                  autoTotalRounds={autoTotalRounds}
                  onExecuteAutoNow={() => simulator.executeNextPendingAutoActionNow()}
                  onExecuteAllAutoNow={() => simulator.executeAllPendingAutoActions()}
                  onCancelAuto={() => simulator.cancelScheduledAutoActions()}
                />
              </div>

              <div className="lg:col-span-1">
                <ActivityLogs logs={logs} nodes={nodes} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contract' && <SolidityCodeViewer />}

        {activeTab === 'math' && <MathExplainer />}

        {activeTab === 'admin' && (
          <AdminPanel
            nodes={nodes}
            wallets={wallets}
            currentWallet={currentWallet}
            onSelectWallet={handleSelectWallet}
            isPaused={isPaused}
            onSetPause={handleAdminSetPause}
            treasuryAddress={treasuryAddress}
            onSetTreasury={handleAdminSetTreasury}
            onForceSetRank={handleAdminForceSetRank}
            onAdjustVault={handleAdminAdjustVault}
            onTransferNodeOwner={handleAdminTransferNodeOwner}
            onAirdrop={handleAdminAirdrop}
            onAddWallet={handleAdminAddWallet}
            onSweepRebirthPool={handleAdminSweepRebirthPool}
            onEmergencyWithdrawERC20={handleAdminEmergencyWithdrawERC20}
            onForceTriggerRebirth={handleAdminForceTriggerRebirth}
            onBatchSimulate={handleAdminBatchSimulate}
            onResetSimulation={handleResetSimulation}
            rebirthPool={simulator.rebirthPool}
            treasuryBalance={simulator.treasuryBalance}
            auditData={auditData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">
              {t('footerLine1')}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{t('footerProtection')}</span>
            <span>•</span>
            <span>{t('footerBatch')}</span>
            <span>•</span>
            <span>{t('footerMathAudit')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
