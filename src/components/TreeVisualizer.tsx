import React, { useState, useMemo, useEffect } from 'react';
import { MatrixNode, WalletAccount, SlotTarget, ActivityLog, ExcessRebirthVaultSummary } from '../types';
import { getRebirthNodeCount, getRebirthNodeIds, getRebirthSeqForMain, formatNodeCloneBadgeParts, formatNodeCloneLabel } from '../lib/rebirthUtils';
import { FifteenLevelExplorer } from './FifteenLevelExplorer';
import { RebirthModal } from './RebirthModal';
import { CloningQueueModal } from './CloningQueueModal';
import { BonusAndVaultHistoryModal } from './BonusAndVaultHistoryModal';
import { TreeSearchModal } from './TreeSearchModal';
import { RANKS, getRankInfo, MAX_RANK, getRankPrice } from '../lib/matrixSimulator';
import {
  User,
  Search,
  GitBranch,
  ArrowDownLeft,
  ArrowDownRight,
  Sparkles,
  Shield,
  Coins,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Smartphone,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Maximize2,
  Globe,
  Play,
  UserPlus,
  RefreshCw,
  Zap,
  Flame,
  History,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TreeVisualizerProps {
  nodes: MatrixNode[];
  wallets: WalletAccount[];
  selectedNodeId: number;
  onSelectNode: (nodeId: number) => void;
  onQuickRegisterUnder: (parentId: number, isLeft: boolean) => void;
  onExecuteRebirth?: (nodeId: number, targetParentId?: number, isLeft?: boolean) => void;
  findRebirthSlot?: (nodeId: number, targetRank?: number) => SlotTarget | null;
  rebirthPool?: number;
  getRankMatrixNodes?: (rank: number) => MatrixNode[];
  getRankRebirthPool?: (rank: number) => number;
  onSimulateRankMatrix?: (rank: number) => void;
  onAddMemberToRankMatrix?: (rank: number) => void;
  onExecuteRankRebirth?: (rank: number, nodeId: number) => void;
  currentWallet?: WalletAccount;
  onPurchaseRank?: (targetRank: number, nodeId?: number) => any;
  onPurchaseNextRank?: (nodeId?: number) => any;
  onPurchaseNextRanksBatch?: (maxSteps?: number, nodeId?: number) => any;
  getNextEligibleRankSummary?: (nodeId?: number) => any;
  getNodeFamilyUpgradeVault?: (nodeId: number, targetRank?: number) => number;
  getRankVaultSummary?: (rank: number, nodeId?: number) => any;
  onTopupWallet?: (address: string, amount: number) => void;
  getFamilyExcessRebirthVaultSummary?: (nodeId: number) => ExcessRebirthVaultSummary;
  onExecuteMainIdRebirthFromExcessVault?: (mainId: number) => number;
  getFamilyExcessVaultRank6To45Summary?: (nodeId: number) => {
    mainId: number;
    mainRank: number;
    vaultRank6To45: number;
    reserved5RanksVault: number;
    excessVault: number;
    eligibleRanks: { rank: number; price: number; name: string }[];
    canCreateNewID: boolean;
  };
  onExecuteExcessVaultIDCreation?: (mainId: number) => number[];
  getTotalFamilyAllUpgradeVault?: (nodeId: number) => number;
  getFamilyEarningsSummary?: (nodeId: number) => { totalDirectEarned: number; totalLevelEarned: number };
  onRelocateNode?: (nodeId: number, targetParentId: number, isLeft: boolean) => void;
  logs?: ActivityLog[];
  onBatchExecuteRebirths?: () => void;
  autoCountdown?: number;
  autoTaskType?: string | null;
  autoCurrentRound?: number;
  autoTotalRounds?: number;
  onExecuteAutoNow?: () => void;
  onExecuteAllAutoNow?: () => void;
  onCancelAuto?: () => void;
  autoDelaySec?: number;
  onSetAutoDelaySec?: (sec: number) => void;
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  nodes,
  wallets,
  selectedNodeId,
  onSelectNode,
  onQuickRegisterUnder,
  onExecuteRebirth,
  findRebirthSlot,
  rebirthPool = 0,
  getRankMatrixNodes,
  getRankRebirthPool,
  onSimulateRankMatrix,
  onAddMemberToRankMatrix,
  onExecuteRankRebirth,
  currentWallet,
  onPurchaseRank,
  onPurchaseNextRank,
  onPurchaseNextRanksBatch,
  getNextEligibleRankSummary,
  getNodeFamilyUpgradeVault,
  getRankVaultSummary,
  onTopupWallet,
  getFamilyExcessRebirthVaultSummary,
  onExecuteMainIdRebirthFromExcessVault,
  getFamilyExcessVaultRank6To45Summary,
  onExecuteExcessVaultIDCreation,
  getTotalFamilyAllUpgradeVault,
  getFamilyEarningsSummary,
  onRelocateNode,
  logs = [],
  onBatchExecuteRebirths,
  autoCountdown = 0,
  autoTaskType,
  autoCurrentRound = 0,
  autoTotalRounds = 0,
  onExecuteAutoNow,
  onExecuteAllAutoNow,
  onCancelAuto,
  autoDelaySec = 2,
  onSetAutoDelaySec,
}) => {
  const { t } = useLanguage();
  // Selected Matrix Rank (1 to 45)
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const currentRankInfo = useMemo(() => getRankInfo(selectedRank), [selectedRank]);

  // Bonus & Vault History Modal State
  const [isBonusHistoryOpen, setIsBonusHistoryOpen] = useState<boolean>(false);

  // Tree Search Modal State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Selected Main Node for Rank Purchase
  const [purchaseNodeId, setPurchaseNodeId] = useState<number | null>(null);
  const [purchaseSuccessToast, setPurchaseSuccessToast] = useState<string | null>(null);
  const [purchaseErrorToast, setPurchaseErrorToast] = useState<string | null>(null);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState<boolean>(false);
  const [treeVaultViewMode, setTreeVaultViewMode] = useState<'all' | 'rank1_5' | 'rank6_45'>('all');
  const [relocateParentId, setRelocateParentId] = useState<number | ''>('');
  const [relocateIsLeft, setRelocateIsLeft] = useState<boolean>(true);
  const [relocateMessage, setRelocateMessage] = useState<string | null>(null);

  // Compute active nodes for the selected matrix rank
  const activeNodes = useMemo(() => {
    if (getRankMatrixNodes) {
      return getRankMatrixNodes(selectedRank);
    }
    return [];
  }, [selectedRank, getRankMatrixNodes]);

  const activeRebirthPool = useMemo(() => {
    if (selectedRank === 1) return rebirthPool;
    if (getRankRebirthPool) return getRankRebirthPool(selectedRank);
    return 0;
  }, [selectedRank, rebirthPool, getRankRebirthPool]);

  // Determine all main nodes in system and user's main node for current wallet
  const allMainNodes = useMemo(() => {
    return nodes.filter((n) => !n.isRebirth);
  }, [nodes]);

  const userEligibleNodes = useMemo(() => {
    if (!currentWallet) return allMainNodes;
    return nodes.filter(
      (n) => n.owner.toLowerCase() === currentWallet.address.toLowerCase() && !n.isRebirth
    );
  }, [nodes, allMainNodes, currentWallet]);

  // Sync purchaseNodeId with selectedNodeId when selectedNodeId changes
  useEffect(() => {
    if (selectedNodeId) {
      const n = nodes.find((item) => item.id === selectedNodeId);
      if (n) {
        const mainId = n.isRebirth ? (n.originalAncestorId || n.rebornFromNodeId || n.id) : n.id;
        setPurchaseNodeId(mainId);
      }
    }
  }, [selectedNodeId, nodes]);

  const activeUserMainNode = useMemo(() => {
    if (purchaseNodeId) {
      const found = nodes.find((n) => n.id === purchaseNodeId);
      if (found) return found;
    }
    if (userEligibleNodes.length > 0) return userEligibleNodes[0];
    if (currentWallet) {
      const anyInWallet = nodes.find(
        (n) => n.owner.toLowerCase() === currentWallet.address.toLowerCase()
      );
      if (anyInWallet) return anyInWallet;
    }
    return nodes[0] || null;
  }, [purchaseNodeId, userEligibleNodes, nodes, currentWallet]);

  // Financial calculations for buying selectedRank
  const effectiveOwnerWallet = useMemo(() => {
    if (activeUserMainNode) {
      const w = wallets.find((item) => item.address.toLowerCase() === activeUserMainNode.owner.toLowerCase());
      if (w) return w;
    }
    return currentWallet;
  }, [activeUserMainNode, wallets, currentWallet]);

  // Calculate 40% Left-Leg Vault (ดึงรวม Vault ไอดีหลัก + รหัสเกิดใหม่ ย้อนหลัง 5 ผัง)
  const userFamilyVault = useMemo(() => {
    if (!activeUserMainNode) return 0;
    const mainId = (activeUserMainNode.isRebirth && activeUserMainNode.originalAncestorId)
      ? activeUserMainNode.originalAncestorId
      : activeUserMainNode.id;
    if (getNodeFamilyUpgradeVault) {
      return getNodeFamilyUpgradeVault(mainId, selectedRank);
    }
    // Fallback manual aggregation
    let total = activeUserMainNode.upgradeVault || 0;
    nodes.forEach((n) => {
      if (n.id !== mainId && n.isRebirth && (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)) {
        total += (n.upgradeVault || 0);
      }
    });
    return Math.round(total * 100) / 100;
  }, [activeUserMainNode, getNodeFamilyUpgradeVault, nodes, selectedRank]);

  // Rebirth nodes list that contribute 40% left-leg vault
  const userRebirthNodes = useMemo(() => {
    if (!activeUserMainNode) return [];
    const mainId = (activeUserMainNode.isRebirth && activeUserMainNode.originalAncestorId)
      ? activeUserMainNode.originalAncestorId
      : activeUserMainNode.id;
    return nodes.filter(
      (n) => n.id !== mainId && n.isRebirth && (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
    );
  }, [activeUserMainNode, nodes]);

  const userRebirthVaultSum = useMemo(() => {
    return userRebirthNodes.reduce((sum, n) => sum + (n.upgradeVault || 0), 0);
  }, [userRebirthNodes]);

  // Excess 40% Upgrade Vault Summary for Main ID Rebirth in Rank 1
  const excessRebirthSummary: ExcessRebirthVaultSummary = useMemo(() => {
    if (!activeUserMainNode) {
      return {
        mainId: 1,
        mainRank: 1,
        totalAllVault: 0,
        vaultRank1To5: 0,
        vaultRank1To10: 0,
        reserved5RanksVault: 0,
        reservedRanksText: 'ผัง 1 (0.00 USDT)',
        reserved5RanksFullVault: 0,
        vaultRolling5Ranks: 0,
        isRank11OrAbove: false,
        isRank10OrAbove: false,
        excessVault: 0,
        rank1Price: 5.0,
        canRebirthRank1: false,
        rebirthCountPossible: 0,
        canRegisterNewMainId: false,
        newMainIdCountPossible: 0,
        formulaText: '(40% Upgrade Vault ผัง 1-5: 0.00 USDT) − 0.00 USDT = 0.00 USDT',
      };
    }
    const mainId = (activeUserMainNode.isRebirth && activeUserMainNode.originalAncestorId)
      ? activeUserMainNode.originalAncestorId
      : activeUserMainNode.id;

    if (getFamilyExcessRebirthVaultSummary) {
      return getFamilyExcessRebirthVaultSummary(mainId);
    }

    const reserved = userFamilyVault;
    let totalAll = activeUserMainNode.upgradeVault || 0;
    nodes.forEach((n) => {
      if (n.id !== mainId && n.isRebirth && (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)) {
        totalAll += (n.upgradeVault || 0);
      }
    });
    const excess = Math.max(0, Math.round((totalAll - reserved) * 100) / 100);
    const mainRank = activeUserMainNode.rank || 1;
    const isRank11OrAbove = mainRank >= 11;
    const isRank10OrAbove = mainRank >= 10;
    return {
      mainId,
      mainRank,
      totalAllVault: Math.round(totalAll * 100) / 100,
      vaultRank1To5: Math.round(totalAll * 100) / 100,
      vaultRank1To10: Math.round(totalAll * 100) / 100,
      reserved5RanksVault: Math.round(reserved * 100) / 100,
      reservedRanksText: `สำรองย้อนหลัง 5 ผัง (${reserved.toFixed(2)} USDT)`,
      reserved5RanksFullVault: Math.round(reserved * 100) / 100,
      vaultRolling5Ranks: Math.round(reserved * 100) / 100,
      isRank11OrAbove,
      isRank10OrAbove,
      excessVault: excess,
      rank1Price: 5.0,
      canRebirthRank1: excess >= 5.0,
      rebirthCountPossible: Math.floor(excess / 5.0),
      canRegisterNewMainId: excess >= 5.0,
      newMainIdCountPossible: Math.floor(excess / 5.0),
      formulaText: `(40% Vault ผัง 1-5: ${totalAll.toFixed(2)} U) − (${reserved.toFixed(2)} U) = ${excess.toFixed(2)} U`,
    };
  }, [activeUserMainNode, getFamilyExcessRebirthVaultSummary, userFamilyVault, nodes]);

  // Financial calculations for buying selectedRank
  const targetRankPrice = currentRankInfo.price;
  const vaultCovered = Math.min(userFamilyVault, targetRankPrice);
  const walletDeficit = Math.max(0, Math.round((targetRankPrice - vaultCovered) * 100) / 100);
  const userWalletBalance = effectiveOwnerWallet?.balance || currentWallet?.balance || 0;
  const canAffordRank = userWalletBalance >= walletDeficit;
  const isAlreadyInRankQueue = useMemo(() => {
    if (!activeUserMainNode) return false;
    if (selectedRank === 1) return false;
    const inActiveNodes = activeNodes.some(
      (n) =>
        n.id === activeUserMainNode.id ||
        n.originalAncestorId === activeUserMainNode.id
    );
    return inActiveNodes || (activeUserMainNode.rank || 1) >= selectedRank;
  }, [activeUserMainNode, activeNodes, selectedRank]);

  // ตรวจสอบการซื้อข้ามผัง (ต้องซื้อเรียงตามลำดับทีละผัง)
  const isSkippingRank = useMemo(() => {
    if (!activeUserMainNode) return false;
    if (selectedRank <= 2) return false;
    const requiredPrevRank = selectedRank - 1;
    let reached = (activeUserMainNode.rank || 1) >= requiredPrevRank;
    if (!reached && getRankMatrixNodes) {
      const prevNodes = getRankMatrixNodes(requiredPrevRank);
      reached = prevNodes.some(
        (n) =>
          n.id === activeUserMainNode.id ||
          n.originalAncestorId === activeUserMainNode.id
      );
    }
    return !reached;
  }, [activeUserMainNode, selectedRank, getRankMatrixNodes]);

  const queueIndex = activeUserMainNode
    ? activeNodes.findIndex((n) => n.id === activeUserMainNode.id)
    : -1;

  // Determine all ranks in which the user's ID/wallet participates
  const userParticipatingRanks = useMemo(() => {
    if (!activeUserMainNode) return [1];
    const ranks: number[] = [1];
    if (getRankMatrixNodes) {
      for (let r = 2; r <= MAX_RANK; r++) {
        const rNodes = getRankMatrixNodes(r);
        if (
          rNodes.some(
            (n) =>
              n.id === activeUserMainNode.id ||
              n.originalAncestorId === activeUserMainNode.id
          )
        ) {
          ranks.push(r);
        }
      }
    }
    if (activeUserMainNode.rank && !ranks.includes(activeUserMainNode.rank)) {
      ranks.push(activeUserMainNode.rank);
    }
    return Array.from(new Set(ranks)).sort((a, b) => a - b);
  }, [activeUserMainNode, getRankMatrixNodes]);

  const userHighestRank = useMemo(() => {
    return Math.max(...userParticipatingRanks, activeUserMainNode?.rank || 1);
  }, [userParticipatingRanks, activeUserMainNode]);

  // 🔍 Auto ตรวจสอบผังถัดไปที่ต้องซื้อ (Next Eligible Rank Calculation)
  const nextEligibleRank = useMemo(() => {
    if (!activeUserMainNode) return 1;
    if (userHighestRank >= MAX_RANK) return null;
    return userHighestRank + 1;
  }, [activeUserMainNode, userHighestRank]);

  // 💰 Auto คำนวณความพร้อมทางการเงินสำหรับผังถัดไป (Next Rank Financial Analysis)
  const nextRankFinancials = useMemo(() => {
    if (!nextEligibleRank || !activeUserMainNode) return null;
    const info = getRankInfo(nextEligibleRank);
    const price = info.price;
    const vault = getNodeFamilyUpgradeVault
      ? getNodeFamilyUpgradeVault(activeUserMainNode.id, nextEligibleRank)
      : userFamilyVault;
    const vaultCovered = Math.min(vault, price);
    const walletDeficit = Math.max(0, Math.round((price - vaultCovered) * 100) / 100);
    const canAfford = userWalletBalance >= walletDeficit;
    const missing = Math.max(0, Math.round((walletDeficit - userWalletBalance) * 100) / 100);

    return {
      rank: nextEligibleRank,
      info,
      price,
      vaultAvailable: vault,
      vaultCovered,
      walletDeficit,
      canAfford,
      missing,
    };
  }, [nextEligibleRank, activeUserMainNode, getNodeFamilyUpgradeVault, userFamilyVault, userWalletBalance]);

  // 🚀 Auto คำนวณความสามารถในการซื้อผังต่อเนื่อง (Continuous Upgrade Chain)
  const affordableNextRanksChain = useMemo(() => {
    if (!activeUserMainNode || !nextEligibleRank) return [];
    const chain: { rank: number; info: any; price: number; vaultUsed: number; walletPaid: number }[] = [];
    let curBal = userWalletBalance;
    for (let r = nextEligibleRank; r <= MAX_RANK; r++) {
      const price = getRankPrice(r);
      const vault = getNodeFamilyUpgradeVault
        ? getNodeFamilyUpgradeVault(activeUserMainNode.id, r)
        : 0;
      const vaultUsed = Math.min(vault, price);
      const deficit = Math.max(0, Math.round((price - vaultUsed) * 100) / 100);
      if (curBal >= deficit) {
        chain.push({
          rank: r,
          info: getRankInfo(r),
          price,
          vaultUsed,
          walletPaid: deficit,
        });
        curBal = Math.round((curBal - deficit) * 100) / 100;
      } else {
        break;
      }
    }
    return chain;
  }, [activeUserMainNode, nextEligibleRank, userWalletBalance, getNodeFamilyUpgradeVault]);

  const handleExecutePurchaseRank = (rankToBuy: number) => {
    if (!activeUserMainNode) {
      setPurchaseErrorToast('ไม่พบรหัสสมาชิกหลักสำหรับดำเนินการซื้อผัง');
      return;
    }
    if (!onPurchaseRank) return;

    // 🔍 คำนวณราคาและ Vault ของผังที่สั่งซื้อจริง
    const buyPrice = getRankPrice(rankToBuy);
    const buyVaultAvailable = getNodeFamilyUpgradeVault
      ? getNodeFamilyUpgradeVault(activeUserMainNode.id, rankToBuy)
      : (rankToBuy === selectedRank ? userFamilyVault : 0);
    const buyVaultCovered = Math.min(buyVaultAvailable, buyPrice);
    const buyWalletDeficit = Math.max(0, Math.round((buyPrice - buyVaultCovered) * 100) / 100);

    // 🔍 ตรวจสอบเงื่อนไขซื้อทีละผังห้ามข้าม (Sequential Rank Upgrade Verification)
    if (rankToBuy >= 2) {
      const requiredPrevRank = rankToBuy - 1;
      let reachedPrev = (activeUserMainNode.rank || 1) >= requiredPrevRank;
      if (!reachedPrev && getRankMatrixNodes) {
        const prevNodes = getRankMatrixNodes(requiredPrevRank);
        reachedPrev = prevNodes.some(
          (n) =>
            n.id === activeUserMainNode.id ||
            n.originalAncestorId === activeUserMainNode.id
        );
      }

      if (!reachedPrev) {
        setPurchaseErrorToast(
          `⚠️ ต้องซื้อผังเรียงตามลำดับทีละผังเท่านั้น ห้ามซื้อข้ามผัง! รหัส #${activeUserMainNode.id} ต้องซื้อผังที่ ${requiredPrevRank} ให้เรียบร้อยก่อน (ไม่สามารถซื้อข้ามไปผังที่ ${rankToBuy} ได้)`
        );
        return;
      }

      // 🔍 ตรวจสอบว่ามี ID นี้ในผังอยู่แล้วหรือไม่ (Duplicate Rank Purchase Verification)
      let alreadyInRank = false;
      if (getRankMatrixNodes) {
        const rNodes = getRankMatrixNodes(rankToBuy);
        alreadyInRank = rNodes.some(
          (n) =>
            n.id === activeUserMainNode.id ||
            n.originalAncestorId === activeUserMainNode.id
        );
      }
      if (!alreadyInRank && (activeUserMainNode.rank || 1) >= rankToBuy) {
        alreadyInRank = true;
      }

      if (alreadyInRank) {
        setPurchaseErrorToast(
          `⚠️ รหัส ID #${activeUserMainNode.id} มีรายชื่ออยู่ในผังที่ ${rankToBuy} เรียบร้อยแล้ว ไม่สามารถซื้อผังที่เคยเข้าแล้วซ้ำได้!`
        );
        return;
      }
    }

    // 🔍 ตรวจสอบยอดเงินในกระเป๋าก่อนทำธุรกรรม (Pre-transaction Wallet Verification)
    if (rankToBuy === 1) {
      if (userWalletBalance < buyPrice) {
        setPurchaseErrorToast(
          `⚠️ ยอดเงินในกระเป๋าไม่เพียงพอสำหรับชำระค่าเปิดผัง 1 (${buyPrice.toLocaleString()} USDT)! ปัจจุบันมีในกระเป๋า: ${userWalletBalance.toLocaleString()} USDT (ขาดอีก ${(buyPrice - userWalletBalance).toLocaleString()} USDT)`
        );
        return;
      }
    } else {
      if (userWalletBalance < buyWalletDeficit) {
        setPurchaseErrorToast(
          `⚠️ ยอดเงินในกระเป๋าไม่เพียงพอสำหรับซื้อผังที่ ${rankToBuy}! ต้องการ ${buyPrice.toLocaleString()} USDT (ใช้ 40% Vault ได้ ${buyVaultCovered.toLocaleString()} USDT, ต้องจ่ายเพิ่มจากกระเป๋า ${buyWalletDeficit.toLocaleString()} USDT) แต่ในกระเป๋ามีเพียง ${userWalletBalance.toLocaleString()} USDT (ขาดอีก ${(buyWalletDeficit - userWalletBalance).toLocaleString()} USDT)`
        );
        return;
      }
    }

    setIsProcessingPurchase(true);
    setPurchaseErrorToast(null);
    setPurchaseSuccessToast(null);

    try {
      const res = onPurchaseRank(rankToBuy, activeUserMainNode.id);
      const vaultUsedStr = (res?.vaultUsed ?? buyVaultCovered).toLocaleString();
      const walletPaidStr = (res?.walletPaid ?? buyWalletDeficit).toLocaleString();

      // 🔄 ย้ายกลับมาแสดงผลที่ผัง 1 ทันทีเมื่อกดซื้อผัง
      setSelectedRank(1);

      // 🔍 Auto ตรวจสอบต่อทันทีว่าผังต่อไปเงิน/Vault พอซื้อต่อได้อีกไหม
      const nextRankAfterThis = rankToBuy < MAX_RANK ? rankToBuy + 1 : null;
      let nextNotice = '';
      if (nextRankAfterThis) {
        const nextPrice = getRankPrice(nextRankAfterThis);
        const nextVault = getNodeFamilyUpgradeVault
          ? getNodeFamilyUpgradeVault(activeUserMainNode.id, nextRankAfterThis)
          : 0;
        const nextDeficit = Math.max(0, nextPrice - Math.min(nextVault, nextPrice));
        const remainingBal = userWalletBalance - (res?.walletPaid ?? buyWalletDeficit);
        if (remainingBal >= nextDeficit) {
          nextNotice = ` ⚡ Auto ตรวจพบยอดเงินพร้อมซื้อผังที่ ${nextRankAfterThis} (${getRankInfo(nextRankAfterThis).title}) ต่อได้ทันที!`;
        }
      }

      setPurchaseSuccessToast(
        `🎉 ซื้อผังที่ ${rankToBuy} (${getRankInfo(rankToBuy).title}) สำเร็จ! รหัส #${activeUserMainNode.id} เข้าสู่ผังแล้ว (ใช้ 40% Vault รวม ${vaultUsedStr} U + หักกระเป๋า ${walletPaidStr} USDT)${nextNotice}`
      );
      setTimeout(() => setPurchaseSuccessToast(null), 8000);
    } catch (err: any) {
      setPurchaseErrorToast(err?.message || 'เกิดข้อผิดพลาดในการซื้อผัง');
      setTimeout(() => setPurchaseErrorToast(null), 6000);
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  // ⚡ ฟังก์ชัน Auto ซื้อผังต่อไปทันที
  const handleExecuteAutoBuyNext = () => {
    if (!nextEligibleRank) {
      setPurchaseErrorToast('รหัสนี้ได้ปลดล็อคถึงผังสูงสุด (Rank 45) เรียบร้อยแล้ว');
      return;
    }
    handleExecutePurchaseRank(nextEligibleRank);
  };

  // 🚀 ฟังก์ชัน Auto ซื้อต่อเนื่องหลายผังรวดเดียว
  const handleExecuteAutoBuyChain = async () => {
    if (!activeUserMainNode || !onPurchaseRank || affordableNextRanksChain.length === 0) return;
    setIsProcessingPurchase(true);
    setPurchaseErrorToast(null);
    setPurchaseSuccessToast(null);

    const boughtRanks: number[] = [];
    let totalWallet = 0;
    let totalVault = 0;
    let lastRank = selectedRank;

    try {
      if (onPurchaseNextRanksBatch) {
        const resList = onPurchaseNextRanksBatch(affordableNextRanksChain.length, activeUserMainNode.id);
        if (resList && resList.length > 0) {
          for (const item of resList) {
            boughtRanks.push(item.targetRank);
            totalWallet += (item.walletPaid || 0);
            totalVault += (item.vaultUsed || 0);
            lastRank = item.targetRank;
          }
        }
      } else {
        for (const step of affordableNextRanksChain) {
          const res = onPurchaseRank(step.rank, activeUserMainNode.id);
          boughtRanks.push(step.rank);
          totalWallet += (res?.walletPaid ?? step.walletPaid);
          totalVault += (res?.vaultUsed ?? step.vaultUsed);
          lastRank = step.rank;
        }
      }

      // 🔄 ย้ายกลับมาแสดงผลที่ผัง 1 ทันทีเมื่อกดซื้อผังต่อเนื่อง
      setSelectedRank(1);
      setPurchaseSuccessToast(
        `🚀 Auto ซื้อผังต่อเนื่องสำเร็จ ${boughtRanks.length} ผัง! (ผังที่ ${boughtRanks.join(', ')}) รหัส #${activeUserMainNode.id} ก้าวขึ้นสู่ผังที่ ${lastRank} (${getRankInfo(lastRank).title}) เรียบร้อยแล้ว! [จ่ายกระเป๋ารวม ${totalWallet.toLocaleString()} U + Vault ${totalVault.toLocaleString()} U]`
      );
      setTimeout(() => setPurchaseSuccessToast(null), 9000);
    } catch (err: any) {
      setPurchaseErrorToast(err?.message || 'เกิดข้อผิดพลาดในการซื้อผังต่อเนื่อง');
      setTimeout(() => setPurchaseErrorToast(null), 6000);
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  // View mode switcher: 'tree' (2D Tree - Primary) vs '15levels' (15-Level Explorer) vs 'step' (Mobile Navigator)
  const [viewMode, setViewMode] = useState<'15levels' | 'tree' | 'step'>('tree');
  const [rootDisplayId, setRootDisplayId] = useState<number>(selectedNodeId || 1);
  const [treeDepth, setTreeDepth] = useState<number>(999); // 999 = ทั้งหมด (เลือกทั้งหมดเป็นหลัก)
  const [compactCards, setCompactCards] = useState<boolean>(true); // Compact for mobile
  const [zoomLevel, setZoomLevel] = useState<number>(0.65);

  // Modal State for Rebirth Popup Window
  const [isRebirthModalOpen, setIsRebirthModalOpen] = useState<boolean>(false);
  const [modalRebornNodeId, setModalRebornNodeId] = useState<number | null>(null);

  // Modal State for Cloning Queue Window
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);

  const handleOpenRebirthModal = (nodeId?: number) => {
    setModalRebornNodeId(nodeId ?? selectedNodeId);
    setIsRebirthModalOpen(true);
  };

  // Compute Pending Cloning Queue Count for current active nodes
  const pendingCloningNodes = useMemo(() => {
    return activeNodes.filter((n) => n.pendingRebirths && n.pendingRebirths > 0);
  }, [activeNodes]);

  const totalPendingCloningCount = useMemo(() => {
    return pendingCloningNodes.reduce((acc, n) => acc + (n.pendingRebirths || 0), 0);
  }, [pendingCloningNodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<number, MatrixNode>();
    activeNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [activeNodes]);

  // Sync tree root display when activeNodes or selectedRank changes
  useEffect(() => {
    if (activeNodes.length > 0) {
      const firstId = activeNodes[0].id;
      setRootDisplayId(firstId);
      onSelectNode(firstId);
    } else {
      setRootDisplayId(1);
    }
  }, [selectedRank]);

  // Ensure rootDisplayId is valid within current rank's nodeMap, fallback to first node only if not found
  useEffect(() => {
    if (activeNodes.length > 0 && !nodeMap.has(rootDisplayId)) {
      setRootDisplayId(activeNodes[0].id);
    }
  }, [activeNodes, nodeMap, rootDisplayId]);

  const getWalletName = (address: string) => {
    const w = wallets.find((item) => item.address.toLowerCase() === address.toLowerCase());
    if (w) return w.name;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const selectedNode = nodeMap.get(selectedNodeId) || (activeNodes.length > 0 ? activeNodes[0] : undefined);

  // Trace 15 levels up from selectedNode
  const getUplinesList = (node: MatrixNode | undefined) => {
    if (!node) return [];
    const uplines: { level: number; node: MatrixNode }[] = [];
    let current = nodeMap.get(node.parentId);
    let level = 1;
    while (current && level <= 15) {
      uplines.push({ level, node: current });
      current = nodeMap.get(current.parentId);
      level++;
    }
    return uplines;
  };

  // Breadcrumb trail from root #1 down to selectedNode
  const getDownlineBreadcrumbs = (targetId: number) => {
    const path: MatrixNode[] = [];
    let curr = nodeMap.get(targetId);
    while (curr) {
      path.unshift(curr);
      if (curr.parentId === 0) break;
      curr = nodeMap.get(curr.parentId);
    }
    return path;
  };

  // Calculate max tree depth from rootDisplayId
  const maxAvailableDepth = useMemo(() => {
    let max = 0;
    const computeDepth = (id: number, currentDepth: number, visited = new Set<number>()) => {
      if (visited.has(id) || currentDepth > 50) return;
      visited.add(id);
      if (currentDepth > max) max = currentDepth;
      const n = nodeMap.get(id);
      if (!n) return;
      if (n.leftChild !== 0) computeDepth(n.leftChild, currentDepth + 1, visited);
      if (n.rightChild !== 0) computeDepth(n.rightChild, currentDepth + 1, visited);
    };
    computeDepth(rootDisplayId, 0);
    return max;
  }, [rootDisplayId, activeNodes]);

  // Render a single node in tree hierarchy (Recursive)
  const renderTreeNode = (
    id: number,
    depth: number = 0,
    maxDepth: number = 3,
    visited: Set<number> = new Set()
  ): React.ReactNode => {
    if (visited.has(id) || depth > 50) return null;
    const nextVisited = new Set(visited);
    nextVisited.add(id);

    const node = nodeMap.get(id);
    if (!node) return null;

    const isSelected = node.id === selectedNodeId;
    const isRoot = node.id === rootDisplayId;
    const hasPendingRebirth = node.pendingRebirths > 0;
    const hasRebirths = (node.rebirthCount || 0) > 0;
    const isClone = Boolean(node.isRebirth);
    const isFromVault = Boolean(
      node.isFromVault || node.paymentSource === 'excess_vault' || node.paymentSource === 'vault'
    );

    // กำหนดสีกรอบและสีพื้นหลังตามประเภทของรหัส:
    // 🟢 รหัสโคลนนิ่ง: กรอบสีเขียวเข้ม (border-emerald-600)
    // 🟡 รหัสที่สมัครจากยอด 40%: กรอบสีเหลืองเข้ม (border-amber-500)
    // ⚪ รหัสทั่วไป: กรอบปกติ
    let nodeCardThemeClass = '';
    if (isSelected) {
      if (isClone) {
        nodeCardThemeClass = 'bg-emerald-950/90 border-2 border-emerald-400 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-950/50';
      } else if (isFromVault) {
        nodeCardThemeClass = 'bg-amber-950/90 border-2 border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-950/50';
      } else {
        nodeCardThemeClass = 'bg-indigo-900/70 border-2 border-indigo-400 ring-2 ring-indigo-400/50 shadow-indigo-500/25';
      }
    } else {
      if (isClone) {
        nodeCardThemeClass = 'bg-slate-900/95 hover:bg-slate-850 border-2 border-emerald-600 hover:border-emerald-500 shadow-md shadow-emerald-950/40';
      } else if (isFromVault) {
        nodeCardThemeClass = 'bg-slate-900/95 hover:bg-slate-850 border-2 border-amber-500 hover:border-amber-400 shadow-md shadow-amber-950/40';
      } else {
        nodeCardThemeClass = 'bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600';
      }
    }

    return (
      <div key={`tree-node-wrapper-${id}-${depth}`} className="flex flex-col items-center min-w-max">
        {/* Node Box */}
        <div
          id={`tree-node-${node.id}`}
          onClick={() => onSelectNode(node.id)}
          className={`relative cursor-pointer transition-all duration-200 rounded-xl p-2 sm:p-2.5 text-left shadow-md shrink-0 ${
            compactCards ? 'w-36 sm:w-44' : 'w-44 sm:w-52'
          } ${nodeCardThemeClass}`}
        >
          {/* แถบหัวการ์ดด้านบน (Header & Badges) */}
          {/* 1. รหัสที่เกิดใหม่ & รหัสประจำตัว (#X)(#ID): เช่น #4(12), #4(8) หรือ รหัสปกติ #ID */}
          {/* 2. ระดับแรงก์ (R1 - R15): คำนวณจากแพ็กเกจ เช่น R1 = 5 USDT, R2 = 10 USDT */}
          {/* 3. ระดับความลึก (ชั้น X): แสดงระดับ Depth ในผังนับจากรหัสรากด้านบนสุด */}
          <div className="flex items-center justify-between mb-1 gap-1">
            <div className="flex items-center space-x-1 shrink-0">
              {node.isRebirth ? (() => {
                const cloneBadge = formatNodeCloneBadgeParts(node, nodes, selectedRank);
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRebirthModal(node.id);
                    }}
                    className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 hover:text-white hover:border-emerald-400 transition-all flex items-center space-x-0.5 shadow-sm group cursor-pointer"
                    title={`ผัง ${node.rank || selectedRank} (${currentRankInfo.title}): รหัสหลัก #${cloneBadge.mainId} | รหัสนี้ #${cloneBadge.nodeId} | จำนวนการเกิดโคลนนิ่ง #${cloneBadge.vaultCloneIndex} | โคลนนิ่งรอบ ${cloneBadge.round} (${cloneBadge.fullLabel}) - คลิกดูรายละเอียด Rebirth`}
                  >
                    <span className="text-amber-300 font-extrabold" title={`ไอดีหลัก #${cloneBadge.mainId}`}>
                      #{cloneBadge.mainId}
                    </span>
                    <span className="text-emerald-200 font-bold" title={`รหัสโคลนนิ่ง #${cloneBadge.nodeId}`}>
                      #{cloneBadge.nodeId}
                    </span>
                    <span className="text-emerald-300 font-bold" title={`จำนวนการเกิดโคลนนิ่ง #${cloneBadge.vaultCloneIndex}`}>
                      #{cloneBadge.vaultCloneIndex}
                    </span>
                    <span className="text-emerald-300 font-bold bg-emerald-900/60 px-1 py-0.2 rounded text-[9px]" title={`โคลนนิ่งรอบ ${cloneBadge.round}`}>
                      โคลนรอบ {cloneBadge.round}
                    </span>
                    <Sparkles className="w-2.5 h-2.5 text-emerald-300 group-hover:rotate-12 transition-transform shrink-0" />
                  </button>
                );
              })() : isFromVault ? (
                <span
                  className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/80 text-amber-200 flex items-center space-x-0.5 shadow-sm"
                  title={`ผัง ${node.rank || selectedRank} (${currentRankInfo.title}): รหัสหลัก #${node.id} | สมัครจากยอด 40% Vault`}
                >
                  <span className="text-amber-300 font-extrabold">
                    #{node.id}
                  </span>
                  <span className="text-amber-200/90">({node.queueNumber || node.id})</span>
                  <span className="text-[8px] bg-amber-500/25 text-amber-300 px-1 py-0.2 rounded border border-amber-500/40 ml-0.5 font-sans font-semibold">
                    40% Vault
                  </span>
                </span>
              ) : (
                <span
                  className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-indigo-500/60 text-indigo-200 flex items-center space-x-0.5 shadow-sm"
                  title={`ผัง ${node.rank || selectedRank} (${currentRankInfo.title}): รหัสหลัก #${node.id} | Global Node ID #${node.queueNumber || node.id}`}
                >
                  <span className="text-amber-300 font-extrabold">
                    #{node.id}
                  </span>
                  <span className="text-indigo-200">({node.queueNumber || node.id})</span>
                </span>
              )}

              {/* ระดับแรงก์ (R1 - R15): แสดงแรงก์ปัจจุบันของรหัส (คำนวณจากแพ็กเกจ เช่น R1 = 5 USDT, R2 = 10 USDT) */}
              <span
                className="font-mono text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0"
                title={`ระดับแรงก์: R${node.rank || 1} (แพ็กเกจ ${getRankPrice(node.rank || 1)} USDT)`}
              >
                R{node.rank || 1}
              </span>
            </div>

            {/* ระดับความลึก (ชั้น X): แสดงระดับ Depth ในผังนับจากรหัสรากด้านบนสุด */}
            <span
              className="text-[9px] sm:text-[9.5px] text-slate-300 font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/70 shrink-0 whitespace-nowrap"
              title={`ระดับความลึก: ชั้นที่ ${node.depth} ในผังต้นไม้นับจากรหัสรากด้านบนสุด`}
            >
              ชั้น {node.depth}
            </span>
          </div>

          {/* Owner Info */}
          <div className="flex items-center space-x-1 mb-1">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium text-slate-200 truncate">
              {getWalletName(node.owner)}
            </span>
          </div>

          {/* Children Indicator: Left (100% Math) vs Right (Rebirth) */}
          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-700/60 text-[8.5px] sm:text-[9.5px]">
            {/* Left Child: Green */}
            <div
              className={`p-1 rounded-md border flex flex-col justify-between ${
                node.leftChild !== 0
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-slate-900/40 border-dashed border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <ArrowDownLeft className="w-2.5 h-2.5 mr-0.5 text-emerald-400" />
                  ซ้าย (1)
                </span>
                {node.leftChild !== 0 ? (
                  <span className="font-mono font-bold text-emerald-300">
                    {(() => {
                      const lNode = nodeMap.get(node.leftChild);
                      const lMainId = lNode ? (lNode.originalAncestorId || lNode.rebornFromNodeId || lNode.id) : node.leftChild;
                      const lGlobalId = lNode ? (lNode.queueNumber || lNode.id) : node.leftChild;
                      return `#${lMainId}(${lGlobalId})`;
                    })()}
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickRegisterUnder(node.id, true);
                    }}
                    className="px-1 py-0.2 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[8px] font-bold"
                    title="คลิกเพื่อลงรหัสต่อทางซ้าย"
                  >
                    +ลง
                  </button>
                )}
              </div>
              <span className="text-[7px] sm:text-[8px] text-slate-400 mt-0.5">30% | 15ช | 40%</span>
            </div>

            {/* Right Child: Purple (Rebirth) */}
            <div
              className={`p-1 rounded-md border flex flex-col justify-between ${
                node.rightChild !== 0
                  ? 'bg-purple-950/40 border-purple-800/60 text-purple-300'
                  : 'bg-slate-900/40 border-dashed border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <ArrowDownRight className="w-2.5 h-2.5 mr-0.5 text-purple-400" />
                  ขวา (2)
                </span>
                {node.rightChild !== 0 ? (
                  <span className="font-mono font-bold text-purple-300">
                    {(() => {
                      const rNode = nodeMap.get(node.rightChild);
                      const rMainId = rNode ? (rNode.originalAncestorId || rNode.rebornFromNodeId || rNode.id) : node.rightChild;
                      const rGlobalId = rNode ? (rNode.queueNumber || rNode.id) : node.rightChild;
                      return `#${rMainId}(${rGlobalId})`;
                    })()}
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickRegisterUnder(node.id, false);
                    }}
                    className="px-1 py-0.2 rounded bg-purple-600/80 hover:bg-purple-500 text-white text-[8px] font-bold"
                    title="คลิกเพื่อลงรหัสต่อทางขวา"
                  >
                    +โคลนนิ่ง
                  </button>
                )}
              </div>
              <span className="text-[7px] sm:text-[8px] text-slate-400 mt-0.5">100% Rebirth</span>
            </div>
          </div>

          {/* Status Ribbons: Upgrade Vault & Rebirth */}
          <div className="mt-1 flex items-center justify-between text-[8.5px] sm:text-[9.5px] text-slate-300 bg-slate-900/60 px-1.5 py-0.5 rounded">
            <span className="flex items-center space-x-0.5" title="ยอดสะสม Vault / เป้าหมาย Rank ถัดไป">
              <Shield className="w-2.5 h-2.5 text-amber-400" />
              <span>
                Vault: {node.upgradeVault.toFixed(1)}/{(node.rank || 1) < MAX_RANK ? getRankPrice((node.rank || 1) + 1) : getRankPrice(MAX_RANK)}U
              </span>
            </span>
            {hasPendingRebirth ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRebirthModal(node.id);
                }}
                className="text-amber-300 font-bold animate-pulse flex items-center hover:underline cursor-pointer"
                title="คลิกเพื่อเปิดหน้าต่างป๊อปอัพจัดการโคลนนิ่ง"
              >
                <Sparkles className="w-2 h-2 mr-0.5" />
                รอโคลน ({node.pendingRebirths}) ⇲
              </button>
            ) : node.isRebirth ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRebirthModal(node.id);
                }}
                className="text-purple-300 hover:text-purple-100 font-medium flex items-center hover:underline cursor-pointer"
                title={`รหัสโคลนนิ่ง: กำเนิดจากรหัส #${node.originalAncestorId || node.rebornFromNodeId} (คลิกเพื่อเปิดหน้าต่างป๊อปอัพ)`}
              >
                <Sparkles className="w-2 h-2 mr-0.5 text-purple-400" />
                เกิดจาก #{node.originalAncestorId || node.rebornFromNodeId} (กดดู ⇲)
              </button>
            ) : (node.spawnedRebirthCount ?? getRebirthNodeCount(node.id, nodes)) > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRebirthModal(node.id);
                }}
                className="text-amber-300 hover:text-amber-100 flex items-center hover:underline cursor-pointer font-medium"
                title={`คลิกเพื่อเปิดหน้าต่างดูรหัสโคลนนิ่งของ ID #${node.id} (${node.spawnedRebirthCount ?? getRebirthNodeCount(node.id, nodes)} รหัส)`}
              >
                <Sparkles className="w-2 h-2 mr-0.5 text-amber-400" />
                โคลนนิ่ง {node.spawnedRebirthCount ?? getRebirthNodeCount(node.id, nodes)} รหัส ⇲
              </button>
            ) : hasRebirths ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRebirthModal(node.id);
                }}
                className="text-purple-300 hover:text-purple-100 flex items-center hover:underline cursor-pointer"
                title="คลิกเพื่อเปิดหน้าต่างป๊อปอัพดูข้อมูลการเกิดใหม่"
              >
                <Sparkles className="w-2 h-2 mr-0.5 text-purple-400" />
                เกิด {node.rebirthCount} รอบ ⇲
              </button>
            ) : (
              <span className="text-slate-500">ปกติ</span>
            )}
          </div>
        </div>

        {/* Downline Children Branches */}
        {depth < maxDepth && (node.leftChild !== 0 || node.rightChild !== 0) && (
          <div className="flex flex-col items-center min-w-max mt-1.5 sm:mt-2">
            {/* Connecting Vertical Line */}
            <div className="w-0.5 h-2.5 sm:h-3 bg-slate-700" />

            {/* Split Horizontal Bar with children branches */}
            <div className="flex items-start justify-center gap-2 sm:gap-4 pt-0.5 flex-nowrap min-w-max">
              {/* Left Branch */}
              <div className="flex flex-col items-center min-w-max">
                {node.leftChild !== 0 ? (
                  renderTreeNode(node.leftChild, depth + 1, maxDepth, nextVisited)
                ) : (
                  <div
                    className={`${
                      compactCards ? 'w-28 sm:w-36' : 'w-32 sm:w-40'
                    } border border-dashed border-emerald-700/50 bg-emerald-950/20 rounded-xl p-1.5 sm:p-2 text-center shrink-0`}
                  >
                    <span className="text-[10px] sm:text-[11px] text-emerald-400 font-medium block">
                      ว่าง (ซ้าย)
                    </span>
                    <button
                      onClick={() => onQuickRegisterUnder(node.id, true)}
                      className="mt-1 px-2 py-0.5 text-[9px] sm:text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                    >
                      + ลงรหัสซ้าย
                    </button>
                  </div>
                )}
              </div>

              {/* Right Branch */}
              <div className="flex flex-col items-center min-w-max">
                {node.rightChild !== 0 ? (
                  renderTreeNode(node.rightChild, depth + 1, maxDepth, nextVisited)
                ) : (
                  <div
                    className={`${
                      compactCards ? 'w-28 sm:w-36' : 'w-32 sm:w-40'
                    } border border-dashed border-purple-700/50 bg-purple-950/20 rounded-xl p-1.5 sm:p-2 text-center shrink-0`}
                  >
                    <span className="text-[10px] sm:text-[11px] text-purple-400 font-medium block">
                      ว่าง (ขวา)
                    </span>
                    <button
                      onClick={() => onQuickRegisterUnder(node.id, false)}
                      className="mt-1 px-2 py-0.5 text-[9px] sm:text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                    >
                      + ลงรหัสขวา
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const uplines = getUplinesList(selectedNode);
  const breadcrumbs = getDownlineBreadcrumbs(selectedNodeId);

  return (
    <div className="space-y-4">
      {/* 45 BINARY MATRIX TREES SELECTOR HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3">
        {/* Main Bar: Title & Rank Switcher */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 border border-indigo-400/40">
              {selectedRank}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-xs sm:text-sm font-bold text-white">
                  ผังต้นไม้ไบนารี่ 1 แตก 2 (ผังที่ {selectedRank} จาก 45 ผัง)
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shadow-sm ${currentRankInfo.badge}`}>
                  {currentRankInfo.title} ({currentRankInfo.price.toLocaleString()} USDT)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedRank === 1 ? (
                  <span>🌐 <strong className="text-emerald-300">ผังหลักสายงานส่วนตัว (Personal Binary Matrix)</strong> — สมาชิก {activeNodes.length} รหัส</span>
                ) : (
                  <span>🚀 <strong className="text-indigo-300">ผัง Global Matrix ประจำ Rank {selectedRank}</strong> — สมาชิก {activeNodes.length} รหัส</span>
                )}
              </p>
            </div>
          </div>

          {/* Rank Selector Dropdown & Stepper */}
          <div className="flex items-center space-x-1.5 w-full lg:w-auto justify-between lg:justify-end">
            <button
              type="button"
              disabled={selectedRank <= 1}
              onClick={() => setSelectedRank((prev) => Math.max(1, prev - 1))}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1 shrink-0"
              title="ผังก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">ผังก่อนหน้า</span>
            </button>

            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(Number(e.target.value))}
              className="bg-slate-800 text-slate-100 text-xs rounded-xl border border-indigo-500/50 px-3 py-1.5 font-bold font-mono focus:ring-2 focus:ring-indigo-400 cursor-pointer flex-1 lg:flex-initial max-w-[240px] text-ellipsis"
            >
              {RANKS.map((r) => (
                <option key={r.rank} value={r.rank}>
                  ผังที่ {r.rank}: {r.title} ({r.price.toLocaleString()} USDT)
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={selectedRank >= MAX_RANK}
              onClick={() => setSelectedRank((prev) => Math.min(MAX_RANK, prev + 1))}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1 shrink-0"
              title="ผังถัดไป"
            >
              <span className="hidden sm:inline">ผังถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Quick Scrollable Pills for 45 Ranks */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          {RANKS.map((r) => {
            const isActive = r.rank === selectedRank;
            const isUserRank = userParticipatingRanks.includes(r.rank);
            const isHighest = r.rank === userHighestRank;
            const priceLabel = r.price >= 1000000 ? `${r.price / 1000000}M` : r.price >= 1000 ? `${r.price / 1000}k` : `${r.price}`;
            return (
              <button
                key={`pill-rank-${r.rank}`}
                onClick={() => setSelectedRank(r.rank)}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap text-[11px] font-semibold transition-all shrink-0 flex items-center space-x-1 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400 scale-105 z-10'
                    : isHighest
                    ? 'bg-amber-950/70 hover:bg-amber-900/60 text-amber-300 border border-amber-500/60'
                    : isUserRank
                    ? 'bg-indigo-950/70 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {isHighest && <span className="text-amber-400">👑</span>}
                {!isHighest && isUserRank && <span className="text-emerald-400 text-[10px]">✓</span>}
                <span>ผัง {r.rank}</span>
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${isActive ? 'bg-indigo-900/80 text-amber-200' : 'bg-slate-900 text-slate-400'}`}>
                  {priceLabel}U
                </span>
              </button>
            );
          })}
        </div>

        {/* User Active ID Matrix Tracker Bar: ตรวจสอบและแสดงสถานะผังของ ID เราอย่างชัดเจน */}
        <div className="bg-slate-950/90 border border-indigo-500/40 rounded-xl p-3 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600/40 to-purple-600/40 border border-indigo-400/50 flex items-center justify-center text-amber-300 font-bold shrink-0 text-base shadow-sm">
              📍
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-xs text-slate-400">สถานะผังของรหัสคุณ:</span>
                <span className="text-xs font-bold font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Node #{activeUserMainNode?.id || 1}
                </span>
                <span className="text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-500/60 px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                  <span>👑 อยู่ผังที่ {userHighestRank} ({getRankInfo(userHighestRank).title})</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  [{getRankInfo(userHighestRank).price.toLocaleString()} USDT]
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 flex-wrap gap-y-1">
                <span>ผังทั้งหมดที่คุณเข้าร่วมแล้ว ({userParticipatingRanks.length} ผัง):</span>
                <div className="flex items-center space-x-1 flex-wrap">
                  {userParticipatingRanks.map((r, rIdx) => (
                    <button
                      key={`user-rank-btn-${r}-${rIdx}`}
                      onClick={() => setSelectedRank(r)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                        selectedRank === r
                          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-700/50'
                      }`}
                      title={`คลิกเพื่อเปิดดูผังที่ ${r}`}
                    >
                      ผัง {r} {r === userHighestRank ? '⭐ สูงสุด' : '✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
            {selectedRank === userHighestRank ? (
              <span className="text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>คุณกำลังดูผังปัจจุบันของรหัสคุณอยู่ (ผังที่ {selectedRank})</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedRank(userHighestRank)}
                className="text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold px-3.5 py-1.5 rounded-xl shadow-lg border border-indigo-400/80 flex items-center space-x-1.5 transition-all active:scale-95 animate-pulse"
                title={`คลิกเพื่อสลับไปดูผังที่ ${userHighestRank} ทันที`}
              >
                <span>👉 สลับไปดูผังปัจจุบันของรหัสคุณ (ผังที่ {userHighestRank})</span>
              </button>
            )}
          </div>
        </div>

        {/* 100% Financial Math Strip for Selected Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400">💰 ราคาแพ็กเกจ</span>
            <span className="text-xs font-bold font-mono text-white">{currentRankInfo.price.toLocaleString()} USDT</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-emerald-400">🎯 ค่าแนะนำ (30%)</span>
            <span className="text-xs font-bold font-mono text-emerald-300">{(currentRankInfo.price * 0.3).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-indigo-400">🌐 15 ชั้น (30%)</span>
            <span className="text-xs font-bold font-mono text-indigo-300">
              {(currentRankInfo.price * 0.3).toLocaleString(undefined, { maximumFractionDigits: 2 })} U <span className="text-[9px] text-slate-400">({(currentRankInfo.price * 0.02).toLocaleString(undefined, { maximumFractionDigits: 2 })}/ชั้น)</span>
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-amber-400">🔒 Vault (40%)</span>
            <span className="text-xs font-bold font-mono text-amber-300">{(currentRankInfo.price * 0.4).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-purple-400">♻️ Rebirth (100%)</span>
            <span className="text-xs font-bold font-mono text-purple-300">{currentRankInfo.price.toLocaleString()} USDT</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-cyan-400">👥 สมาชิกในผัง</span>
            <span className="text-xs font-bold font-mono text-cyan-300">{activeNodes.length} รหัส</span>
          </div>
        </div>

        {/* Upgrade Matrix Purchase & 40% Left-Leg Vault Aggregation Panel for All Ranks (Rank 1-45) */}
        {selectedRank >= 1 && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/90 border-2 border-indigo-500/50 shadow-2xl space-y-3.5 relative overflow-hidden">
            {/* Top decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Panel Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/30 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>ผังที่ {selectedRank}: {currentRankInfo.title}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold">
                        {currentRankInfo.price.toLocaleString()} USDT
                      </span>
                    </h4>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      {selectedRank === 1 ? 'ผังหลัก (Rank 1 - Iron)' : 'ผังอัพเกรด (Rank 2–45)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedRank === 1
                      ? 'ผังหลักสายงานส่วนตัว (Personal Binary Matrix 5 USDT) — เก็บยอด 40% เม็ดซ้าย (2.00 USDT) เพื่อสะสม Vault อัพเกรดสู่ผัง 2 (Bronze 10 USDT)'
                      : 'เก็บยอด 40% เม็ดซ้าย (รวมรายได้นับถอยหลังไป 5 ผัง ทั้งไอดีหลัก + รหัสเกิดใหม่) เพื่อซื้อผัง / อัพเกรดเลื่อนขั้น'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                {selectedRank === 1 ? (
                  activeUserMainNode ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center space-x-1 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>อยู่ในผังนี้แล้ว (รหัส #{activeUserMainNode.id})</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>พร้อมสมัคร / เปิดรหัสใหม่ในผัง 1</span>
                    </span>
                  )
                ) : isAlreadyInRankQueue ? (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center space-x-1 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>อยู่ในผังนี้แล้ว (คิว #{queueIndex + 1})</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>พร้อมซื้อผัง / อัพเกรดทันที</span>
                  </span>
                )}
              </div>
            </div>

            {/* Financial Status Matrix (40% Left-Leg Vault Aggregator) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: 40% Left-Leg Vault Available */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>40% Vault เม็ดซ้าย (ย้อนหลัง 5 ผัง)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID #{activeUserMainNode?.id || 1}
                  </span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-bold font-mono text-amber-300">
                    {userFamilyVault.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-amber-400/80 font-mono">USDT</span>
                </div>
                <div className="text-[10.5px] text-slate-400 leading-tight pt-1 border-t border-slate-800">
                  {userRebirthNodes.length > 0 ? (
                    <span>
                      🔹 ID หลัก: <b className="text-slate-200">{(activeUserMainNode?.upgradeVault || 0).toFixed(2)} U</b> + {userRebirthNodes.length} รหัสโคลนนิ่ง: <b className="text-amber-300">{userRebirthVaultSum.toFixed(2)} U</b>
                    </span>
                  ) : (
                    <span>
                      🔹 สะสมจากเม็ดซ้ายของ ID หลัก #{activeUserMainNode?.id || 1}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setIsBonusHistoryOpen(true)}
                  className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                  <span>📜 ประวัติค่าแนะนำ, ค่าชั้น & 40% Vault ⇲</span>
                </button>
              </div>

              {/* Card 2: Wallet USDT Deficit / Registration Cost */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-semibold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{selectedRank === 1 ? 'ยอดชำระเปิดรหัส ผัง 1' : 'ยอดจ่ายเพิ่มจากกระเป๋า USDT'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    กระเป๋า: {userWalletBalance.toLocaleString()} U
                  </span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  {selectedRank > 1 && walletDeficit === 0 ? (
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      0.00 <span className="text-xs font-sans text-emerald-300">(Vault ครอบคลุม 100%)</span>
                    </span>
                  ) : (
                    <span className="text-xl font-bold font-mono text-amber-300">
                      {(selectedRank === 1 ? targetRankPrice : walletDeficit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-mono text-slate-400">USDT</span>
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-400 leading-tight pt-1 border-t border-slate-800 flex justify-between">
                  <span>ราคาผัง: <b className="text-slate-200">{targetRankPrice.toLocaleString()} USDT</b></span>
                  <span>{selectedRank === 1 ? 'หักจากกระเป๋า' : 'หัก Vault'}: <b className="text-emerald-400">{(selectedRank === 1 ? targetRankPrice : vaultCovered).toLocaleString()} USDT</b></span>
                </div>
              </div>

              {/* Card 3: Vault Coverage Progress / Next Rank Target */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300 font-semibold">
                    {selectedRank === 1 ? 'สะสม 40% สู่ผัง 2 (เป้าหมาย 10 U)' : 'ความคืบหน้าสะสม 40% Vault'}
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {Math.min(100, Math.round((userFamilyVault / (selectedRank === 1 ? 10 : targetRankPrice)) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, Math.round((userFamilyVault / (selectedRank === 1 ? 10 : targetRankPrice)) * 100)))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                  <span>{userFamilyVault.toFixed(2)} U</span>
                  <span>เป้าหมาย {(selectedRank === 1 ? 10 : targetRankPrice).toLocaleString()} U</span>
                </div>
              </div>
            </div>



            {/* Notification Toasts */}
            {purchaseSuccessToast && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{purchaseSuccessToast}</span>
              </div>
            )}
            {purchaseErrorToast && (
              <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{purchaseErrorToast}</span>
              </div>
            )}

            {/* Auto Next Rank Intelligence Banner (ระบบ Auto ตรวจสอบและเตรียมซื้อผังต่อไป) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/70 via-indigo-950/80 to-slate-950 border border-purple-500/50 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Auto ตรวจสอบผังต่อไป</span>
                  </span>
                  <span className="text-slate-300">
                    รหัส <b className="text-amber-300 font-mono">#{activeUserMainNode?.id}</b>
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">
                    ผังสูงสุดปัจจุบัน: <b className="text-indigo-300 font-bold">ผังที่ {userHighestRank} ({getRankInfo(userHighestRank).title})</b>
                  </span>
                </div>

                {nextEligibleRank ? (
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      ➔ ผังถัดไปที่ต้องซื้อ: <b className="text-amber-300 underline underline-offset-2">ผังที่ {nextEligibleRank} ({nextRankFinancials?.info.title})</b>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      (ราคา {nextRankFinancials?.price.toLocaleString()} U • Vault ช่วย {nextRankFinancials?.vaultCovered.toLocaleString()} U • หักกระเป๋า {nextRankFinancials?.walletDeficit.toLocaleString()} U)
                    </span>
                    {nextRankFinancials?.canAfford ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold">
                        พร้อมซื้อทันที ✅
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10.5px] font-bold">
                        ขาดอีก {nextRankFinancials?.missing.toLocaleString()} USDT ⚠️
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                    👑 รหัสนี้ปลดล็อคครบทั้ง 45 ผังแล้ว (ระดับสูงสุด)
                  </div>
                )}
              </div>

              {/* Quick Auto Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Auto Topup helper if deficit */}
                {nextRankFinancials && !nextRankFinancials.canAfford && onTopupWallet && currentWallet && (
                  <button
                    type="button"
                    onClick={() => onTopupWallet(currentWallet.address, nextRankFinancials.missing)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all flex items-center gap-1"
                    title={`เติมเงิน ${nextRankFinancials.missing.toLocaleString()} USDT ให้พอซื้อผังที่ ${nextEligibleRank}`}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ เติม {nextRankFinancials.missing.toLocaleString()} U</span>
                  </button>
                )}

                {/* Auto Buy Next Rank Button */}
                {nextEligibleRank && (
                  <button
                    type="button"
                    disabled={isProcessingPurchase || !nextRankFinancials?.canAfford}
                    onClick={() => handleExecutePurchaseRank(nextEligibleRank)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                      !nextRankFinancials?.canAfford
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white active:scale-95 shadow-purple-500/25'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ Auto ซื้อผังต่อไป (ผัง {nextEligibleRank})</span>
                  </button>
                )}

                {/* Multi-rank Chain Auto Purchase Button */}
                {affordableNextRanksChain.length > 1 && (
                  <button
                    type="button"
                    disabled={isProcessingPurchase}
                    onClick={handleExecuteAutoBuyChain}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white active:scale-95 shadow-emerald-500/25"
                    title={`ซื้อต่อเนื่องทีเดียว ${affordableNextRanksChain.length} ผัง: ผังที่ ${affordableNextRanksChain[0].rank} ถึง ${affordableNextRanksChain[affordableNextRanksChain.length - 1].rank}`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                    <span>🚀 Auto ซื้อต่อเนื่อง {affordableNextRanksChain.length} ผัง</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-indigo-500/30">
              {/* Node Selector (always accessible with all Main IDs including ID 1) */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">รหัสที่ดำเนินการ:</span>
                <select
                  value={activeUserMainNode?.id || 1}
                  onChange={(e) => setPurchaseNodeId(Number(e.target.value))}
                  className="bg-slate-900 border border-indigo-500/60 text-white rounded-lg px-2.5 py-1 text-xs font-mono font-bold cursor-pointer max-w-[220px] sm:max-w-[280px]"
                >
                  {/* Current Wallet's Nodes */}
                  {userEligibleNodes.length > 0 && (
                    <optgroup label={`⭐ กระเป๋าปัจจุบัน (${currentWallet?.name || 'My Wallet'})`}>
                      {userEligibleNodes.map((n, idx) => (
                        <option key={`my-eligible-${n.id}-${idx}`} value={n.id}>
                          #{n.id} (Rank {n.rank || 1}) • {getWalletName(n.owner)}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* All Main IDs in System (Including ID #1) */}
                  <optgroup label="👑 รหัสหลักทั้งหมดในระบบ (รวม #1 id1)">
                    {allMainNodes.map((n, idx) => (
                      <option key={`all-main-eligible-${n.id}-${idx}`} value={n.id}>
                        #{n.id} {n.id === 1 ? '👑 [id1]' : `[Rank ${n.rank || 1}]`} • {getWalletName(n.owner)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Purchase Button & Faucet Button */}
              <div className="flex items-center space-x-2">
                {((selectedRank === 1 && userWalletBalance < targetRankPrice) || (selectedRank > 1 && walletDeficit > userWalletBalance)) && onTopupWallet && currentWallet && (
                  <button
                    type="button"
                    onClick={() => onTopupWallet(currentWallet.address, Math.max(1000, selectedRank === 1 ? 100 : walletDeficit))}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center space-x-1"
                    title="เติม USDT สำหรับทดสอบซื้อผัง"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ เติม USDT ทดสอบ</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    isProcessingPurchase ||
                    ((selectedRank >= 2 && isAlreadyInRankQueue) || (selectedRank === 1 && activeUserMainNode)
                      ? (!nextEligibleRank || !nextRankFinancials?.canAfford)
                      : isSkippingRank
                      ? (!nextEligibleRank || !nextRankFinancials?.canAfford)
                      : selectedRank === 1
                      ? userWalletBalance < targetRankPrice
                      : (!canAffordRank && walletDeficit > userWalletBalance))
                  }
                  onClick={() => {
                    if ((selectedRank >= 2 && isAlreadyInRankQueue) || (selectedRank === 1 && activeUserMainNode)) {
                      // Already in selected rank -> Auto purchase next eligible rank!
                      if (nextEligibleRank) {
                        handleExecutePurchaseRank(nextEligibleRank);
                      }
                    } else if (selectedRank >= 2 && isSkippingRank) {
                      // Skipping rank -> Auto purchase correct next eligible rank!
                      if (nextEligibleRank) {
                        handleExecutePurchaseRank(nextEligibleRank);
                      }
                    } else {
                      // Purchase selected rank
                      handleExecutePurchaseRank(selectedRank);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center space-x-2 ${
                    isProcessingPurchase
                      ? 'bg-slate-800 text-slate-400 cursor-wait'
                      : ((selectedRank >= 2 && isAlreadyInRankQueue) || (selectedRank === 1 && activeUserMainNode))
                      ? nextEligibleRank
                        ? nextRankFinancials?.canAfford
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-purple-500/25 active:scale-95'
                          : 'bg-purple-950/80 text-purple-300 border border-purple-500/50 cursor-not-allowed opacity-90'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 cursor-not-allowed opacity-90'
                      : isSkippingRank
                      ? nextEligibleRank
                        ? nextRankFinancials?.canAfford
                          ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-amber-500/25 active:scale-95'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/50 cursor-not-allowed opacity-90'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/50 cursor-not-allowed opacity-90'
                      : (selectedRank === 1 ? userWalletBalance >= targetRankPrice : canAffordRank)
                      ? 'bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white shadow-indigo-500/20 active:scale-95'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {((selectedRank >= 2 && isAlreadyInRankQueue) || (selectedRank === 1 && activeUserMainNode)) ? (
                    nextEligibleRank ? (
                      <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )
                  ) : isSkippingRank ? (
                    nextEligibleRank ? (
                      <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  )}
                  <span>
                    {isProcessingPurchase
                      ? 'กำลังประมวลผล...'
                      : ((selectedRank >= 2 && isAlreadyInRankQueue) || (selectedRank === 1 && activeUserMainNode))
                      ? nextEligibleRank
                        ? nextRankFinancials?.canAfford
                          ? `🚀 Auto ซื้อผังต่อไป: ผังที่ ${nextEligibleRank} (${nextRankFinancials.info.title}) [หักกระเป๋า ${nextRankFinancials.walletDeficit.toLocaleString()} U]`
                          : `⚠️ Auto แนะนำผังที่ ${nextEligibleRank} (${nextRankFinancials?.info.title}) [ขาดอีก ${nextRankFinancials?.missing.toLocaleString()} USDT]`
                        : `👑 ปลดล็อคครบทุกผังแล้ว (รหัส #${activeUserMainNode?.id} ถึง Rank 45 สูงสุด)`
                      : isSkippingRank
                      ? nextEligibleRank
                        ? nextRankFinancials?.canAfford
                          ? `🎯 Auto แนะนำ ➔ ซื้อผังที่ ${nextEligibleRank} (${nextRankFinancials.info.title}) ตามลำดับ`
                          : `⚠️ ต้องซื้อผังที่ ${nextEligibleRank} ก่อน (ขาดอีก ${nextRankFinancials?.missing.toLocaleString()} USDT)`
                        : `⚠️ ไม่สามารถซื้อข้ามผังได้`
                      : selectedRank === 1
                      ? `💎 สมัคร / เปิดรหัสใหม่ ผัง 1 (${targetRankPrice.toLocaleString()} USDT)`
                      : vaultCovered >= targetRankPrice
                      ? `🎉 ซื้อผังที่ ${selectedRank} ด้วย 40% Vault (ฟรี 100%)`
                      : vaultCovered > 0
                      ? `💎 ซื้อผังที่ ${selectedRank} (หัก Vault ${vaultCovered.toLocaleString()} U + กระเป๋า ${walletDeficit.toLocaleString()} U)`
                      : `💎 ซื้อผังที่ ${selectedRank} (${targetRankPrice.toLocaleString()} USDT)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeNodes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <GitBranch className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-100">
              ผังที่ {selectedRank}: {currentRankInfo.title} ({currentRankInfo.price.toLocaleString()} USDT)
            </h3>
            <p className="text-xs text-slate-400">
              ยังไม่มีสมาชิกลงสายงานในผังนี้
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Top Main Navigation Tabs for Mobile & Desktop */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* View Mode Tabs */}
            <div className="flex items-center space-x-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-stretch sm:self-auto overflow-x-auto">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                  viewMode === 'tree'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>{t('viewTree2D')}</span>
                <span className="text-[9px] font-mono bg-indigo-900/70 border border-indigo-700/60 px-1.5 py-0.2 rounded text-indigo-200">
                  โหมดหลัก
                </span>
              </button>

              <button
                onClick={() => setViewMode('15levels')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                  viewMode === '15levels'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('view15Levels')}</span>
              </button>

              <button
                onClick={() => setViewMode('step')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                  viewMode === 'step'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t('viewStepNav')}</span>
              </button>
            </div>

            {/* Focus selector on header */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs text-slate-300">
              <span className="text-slate-400 hidden xs:inline flex items-center gap-1 font-medium">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                <span>หัวผัง (Root):</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const ids = activeNodes.map((n) => n.id).sort((a, b) => a - b);
                  const idx = ids.indexOf(rootDisplayId);
                  const prev = idx > 0 ? ids[idx - 1] : ids[ids.length - 1];
                  setRootDisplayId(prev);
                  onSelectNode(prev);
                }}
                title="ID ก่อนหน้า"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={rootDisplayId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRootDisplayId(val);
                  onSelectNode(val);
                }}
                className="bg-slate-800 text-slate-200 text-xs rounded-xl border border-slate-700 px-2 py-1 max-w-[140px] xs:max-w-[170px] truncate font-medium font-mono cursor-pointer"
              >
                {activeNodes.map((n, idx) => {
                  const mainId = n.originalAncestorId || n.rebornFromNodeId || n.id;
                  const globalNodeId = n.queueNumber || n.id;
                  return (
                    <option key={`root-opt-${n.id}-${idx}`} value={n.id}>
                      {selectedRank === 1
                        ? `#${n.id} ${n.id === 1 ? '👑' : n.isRebirth ? '🌱' : ''}`
                        : n.isRebirth
                        ? `#${mainId}#${n.id}(${globalNodeId}) 🌱 Rebirth`
                        : `#${mainId}(${globalNodeId}) ${globalNodeId === 1 ? '👑 Global Pioneer' : ''}`}{' '}
                      ({getWalletName(n.owner)})
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={() => {
                  const ids = activeNodes.map((n) => n.id).sort((a, b) => a - b);
                  const idx = ids.indexOf(rootDisplayId);
                  const next = idx < ids.length - 1 ? ids[idx + 1] : ids[0];
                  setRootDisplayId(next);
                  onSelectNode(next);
                }}
                title="ID ถัดไป"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              {rootDisplayId !== (activeNodes[0]?.id || 1) && (
                <button
                  onClick={() => {
                    const firstId = activeNodes[0]?.id || 1;
                    setRootDisplayId(firstId);
                    onSelectNode(firstId);
                  }}
                  className="p-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700 text-indigo-300 hover:text-white"
                  title="กลับไปรหัสเริ่มต้น"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}

              {/* Search Button in Header */}
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow transition-all flex items-center space-x-1 border border-indigo-400/40 ml-1 active:scale-95"
                title="คลิกเพื่อค้นหารหัสในผัง (ID / เจ้าของ)"
              >
                <Search className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">ค้นหารหัส</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: 15-LEVEL EXPLORER (Full 15 Levels Layout) */}
          {viewMode === '15levels' && (
            <FifteenLevelExplorer
              nodes={activeNodes}
              wallets={wallets}
              rootId={rootDisplayId}
              onChangeRootId={setRootDisplayId}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onQuickRegisterUnder={onQuickRegisterUnder}
              rankPrice={currentRankInfo.price}
            />
          )}

          {/* VIEW 2: 2D BINARY TREE (Mobile Optimized) */}
          {viewMode === 'tree' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 notranslate" translate="no">
              {/* Tree Visualization Stage (3 Columns) */}
              <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-xl flex flex-col">
                {/* Visualizer Controls Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-indigo-400 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide">
                        ผังต้นไม้ไบนารี่ 1 แตก 2 (ผังที่ {selectedRank}: {currentRankInfo.title})
                      </h3>
                    </div>

                    {/* If any rebirth nodes exist, show prominent quick popup button */}
                    {activeNodes.some((n) => n.isRebirth) && (
                      <button
                        type="button"
                        onClick={() => handleOpenRebirthModal()}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/60 text-purple-200 text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ml-1"
                        title="คลิกเพื่อเปิดหน้าต่างป๊อปอัพข้อมูลรหัสโคลนนิ่ง (Rebirth Modal)"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>รหัสโคลนนิ่ง ({activeNodes.filter((n) => n.isRebirth).length} รหัส)</span>
                        <span className="text-[10px] bg-purple-950 px-1.5 py-0.2 rounded border border-purple-700 text-purple-100 font-mono">
                          เปิดป๊อปอัพ ⇲
                        </span>
                      </button>
                    )}

                    {/* Cloning Queue System Button */}
                    <button
                      type="button"
                      onClick={() => setIsQueueModalOpen(true)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ml-1 ${
                        totalPendingCloningCount > 0
                          ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border-amber-500/80 text-amber-200 ring-1 ring-amber-500/40 animate-pulse-subtle'
                          : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-200'
                      }`}
                      title="คลิกเพื่อเปิดหน้าต่างระบบคิวรอโคลนนิ่ง (Cloning Queue System)"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${totalPendingCloningCount > 0 ? 'animate-spin-slow' : ''}`} />
                      <span>คิวรอโคลนนิ่ง ({totalPendingCloningCount} คิว)</span>
                      <span className="text-[10px] bg-amber-950/90 px-1.5 py-0.2 rounded border border-amber-600/60 text-amber-100 font-mono">
                        เปิดคิว ⇲
                      </span>
                    </button>

                    {/* Tree Search Button */}
                    <button
                      type="button"
                      onClick={() => setIsSearchModalOpen(true)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500/60 text-indigo-200 text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ml-1"
                      title="คลิกเพื่อเปิดหน้าต่างค้นหารหัสในผัง (Tree Search)"
                    >
                      <Search className="w-3.5 h-3.5 text-amber-300" />
                      <span>ค้นหาผัง</span>
                    </button>
                  </div>

              {/* Depth & Compact Toggles */}
              <div className="flex items-center justify-between sm:justify-end space-x-1.5 flex-wrap gap-y-1">
                {/* Depth selector */}
                <div className="flex items-center space-x-1 border border-slate-700 rounded-lg bg-slate-800 px-1.5 py-0.5 text-[11px]">
                  <span className="text-slate-400 font-medium">การแสดง:</span>
                  {[
                    { label: '2ชั้น', val: 2, title: 'แสดง 2 ชั้น' },
                    { label: '3ชั้น', val: 3, title: 'แสดง 3 ชั้น' },
                    { label: '4ชั้น', val: 4, title: 'แสดง 4 ชั้น' },
                    { label: '5ชั้น', val: 5, title: 'แสดง 5 ชั้น' },
                    { label: '15ชั้น', val: 15, title: 'แสดง 15 ชั้น' },
                    { label: 'เลือกทั้งหมด', val: 999, title: `แสดงทุกชั้นทั้งหมดในผัง (${maxAvailableDepth + 1} ชั้น)` },
                  ].map((opt) => (
                    <button
                      key={`depth-btn-${opt.val}`}
                      onClick={() => {
                        setTreeDepth(opt.val);
                        if ((opt.val === 15 || opt.val === 999) && zoomLevel > 0.5) {
                          setZoomLevel(0.35);
                        }
                      }}
                      title={opt.title}
                      className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                        treeDepth === opt.val
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Compact card toggle */}
                <button
                  key="toggle-compact-btn"
                  onClick={() => setCompactCards(!compactCards)}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-colors ${
                    compactCards
                      ? 'bg-indigo-900/60 border-indigo-700 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title="สลับขนาดการ์ดเพื่อดูง่ายบนมือถือ"
                >
                  <span>{compactCards ? 'การ์ดมินิ (มือถือ)' : 'การ์ดปกติ'}</span>
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-1 border border-slate-700 rounded-lg bg-slate-800 p-0.5">
                  <button
                    key="btn-zoom-out"
                    onClick={() => setZoomLevel((z) => Math.max(0.15, +(z - 0.1).toFixed(2)))}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                    title="ย่อขนาด (Zoom Out)"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span key="span-zoom-pct" className="text-[10px] font-mono px-1 text-slate-300 min-w-[32px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    key="btn-zoom-in"
                    onClick={() => setZoomLevel((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                    title="ขยายขนาด (Zoom In)"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  <button
                    key="btn-zoom-fit"
                    onClick={() => setZoomLevel(0.85)}
                    className="px-1.5 py-0.5 text-[9px] text-slate-300 rounded bg-slate-700/60 hover:bg-slate-700"
                    title="รีเซ็ตขนาดปกติ (85%)"
                  >
                    Fit
                  </button>
                  {treeDepth === 999 || treeDepth === 15 ? (
                    <button
                      key="btn-zoom-all"
                      onClick={() => setZoomLevel(0.3)}
                      className="px-1.5 py-0.5 text-[9px] text-indigo-300 rounded bg-indigo-950/80 border border-indigo-700/60 hover:bg-indigo-900"
                      title="ย่อดูภาพรวม 15 ชั้น"
                    >
                      ภาพรวม
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Mobile Touch Notice */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80 mb-2">
              <span className="flex items-center space-x-1">
                <Smartphone className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>
                  {treeDepth === 999
                    ? `🌐 แสดงผังต้นไม้ทุกชั้นทั้งหมด (ลึก ${maxAvailableDepth + 1} ชั้น) แตะเลื่อนหรือย่อ-ขยายเพื่อสำรวจ`
                    : 'แตะเลื่อนซ้าย-ขวา เพื่อสำรวจผัง หรือคลิกที่รหัสเพื่อเจาะลึก'}
                </span>
              </span>
              <span className="text-indigo-300 font-mono shrink-0">
                {treeDepth === 999 ? `ทั้งหมด (${maxAvailableDepth + 1} ชั้น)` : `${treeDepth} ชั้น`} • Zoom: {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            {/* Quick Relocate Notice for #8 under #7 */}
            {nodeMap.has(8) && nodeMap.get(8)?.parentId === 3 && nodeMap.has(7) && (nodeMap.get(7)?.leftChild === 0 || nodeMap.get(7)?.rightChild === 0) && (
              <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/90 via-indigo-950/90 to-purple-950/90 border border-amber-500/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2.5 text-xs text-amber-200">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-100 flex items-center space-x-1.5">
                      <span>🔄 ตรวจพบรหัส #8 (โคลนรอบ 1 ของ #2) วางอยู่ใต้ #3</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      ตามกฎโคลนรอบ 1 (ช่วยสายงานผู้แนะนำ): ขาตรงของ #1 เต็มแล้ว ➔ ต้องไปต่อใต้รหัสโคลนนิ่งของผู้แนะนำ <strong className="text-emerald-300">#7</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onRelocateNode) {
                      const n7 = nodeMap.get(7)!;
                      const useLeft = n7.leftChild === 0;
                      onRelocateNode(8, 7, useLeft);
                    }
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer shrink-0 active:scale-95 ring-2 ring-emerald-400/50"
                >
                  <ArrowLeftRight className="w-4 h-4 text-slate-950" />
                  <span className="font-black text-slate-950">กดคลิกเดียว: ย้าย #8 ไปต่อใต้ #7 ทันที</span>
                </button>
              </div>
            )}

            {/* ⏳ Active Auto Countdown Notification Banner */}
            {autoCountdown > 0 && (
              <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/95 via-purple-950/95 to-slate-950 border-2 border-amber-500/70 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xl animate-pulse text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shrink-0">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <div className="font-extrabold text-amber-300 flex items-center space-x-2 flex-wrap">
                      <span>⏳ {autoTaskType || 'Auto โคลนนิ่ง & เกิดใหม่'}</span>
                      {autoTotalRounds > 1 && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/50">
                          รอบละ 1 รหัส (ไล่จากน้อยไปมาก)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      ระบบจะจัดวางตำแหน่งลงผังรอบนี้ในอีก <strong className="text-amber-400 font-mono text-sm font-bold">{autoCountdown}</strong> วินาที
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0 flex-wrap">
                  {onExecuteAutoNow && (
                    <button
                      type="button"
                      onClick={onExecuteAutoNow}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                      title="รันรอบปัจจุบัน 1 รหัสทันที"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
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
                      <span>รันหมด ({autoTotalRounds} รอบ)</span>
                    </button>
                  )}
                  {onCancelAuto && (
                    <button
                      type="button"
                      onClick={onCancelAuto}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                    >
                      ✕ หยุด/ข้าม
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pending Queue Alert Banner */}
            {totalPendingCloningCount > 0 && (
              <div className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shrink-0">
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-200 flex items-center space-x-2">
                      <span>⏳ มีรหัสที่เข้าคิวรอโคลนนิ่งอยู่ในผังนี้ ({totalPendingCloningCount} คิว)</span>
                      <span className="px-2 py-0.2 rounded bg-amber-500/30 text-amber-100 text-[10px] font-mono border border-amber-400/40 font-bold">
                        Rank {selectedRank}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      สมาชิกลงลูกขาขวาเต็มแล้ว และติดคิวรอรับรหัสโคลนนิ่งใหม่เข้าผัง
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0 flex-wrap gap-1.5">
                  {onBatchExecuteRebirths && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          onBatchExecuteRebirths();
                          setPurchaseSuccessToast(`⚡ สั่งโคลนนิ่งรหัสที่รอค้างสำเร็จ!`);
                          setTimeout(() => setPurchaseSuccessToast(null), 5000);
                        } catch (e: any) {
                          setPurchaseErrorToast(e.message || 'เกิดข้อผิดพลาดในการโคลนนิ่ง');
                          setTimeout(() => setPurchaseErrorToast(null), 5000);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>⚡ สั่งโคลนทันที (Execute All)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsQueueModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-1.5 border border-amber-400/40"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-200" />
                    <span>เปิดระบบคิวรอโคลนนิ่ง</span>
                    <span className="font-mono text-[10px]">⇲</span>
                  </button>
                </div>
              </div>
            )}

            {/* Color Legend Bar */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-[11px] bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80 mb-2">
              <span className="text-slate-400 font-semibold shrink-0">คำอธิบายสีกรอบ:</span>
              <span className="inline-flex items-center space-x-1 font-medium text-emerald-300 bg-emerald-950/60 border-2 border-emerald-600 px-2 py-0.5 rounded-lg shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>🟢 กรอบเขียวเข้ม: รหัสโคลนนิ่ง (Rebirth)</span>
              </span>
              <span className="inline-flex items-center space-x-1 font-medium text-amber-300 bg-amber-950/60 border-2 border-amber-500 px-2 py-0.5 rounded-lg shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>🟡 กรอบเหลืองเข้ม: สมัครจากยอด 40% (Upgrade / Excess Vault)</span>
              </span>
              <span className="inline-flex items-center space-x-1 font-medium text-slate-300 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>⚪ กรอบปกติ: สมาชิกทั่วไป</span>
              </span>
            </div>

            {/* Tree Canvas Area (Mobile Scrolling Fixed with Centered Flex Box) */}
            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[380px] sm:min-h-[460px] p-2 sm:p-6 bg-slate-950/80 rounded-xl border border-slate-800/80 touch-pan-x cursor-grab active:cursor-grabbing">
              <div className="w-full min-w-max flex justify-center items-start">
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="inline-block pt-2 pb-10"
                >
                  {renderTreeNode(rootDisplayId, 0, treeDepth)}
                </div>
              </div>
            </div>

            {/* Footer Legend */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-400 inline-block" />
                  <span>ซ้าย: แบ่ง 100% (30% + 30% + 40%)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500/30 border border-purple-400 inline-block" />
                  <span>ขวา: 100% Rebirth</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                เลือกแสดง "15ชั้น" หรือสลับแท็บ "📊 ผังสายงาน 15 ชั้น" เพื่อสำรวจสายงาน 15 ชั้นเชิงลึก
              </span>
            </div>
          </div>

          {/* Node Inspector Panel (1 Column) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                  {selectedRank >= 2 && selectedNode ? (
                    <>
                      รายละเอียดรหัส #{selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || selectedNode.id}({selectedNode.queueNumber || selectedNode.id})
                    </>
                  ) : selectedNode?.isRebirth ? (
                    <>
                      รายละเอียดรหัส #{selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || 1}({selectedNode.id})
                    </>
                  ) : (
                    `รายละเอียดรหัส #${selectedNode?.id || 1}`
                  )}
                </h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                {selectedNode?.isRebirth ? (
                  <>
                    <span className="text-amber-300 font-extrabold">
                      #{selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || 1}
                    </span>
                    <span className="text-purple-300 font-bold">#{selectedNode.id}</span>
                    <span className="text-indigo-200">({selectedNode.queueNumber || selectedNode.id})</span>
                  </>
                ) : selectedRank >= 2 && selectedNode ? (
                  <>
                    <span className="text-amber-300 font-extrabold">
                      #{selectedNode.id}
                    </span>
                    <span className="text-indigo-200">({selectedNode.queueNumber || selectedNode.id})</span>
                  </>
                ) : (
                  <span className="flex items-center space-x-1">
                    <span className="text-emerald-300 font-bold">👑 ไอดีหลัก ID #{selectedNode?.id}</span>
                  </span>
                )}
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                {/* Fast Action to Focus this Node */}
                <button
                  type="button"
                  onClick={() => setRootDisplayId(selectedNode.id)}
                  className="w-full py-1.5 px-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ตั้ง #{selectedNode.id} เป็นหัวผังแสดงผล</span>
                </button>

                {/* Wallet & Status */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">สถานะไอดี:</span>
                    {selectedNode.isRebirth ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                        🌱 รหัสโคลนนิ่ง (Rebirth)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center space-x-1">
                        <span>👑 ไอดีหลัก (Main ID)</span>
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">เจ้าของ (Owner):</span>
                    <span className="font-semibold text-slate-200">
                      {getWalletName(selectedNode.owner)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">กระเป๋า (Address):</span>
                    <span className="font-mono text-[10px] text-slate-300 truncate max-w-[130px]">
                      {selectedNode.owner}
                    </span>
                  </div>
                  {selectedNode.isRebirth && (
                    <div className="space-y-1.5 bg-purple-950/60 border border-purple-800/80 p-2.5 rounded-lg">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-purple-300 font-semibold flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>รอบเกิดใหม่ (Rebirth Round):</span>
                        </span>
                        {(() => {
                          const oId = selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || selectedNode.id;
                          const sibs = nodes
                            .filter((n) => n.isRebirth && (n.originalAncestorId === oId || n.rebornFromNodeId === oId))
                            .sort((a, b) => a.id - b.id);
                          const rIndex = sibs.findIndex((n) => n.id === selectedNode.id) + 1;
                          const cIndex = Math.floor((rIndex - 1) / 2) + 1;
                          const rInCycle = ((rIndex - 1) % 2) + 1;

                          return (
                            <span className="font-mono font-extrabold text-amber-300 px-2 py-0.5 rounded bg-purple-900 border border-purple-700 text-xs">
                              รอบที่ {rIndex > 0 ? rIndex : 1} ({rInCycle === 1 ? 'รอบ 1 ติดตัวผู้แนะนำ' : 'รอบ 2 ช่วยชุมชน'})
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex justify-between items-center border-t border-purple-900/60 pt-1.5">
                        <span className="text-purple-200 text-xs">เกิดมาจากรหัสหลัก:</span>
                        <button
                          onClick={() => {
                            const originId = selectedNode.originalAncestorId || selectedNode.rebornFromNodeId;
                            if (originId && originId > 0) onSelectNode(originId);
                          }}
                          className="font-mono font-bold text-amber-300 hover:text-amber-200 underline text-xs px-2 py-0.5 rounded bg-purple-900/80 border border-purple-700/60 flex items-center space-x-1 cursor-pointer"
                          title="คลิกเพื่อไปดูรหัสต้นทางที่ให้กำเนิดรหัสเกิดใหม่นี้"
                        >
                          <span>ID #{selectedNode.originalAncestorId || selectedNode.rebornFromNodeId}</span>
                          <span className="text-[10px] text-purple-200 font-normal">({getWalletName(selectedNode.owner)})</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">อัพไลน์ (Parent):</span>
                    <button
                      onClick={() => selectedNode.parentId > 0 && onSelectNode(selectedNode.parentId)}
                      className={`font-mono font-bold ${
                        selectedNode.parentId > 0
                          ? 'text-indigo-400 hover:underline'
                          : 'text-slate-500 cursor-default'
                      }`}
                    >
                      {selectedNode.parentId > 0 ? `#${selectedNode.parentId}` : 'ไม่มี (Root Node)'}
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Direct Upline:</span>
                    {selectedNode.id === 1 ? (
                      <span className="font-mono font-bold text-indigo-400 text-xs">
                        #1
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const sId = selectedNode.sponsorNodeId || 1;
                          if (sId > 0) onSelectNode(sId);
                        }}
                        className="font-mono font-bold text-indigo-400 hover:underline text-xs flex items-center space-x-1"
                      >
                        <span>#{selectedNode.sponsorNodeId || 1}</span>
                        {selectedNode.isRebirth && (
                          <span className="text-[10px] text-amber-300 font-normal ml-1 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded">
                            (ดึงจาก ID หลัก)
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ความลึก (Depth):</span>
                    <span className="font-mono text-slate-200">ชั้นที่ {selectedNode.depth}</span>
                  </div>
                  {selectedNode.createdVia && (
                    <div className="flex justify-between border-t border-slate-700/40 pt-1.5">
                      <span className="text-slate-400">แหล่งกำเนิด (Origin):</span>
                      <span className="font-semibold text-indigo-300">
                        {selectedNode.createdVia}
                      </span>
                    </div>
                  )}
                </div>

                {/* Block 1: Financial Status of this Node in this SPECIFIC RANK */}
                {(() => {
                  const mainId = selectedNode.isRebirth
                    ? (selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || selectedNode.id)
                    : selectedNode.id;

                  const familyNodesInActive = activeNodes.filter((n) => {
                    const nodeId = 'nodeId' in n ? (n as any).nodeId : n.id;
                    const isRebirth = n.isRebirth;
                    const ancestorId = n.originalAncestorId || (n as any).rebornFromNodeId;
                    return nodeId === mainId || (isRebirth && ancestorId === mainId);
                  });

                  // If no family nodes found in active rank queue, fallback to currentRankNode
                  const currentRankNode = activeNodes.find((n) => {
                    const idInActive = 'nodeId' in n ? (n as any).nodeId : n.id;
                    return idInActive === selectedNode.id;
                  }) || selectedNode;

                  const totalDirectEarnedInRank = familyNodesInActive.length > 0
                    ? familyNodesInActive.reduce((sum, n) => sum + (n.totalDirectEarned || 0), 0)
                    : currentRankNode.totalDirectEarned;

                  // 30% Level Bonus คิดแยกเฉพาะของแต่ละ ID ตามโครงสร้างต้นไม้เมทริกซ์ของ ID นั้นๆ จริง
                  const totalLevelEarnedInRank = currentRankNode.totalLevelEarned;

                  const upgradeVaultInRank = familyNodesInActive.length > 0
                    ? familyNodesInActive.reduce((sum, n) => sum + (n.upgradeVault || 0), 0)
                    : currentRankNode.upgradeVault;

                  const cloneCount = familyNodesInActive.filter(n => {
                    const nid = 'nodeId' in n ? (n as any).nodeId : n.id;
                    return nid !== mainId;
                  }).length;

                  return (
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-2.5">
                      <h5 className="font-semibold text-slate-200 text-xs flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                        <span className="flex items-center space-x-1.5">
                          <Coins className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ผลประโยชน์เฉพาะผังนี้ (ผัง {selectedRank} ไอดีที่ {selectedNode.id})</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
                          RANK {selectedRank}
                        </span>
                      </h5>

                      <div className="flex justify-between items-center py-0.5 text-xs">
                        <span className="text-slate-400">30% Direct Upline ในผังนี้:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{totalDirectEarnedInRank.toFixed(2)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 text-xs">
                        <span className="text-slate-400">30% Level Bonus ในผังนี้:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +{totalLevelEarnedInRank.toFixed(2)} USDT
                        </span>
                      </div>

                      {cloneCount > 0 && (
                        <div className="text-[10px] text-emerald-300 font-medium text-center pt-1 border-t border-slate-700/40">
                          (ยอดแนะนำรวม ID หลัก + โคลนนิ่ง | Level Bonus คิดแยกเฉพาะ ID)
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Block 2: Consolidated Financial Status ACROSS ALL RANKS */}
                {(() => {
                  const isClone = Boolean(selectedNode.isRebirth);
                  const rootId = (isClone && selectedNode.originalAncestorId && selectedNode.originalAncestorId > 0)
                    ? selectedNode.originalAncestorId
                    : selectedNode.id;
                  const sameIdNodes = nodes.filter((n) => {
                    const nRootId = (n.isRebirth && n.originalAncestorId && n.originalAncestorId > 0) ? n.originalAncestorId : n.id;
                    return nRootId === rootId;
                  });
                  const idFamilyVault = getNodeFamilyUpgradeVault
                    ? getNodeFamilyUpgradeVault(rootId, selectedRank)
                    : sameIdNodes.reduce((sum, n) => sum + (n.upgradeVault || 0), 0);
                  const rebirthCount = nodes.filter((n) => n.id !== rootId && n.isRebirth && (n.originalAncestorId === rootId || n.rebornFromNodeId === rootId)).length;

                  // Sum up all earnings of this specific owner address across ALL ranks
                  const earnings = getFamilyEarningsSummary
                    ? getFamilyEarningsSummary(selectedNode.id)
                    : { totalDirectEarned: 0, totalLevelEarned: 0 };
                  const allRanksDirectEarned = earnings.totalDirectEarned;
                  const allRanksLevelEarned = earnings.totalLevelEarned;

                  const summary1to5 = getFamilyExcessRebirthVaultSummary
                    ? getFamilyExcessRebirthVaultSummary(rootId)
                    : { excessVault: 0, newMainIdCountPossible: 0, systemTotal: 0 };

                  const summary6to45 = getFamilyExcessVaultRank6To45Summary
                    ? getFamilyExcessVaultRank6To45Summary(rootId)
                    : { excessVault: 0, canCreateNewID: false, systemTotal: 0 };

                  return (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 space-y-2.5 shadow-md">
                      <h5 className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5 border-b border-indigo-500/20 pb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        <span className="text-indigo-200">ผลประโยชน์สะสมรวมทุกผัง (ไอดีที่ {selectedNode.id})</span>
                      </h5>

                      <div className="flex justify-between items-center py-0.5 text-xs">
                        <span className="text-slate-400">30% Direct Upline (ทุกผัง):</span>
                        <span className="font-mono font-bold text-indigo-300">
                          +{allRanksDirectEarned.toFixed(2)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 text-xs">
                        <span className="text-slate-400">30% Level Bonus (ทุกผัง):</span>
                        <span className="font-mono font-bold text-indigo-300">
                          +{allRanksLevelEarned.toFixed(2)} USDT
                        </span>
                      </div>

                      {/* Divider and new metrics requested by user */}
                      <div className="border-t border-indigo-500/15 pt-2 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>40% Vault เม็ดซ้าย (ย้อนหลัง 5 ผัง):</span>
                          </span>
                          <span className="font-mono font-bold text-amber-400 text-right">
                            {idFamilyVault.toFixed(2)} USDT
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>ยอดส่วนเกินไอดี #{rootId} (ผัง 1-5):</span>
                          </span>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-mono font-bold text-indigo-300">
                              {summary1to5.excessVault.toFixed(2)} / 5.00 U
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold shrink-0">
                              เปิดได้: {summary1to5.newMainIdCountPossible ?? 0} ไอดี
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>ยอดส่วนเกินไอดี #{rootId} (ผัง 6-45):</span>
                          </span>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-mono font-bold text-emerald-300">
                              {summary6to45.excessVault.toFixed(2)} USDT
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              summary6to45.canCreateNewID 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-slate-800 text-slate-500'
                            }`}>
                              {summary6to45.canCreateNewID ? 'พร้อมเปิดรหัส' : 'รอสะสม'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Block 2.5: Income and Level Bonus History Log */}
                {(() => {
                  const mainId = selectedNode.isRebirth
                    ? (selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || selectedNode.id)
                    : selectedNode.id;

                  const familyNodeIds = nodes
                    .filter((n) => {
                      const isRebirth = n.isRebirth;
                      const ancestorId = n.originalAncestorId || n.rebornFromNodeId;
                      return n.id === mainId || (isRebirth && ancestorId === mainId);
                    })
                    .map((n) => n.id);

                  const nodeBonusLogs = (logs || []).filter((log) => {
                    return (
                      (log.type === 'LEVEL_BONUS' || log.type === 'DIRECT_BONUS') &&
                      log.nodeId !== undefined &&
                      familyNodeIds.includes(log.nodeId)
                    );
                  });

                  return (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                      <h5 className="font-semibold text-slate-200 text-xs flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="flex items-center space-x-1.5">
                          <History className="w-3.5 h-3.5 text-indigo-400" />
                          <span>ประวัติโบนัส (ค่าชั้น & แนะนำตรง)</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsBonusHistoryOpen(true)}
                            className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1"
                            title="เปิดตารางประวัติคำนวณและตัวกรองละเอียด"
                          >
                            <span>📊 ดูตารางประวัติ</span>
                          </button>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono font-bold">
                            {nodeBonusLogs.length}
                          </span>
                        </div>
                      </h5>

                      {nodeBonusLogs.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-[11px]">
                          ยังไม่มีประวัติการรับโบนัสของตระกูล ID นี้
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                          {nodeBonusLogs.map((log) => {
                            const isLevel = log.type === 'LEVEL_BONUS';
                            const bonusRank = log.details?.rank || 1;
                            return (
                              <div
                                key={log.id}
                                className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col space-y-1 text-[11px]"
                              >
                                <div className="flex justify-between items-center">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    isLevel ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  }`}>
                                    {isLevel ? `ค่าชั้น (Rank ${bonusRank})` : `แนะนำตรง (Rank ${bonusRank})`}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                                <div className="text-slate-200 leading-relaxed font-sans text-[10.5px]">
                                  {log.description}
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5 border-t border-slate-900/60 font-mono">
                                  <span>รหัสผู้รับ: #{log.nodeId}</span>
                                  <span className="text-emerald-400 font-bold font-sans">+{log.amount?.toFixed(2)} USDT</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Rebirth Status / Main ID Status */}
                {(() => {
                  const isNodeRebirth = Boolean(selectedNode.isRebirth);
                  const ancestorId = selectedNode.originalAncestorId || selectedNode.id;
                  
                  // ดึงข้อมูลกระเป๋าเจ้าของโหนดนี้ (อ้างอิงเลขกระเป๋า)
                  const ownerWallet = wallets.find(
                    (w) => w.address.toLowerCase() === selectedNode.owner.toLowerCase()
                  );
                  const walletRebirthCount = ownerWallet?.rebirthCount ?? selectedNode.rebirthCount;
                  const walletPendingRebirths = ownerWallet?.pendingRebirths ?? selectedNode.pendingRebirths;
                  const walletRebirthNodes = nodes
                    .filter((n) => n.owner.toLowerCase() === selectedNode.owner.toLowerCase() && n.isRebirth)
                    .sort((a, b) => a.id - b.id);
                  const cycleNumber = walletRebirthNodes.findIndex((n) => n.id === selectedNode.id) + 1;
                  const spawnedNodes = nodes.filter((n) => n.isRebirth && (n.originalAncestorId === selectedNode.id || n.rebornFromNodeId === selectedNode.id));
                  const executedRebirths = walletRebirthNodes.length;

                  // หากเป็นไอดีหลัก (Main ID) เช่น #1, #2, #3
                  if (!isNodeRebirth) {
                    return (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-emerald-300 text-xs flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ข้อมูลสถานะไอดีหลัก #{selectedNode.id}</span>
                          </h5>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                            👑 ไอดีหลัก (Main ID)
                          </span>
                        </div>

                        {/* Wallet Identification Badge */}
                        <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-[11px] space-y-1">
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400">เจ้าของกระเป๋า:</span>
                            <span className="font-semibold text-emerald-200">{getWalletName(selectedNode.owner)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>เลขกระเป๋า:</span>
                            <span className="font-mono text-slate-300 truncate max-w-[160px]" title={selectedNode.owner}>
                              {selectedNode.owner.slice(0, 6)}...{selectedNode.owner.slice(-4)}
                            </span>
                          </div>
                        </div>

                        {/* Node Rebirth Statistics for this Main ID */}
                        <div className="space-y-1.5 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-emerald-900/40">
                          <div className="flex justify-between">
                            <span className="text-slate-300">รหัสโคลนนิ่งที่แตกหน่อจากไอดีนี้:</span>
                            <span className="font-mono font-bold text-emerald-400">{spawnedNodes.length} รหัส</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">คิวรอโคลนนิ่งของไอดีนี้:</span>
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                selectedNode.pendingRebirths > 0
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                  : 'text-slate-400'
                              }`}
                            >
                              {selectedNode.pendingRebirths > 0
                                ? `รอโคลน ${selectedNode.pendingRebirths} เม็ด`
                                : 'ครบแล้ว (0 เม็ด)'}
                            </span>
                          </div>
                          {spawnedNodes.length === 0 && (
                            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 leading-relaxed">
                              💡 รหัสนี้คือ <strong className="text-emerald-300">ไอดีหลัก (Main ID)</strong> พร้อมรับรายได้ 30% ผู้แนะนำ + 30% โบนัส 15 ชั้น + 40% Upgrade Vault และเมื่อมีสมาชิกติดตัวฝั่งขวาจะได้รับสิทธิ์โคลนนิ่ง 100% Rebirth ทันที
                            </p>
                          )}
                        </div>

                        {/* Button to trigger Rebirth Modal popup */}
                        <button
                          type="button"
                          onClick={() => handleOpenRebirthModal(selectedNode.id)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-indigo-700 hover:from-emerald-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-emerald-400/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span>เปิดหน้าต่างป๊อปอัพข้อมูลรหัสโคลนนิ่ง ⇲</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-purple-300 text-xs flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>สถานะการโคลนนิ่ง (อ้างอิงเลขกระเป๋า)</span>
                        </h5>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                          กระเป๋าโคลน {walletRebirthCount} รอบ
                        </span>
                      </div>

                      {/* Button to trigger Rebirth Modal popup */}
                      <button
                        type="button"
                        onClick={() => handleOpenRebirthModal(selectedNode.id)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-purple-400/40 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>เปิดหน้าต่างป๊อปอัพข้อมูลรหัสโคลนนิ่ง ⇲</span>
                      </button>

                      {/* Wallet Identification Badge */}
                      <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-[11px] space-y-1">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-400">เจ้าของกระเป๋า:</span>
                          <span className="font-semibold text-purple-200">{getWalletName(selectedNode.owner)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>เลขกระเป๋า:</span>
                          <span className="font-mono text-slate-300 truncate max-w-[160px]" title={selectedNode.owner}>
                            {selectedNode.owner.slice(0, 6)}...{selectedNode.owner.slice(-4)}
                          </span>
                        </div>
                      </div>

                      {/* If this node is a Rebirth Node */}
                      {isNodeRebirth && (
                        <div className="bg-purple-900/50 border border-purple-700/60 p-2.5 rounded-lg text-[11px] space-y-1.5">
                          {(() => {
                            const badge = formatNodeCloneBadgeParts(selectedNode, nodes, selectedRank);
                            return (
                              <div className="bg-purple-950/80 p-2 rounded border border-purple-600/50 text-purple-200 mb-1">
                                <div className="text-[10px] text-purple-300 font-semibold mb-0.5 flex items-center justify-between">
                                  <span>🏷️ รูปแบบรหัสโคลนนิ่ง:</span>
                                  <span className="text-emerald-300 font-bold text-[9px]">รอบที่ {badge.round}</span>
                                </div>
                                <div className="font-mono font-extrabold text-sm text-amber-300 tracking-wide">
                                  ({badge.fullLabel})
                                </div>
                                <div className="text-[9px] text-slate-300 mt-1 flex flex-wrap gap-1 font-mono">
                                  <span className="bg-amber-950/60 px-1 rounded text-amber-200">หลัก #{badge.mainId}</span>
                                  <span className="bg-indigo-950/60 px-1 rounded text-indigo-200">รหัส #{badge.nodeId}</span>
                                  <span className="bg-emerald-950/60 px-1 rounded text-emerald-200">โคลนสะสม #{badge.vaultCloneIndex}</span>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="flex justify-between items-center text-purple-200">
                            <span className="font-semibold">🌟 ร่างโคลนนิ่งรอบที่:</span>
                            <span className="font-bold text-amber-300">รอบที่ {cycleNumber > 0 ? cycleNumber : 1}</span>
                          </div>
                          {(() => {
                            const originId = selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || ancestorId;
                            return (
                              <>
                                <div className="flex justify-between items-center text-purple-200">
                                  <span className="font-semibold text-emerald-300">🌱 โคลนมาจากรหัส (Origin ID):</span>
                                  <button
                                    onClick={() => {
                                      if (originId) onSelectNode(originId);
                                    }}
                                    className="font-mono font-extrabold text-amber-300 hover:text-amber-200 underline flex items-center space-x-1 bg-amber-950/70 border border-amber-800/70 px-2 py-0.5 rounded"
                                    title="คลิกเพื่อกระโดดไปดูรหัสต้นทางที่ให้กำเนิดรหัสนี้"
                                  >
                                    <span>#{originId}</span>
                                    <span className="text-[9px] text-purple-300 font-normal">({getWalletName(selectedNode.owner)})</span>
                                  </button>
                                </div>
                                {selectedNode.originalAncestorId && selectedNode.originalAncestorId !== originId && (
                                  <div className="flex justify-between items-center text-purple-200 text-[10px]">
                                    <span>ไอดีต้นตระกูลหลัก (Root ID):</span>
                                    <button
                                      onClick={() => onSelectNode(selectedNode.originalAncestorId)}
                                      className="font-mono text-indigo-300 hover:underline"
                                    >
                                      #{selectedNode.originalAncestorId}
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Rebirth stats referenced by Wallet */}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400" title="ยอดรอบ Rebirth รวมทั้งหมดที่เกิดขึ้นกับกระเป๋านี้">
                            ยอดโคลนนิ่งสะสม (อ้างอิงกระเป๋า):
                          </span>
                          <span className="font-bold text-purple-200">{walletRebirthCount} รอบ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">รหัสโคลนนิ่งในผังของกระเป๋านี้:</span>
                          <span className="font-mono font-bold text-emerald-400">{executedRebirths} รหัส</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">คิวรอโคลนนิ่งของกระเป๋านี้:</span>
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              walletPendingRebirths > 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : 'text-slate-500'
                            }`}
                          >
                            {walletPendingRebirths > 0
                              ? `รอโคลน ${walletPendingRebirths} เม็ด`
                              : 'ครบแล้ว'}
                          </span>
                        </div>
                      </div>

                      {/* Rebirth Nodes of this Wallet list */}
                      {walletRebirthNodes.length > 0 && (
                        <div className="pt-1.5 border-t border-purple-800/40 text-[11px] space-y-1">
                          <span className="text-slate-400 block text-[10px]">
                            รหัสโคลนนิ่งของกระเป๋านี้ทั้งหมด ({walletRebirthNodes.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {walletRebirthNodes.map((s, idx) => (
                              <button
                                key={`wallet-rebirth-${s.id}-${idx}`}
                                onClick={() => onSelectNode(s.id)}
                                className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                                  s.id === selectedNode.id
                                    ? 'bg-purple-600 text-white font-bold ring-1 ring-purple-300'
                                    : 'bg-purple-900/60 border border-purple-700/60 text-purple-200 hover:bg-purple-700/60'
                                }`}
                                title={`คลิกเพื่อดูรหัส #${s.id}`}
                              >
                                #{s.id} (รอบ {idx + 1})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rebirth Nodes spawned directly from this node or its Main ID */}
                      {(() => {
                        const effectiveMainId = (selectedNode.isRebirth && selectedNode.originalAncestorId)
                          ? selectedNode.originalAncestorId
                          : selectedNode.id;
                        const spawnedNodeIds = getRebirthNodeIds(effectiveMainId, nodes);
                        const spawnedCount = spawnedNodeIds.length;
                        const totalFamilyVault = getTotalFamilyAllUpgradeVault
                          ? getTotalFamilyAllUpgradeVault(effectiveMainId)
                          : 0;

                        return (
                          <div className="pt-2 border-t border-purple-800/50 text-[11px] space-y-2">
                            {/* Summary Box */}
                            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-emerald-300 font-bold flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>ยอดรหัสโคลนนิ่งของ ID หลัก #{effectiveMainId}:</span>
                                </span>
                                <span className="font-mono font-extrabold text-amber-300 bg-emerald-950 border border-emerald-700 px-2 py-0.5 rounded text-xs">
                                  {spawnedCount} รหัส
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="text-slate-300">40% Vault รวมตระกูล #{effectiveMainId} (ทุกผัง):</span>
                                <span className="font-mono font-bold text-amber-300">{totalFamilyVault.toFixed(2)} USDT</span>
                              </div>
                            </div>

                            {spawnedCount > 0 ? (
                              <div className="space-y-1">
                                <span className="text-slate-400 block text-[10px]">
                                  รายการรหัสโคลนนิ่งของ ID หลัก #{effectiveMainId} ({spawnedCount} รหัส):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {spawnedNodeIds.map((sId, sIdx) => (
                                    <button
                                      key={`spawned-${sId}-${sIdx}`}
                                      onClick={() => onSelectNode(sId)}
                                      className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors flex items-center space-x-1 cursor-pointer ${
                                        sId === selectedNode.id
                                          ? 'bg-amber-500 text-slate-950 font-bold ring-1 ring-amber-300'
                                          : 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 hover:bg-emerald-800/70'
                                      }`}
                                      title={`คลิกเพื่อเปิดดูรหัสโคลนนิ่ง #${sId}`}
                                    >
                                      <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                      <span>#{sId}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-500 italic">
                                รหัส #{effectiveMainId} นี้ยังไม่มีรหัสโคลนนิ่งในระบบ
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      <p className="text-[9.5px] text-slate-400/90 leading-tight pt-1 border-t border-purple-900/40">
                        💡 ยอด Rebirth อ้างอิงตามเลขกระเป๋าเดียวกัน ({selectedNode.owner.slice(0, 6)}...{selectedNode.owner.slice(-4)})
                      </p>
                    </div>
                  );
                })()}

                {/* Relocate / Move Node Action Card */}
                {onRelocateNode && selectedNode.id !== 1 && (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-indigo-700/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300 text-xs flex items-center space-x-1.5">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ปรับย้ายตำแหน่งรหัส #{selectedNode.id}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        อยู่ใต้ #{selectedNode.parentId} ({nodeMap.get(selectedNode.parentId)?.leftChild === selectedNode.id ? 'ซ้าย' : 'ขวา'})
                      </span>
                    </div>

                    {relocateMessage && (
                      <div className="p-1.5 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[10px] flex items-center justify-between">
                        <span>{relocateMessage}</span>
                        <button
                          onClick={() => setRelocateMessage(null)}
                          className="text-emerald-400 hover:text-white ml-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Quick Smart Relocate: If node #8, quick jump under node #7 */}
                    {selectedNode.id === 8 && nodeMap.has(7) && (nodeMap.get(7)?.leftChild === 0 || nodeMap.get(7)?.rightChild === 0) && (
                      <button
                        onClick={() => {
                          const n7 = nodeMap.get(7)!;
                          const useLeft = n7.leftChild === 0;
                          onRelocateNode(8, 7, useLeft);
                          setRelocateMessage(`ย้าย #8 ไปต่อใต้ #7 (รหัสโคลนนิ่งของผู้แนะนำ) ฝั่ง${useLeft ? 'ซ้าย' : 'ขวา'} สำเร็จ!`);
                        }}
                        className="w-full py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-lg text-[10.5px] font-bold shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                        title="ตามกฎโคลนรอบ 1: ต่อใต้รหัสโคลนของผู้แนะนำ (#7) ที่ยังมีขาว่าง"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>ย้าย #8 ไปต่อใต้ #7 (รหัสโคลนของผู้แนะนำ) ฝั่ง{nodeMap.get(7)?.leftChild === 0 ? 'ซ้าย' : 'ขวา'}</span>
                      </button>
                    )}

                    {/* Custom Relocate Form */}
                    <div className="flex items-center space-x-1.5 text-[10.5px]">
                      <span className="text-slate-400 shrink-0">ไปต่อใต้ ID:</span>
                      <input
                        type="number"
                        min="1"
                        value={relocateParentId}
                        onChange={(e) => setRelocateParentId(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-white text-xs focus:ring-1 focus:ring-indigo-500"
                        placeholder="ID"
                      />
                      <select
                        value={relocateIsLeft ? 'left' : 'right'}
                        onChange={(e) => setRelocateIsLeft(e.target.value === 'left')}
                        className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white text-[10.5px]"
                      >
                        <option value="left">ขาซ้าย</option>
                        <option value="right">ขาขวา</option>
                      </select>
                      <button
                        onClick={() => {
                          const pId = typeof relocateParentId === 'number' ? relocateParentId : parseInt(String(relocateParentId), 10);
                          if (!isNaN(pId) && pId > 0) {
                            try {
                              onRelocateNode(selectedNode.id, pId, relocateIsLeft);
                              setRelocateMessage(`ย้าย #${selectedNode.id} ไปต่อใต้ #${pId} (${relocateIsLeft ? 'ขาซ้าย' : 'ขาขวา'}) เรียบร้อย`);
                            } catch (err: any) {
                              setRelocateMessage(err.message || 'เกิดข้อผิดพลาดในการย้าย');
                            }
                          }
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10.5px] font-semibold transition cursor-pointer"
                      >
                        ย้าย
                      </button>
                    </div>
                  </div>
                )}

                {/* 15-Level Uplines Lineage Tracker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300 flex items-center space-x-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      <span>สายงานอัพไลน์ 15 ชั้น</span>
                    </span>
                    <span className="text-[10px] text-slate-500">ชั้นละ 0.1 U</span>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {uplines.length > 0 ? (
                      uplines.map(({ level, node }, uIdx) => (
                        <div
                          key={`upline-${level}-${node.id}-${uIdx}`}
                          onClick={() => onSelectNode(node.id)}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer text-[10px]"
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-indigo-400 font-bold w-5">L{level}</span>
                            <span className="font-mono text-slate-200 font-semibold">#{node.id}</span>
                            <span className="text-slate-400 truncate max-w-[85px]">
                              {getWalletName(node.owner)}
                            </span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-[10px] italic py-1 text-center">
                        รหัสนี้อยู่บนสุดของสายงาน
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6 text-xs">เลือกการ์ดในผังเพื่อดูรายละเอียด</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: STEP-BY-STEP VERTICAL MOBILE NAVIGATOR */}
      {viewMode === 'step' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">
                ท่องผังสายงานแนวตั้ง (Vertical Step Navigator)
              </h3>
            </div>
            <span className="text-xs text-slate-400">สำหรับหน้าจอมือถือโดยเฉพาะ</span>
          </div>

          {/* Breadcrumbs Path */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-slate-500 shrink-0">เส้นทางสายงาน:</span>
            {breadcrumbs.map((bNode, index) => (
              <React.Fragment key={`breadcrumb-${bNode.id}-${index}`}>
                {index > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                <button
                  onClick={() => onSelectNode(bNode.id)}
                  className={`px-2 py-0.5 rounded font-mono font-bold shrink-0 transition-colors ${
                    bNode.id === selectedNodeId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-indigo-300'
                  }`}
                >
                  {selectedRank >= 2
                    ? `#${bNode.originalAncestorId || bNode.rebornFromNodeId || bNode.id}(${bNode.queueNumber || bNode.id})`
                    : `#${bNode.id}`}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Current Focused Node Card */}
          {selectedNode && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-mono font-bold text-indigo-200 bg-indigo-900/80 px-2.5 py-1 rounded-lg border border-indigo-700">
                    รหัสที่กำลังดู: #{selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || selectedNode.id}({selectedNode.queueNumber || selectedNode.id})
                  </span>
                  <span className="text-xs text-slate-400">ชั้นที่ {selectedNode.depth}</span>
                  {selectedNode.id !== rootDisplayId && (
                    <button
                      onClick={() => setRootDisplayId(selectedNode.id)}
                      className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all flex items-center space-x-1"
                      title="สลับมุมมองผังต้นไม้ให้รหัสนี้เป็นจุดเริ่มต้น (Root)"
                    >
                      <GitBranch className="w-3 h-3" />
                      <span>สลับผังมาเริ่มที่ #{selectedNode.originalAncestorId || selectedNode.rebornFromNodeId || selectedNode.id}({selectedNode.queueNumber || selectedNode.id})</span>
                    </button>
                  )}
                </div>
                <span className="text-xs text-emerald-400 font-mono font-semibold">
                  เจ้าของ: {getWalletName(selectedNode.owner)}
                </span>
              </div>

              {/* 2 Children Branches: Direct Tap to Step Down */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Left Branch */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center">
                      <ArrowDownLeft className="w-4 h-4 mr-1 text-emerald-400" />
                      ขาซ้าย (เม็ดที่ 1 — 100% Math)
                    </span>
                    {selectedNode.leftChild !== 0 ? (
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                        {(() => {
                          const lNode = nodeMap.get(selectedNode.leftChild);
                          const lMainId = lNode ? (lNode.originalAncestorId || lNode.rebornFromNodeId || lNode.id) : selectedNode.leftChild;
                          const lGlobalId = lNode ? (lNode.queueNumber || lNode.id) : selectedNode.leftChild;
                          return `#${lMainId}(${lGlobalId})`;
                        })()}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                        ตำแหน่งว่าง
                      </span>
                    )}
                  </div>

                  {selectedNode.leftChild !== 0 ? (
                    <button
                      onClick={() => onSelectNode(selectedNode.leftChild)}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <span>
                        แตะเพื่อลงไปดูสายงานรหัส {(() => {
                          const lNode = nodeMap.get(selectedNode.leftChild);
                          const lMainId = lNode ? (lNode.originalAncestorId || lNode.rebornFromNodeId || lNode.id) : selectedNode.leftChild;
                          const lGlobalId = lNode ? (lNode.queueNumber || lNode.id) : selectedNode.leftChild;
                          return `#${lMainId}(${lGlobalId})`;
                        })()}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onQuickRegisterUnder(selectedNode.id, true)}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <span>+ ลงทะเบียนรหัสใหม่ตรงนี้ (ขาซ้าย)</span>
                    </button>
                  )}
                </div>

                {/* Right Branch */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 flex items-center">
                      <ArrowDownRight className="w-4 h-4 mr-1 text-purple-400" />
                      ขวา (เม็ดที่ 2 — 100% Rebirth)
                    </span>
                    {selectedNode.rightChild !== 0 ? (
                      <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded">
                        {(() => {
                          const rNode = nodeMap.get(selectedNode.rightChild);
                          const rMainId = rNode ? (rNode.originalAncestorId || rNode.rebornFromNodeId || rNode.id) : selectedNode.rightChild;
                          const rGlobalId = rNode ? (rNode.queueNumber || rNode.id) : selectedNode.rightChild;
                          return `#${rMainId}(${rGlobalId})`;
                        })()}
                      </span>
                    ) : (
                      <span className="text-xs text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/60">
                        ตำแหน่งว่าง
                      </span>
                    )}
                  </div>

                  {selectedNode.rightChild !== 0 ? (
                    <button
                      onClick={() => onSelectNode(selectedNode.rightChild)}
                      className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <span>
                        แตะเพื่อลงไปดูสายงานรหัส {(() => {
                          const rNode = nodeMap.get(selectedNode.rightChild);
                          const rMainId = rNode ? (rNode.originalAncestorId || rNode.rebornFromNodeId || rNode.id) : selectedNode.rightChild;
                          const rGlobalId = rNode ? (rNode.queueNumber || rNode.id) : selectedNode.rightChild;
                          return `#${rMainId}(${rGlobalId})`;
                        })()}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onQuickRegisterUnder(selectedNode.id, false)}
                      className="w-full py-2 px-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1"
                    >
                      <span>+ ลงทะเบียนรหัสใหม่ตรงนี้ (ขาขวา)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Up to Parent Button */}
              {selectedNode.parentId !== 0 && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => onSelectNode(selectedNode.parentId)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 inline-flex items-center space-x-1"
                  >
                    <span>↑ ย้อนกลับไปดูรหัสพ่อ (#{selectedNode.parentId})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* Rebirth Modal Popup */}
      <RebirthModal
        isOpen={isRebirthModalOpen}
        onClose={() => setIsRebirthModalOpen(false)}
        selectedNodeId={modalRebornNodeId}
        nodes={activeNodes}
        wallets={wallets}
        onFocusNodeInTree={(id) => {
          onSelectNode(id);
          setRootDisplayId(id);
        }}
        onExecuteRebirth={
          selectedRank === 1
            ? onExecuteRebirth
            : (nodeId) => onExecuteRankRebirth?.(selectedRank, nodeId)
        }
        findRebirthSlot={(nodeId, targetRank) =>
          findRebirthSlot ? findRebirthSlot(nodeId, targetRank !== undefined ? targetRank : selectedRank) : null
        }
        rebirthPool={activeRebirthPool}
      />

      {/* Cloning Queue Modal Popup */}
      <CloningQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        selectedRank={selectedRank}
        activeNodes={activeNodes}
        allNodes={nodes}
        wallets={wallets}
        activeRebirthPool={activeRebirthPool}
        onSelectNode={(id) => {
          onSelectNode(id);
          setRootDisplayId(id);
        }}
        onExecuteRankRebirth={onExecuteRankRebirth}
        onExecuteRebirth={onExecuteRebirth}
        onBatchExecuteRebirths={onBatchExecuteRebirths}
        onTopupRebirthPool={onTopupWallet ? (amount) => onTopupWallet(currentWallet?.address || (wallets[0] ? wallets[0].address : ''), amount) : undefined}
      />

      {/* Bonus & 40% Upgrade Vault History Modal */}
      <BonusAndVaultHistoryModal
        isOpen={isBonusHistoryOpen}
        onClose={() => setIsBonusHistoryOpen(false)}
        logs={logs}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
      />

      {/* Tree Search Modal */}
      <TreeSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        selectedRank={selectedRank}
        activeNodes={activeNodes}
        allNodes={nodes}
        wallets={wallets}
        getRankMatrixNodes={getRankMatrixNodes}
        onFocusNode={(nodeId, targetRank) => {
          if (targetRank !== selectedRank) {
            setSelectedRank(targetRank);
          }
          setRootDisplayId(nodeId);
          onSelectNode(nodeId);
        }}
      />
    </div>
  );
};
