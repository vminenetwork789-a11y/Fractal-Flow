import React, { useState, useMemo, useEffect } from 'react';
import { MatrixNode, WalletAccount, RegistrationPaymentSource, ExcessRebirthVaultSummary } from '../types';
import {
  UserPlus,
  ArrowDownLeft,
  ArrowDownRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Sparkles,
  Search,
  Fuel,
  TrendingUp,
  Layers,
  Shield,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Coins,
  RefreshCw,
  Crown,
  Clock,
  Timer,
  Play,
} from 'lucide-react';
import {
  REGISTRATION_FEE,
  DIRECT_BONUS,
  LEVEL_BONUS,
  UPGRADE_VAULT_SHARE,
  MAX_LEVELS,
  RANKS,
  getRankInfo,
  getRankPrice,
} from '../lib/matrixSimulator';
import { useLanguage } from '../i18n/LanguageContext';

interface RegistrationCardProps {
  currentWallet: WalletAccount;
  nodes: MatrixNode[];
  wallets?: WalletAccount[];
  onSelectWallet?: (address: string) => void;
  onRegister: (
    parentId: number,
    isLeft: boolean,
    sponsorId?: number,
    paymentSource?: RegistrationPaymentSource,
    rank?: number
  ) => void;
  onBatchRegister: (
    count: number,
    paymentSource?: RegistrationPaymentSource,
    sponsorId?: number,
    rank?: number
  ) => void;
  quickTarget: { parentId: number; isLeft: boolean } | null;
  onClearQuickTarget: () => void;
  getFamilyExcessRebirthVaultSummary?: (mainId: number) => ExcessRebirthVaultSummary;
  onExecuteMainIdRebirthFromExcessVault?: (mainId: number) => number;
  getRankMatrixNodes?: (rank: number) => MatrixNode[];
  autoRebirth?: boolean;
  onToggleAutoRebirth?: (enabled: boolean) => void;
  autoExcessVaultNewMainId?: boolean;
  onToggleAutoExcessVaultNewMainId?: (enabled: boolean) => void;
  onBatchExecuteRebirths?: () => void;
  autoDelaySec?: number;
  onSetAutoDelaySec?: (sec: number) => void;
  autoCountdown?: number;
  autoTaskType?: string | null;
  autoCurrentRound?: number;
  autoTotalRounds?: number;
  onExecuteAutoNow?: () => void;
  onExecuteAllAutoNow?: () => void;
  onCancelAuto?: () => void;
}

interface BfsSlotResult {
  parentId: number;
  isLeft: boolean;
  depth: number;
  parentOwner: string;
  isRebirthTarget?: boolean;
  targetRebirthNodeId?: number;
  reason?: string;
}

// True BFS (Breadth-First Search) level-by-level slot finder
// กฎการจัดวางตำแหน่งไอดี: ให้ ค้นหาตำแหน่งว่างเฉพาะโหนดที่อยู่ในผัง Rank นั้นๆ เท่านั้น ในฟังชั่น สมัครเปิดไอดีหลักใหม่ (New Main ID)
function findBfsSlot(
  nodes: MatrixNode[],
  rootStartId: number = 1,
  sponsorId: number = 1,
  targetRank: number = 1,
  getRankMatrixNodes?: (rank: number) => MatrixNode[]
): BfsSlotResult | null {
  const rankNodes = getRankMatrixNodes
    ? getRankMatrixNodes(targetRank)
    : nodes.filter((n) => (n.rank || 1) === targetRank || (targetRank === 1 && (!n.rank || n.rank >= 1)));

  if (rankNodes.length === 0) return null;

  const nodeMap = new Map<number, MatrixNode>();
  rankNodes.forEach((n) => nodeMap.set(n.id, n));

  // 1. สแกนตามผู้แนะนำตรง (Direct Sponsor Priority): หากผู้แนะนำยังมีตำแหน่งติดตัวว่าง (ซ้ายว่าง หรือ ขวาว่าง) ในผัง Rank นั้น
  if (sponsorId && nodeMap.has(sponsorId)) {
    const sponsor = nodeMap.get(sponsorId)!;

    if (sponsor.leftChild === 0) {
      return {
        parentId: sponsor.id,
        isLeft: true,
        depth: sponsor.depth + 1,
        parentOwner: sponsor.owner,
        reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: ต่อติดตัวผู้แนะนำ #${sponsor.id} (ฝั่งซ้าย)`,
      };
    }
    if (sponsor.rightChild === 0) {
      return {
        parentId: sponsor.id,
        isLeft: false,
        depth: sponsor.depth + 1,
        parentOwner: sponsor.owner,
        reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: ต่อติดตัวผู้แนะนำ #${sponsor.id} (ฝั่งขวา)`,
      };
    }

    // 1.2 ผู้แนะนำเต็ม 2 ขาแล้ว: ค้นหารหัสเกิดใหม่ของผู้แนะนำเฉพาะในผัง Rank นั้น
    const rebirthNodes = rankNodes.filter(
      (n) =>
        n.isRebirth &&
        n.id !== sponsor.id &&
        (n.rebornFromNodeId === sponsor.id || n.originalAncestorId === sponsor.id)
    );

    const vacantRebirth = rebirthNodes.find((rn) => rn.leftChild === 0 || rn.rightChild === 0);
    if (vacantRebirth) {
      const isLeft = vacantRebirth.leftChild === 0;
      return {
        parentId: vacantRebirth.id,
        isLeft,
        depth: vacantRebirth.depth + 1,
        parentOwner: vacantRebirth.owner,
        isRebirthTarget: true,
        targetRebirthNodeId: vacantRebirth.id,
        reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: ผู้แนะนำ #${sponsor.id} เต็ม 2 ขา ➔ โยนไปรหัสเกิดใหม่ #${vacantRebirth.id} ใน Rank ${targetRank} (${isLeft ? 'ฝั่งซ้าย' : 'ฝั่งขวา'})`,
      };
    }

    // หากเต็ม ให้สแกน BFS ใต้รหัสเกิดใหม่ในผัง Rank นั้น
    for (const rNode of rebirthNodes) {
      const queue = [rNode.id];
      const visited = new Set<number>();
      while (queue.length > 0) {
        const currId = queue.shift()!;
        if (visited.has(currId)) continue;
        visited.add(currId);
        const curr = nodeMap.get(currId);
        if (!curr) continue;
        if (curr.leftChild === 0) {
          return {
            parentId: curr.id,
            isLeft: true,
            depth: curr.depth + 1,
            parentOwner: curr.owner,
            isRebirthTarget: true,
            targetRebirthNodeId: rNode.id,
            reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: โยนสายงานใต้รหัสเกิดใหม่ #${rNode.id} ใน Rank ${targetRank} (ต่อใต้ #${curr.id} ฝั่งซ้าย)`,
          };
        }
        if (curr.rightChild === 0) {
          return {
            parentId: curr.id,
            isLeft: false,
            depth: curr.depth + 1,
            parentOwner: curr.owner,
            isRebirthTarget: true,
            targetRebirthNodeId: rNode.id,
            reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: โยนสายงานใต้รหัสเกิดใหม่ #${rNode.id} ใน Rank ${targetRank} (ต่อใต้ #${curr.id} ฝั่งขวา)`,
          };
        }
        if (curr.leftChild !== 0) queue.push(curr.leftChild);
        if (curr.rightChild !== 0) queue.push(curr.rightChild);
      }
    }

    // สแกน BFS ใต้สายงานของผู้แนะนำในผัง Rank นั้น
    const queue = [sponsor.id];
    const visited = new Set<number>();
    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      const curr = nodeMap.get(currId);
      if (!curr) continue;

      if (curr.leftChild === 0) {
        return {
          parentId: curr.id,
          isLeft: true,
          depth: curr.depth + 1,
          parentOwner: curr.owner,
          reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: โยนสายงานใต้ผู้แนะนำ #${sponsor.id} ใน Rank ${targetRank} (ต่อใต้ #${curr.id} ฝั่งซ้าย)`,
        };
      }
      if (curr.rightChild === 0) {
        return {
          parentId: curr.id,
          isLeft: false,
          depth: curr.depth + 1,
          parentOwner: curr.owner,
          reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: โยนสายงานใต้ผู้แนะนำ #${sponsor.id} ใน Rank ${targetRank} (ต่อใต้ #${curr.id} ฝั่งขวา)`,
        };
      }

      if (curr.leftChild !== 0) queue.push(curr.leftChild);
      if (curr.rightChild !== 0) queue.push(curr.rightChild);
    }
  }

  // 2. กรณีผู้ใช้ระบุจุดสแกนเฉพาะเจาะจงในผัง Rank นั้น
  if (rootStartId !== 1 && nodeMap.has(rootStartId)) {
    const queue: number[] = [rootStartId];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      const curr = nodeMap.get(currId);
      if (!curr) continue;

      if (curr.leftChild === 0) {
        return {
          parentId: curr.id,
          isLeft: true,
          depth: curr.depth + 1,
          parentOwner: curr.owner,
          reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: สแกนใต้รหัส #${rootStartId} (ฝั่งซ้าย)`,
        };
      }
      if (curr.rightChild === 0) {
        return {
          parentId: curr.id,
          isLeft: false,
          depth: curr.depth + 1,
          parentOwner: curr.owner,
          reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: สแกนใต้รหัส #${rootStartId} (ฝั่งขวา)`,
        };
      }

      if (curr.leftChild !== 0) queue.push(curr.leftChild);
      if (curr.rightChild !== 0) queue.push(curr.rightChild);
    }
  }

  // 3. ผังรวมเฉพาะ Rank นั้น
  let startId = 1;
  if (!nodeMap.has(startId) && rankNodes.length > 0) {
    startId = rankNodes[0].id;
  }

  const queue: number[] = [startId];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const currId = queue.shift()!;
    if (visited.has(currId)) continue;
    visited.add(currId);

    const curr = nodeMap.get(currId);
    if (!curr) continue;

    if (curr.leftChild === 0) {
      return {
        parentId: curr.id,
        isLeft: true,
        depth: curr.depth + 1,
        parentOwner: curr.owner,
        reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: จัดวางตามผังรวม Rank ${targetRank} (ต่อใต้ #${curr.id} ฝั่งซ้าย)`,
      };
    }

    if (curr.rightChild === 0) {
      return {
        parentId: curr.id,
        isLeft: false,
        depth: curr.depth + 1,
        parentOwner: curr.owner,
        reason: `📍 [กฎค้นหาเฉพาะโหนดผัง Rank ${targetRank}]: จัดวางตามผังรวม Rank ${targetRank} (ต่อใต้ #${curr.id} ฝั่งขวา)`,
      };
    }

    if (curr.leftChild !== 0) queue.push(curr.leftChild);
    if (curr.rightChild !== 0) queue.push(curr.rightChild);
  }

  return null;
}

// Simulate subsequent BFS allocations for batch preview exclusively within target Rank
function simulateBatchBfsSlots(
  nodes: MatrixNode[],
  count: number,
  startRootId: number = 1,
  sponsorId: number = 1,
  targetRank: number = 1,
  getRankMatrixNodes?: (rank: number) => MatrixNode[]
) {
  const rankNodes = getRankMatrixNodes
    ? getRankMatrixNodes(targetRank)
    : nodes.filter((n) => (n.rank || 1) === targetRank || (targetRank === 1 && (!n.rank || n.rank >= 1)));

  const tempNodes = new Map<
    number,
    { id: number; left: number; right: number; depth: number; owner: string; isRebirth?: boolean; originalAncestorId?: number; rebornFromNodeId?: number }
  >();
  
  rankNodes.forEach((n) => {
    tempNodes.set(n.id, {
      id: n.id,
      left: n.leftChild,
      right: n.rightChild,
      depth: n.depth,
      owner: n.owner,
      isRebirth: n.isRebirth,
      originalAncestorId: n.originalAncestorId,
      rebornFromNodeId: n.rebornFromNodeId,
    });
  });

  let nextId = Math.max(...nodes.map((n) => n.id), 1) + 1;
  const plannedSlots: { index: number; parentId: number; isLeft: boolean; depth: number; tempId: number; isRebirthTarget?: boolean }[] = [];

  for (let i = 0; i < count; i++) {
    let targetSlot: { parentId: number; isLeft: boolean; depth: number; isRebirthTarget?: boolean } | null = null;

    // 1. สแกนตามผู้แนะนำตรง (Direct Sponsor Priority): หากผู้แนะนำยังมีตำแหน่งติดตัวว่าง (ซ้ายว่าง หรือ ขวาว่าง) ระบบจะจัดวางติดตัวผู้แนะนำทันที
    if (sponsorId && tempNodes.has(sponsorId)) {
      const sp = tempNodes.get(sponsorId)!;
      if (sp.left === 0) {
        targetSlot = { parentId: sp.id, isLeft: true, depth: sp.depth + 1 };
      } else if (sp.right === 0) {
        targetSlot = { parentId: sp.id, isLeft: false, depth: sp.depth + 1 };
      } else {
        // ผู้แนะนำเต็ม 2 ขาแล้ว: ค้นหารหัสเกิดใหม่ของ ID ผู้แนะนำที่เรากรอก ที่ยังว่างอยู่ (ไม่ต้องสนใจลำดับ)
        const rebirthNodes = Array.from(tempNodes.values()).filter(
          (n) =>
            n.isRebirth &&
            n.id !== sp.id &&
            (n.rebornFromNodeId === sp.id || n.originalAncestorId === sp.id)
        );

        const vacantRebirth = rebirthNodes.find((rn) => rn.left === 0 || rn.right === 0);
        if (vacantRebirth) {
          targetSlot = {
            parentId: vacantRebirth.id,
            isLeft: vacantRebirth.left === 0,
            depth: vacantRebirth.depth + 1,
            isRebirthTarget: true,
          };
        }

        // หากตำแหน่งติดตัวของรหัสเกิดใหม่เต็ม ให้สแกน BFS ใต้สายงานรหัสเกิดใหม่ของผู้แนะนำ (ซ้ายก่อน ขวา)
        if (!targetSlot) {
          for (const rNode of rebirthNodes) {
            const queue = [rNode.id];
            const visited = new Set<number>();
            while (queue.length > 0) {
              const currId = queue.shift()!;
              if (visited.has(currId)) continue;
              visited.add(currId);
              const node = tempNodes.get(currId);
              if (!node) continue;
              if (node.left === 0) {
                targetSlot = { parentId: currId, isLeft: true, depth: node.depth + 1, isRebirthTarget: true };
                break;
              }
              if (node.right === 0) {
                targetSlot = { parentId: currId, isLeft: false, depth: node.depth + 1, isRebirthTarget: true };
                break;
              }
              if (node.left !== 0) queue.push(node.left);
              if (node.right !== 0) queue.push(node.right);
            }
            if (targetSlot) break;
          }
        }

        // หากยังไม่เจอ ให้สแกน BFS ใต้สายงานของผู้แนะนำ (ซ้ายก่อน ขวา)
        if (!targetSlot) {
          const queue = [sp.id];
          const visited = new Set<number>();
          while (queue.length > 0) {
            const currId = queue.shift()!;
            if (visited.has(currId)) continue;
            visited.add(currId);
            const node = tempNodes.get(currId);
            if (!node) continue;
            if (node.left === 0) {
              targetSlot = { parentId: currId, isLeft: true, depth: node.depth + 1 };
              break;
            }
            if (node.right === 0) {
              targetSlot = { parentId: currId, isLeft: false, depth: node.depth + 1 };
              break;
            }
            if (node.left !== 0) queue.push(node.left);
            if (node.right !== 0) queue.push(node.right);
          }
        }
      }
    }

    // 2. Specific root selected (not 1 and not sponsor):
    if (!targetSlot && startRootId !== 1 && tempNodes.has(startRootId)) {
      const queue = [startRootId];
      const visited = new Set<number>();
      while (queue.length > 0) {
        const currId = queue.shift()!;
        if (visited.has(currId)) continue;
        visited.add(currId);
        const node = tempNodes.get(currId);
        if (!node) continue;
        if (node.left === 0) {
          targetSlot = { parentId: currId, isLeft: true, depth: node.depth + 1 };
          break;
        }
        if (node.right === 0) {
          targetSlot = { parentId: currId, isLeft: false, depth: node.depth + 1 };
          break;
        }
        if (node.left !== 0) queue.push(node.left);
        if (node.right !== 0) queue.push(node.right);
      }
    }

    // 3. Global BFS from #1:
    if (!targetSlot) {
      const queue = [1];
      const visited = new Set<number>();

      while (queue.length > 0) {
        const currId = queue.shift()!;
        if (visited.has(currId)) continue;
        visited.add(currId);

        const node = tempNodes.get(currId);
        if (!node) continue;

        if (node.left === 0) {
          targetSlot = { parentId: currId, isLeft: true, depth: node.depth + 1 };
          break;
        }
        if (node.right === 0) {
          targetSlot = { parentId: currId, isLeft: false, depth: node.depth + 1 };
          break;
        }

        if (node.left !== 0) queue.push(node.left);
        if (node.right !== 0) queue.push(node.right);
      }
    }

    if (!targetSlot) break;

    const parent = tempNodes.get(targetSlot.parentId)!;
    if (targetSlot.isLeft) {
      parent.left = nextId;
    } else {
      parent.right = nextId;
    }

    tempNodes.set(nextId, {
      id: nextId,
      left: 0,
      right: 0,
      depth: targetSlot.depth,
      owner: 'pending_batch',
    });

    plannedSlots.push({
      index: i + 1,
      parentId: targetSlot.parentId,
      isLeft: targetSlot.isLeft,
      depth: targetSlot.depth,
      tempId: nextId,
      isRebirthTarget: targetSlot.isRebirthTarget,
    });

    nextId++;

    // เมื่อรหัส #1 หรือรหัสเกิดใหม่ของ #1 เติมลูกขาขวาเต็ม จะเกิด Rebirth Node ของ #1 เข้าสู่ผังทันที เพื่อเตรียมพร้อมรับสายงานถัดไป
    const isParent1OrRebirthOf1 = targetSlot.parentId === 1 ||
      Boolean(tempNodes.get(targetSlot.parentId)?.isRebirth && tempNodes.get(targetSlot.parentId)?.originalAncestorId === 1);
    if (isParent1OrRebirthOf1 && !targetSlot.isLeft) {
      const rebirthId = nextId;
      nextId++;

      // สแกนหาตำแหน่งว่างระดับต่อระดับที่ตื้นที่สุดสำหรับรหัสเกิดใหม่นี้
      const queue = [1];
      const visited = new Set<number>();
      let rSlot: { parentId: number; isLeft: boolean; depth: number } | null = null;
      while (queue.length > 0) {
        const cId = queue.shift()!;
        if (visited.has(cId)) continue;
        visited.add(cId);
        const cn = tempNodes.get(cId);
        if (!cn) continue;
        if (cn.left === 0) {
          rSlot = { parentId: cId, isLeft: true, depth: cn.depth + 1 };
          break;
        }
        if (cn.right === 0) {
          rSlot = { parentId: cId, isLeft: false, depth: cn.depth + 1 };
          break;
        }
        if (cn.left !== 0) queue.push(cn.left);
        if (cn.right !== 0) queue.push(cn.right);
      }

      if (rSlot) {
        const rp = tempNodes.get(rSlot.parentId)!;
        if (rSlot.isLeft) rp.left = rebirthId;
        else rp.right = rebirthId;
        tempNodes.set(rebirthId, {
          id: rebirthId,
          left: 0,
          right: 0,
          depth: rSlot.depth,
          owner: tempNodes.get(1)?.owner || 'treasury',
          isRebirth: true,
          originalAncestorId: 1,
        });
      }
    }
  }

  return plannedSlots;
}

export const RegistrationCard: React.FC<RegistrationCardProps> = ({
  currentWallet,
  nodes,
  wallets = [],
  onSelectWallet,
  onRegister,
  onBatchRegister,
  quickTarget,
  onClearQuickTarget,
  getFamilyExcessRebirthVaultSummary,
  onExecuteMainIdRebirthFromExcessVault,
  getRankMatrixNodes,
  autoRebirth,
  onToggleAutoRebirth,
  autoExcessVaultNewMainId,
  onToggleAutoExcessVaultNewMainId,
  onBatchExecuteRebirths,
  autoDelaySec = 2,
  onSetAutoDelaySec,
  autoCountdown = 0,
  autoTaskType,
  autoCurrentRound = 0,
  autoTotalRounds = 0,
  onExecuteAutoNow,
  onExecuteAllAutoNow,
  onCancelAuto,
}) => {
  const { t } = useLanguage();
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [isAutoPlacement, setIsAutoPlacement] = useState<boolean>(true);
  const [sponsorIdInput, setSponsorIdInput] = useState<number>(1);
  const [parentIdInput, setParentIdInput] = useState<number>(quickTarget ? quickTarget.parentId : 1);
  const [isLeftInput, setIsLeftInput] = useState<boolean>(quickTarget ? quickTarget.isLeft : true);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [paymentSource, setPaymentSource] = useState<RegistrationPaymentSource>('wallet');
  const [batchCount, setBatchCount] = useState<number>(3);
  const [bfsRootId, setBfsRootId] = useState<number>(1);
  const [showUplinePath, setShowUplinePath] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedRankInfo = useMemo(() => getRankInfo(selectedRank), [selectedRank]);

  // Owned main nodes of the current wallet for excess vault registration
  const ownedMainNodes = useMemo(() => {
    return nodes.filter(
      (n) => !n.isRebirth && n.owner.toLowerCase() === currentWallet.address.toLowerCase()
    );
  }, [nodes, currentWallet.address]);

  const [selectedExcessMainId, setSelectedExcessMainId] = useState<number>(1);

  useEffect(() => {
    if (ownedMainNodes.length > 0) {
      if (!ownedMainNodes.some((n) => n.id === selectedExcessMainId)) {
        setSelectedExcessMainId(ownedMainNodes[0].id);
      }
    } else {
      setSelectedExcessMainId(1);
    }
  }, [ownedMainNodes, selectedExcessMainId]);

  const excessSummary = useMemo(() => {
    if (getFamilyExcessRebirthVaultSummary) {
      return getFamilyExcessRebirthVaultSummary(selectedExcessMainId);
    }
    return null;
  }, [getFamilyExcessRebirthVaultSummary, selectedExcessMainId]);

  // Registered Users Statistics
  const mainUsersCount = useMemo(() => nodes.filter((n) => !n.isRebirth).length, [nodes]);
  const rebirthCount = useMemo(() => nodes.filter((n) => n.isRebirth).length, [nodes]);
  const uniqueWalletsCount = useMemo(() => new Set(nodes.filter((n) => !n.isRebirth).map((n) => n.owner.toLowerCase())).size, [nodes]);

  // Wallet and Upgrade Vault funds
  const walletVault = currentWallet.upgradeVault || 0;
  const totalAvailableFunds = Math.round((currentWallet.balance + walletVault) * 100) / 100;

  // Single mode breakdown अิงตามผัง Rank ที่เลือก
  const singleCost = selectedRankInfo ? selectedRankInfo.price : REGISTRATION_FEE;
  const singleWalletCovered = Math.min(currentWallet.balance, singleCost);
  const singleVaultNeeded = Math.max(0, Math.round((singleCost - singleWalletCovered) * 100) / 100);
  const canSinglePay =
    paymentSource === 'vault'
      ? walletVault >= singleCost
      : paymentSource === 'wallet'
      ? currentWallet.balance >= singleCost
      : totalAvailableFunds >= singleCost;

  // Batch mode breakdown อิงตามผัง Rank ที่เลือก
  const batchTotalCost = batchCount * singleCost;
  const batchWalletCovered = Math.min(currentWallet.balance, batchTotalCost);
  const batchVaultNeeded = Math.max(0, Math.round((batchTotalCost - batchWalletCovered) * 100) / 100);
  const canBatchPay =
    paymentSource === 'vault'
      ? walletVault >= batchTotalCost
      : paymentSource === 'wallet'
      ? currentWallet.balance >= batchTotalCost
      : totalAvailableFunds >= batchTotalCost;

  // Wallet helper
  const getWalletName = (address: string) => {
    const found = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
    return found ? found.name : `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Real-time BFS recommendation (ค้นหาตำแหน่งว่างเฉพาะโหนดที่อยู่ในผัง Rank นั้นๆ เท่านั้น)
  const bfsRecommendation = useMemo(() => {
    return findBfsSlot(nodes, bfsRootId, sponsorIdInput, selectedRank, getRankMatrixNodes);
  }, [nodes, bfsRootId, sponsorIdInput, selectedRank, getRankMatrixNodes]);

  // Automatic placement synchronization: automatically fills the vacant slot whenever nodes or BFS changes
  useEffect(() => {
    if (isAutoPlacement && bfsRecommendation) {
      setParentIdInput(bfsRecommendation.parentId);
      setIsLeftInput(bfsRecommendation.isLeft);
      setErrorMsg(null);
    }
  }, [isAutoPlacement, bfsRecommendation]);

  // Sync with quick target when user clicks on tree manually
  useEffect(() => {
    if (quickTarget) {
      setIsAutoPlacement(false); // User intentionally selected a manual target on tree
      setParentIdInput(quickTarget.parentId);
      setIsLeftInput(quickTarget.isLeft);
      setMode('single');
    }
  }, [quickTarget]);

  // Target nodes in selected rank network
  const targetRankNodes = useMemo(() => {
    if (getRankMatrixNodes) return getRankMatrixNodes(selectedRank);
    return nodes.filter((n) => (n.rank || 1) === selectedRank || (selectedRank === 1 && (!n.rank || n.rank >= 1)));
  }, [getRankMatrixNodes, selectedRank, nodes]);

  const targetParent = targetRankNodes.find((n) => n.id === parentIdInput) || nodes.find((n) => n.id === parentIdInput);
  const sponsorNode = targetRankNodes.find((n) => n.id === sponsorIdInput) || nodes.find((n) => n.id === sponsorIdInput);
  const isSlotFree = targetParent
    ? isLeftInput
      ? targetParent.leftChild === 0
      : targetParent.rightChild === 0
    : false;

  const currentOccupiedNodeId = targetParent
    ? isLeftInput
      ? targetParent.leftChild
      : targetParent.rightChild
    : 0;

  // Manual re-sync to BFS recommendation
  const handleApplyBfs = () => {
    setIsAutoPlacement(true);
    if (bfsRecommendation) {
      setParentIdInput(bfsRecommendation.parentId);
      setIsLeftInput(bfsRecommendation.isLeft);
      setErrorMsg(null);
    }
  };

  // Build real-time 15-level upline lineage for Left child math breakdown
  const uplineLineage = useMemo(() => {
    if (!targetParent || !isLeftInput) return [];
    const list: { level: number; nodeId: number; owner: string; bonus: number; isLevel0?: boolean }[] = [];
    let currentParentId = targetParent.id;
    let level = 0;

    const nodeMap = new Map<number, MatrixNode>();
    targetRankNodes.forEach((n) => nodeMap.set(n.id, n));

    while (currentParentId !== 0 && level < MAX_LEVELS) {
      const node = nodeMap.get(currentParentId);
      if (!node) break;
      list.push({
        level,
        nodeId: node.id,
        owner: node.owner,
        bonus: LEVEL_BONUS,
        isLevel0: level === 0,
      });
      currentParentId = node.parentId;
      level++;
    }

    return list;
  }, [targetParent, isLeftInput, targetRankNodes]);

  // Batch BFS preview (ค้นหาเฉพาะผัง Rank ที่เลือก)
  const batchPreview = useMemo(() => {
    return simulateBatchBfsSlots(nodes, batchCount, bfsRootId, sponsorIdInput, selectedRank, getRankMatrixNodes);
  }, [nodes, batchCount, bfsRootId, sponsorIdInput, selectedRank, getRankMatrixNodes]);

  const batchLeftCount = batchPreview.filter((s) => s.isLeft).length;
  const batchRightCount = batchPreview.filter((s) => !s.isLeft).length;

  // Gas calculation estimates
  const singleGasPerTx = 85000;
  const batchBaseGas = 45000;
  const batchGasPerNode = 35000;

  const totalSingleGas = batchCount * singleGasPerTx;
  const totalBatchGas = batchBaseGas + batchCount * batchGasPerNode;
  const gasPercentSaved = Math.round(((totalSingleGas - totalBatchGas) / totalSingleGas) * 100);

  // Form Submissions
  const handleSingleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let effectiveParentId = parentIdInput;
    let effectiveIsLeft = isLeftInput;

    if (sponsorNode && sponsorNode.leftChild !== 0 && sponsorNode.rightChild !== 0) {
      if (effectiveParentId === sponsorIdInput || !isSlotFree) {
        const autoSlot = findBfsSlot(nodes, sponsorIdInput, sponsorIdInput, selectedRank, getRankMatrixNodes);
        if (autoSlot) {
          effectiveParentId = autoSlot.parentId;
          effectiveIsLeft = autoSlot.isLeft;
        }
      }
    }

    const effTargetParent = targetRankNodes.find((n) => n.id === effectiveParentId) || nodes.find((n) => n.id === effectiveParentId);
    if (!effTargetParent) {
      setErrorMsg(`ไม่พบรหัสอัพไลน์ #${effectiveParentId} ในผัง Rank ${selectedRank}`);
      return;
    }
    if (!sponsorNode) {
      setErrorMsg(`ไม่พบรหัสผู้แนะนำ #${sponsorIdInput} ในระบบ กรุณาตรวจสอบรหัสผู้แนะนำ`);
      return;
    }
    const isEffSlotFree = effectiveIsLeft ? effTargetParent.leftChild === 0 : effTargetParent.rightChild === 0;
    if (!isEffSlotFree) {
      setErrorMsg(
        `ตำแหน่ง ${effectiveIsLeft ? 'ซ้าย' : 'ขวา'} ของรหัส #${effectiveParentId} ในผัง Rank ${selectedRank} ถูกใช้งานไปแล้ว กรุณาใช้ปุ่ม BFS เพื่อหาตำแหน่งว่างถัดไป`
      );
      return;
    }

    if (paymentSource === 'vault' && walletVault < singleCost) {
      setErrorMsg(
        `ยอด Upgrade Vault ไม่เพียงพอ! ต้องใช้ ${singleCost} USDT (ปัจจุบันมีใน Vault: ${walletVault.toFixed(2)} USDT)`
      );
      return;
    }
    if (paymentSource === 'wallet' && currentWallet.balance < singleCost) {
      setErrorMsg(
        `ยอดเงินในกระเป๋าไม่พอ! ต้องใช้ ${singleCost} USDT (ปัจจุบันมีในกระเป๋า: ${currentWallet.balance.toFixed(2)} USDT)`
      );
      return;
    }
    if (paymentSource === 'combined' && totalAvailableFunds < singleCost) {
      setErrorMsg(
        `ยอดเงินรวมไม่เพียงพอ! ต้องใช้ ${singleCost} USDT (กระเป๋า ${currentWallet.balance.toFixed(2)} + Upgrade Vault ${walletVault.toFixed(2)} = รวม ${totalAvailableFunds.toFixed(2)} USDT)`
      );
      return;
    }

    try {
      onRegister(effectiveParentId, effectiveIsLeft, sponsorIdInput, paymentSource, selectedRank);
      const paymentMethodNotice = paymentSource === 'vault'
        ? ' (ชำระด้วย Upgrade Vault 100%)'
        : paymentSource === 'wallet'
        ? ' (ชำระด้วยกระเป๋าเงิน USDT - ตัดเงินกระเป๋าเป็นอันดับแรก)'
        : ' (ชำระด้วยกระเป๋าเงิน USDT + เสริม Upgrade Vault)';

      setSuccessMsg(
        `✅ สมัครสมาชิกเปิดไอดีหลักใหม่สำเร็จ! รหัสใหม่เข้าผัง Rank ${selectedRank} (${selectedRankInfo.title}) เชื่อมต่อกับอัพไลน์ #${effectiveParentId} (${effectiveIsLeft ? 'ฝั่งซ้าย' : 'ฝั่งขวา'}) โดยมีผู้แนะนำคือ #${sponsorIdInput}${paymentMethodNotice} เรียบร้อย`
      );
      if (quickTarget) onClearQuickTarget();
      setIsAutoPlacement(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    }
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const totalCost = batchCount * singleCost;
    if (paymentSource === 'vault' && walletVault < totalCost) {
      setErrorMsg(
        `ยอด Upgrade Vault ไม่พอสำหรับสมัครแบบชุด (${batchCount} รหัส = ${totalCost} USDT, ใน Vault มี ${walletVault.toFixed(2)} USDT)`
      );
      return;
    }
    if (paymentSource === 'wallet' && currentWallet.balance < totalCost) {
      setErrorMsg(
        `ยอดเงินในกระเป๋าไม่พอสำหรับสมัครแบบชุด (${batchCount} รหัส = ${totalCost} USDT, กระเป๋ามี ${currentWallet.balance.toFixed(2)} USDT)`
      );
      return;
    }
    if (paymentSource === 'combined' && totalAvailableFunds < totalCost) {
      setErrorMsg(
        `ยอดเงินรวมไม่พอสำหรับสมัครแบบชุด (${batchCount} รหัส = ${totalCost} USDT, กระเป๋า ${currentWallet.balance.toFixed(2)} + Upgrade Vault ${walletVault.toFixed(2)} = รวม ${totalAvailableFunds.toFixed(2)} USDT)`
      );
      return;
    }

    try {
      onBatchRegister(batchCount, paymentSource, sponsorIdInput, selectedRank);
      const paymentMethodNotice = paymentSource === 'vault'
        ? 'ชำระด้วย Upgrade Vault 100%'
        : paymentSource === 'wallet'
        ? 'ชำระด้วยกระเป๋าเงิน USDT (ตัดกระเป๋าเป็นอันดับแรก)'
        : 'ตัดเงินกระเป๋าก่อน + เสริม Vault';

      setSuccessMsg(
        `⚡ สมัครแบบชุดสำเร็จ! ระบบสร้าง ${batchCount} รหัสในผัง Rank ${selectedRank} (${selectedRankInfo.title}) ใน 1 ธุรกรรม (${paymentMethodNotice} ประหยัด Gas ${gasPercentSaved}%)`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสมัครแบบชุด');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl text-slate-200">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center space-x-1.5 flex-wrap gap-1">
              <span>📝 สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID Registration)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                [สร้างไอดีหลัก • Main ID]
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {t('regCardPrice')}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              เปิดรหัสหลักใหม่โดยตรง (มีสิทธิ์ไต่ผัง Auto-Upgrade สู่ Rank 2–45) • สำหรับระบบเกิดใหม่โคลนนิ่งจะทำงานให้อัตโนมัติในผัง
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
              mode === 'single'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('singleModeBtn')}
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              mode === 'batch'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-purple-400 hover:text-purple-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('batchModeBtn')}</span>
          </button>
        </div>
      </div>

      {/* System Registered User Stats Summary Banner */}
      <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-700/60 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center space-x-2">
          <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-slate-100">
            📊 จำนวนยูสที่สมัครในระบบ:
          </span>
        </div>
        <div className="flex items-center space-x-2 font-mono flex-wrap text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 font-bold flex items-center space-x-1" title="จำนวนยูสที่สมัครจริง (ไอดีสมัครหลัก)">
            <span>👥 ยูสสมัครหลัก:</span>
            <strong className="text-amber-300 text-xs sm:text-sm font-extrabold">{mainUsersCount}</strong>
            <span>ยูส</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-bold" title="จำนวนกระเป๋าเงินผู้สมัคร">
            💳 กระเป๋าผู้สมัคร: <strong className="text-white font-extrabold">{uniqueWalletsCount}</strong> กระเป๋า
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/80 text-purple-300 font-bold" title="จำนวนรหัสโคลนนิ่งที่ถูกสร้างแล้ว">
            🌱 โคลนนิ่ง: <strong className="text-purple-200 font-extrabold">{rebirthCount}</strong> รหัส
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 font-bold" title="รวมจำนวนรหัสทั้งหมดในระบบ">
            รวมทั้งหมด: <strong className="text-white font-extrabold">{nodes.length}</strong> รหัส
          </span>
        </div>
      </div>

      {/* ⏱️ Auto Execution Delay Speed Selector */}
      <div className="mb-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-slate-300">
            ⏱️ หน่วงเวลา Auto โคลนนิ่ง & New Main ID:
          </span>
        </div>
        <div className="flex items-center space-x-1.5 flex-wrap">
          {[
            { sec: 0, label: 'ทันที (0s)' },
            { sec: 1, label: '1 วิ' },
            { sec: 2, label: '2 วิ' },
            { sec: 3, label: '3 วิ' },
            { sec: 5, label: '5 วิ' },
          ].map((d) => (
            <button
              key={`reg-delay-${d.sec}`}
              type="button"
              onClick={() => onSetAutoDelaySec && onSetAutoDelaySec(d.sec)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                autoDelaySec === d.sec
                  ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ⏳ Active Countdown Banner */}
      {autoCountdown > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-slate-950 border border-amber-500/60 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <div>
              <span className="text-xs text-amber-200 block">
                ⏳ กำลังหน่วงเวลารัน: <strong className="text-amber-300">{autoTaskType || 'Auto Action'}</strong>
              </span>
              <span className="text-[11px] text-slate-300">
                ระบบจะประมวลผลรอบนี้ในอีก <span className="text-amber-400 font-mono font-extrabold text-sm">{autoCountdown}</span> วินาที
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 self-end sm:self-auto flex-wrap">
            {onExecuteAutoNow && (
              <button
                type="button"
                onClick={onExecuteAutoNow}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] shadow cursor-pointer flex items-center space-x-1"
                title="รันรอบปัจจุบัน 1 รหัสทันที"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>รันรอบนี้ทันที (1 รหัส)</span>
              </button>
            )}
            {onExecuteAllAutoNow && autoTotalRounds > 1 && (
              <button
                type="button"
                onClick={onExecuteAllAutoNow}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[11px] shadow cursor-pointer flex items-center space-x-1 border border-purple-400"
                title="รันทุกรอบให้เสร็จหมดทันที"
              >
                <Sparkles className="w-3 h-3" />
                <span>รันหมด ({autoTotalRounds} รอบ)</span>
              </button>
            )}
            {onCancelAuto && (
              <button
                type="button"
                onClick={onCancelAuto}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
              >
                ✕ หยุด/ข้าม
              </button>
            )}
          </div>
        </div>
      )}

      {/* ⚡ Dedicated Automation & Quick Actions Panel (Auto โคลนนิ่ง & Auto เปิด New Main ID) */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Panel 1: Auto โคลนนิ่ง */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 border-2 border-purple-500/50 shadow-md flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-200">⚡ Auto โคลนนิ่ง (Rebirth)</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              autoRebirth ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {autoRebirth ? '🟢 เปิดใช้งาน' : '⚪ ปิดอยู่'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            โคลนนิ่งรหัสใหม่อัตโนมัติทันทีเมื่อมีลูกขาขวา (100% 5.00 U เข้ากองกลาง Rebirth)
          </p>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-900/40">
            <button
              type="button"
              onClick={() => onToggleAutoRebirth && onToggleAutoRebirth(!autoRebirth)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                autoRebirth
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <span>{autoRebirth ? '⚡ สวิตช์: เปิดอยู่' : '⚪ สวิตช์: ปิดอยู่'}</span>
            </button>

            {onBatchExecuteRebirths && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  try {
                    onBatchExecuteRebirths();
                    setSuccessMsg('⚡ สั่งประมวลผล Auto โคลนนิ่งค้างทั้งหมดเรียบร้อย!');
                  } catch (err: any) {
                    setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการโคลนนิ่ง');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] shadow-sm flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>สั่งโคลนทันที</span>
              </button>
            )}
          </div>
        </div>

        {/* Panel 2: Auto สมัครเปิด New Main ID จากส่วนเกิน 40% Vault */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border-2 border-indigo-500/50 shadow-md flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-200">👑 Auto เปิด New Main ID</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              autoExcessVaultNewMainId ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {autoExcessVaultNewMainId ? '🟢 เปิดใช้งาน' : '⚪ ปิดอยู่'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            สมัครเปิด New Main ID ผัง 1 อัตโนมัติเมื่อยอดส่วนเกิน 40% Vault (ผัง 1-5) ครบ 5.00 U
          </p>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-indigo-900/40">
            <button
              type="button"
              onClick={() => onToggleAutoExcessVaultNewMainId && onToggleAutoExcessVaultNewMainId(!autoExcessVaultNewMainId)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                autoExcessVaultNewMainId
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <span>{autoExcessVaultNewMainId ? '⚡ สวิตช์: เปิดอยู่' : '⚪ สวิตช์: ปิดอยู่'}</span>
            </button>

            {onExecuteMainIdRebirthFromExcessVault && excessSummary && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  try {
                    const newId = onExecuteMainIdRebirthFromExcessVault(selectedExcessMainId);
                    setSuccessMsg(
                      `👑 สมัครเปิด New Main ID #${newId} จากส่วนเกิน 40% Vault สำเร็จ!`
                    );
                  } catch (err: any) {
                    setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเปิด New Main ID');
                  }
                }}
                disabled={!excessSummary.canRegisterNewMainId}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-sm flex items-center space-x-1 transition-all ${
                  excessSummary.canRegisterNewMainId
                    ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-300" />
                <span>
                  {excessSummary.canRegisterNewMainId
                    ? `เปิด New Main ID (${excessSummary.excessVault.toFixed(1)} U)`
                    : `ส่วนเกิน ${excessSummary.excessVault.toFixed(1)}/5.0 U`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Active Status Bar with Quick Account Switcher */}
      <div className="mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
        {wallets && wallets.length > 0 && onSelectWallet && (
          <div className="pb-2 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1.5 font-medium">
              <span>เลือกกระเป๋าผู้สมัคร (Register as Wallet):</span>
            </span>
            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
              {wallets.slice(0, 6).map((w) => {
                const isCurrent = currentWallet.address.toLowerCase() === w.address.toLowerCase();
                return (
                  <button
                    key={`switch-reg-w-${w.address}`}
                    type="button"
                    onClick={() => onSelectWallet(w.address)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                      isCurrent
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/50 border border-indigo-400/40'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{w.name}</span>
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1 inline-block animate-ping" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400">{t('activeWalletLabel')}:</span>
              <span className="font-semibold text-slate-100">{currentWallet.name}</span>
            </div>
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            <span
              className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md font-bold"
              title="USDT Wallet Balance"
            >
              💳 กระเป๋า: {currentWallet.balance.toFixed(2)} U
            </span>
            <span
              className="text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1"
              title="Upgrade Vault Balance (40% เม็ดซ้ายสะสม)"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Vault: {walletVault.toFixed(2)} U</span>
            </span>
            <span
              className="text-indigo-300 bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded-md font-bold"
              title="Total Available Funds"
            >
              รวม: {totalAvailableFunds.toFixed(2)} U
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            ({currentWallet.address.slice(0, 6)}...{currentWallet.address.slice(-4)})
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">{t('directUplineLabel')}:</span>
            {currentWallet.address.toLowerCase() === '0x1111111111111111111111111111111111111111' ? (
              <span className="font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded-full font-mono flex items-center space-x-1">
                <span>#1 (id1)</span>
              </span>
            ) : (
              <span className="font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800 px-2 py-0.5 rounded-full font-mono">
                {currentWallet.firstSponsor ? getWalletName(currentWallet.firstSponsor) : '#1 (Root)'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-purple-300 font-semibold">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{t('walletRebirthLabel')}: {currentWallet.rebirthCount || 0}</span>
          </div>

          {(currentWallet.pendingRebirths || 0) > 0 && (
            <span className="text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 animate-pulse text-[10px]">
              {t('pendingRebirthsLabel')} {currentWallet.pendingRebirths}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 text-[11px]">
          <span className="text-slate-400">{t('ownedNodesLabel')}:</span>
          <span className="font-bold text-indigo-300">
            {currentWallet.nodeIds.length > 0 ? (
              Array.from(new Set(currentWallet.nodeIds)).map((id, idx) => (
                <span
                  key={`reg-owned-${id}-${idx}`}
                  className="mr-1 px-1.5 py-0.2 rounded bg-indigo-950/60 border border-indigo-800 text-[10px]"
                >
                  #{id}
                </span>
              ))
            ) : (
              <span className="text-slate-500 font-normal">{t('noNodesYetRegister')}</span>
            )}
          </span>
        </div>
        </div>
      </div>

      {/* Payment Source Selection Card */}
      <div className="mb-4 p-3.5 rounded-xl bg-slate-950/90 border border-indigo-950/80 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-100">{t('paySourceTitle')}</span>
            <span className="text-[10px] text-indigo-300 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.2 rounded-full font-medium">
              รองรับเงิน Upgrade Vault 40% สมัครสมาชิก
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-slate-400">{t('totalAvailableFunds')}:</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-0.5 rounded-md">
              {totalAvailableFunds.toFixed(2)} USDT
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Option 1 (อันดับแรก / ค่าเริ่มต้น): กระเป๋าเงิน USDT */}
          <button
            type="button"
            onClick={() => setPaymentSource('wallet')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              paymentSource === 'wallet'
                ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-300 flex items-center">
                <Wallet className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                {t('payWithWallet')}
              </span>
              {currentWallet.balance >= (mode === 'single' ? singleCost : batchTotalCost) ? (
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-500/40">
                    อันดับแรก
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
              ) : (
                <span className="text-[9px] text-rose-400 font-mono">
                  ขาด {Math.max(0, (mode === 'single' ? singleCost : batchTotalCost) - currentWallet.balance).toFixed(2)} U
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              หักจากกระเป๋า: <strong className="text-emerald-300 font-mono">{currentWallet.balance.toFixed(2)} USDT</strong>
              <span className="block text-[9px] text-emerald-400/90 mt-0.5 font-medium">
                ★ ตัดเงินกระเป๋าเป็นอันดับแรก (ค่าเริ่มต้น)
              </span>
            </p>
          </button>

          {/* Option 2: อัตโนมัติ (ตัดเงินกระเป๋าก่อน + เสริม Vault) */}
          <button
            type="button"
            onClick={() => setPaymentSource('combined')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              paymentSource === 'combined'
                ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/50 shadow-md'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-indigo-300 flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {t('payWithCombined')}
              </span>
              {(mode === 'single' ? canSinglePay : canBatchPay) ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              ใช้กระเป๋า <strong className="text-emerald-300 font-mono">{(mode === 'single' ? singleWalletCovered : batchWalletCovered).toFixed(2)} U</strong>
              {((mode === 'single' ? singleVaultNeeded : batchVaultNeeded) > 0) && (
                <span> + เสริม Vault <strong className="text-amber-300 font-mono">{(mode === 'single' ? singleVaultNeeded : batchVaultNeeded).toFixed(2)} U</strong></span>
              )}
              <span className="block text-[9px] text-slate-400 mt-0.5">
                ตัดกระเป๋าก่อน หากไม่พอดึง Vault ช่วย
              </span>
            </p>
          </button>

          {/* Option 3: Upgrade Vault 100% */}
          <button
            type="button"
            onClick={() => setPaymentSource('vault')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              paymentSource === 'vault'
                ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/50 shadow-md'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-300 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {t('payWithVault')}
              </span>
              {walletVault >= (mode === 'single' ? singleCost : batchTotalCost) ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <span className="text-[9px] text-rose-400 font-mono">
                  ขาด {Math.max(0, (mode === 'single' ? singleCost : batchTotalCost) - walletVault).toFixed(2)} U
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              ใช้เงินใน Vault เท่านั้น: <strong className="text-amber-300 font-mono">{walletVault.toFixed(2)} USDT</strong>
              <span className="block text-[9px] text-slate-400 mt-0.5">
                หักจากเงินสะสม Upgrade Vault 40%
              </span>
            </p>
          </button>
        </div>
      </div>

      {/* 🌟 ฟังก์ชันพิเศษ: สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID Registration) จากส่วนเกิน 40% Vault (ผัง 1 ถึง 5) */}
      {excessSummary && (
        <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/40 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-xs font-bold text-purple-200">
                สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID Registration) จากส่วนเกิน 40% Vault (ผัง 1 ถึง 5)
              </span>
            </div>
            {ownedMainNodes.length > 1 && (
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-slate-400 text-[10px]">เลือกไอดีหลัก:</span>
                <select
                  value={selectedExcessMainId}
                  onChange={(e) => setSelectedExcessMainId(Number(e.target.value))}
                  className="bg-slate-900 text-purple-200 border border-purple-500/50 rounded-lg px-2 py-0.5 text-[11px] font-mono focus:outline-none"
                >
                  {ownedMainNodes.map((mn) => (
                    <option key={`reg-excess-${mn.id}`} value={mn.id}>
                      ไอดี #{mn.id} (ผัง {mn.rank})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-2.5">
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">1. (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 5)</span>
              <span className="font-mono font-bold text-amber-300">{(excessSummary.vaultRank1To5 ?? excessSummary.totalAllVault).toFixed(2)} U</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">
                2. 40% Upgrade Vault สำรองย้อนหลัง 5 ผัง
              </span>
              <span className="font-mono font-bold text-indigo-300">
                {excessSummary.isRank11OrAbove
                  ? '0.00 U (ผัง ≥ 11 รับเต็ม 100%)'
                  : excessSummary.isRank10OrAbove
                  ? '0.00 U (ผัง 6-10 อยู่นอกผัง 1-5)'
                  : `${excessSummary.reserved5RanksVault.toFixed(2)} U [${excessSummary.reservedRanksText}]`}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30">
              <span className="text-[10px] text-purple-300 block font-semibold">3. ยอดส่วนเกินสุทธิ (ลงผัง 1 มูลค่า 5.00 U)</span>
              <span className={`font-mono font-bold ${excessSummary.excessVault >= 5 ? 'text-emerald-400' : 'text-purple-300'}`}>
                {excessSummary.excessVault.toFixed(2)} / 5.00 U
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-purple-500/20">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-300 leading-tight block">
                สูตรคำนวณ: {excessSummary.formulaText} {excessSummary.canRegisterNewMainId ? `✨ (พร้อมสมัครเปิดไอดีหลักใหม่ได้ ${excessSummary.newMainIdCountPossible} รหัส)` : `(รอสะสมครบ 5.00 USDT)`}
              </span>
              <span className="text-[9.5px] text-indigo-300 flex items-center gap-1">
                <span>📍 การจัดวาง:</span>
                <span className="text-slate-400">ขั้นที่ 1: ติดตัวผู้แนะนำตรงก่อน (ลงซ้ายหรือขวา) • ขั้นที่ 2: เต็ม 2 ขาโยนลงใต้รหัสโคลนของผู้แนะนำเท่านั้น จากล่างสุดขึ้นบน</span>
              </span>
            </div>

            {onExecuteMainIdRebirthFromExcessVault && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  try {
                    const newId = onExecuteMainIdRebirthFromExcessVault(selectedExcessMainId);
                    setSuccessMsg(
                      `✨ สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID Registration) #${newId} จากส่วนเกิน 40% Vault (ผัง 1 ถึง 5) สำเร็จ! (หักยอดส่วนเกิน 5.00 USDT โดยไม่ต้องใช้เงินสด)`
                    );
                  } catch (err: any) {
                    setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเปิดไอดีหลักใหม่จากส่วนเกิน 40% Vault');
                  }
                }}
                disabled={!excessSummary.canRegisterNewMainId}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-[11px] shadow-md transition-all shrink-0 flex items-center justify-center space-x-1 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                <span>สมัครเปิดไอดีหลักใหม่จากส่วนเกิน 40% Vault (5.00 U)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/70 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/70 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MODE 1: SINGLE REGISTRATION */}
      {mode === 'single' ? (
        <form onSubmit={handleSingleRegister} className="space-y-4">
          {/* Breadth-First Search (BFS) Auto-Placement Banner */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-800/60 text-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isAutoPlacement ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isAutoPlacement ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                </span>
                <span className="font-bold text-slate-100 flex items-center space-x-1.5">
                  <span>ระบบจัดตำแหน่งอัตโนมัติ (BFS Auto-Fill)</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                      isAutoPlacement
                        ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 font-semibold'
                        : 'bg-amber-950/70 border-amber-700/80 text-amber-300 font-semibold'
                    }`}
                  >
                    {isAutoPlacement ? '● ทำงานออโต้ (AUTO ACTIVE)' : '○ กำหนดเอง (MANUAL)'}
                  </span>
                </span>
              </div>

              {/* Context Selector & Auto Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAutoPlacement) {
                      handleApplyBfs();
                    } else {
                      setIsAutoPlacement(false);
                    }
                  }}
                  className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold transition-all border flex items-center space-x-1 ${
                    isAutoPlacement
                      ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-slate-300'
                      : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-sm'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{isAutoPlacement ? 'สลับเป็นเลือกเอง' : '⚡ เปิดทำงานออโต้ทันที'}</span>
                </button>

                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className="text-slate-400 hidden sm:inline">สแกนจาก:</span>
                  <select
                    value={bfsRootId}
                    onChange={(e) => setBfsRootId(Number(e.target.value))}
                    className="bg-slate-900 text-slate-200 text-[11px] rounded-lg border border-slate-700 px-2 py-1"
                  >
                    <option value={1}>🌐 รหัสราก (#1 Root)</option>
                    {sponsorIdInput > 1 && !currentWallet.nodeIds.includes(sponsorIdInput) && (
                      <option value={sponsorIdInput}>
                        👥 สายงานผู้แนะนำ (#{sponsorIdInput})
                      </option>
                    )}
                    {Array.from(new Set(currentWallet.nodeIds)).map((id, idx) => (
                      <option key={`my-opt-${id}-${idx}`} value={id}>
                        👤 รหัสของฉัน (#{id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {bfsRecommendation ? (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-indigo-900/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-medium text-[11px] flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {isAutoPlacement ? 'ตำแหน่งที่ระบบใส่อัตโนมัติ:' : 'ตำแหน่งว่างแนะนำ (BFS):'}
                    </span>
                    <span className="bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-lg text-indigo-300 font-mono text-[11px] font-bold shadow-sm">
                      รหัสพ่อ #{bfsRecommendation.parentId} ({bfsRecommendation.isLeft ? 'ฝั่งซ้าย' : 'ฝั่งขวา'})
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      ชั้นที่ {bfsRecommendation.depth} ({getWalletName(bfsRecommendation.parentOwner)})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {bfsRecommendation.isRebirthTarget && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-900 border border-purple-500 text-purple-200 font-bold text-[10px] flex items-center shadow-sm animate-pulse">
                        ⚡ โยนให้รหัสเกิดใหม่ของ #{sponsorIdInput}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-semibold text-[10px] flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                      สถานะ: ว่าง 100%
                    </span>
                  </div>
                </div>

                {bfsRecommendation.reason && (
                  <div className="text-[11px] text-indigo-300/85 flex items-center space-x-1 pl-1">
                    <span className="text-indigo-400 font-mono">↳</span>
                    <span>{bfsRecommendation.reason}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">ผังเต็ม ไม่พบตำแหน่งว่าง</p>
            )}
          </div>

          {/* Form Fields: Sponsor ID & Target Parent & Slot Selection */}
          <div className="space-y-4">
            {/* SPONSOR ID FIELD (ผู้แนะนำยังคงเป็นหมายเลขที่กรอก) */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/60 shadow-inner space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('sponsorIdField')}</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded-full">
                    {t('sponsorFixedNotice')}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400/90 font-mono">
                  {t('directBonusEarn')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={sponsorIdInput}
                    onChange={(e) => setSponsorIdInput(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    placeholder={t('sponsorPlaceholder')}
                  />
                  {currentWallet.address.toLowerCase() === '0x1111111111111111111111111111111111111111' && sponsorIdInput !== 1 && (
                    <button
                      type="button"
                      onClick={() => setSponsorIdInput(1)}
                      className="absolute right-2 top-2 px-2 py-0.5 text-[10px] bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-md transition-colors"
                    >
                      {t('chooseId1')}
                    </button>
                  )}
                </div>

                {sponsorNode ? (
                  <div className="text-[11px] text-slate-300 flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700/80">
                    <span className="truncate">
                      {t('directSponsorLabel')}: <strong className="text-emerald-300">#{sponsorNode.id} ({getWalletName(sponsorNode.owner)})</strong>
                      {sponsorNode.id === 1 && (
                        <span className="ml-1 text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          Direct Upline (Wallet 1)
                        </span>
                      )}
                    </span>
                    <span className="text-emerald-400 font-mono font-bold shrink-0 ml-2">30% (+1.50 USDT)</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800 px-3 py-2 rounded-xl">
                    ⚠️ {t('sponsorNotFound')} #{sponsorIdInput}
                  </div>
                )}
              </div>
              {/* แบนเนอร์แสดงเงื่อนไขพิเศษ: ถ้ารหัสผู้แนะนำที่เรากรอก และเต็มทั้ง 2 ขาแล้ว ให้ไปหารหัสที่เกิดใหม่ของ ID ที่เรากรอกตรงรหัสผู้แนะนำ */}
              {sponsorNode && sponsorNode.leftChild !== 0 && sponsorNode.rightChild !== 0 && (
                <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-600/80 text-purple-100 text-xs flex items-start gap-2.5 shadow-md">
                  <Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-purple-200 text-xs">
                        ⚡ เงื่อนไขระบบ: แนะนำโดยไอดี #{sponsorIdInput} (แต่ไอดี #{sponsorIdInput} เต็มทั้ง 2 ขาแล้ว)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-800 text-amber-300 border border-purple-500 text-[10px] font-bold">
                        โยนต่อให้รหัสเกิดใหม่ของ #{sponsorIdInput} ทันที
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200/90 leading-relaxed">
                      ระบบจะทำการโยนสายงาน (Auto-Spillover) ไปจัดวางใต้<strong>รหัสเกิดใหม่ของไอดี #{sponsorIdInput}</strong> อัตโนมัติ
                      {bfsRecommendation?.isRebirthTarget ? (
                        <span className="text-amber-300 font-semibold ml-1">
                          (รหัสแม่ #{bfsRecommendation.parentId} {bfsRecommendation.isLeft ? 'ฝั่งซ้าย' : 'ฝั่งขวา'})
                        </span>
                      ) : ''}
                      {' '}โดยสิทธิประโยชน์ค่าแนะนำตรง 30% (1.50 USDT) ยังคงส่งมอบเข้ากระเป๋าของผู้แนะนำ #{sponsorIdInput} ({getWalletName(sponsorNode.owner)}) โดยตรง 100%
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-400">
                <p>
                  💡 แม้ว่าระบบจะจัดวางตำแหน่งในผัง (Spillover) หรือเลือกต่อตรงใต้รหัสแม่อื่น <strong>ผู้แนะนำยังคงเป็นหมายเลขที่กรอกตรงนี้เสมอ</strong>
                </p>
                <div className="text-emerald-400/90 font-medium shrink-0 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                  📌 อัพไลน์ (Parent) และ Direct Upline ของ ID #1 คือ 0 = กองกลาง
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Parent ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {t('targetParentField')}
                  </label>
                  {isAutoPlacement && (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      ⚡ {t('autoPlacementBadge')}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  ({t('binaryTwoLegs')})
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={parentIdInput}
                  onChange={(e) => {
                    setParentIdInput(Number(e.target.value));
                    setIsAutoPlacement(false);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="เช่น 1, 2, 3..."
                />
              </div>

              {targetParent ? (
                <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span>
                      {t('ownerWalletLabel')}: <strong className="text-slate-200">{getWalletName(targetParent.owner)}</strong>
                    </span>
                    {targetParent.isRebirth && (
                      <span className="px-1.5 py-0.2 bg-purple-900/80 border border-purple-600 text-purple-200 text-[9px] rounded-full font-bold">
                        ✨ รหัสเกิดใหม่{targetParent.rebornFromNodeId ? ` จาก #${targetParent.rebornFromNodeId}` : ''}
                      </span>
                    )}
                  </div>
                  <span>{t('depthLevel')}: {targetParent.depth}</span>
                </div>
              ) : (
                <div className="mt-1.5 text-[11px] text-rose-400">
                  ⚠️ #{parentIdInput}
                </div>
              )}

              {/* Quick action to sync with vacant rebirth node of sponsor */}
              {sponsorNode && sponsorNode.leftChild !== 0 && sponsorNode.rightChild !== 0 && bfsRecommendation?.isRebirthTarget && (
                <div className="mt-1.5 flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-purple-950/50 border border-purple-700/60 text-[10px]">
                  <span className="text-purple-300 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                    รหัสเกิดใหม่ของผู้แนะนำ #{sponsorIdInput} ที่ว่างอยู่: <strong className="text-amber-300 font-mono">#{bfsRecommendation.parentId} ({bfsRecommendation.isLeft ? 'ฝั่งซ้าย' : 'ฝั่งขวา'})</strong>
                  </span>
                  {(parentIdInput !== bfsRecommendation.parentId || isLeftInput !== bfsRecommendation.isLeft || !isAutoPlacement) && (
                    <button
                      type="button"
                      onClick={() => {
                        setParentIdInput(bfsRecommendation.parentId);
                        setIsLeftInput(bfsRecommendation.isLeft);
                        setIsAutoPlacement(true);
                      }}
                      className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold transition-colors shrink-0 shadow-sm"
                    >
                      ⚡ ใช้รหัสนี้
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Target Slot (Left vs Right) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {t('placementSlotField')}
                </label>
                {isAutoPlacement && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    ⚡ {t('autoPlacementBadge')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Left Slot Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLeftInput(true);
                    setIsAutoPlacement(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isLeftInput
                      ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center text-emerald-300">
                      <ArrowDownLeft className="w-3.5 h-3.5 mr-1" />
                      {t('leftLegOne')}
                    </span>
                    {targetParent?.leftChild !== 0 ? (
                      <span className="text-[9px] text-rose-300 font-bold bg-rose-950/80 border border-rose-800 px-1.5 py-0.2 rounded flex items-center">
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5 text-rose-400" />
                        {t('slotFull')} (#{targetParent?.leftChild})
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded flex items-center">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 text-emerald-400" />
                        {t('slotEmpty')}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    100% Math (30% + 30% + 40%)
                  </span>
                </button>

                {/* Right Slot Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLeftInput(false);
                    setIsAutoPlacement(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    !isLeftInput
                      ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/40 shadow-sm'
                      : 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center text-purple-300">
                      <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                      {t('rightLegTwo')}
                    </span>
                    {targetParent?.rightChild !== 0 ? (
                      <span className="text-[9px] text-rose-300 font-bold bg-rose-950/80 border border-rose-800 px-1.5 py-0.2 rounded flex items-center">
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5 text-rose-400" />
                        {t('slotFull')} (#{targetParent?.rightChild})
                      </span>
                    ) : (
                      <span className="text-[9px] text-purple-300 font-bold bg-purple-950/80 border border-purple-800 px-1.5 py-0.2 rounded flex items-center">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 text-purple-400" />
                        {t('slotEmpty')}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    100% Rebirth Pool
                  </span>
                </button>
              </div>
            </div>
          </div>
          </div>

          {/* REAL-TIME SLOT STATUS BANNER (ว่าง / เต็มแล้ว) */}
          {/* REAL-TIME SLOT STATUS BANNER */}
          {isSlotFree ? (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-xs text-emerald-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {t('slotStatusFree')} — #{parentIdInput} ({isLeftInput ? t('leftLegOne') : t('rightLegTwo')})
                </span>
              </div>
              {isAutoPlacement ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shrink-0">
                  ⚡ {t('autoActive')}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {t('manualMode')}
                </span>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-700/70 text-xs text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {t('slotStatusFull')} #{parentIdInput} ({isLeftInput ? t('leftLegOne') : t('rightLegTwo')}) — #{currentOccupiedNodeId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyBfs}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center justify-center space-x-1 shadow-sm shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('switchAutoBfs')}</span>
              </button>
            </div>
          )}

          {/* REAL-TIME 5.0 USDT DISTRIBUTION SUMMARY */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-1.5">
              <div className="flex items-center space-x-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200">
                  {t('realtimeDistSummary')}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center space-x-1 self-start sm:self-auto ${
                  isLeftInput
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/40'
                }`}
              >
                <span>{isLeftInput ? t('leftChild100Math') : t('rightChildRebirth')}</span>
              </span>
            </div>

            {isLeftInput ? (
              /* Left Child 100% Math Breakdown */
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  {/* Direct 30% */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">{t('directSponsorShare')}</span>
                    <span className="font-mono font-bold text-emerald-400 text-base">
                      {DIRECT_BONUS.toFixed(2)} USDT
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      #{sponsorIdInput} ({sponsorNode ? getWalletName(sponsorNode.owner) : '-'})
                    </p>
                  </div>

                  {/* 15-Level 30% */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 block text-[10px]">{t('levels15Share')}</span>
                      <button
                        type="button"
                        onClick={() => setShowUplinePath(!showUplinePath)}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 underline flex items-center"
                      >
                        {showUplinePath ? t('cancel') : t('view')}
                        {showUplinePath ? <ChevronUp className="w-2.5 h-2.5 ml-0.5" /> : <ChevronDown className="w-2.5 h-2.5 ml-0.5" />}
                      </button>
                    </div>
                    <span className="font-mono font-bold text-indigo-400 text-base">
                      1.50 USDT
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      (#{parentIdInput}) 15x 0.10 USDT
                    </p>
                  </div>

                  {/* Upgrade Vault 40% */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">{t('upgradeVaultShare')}</span>
                    <span className="font-mono font-bold text-amber-400 text-base">
                      {UPGRADE_VAULT_SHARE.toFixed(2)} USDT
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Upgrade Vault (#{parentIdInput}) Rank 1–45
                    </p>
                  </div>
                </div>

                {/* Optional Expandable 15-Level Uplines Path */}
                {showUplinePath && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-900/40 text-[10px] space-y-1.5 animate-fadeIn">
                    <span className="font-semibold text-indigo-300 block">
                      15-Level Bonus Distribution (0.10 USDT/level):
                    </span>
                    {uplineLineage.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1">
                        {uplineLineage.map((item, idx) => (
                          <div
                            key={`upline-lineage-${item.level}-${item.nodeId || idx}`}
                            className={`flex items-center justify-between px-2 py-1 rounded border ${
                              item.level === 0
                                ? 'bg-indigo-950/70 border-indigo-700/80 text-indigo-200'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span>
                              {item.level === 0 ? '★ Level 0 (Parent)' : `Level ${item.level}`}: #{item.nodeId} ({getWalletName(item.owner)})
                            </span>
                            <span className="font-mono text-emerald-400 font-semibold">
                              +{item.bonus.toFixed(2)} USDT
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">id1 (Treasury)</p>
                    )}
                    {uplineLineage.length < MAX_LEVELS && (
                      <div className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-300 font-mono">
                        🏛️ ค่าชั้นส่วนที่เหลือโอนเข้ากระเป๋ากลาง (id1 Treasury): {MAX_LEVELS - uplineLineage.length} ชั้น x {LEVEL_BONUS} = {((MAX_LEVELS - uplineLineage.length) * LEVEL_BONUS).toFixed(2)} USDT
                      </div>
                    )}
                  </div>
                )}

                {/* Formula verification */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800/80">
                  <span>100% Math:</span>
                  <span className="font-mono text-slate-300">
                    1.50 + 1.50 + 2.00 = <strong className="text-emerald-400">5.00 USDT (100%)</strong>
                  </span>
                </div>
              </div>
            ) : (
              /* Right Child Rebirth Trigger Breakdown */
              <div className="p-3 sm:p-3.5 rounded-xl bg-purple-950/25 border border-purple-800/40 text-[11px] space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-purple-800/30">
                  <span className="text-slate-300">Rebirth Trigger (100%):</span>
                  <span className="font-mono font-bold text-sm text-purple-300">
                    5.00 USDT
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-300">Parent #{parentIdInput}:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded text-[10px]">
                      rebirthCount += 1
                    </span>
                    <span className="font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded text-[10px]">
                      pendingRebirths += 1
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                  💡 <strong>Rebirth Pool:</strong> 100% (5.0 USDT) <code>rebirthPool</code>, <code>pendingRebirths += 1</code>
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          {isSlotFree ? (
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:opacity-95 text-white transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isAutoPlacement
                  ? `${t('confirmAutoRegister')} (Parent #${parentIdInput} ${isLeftInput ? t('leftLegOne') : t('rightLegTwo')}) — ${REGISTRATION_FEE.toFixed(1)} USDT`
                  : `${t('confirmManualRegister')} (Parent #${parentIdInput} ${isLeftInput ? t('leftLegOne') : t('rightLegTwo')}) — ${REGISTRATION_FEE.toFixed(1)} USDT`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyBfs}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-rose-900/60 hover:bg-rose-800/80 border border-rose-700/80 text-rose-200 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{t('switchAutoBfs')}</span>
            </button>
          )}
        </form>
      ) : (
        /* MODE 2: BATCH REGISTRATION */
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-purple-300 font-semibold text-xs">
                <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{t('batchGasSaved')}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                {t('saveGasUpTo')} {gasPercentSaved}%
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              <code>batchRegister(uint256[] parentIds, bool[] isLefts)</code> — Atomic Transaction (~60-70% Gas reduction)
            </p>

            {/* Batch Count Selectors: +2, +3, +5, +10 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t('selectBatchQty')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[2, 3, 5, 10].map((num) => (
                  <button
                    key={`batch-count-btn-${num}`}
                    type="button"
                    onClick={() => setBatchCount(num)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                      batchCount === num
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-400 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40'
                        : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm font-black text-purple-200">+{num}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 font-normal">
                      {(num * REGISTRATION_FEE).toFixed(0)} USDT
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* GAS SAVINGS BENCHMARK CARD */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
                <span className="flex items-center space-x-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('gasBenchmark')}</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  ~{gasPercentSaved}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">Single (x{batchCount}):</span>
                  <span className="font-mono text-rose-400 font-bold">
                    ~{totalSingleGas.toLocaleString()} Gas Units
                  </span>
                  <p className="text-[9px] text-slate-500">{batchCount} txs</p>
                </div>

                <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-800/40 space-y-0.5">
                  <span className="text-purple-300 block text-[10px]">Batch (x{batchCount}):</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ~{totalBatchGas.toLocaleString()} Gas Units
                  </span>
                  <p className="text-[9px] text-slate-400">1 tx, save ~{(totalSingleGas - totalBatchGas).toLocaleString()} Gas</p>
                </div>
              </div>

              {/* Progress bar visual comparison */}
              <div className="pt-1">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${100 - gasPercentSaved}%` }}
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    title={`Batch Gas: ${100 - gasPercentSaved}%`}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>Batch: {100 - gasPercentSaved}%</span>
                  <span>{t('gasSaved')}: {gasPercentSaved}%</span>
                </div>
              </div>
            </div>

            {/* REAL-TIME BATCH BFS SIMULATION PREVIEW */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t('batchBfsPreview')} ({batchPreview.length}):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {t('leftLegOne')} {batchLeftCount} | {t('rightLegTwo')} {batchRightCount}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 text-[11px]">
                {batchPreview.map((slot, sIdx) => (
                  <div
                    key={`batch-slot-${slot.index}-${sIdx}`}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-slate-400 font-bold">#{slot.index}</span>
                      <span className="text-slate-200">
                        Parent <strong>#{slot.parentId}</strong>
                      </span>
                      {slot.isRebirthTarget && (
                        <span className="text-[9px] text-purple-300 font-bold bg-purple-900/80 border border-purple-600 px-1 rounded">
                          Rebirth #1
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                        slot.isLeft
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : 'bg-purple-950/60 border-purple-800 text-purple-300'
                      }`}
                    >
                      {slot.isLeft ? t('leftChild100Math') : t('rightChildRebirth')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Aggregated distribution of the batch */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-[10px]">
                <div className="bg-slate-900 p-1.5 rounded text-center">
                  <span className="text-slate-400 block">{t('levels15Share')}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(batchLeftCount * 3.0).toFixed(1)} U
                  </span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded text-center">
                  <span className="text-slate-400 block">{t('upgradeVaultShare')}</span>
                  <span className="font-mono font-bold text-amber-400">
                    {(batchLeftCount * 2.0).toFixed(1)} U
                  </span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded text-center">
                  <span className="text-slate-400 block">Rebirth Pool</span>
                  <span className="font-mono font-bold text-purple-400">
                    {(batchRightCount * 5.0).toFixed(1)} U
                  </span>
                </div>
              </div>
            </div>

            {/* Total Cost Summary */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">{t('totalBatchAmount')} ({batchCount}):</span>
              <span className="font-mono font-bold text-lg text-purple-300">
                {(batchCount * REGISTRATION_FEE).toFixed(2)} USDT
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:opacity-95 text-white transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>
              {t('confirmBatchRegisterBtn')} {batchCount} ({(batchCount * REGISTRATION_FEE).toFixed(0)} USDT)
            </span>
          </button>
        </form>
      )}
    </div>
  );
};
