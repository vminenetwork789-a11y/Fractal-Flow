import { MatrixNode, WalletAccount, ActivityLog, SlotTarget, RankInfo, RankQueueNode, RegistrationPaymentSource, AppNotification, NotificationType, RebirthRoundInfo, ExcessRebirthVaultSummary } from '../types';

export const REGISTRATION_FEE = 5.0;
export const DIRECT_BONUS = 1.5;   // 30%
export const LEVEL_BONUS = 0.1;    // 2% per level (15 levels = 1.5 total = 30%)
export const UPGRADE_VAULT_SHARE = 2.0; // 40%
export const MAX_LEVELS = 15;
export const MAX_RANK = 45;

const RANK_METADATA: { title: string; badge: string; gradient: string }[] = [
  { title: 'Iron Member', badge: '🛡️ R1', gradient: 'from-slate-600 to-slate-700' },
  { title: 'Bronze Member', badge: '🥉 R2', gradient: 'from-amber-700 to-amber-900' },
  { title: 'Silver Member', badge: '🥈 R3', gradient: 'from-slate-400 to-zinc-500' },
  { title: 'Gold Member', badge: '🥇 R4', gradient: 'from-yellow-500 to-amber-600' },
  { title: 'Platinum Star', badge: '💎 R5', gradient: 'from-cyan-500 to-blue-600' },
  { title: 'Emerald Elite', badge: '❇️ R6', gradient: 'from-emerald-500 to-teal-700' },
  { title: 'Sapphire Pro', badge: '🔷 R7', gradient: 'from-blue-600 to-indigo-700' },
  { title: 'Ruby Veteran', badge: '🔺 R8', gradient: 'from-rose-600 to-red-700' },
  { title: 'Diamond King', badge: '💠 R9', gradient: 'from-sky-400 to-indigo-600' },
  { title: 'Master Knight', badge: '⚔️ R10', gradient: 'from-purple-600 to-pink-700' },
  { title: 'Grand Master', badge: '🔮 R11', gradient: 'from-violet-600 to-purple-900' },
  { title: 'Epic Champion', badge: '⚡ R12', gradient: 'from-fuchsia-600 to-pink-800' },
  { title: 'Legend Lord', badge: '🔥 R13', gradient: 'from-orange-500 to-red-700' },
  { title: 'Mythic Sovereign', badge: '⭐ R14', gradient: 'from-amber-400 to-yellow-600' },
  { title: 'Immortal Apex', badge: '👑 R15', gradient: 'from-yellow-400 via-amber-500 to-red-600' },
  { title: 'Celestial Voyager', badge: '🌌 R16', gradient: 'from-indigo-600 to-sky-700' },
  { title: 'Cosmic Guardian', badge: '🪐 R17', gradient: 'from-blue-700 to-purple-800' },
  { title: 'Astral Warden', badge: '✨ R18', gradient: 'from-purple-600 to-indigo-800' },
  { title: 'Solar Vanguard', badge: '☀️ R19', gradient: 'from-amber-500 to-orange-700' },
  { title: 'Supernova Overlord', badge: '💥 R20', gradient: 'from-red-600 to-amber-600' },
  { title: 'Galaxy Sovereign', badge: '🌀 R21', gradient: 'from-cyan-600 to-indigo-800' },
  { title: 'Nebula Archon', badge: '🌠 R22', gradient: 'from-teal-600 to-emerald-800' },
  { title: 'Hyperion Titan', badge: '🛡️ R23', gradient: 'from-yellow-600 to-amber-800' },
  { title: 'Aether Dominator', badge: '💠 R24', gradient: 'from-blue-500 to-cyan-700' },
  { title: 'Quantum Monarch', badge: '⚛️ R25', gradient: 'from-violet-600 to-fuchsia-800' },
  { title: 'Infinity Conqueror', badge: '♾️ R26', gradient: 'from-indigo-500 to-rose-700' },
  { title: 'Vortex Sentinel', badge: '🌪️ R27', gradient: 'from-sky-600 to-blue-800' },
  { title: 'Zenith Supreme', badge: '🏔️ R28', gradient: 'from-emerald-600 to-cyan-800' },
  { title: 'Starlight Imperator', badge: '🌟 R29', gradient: 'from-amber-400 to-yellow-700' },
  { title: 'Eclipse Emperor', badge: '🌑 R30', gradient: 'from-slate-800 via-purple-900 to-slate-900' },
  { title: 'Titanium Vanguard', badge: '⚙️ R31', gradient: 'from-zinc-500 to-slate-700' },
  { title: 'Chrono Weaver', badge: '⏳ R32', gradient: 'from-teal-500 to-blue-700' },
  { title: 'Dimension Shifter', badge: '🚪 R33', gradient: 'from-purple-700 to-pink-700' },
  { title: 'Singularity Lord', badge: '🕳️ R34', gradient: 'from-violet-900 via-slate-900 to-indigo-950' },
  { title: 'Omni Luminary', badge: '💡 R35', gradient: 'from-yellow-400 to-amber-600' },
  { title: 'Genesis Sovereign', badge: '🌱 R36', gradient: 'from-emerald-500 to-green-700' },
  { title: 'Elysium Ascendant', badge: '🕊️ R37', gradient: 'from-sky-400 to-indigo-500' },
  { title: 'Valhalla Warlord', badge: '⚔️ R38', gradient: 'from-red-700 to-amber-800' },
  { title: 'Prometheus Prime', badge: '🔥 R39', gradient: 'from-orange-600 to-red-800' },
  { title: 'Nexus Archmage', badge: '🧙 R40', gradient: 'from-indigo-700 to-purple-900' },
  { title: 'Cybernetic Deity', badge: '🤖 R41', gradient: 'from-cyan-400 to-blue-700' },
  { title: 'Eternal Paragon', badge: '🏛️ R42', gradient: 'from-amber-300 via-yellow-500 to-amber-700' },
  { title: 'Universal Regent', badge: '👑 R43', gradient: 'from-fuchsia-600 via-purple-600 to-indigo-800' },
  { title: 'Godhead Luminary', badge: '☀️ R44', gradient: 'from-yellow-300 via-amber-400 to-orange-500' },
  { title: 'Omniverse Transcendence', badge: '💎 R45', gradient: 'from-indigo-400 via-fuchsia-500 to-amber-400' },
];

// Ranks 1 to 45 (45 Binary Matrix Trees): Custom configured prices from 5 USDT to 1,000,000 USDT
export const RANK_PRICES: number[] = [
  5, 10, 20, 30, 40, 50, 60, 80, 100, 200,
  300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000,
  4000, 5000, 6000, 7000, 8000, 9000, 10000, 20000, 30000, 40000,
  50000, 60000, 70000, 80000, 90000, 100000, 200000, 300000, 400000, 500000,
  600000, 700000, 800000, 900000, 1000000,
];

export const RANKS: RankInfo[] = Array.from({ length: MAX_RANK }, (_, idx) => {
  const rank = idx + 1;
  const price = RANK_PRICES[idx] !== undefined ? RANK_PRICES[idx] : 5;
  const meta = RANK_METADATA[idx] || {
    title: `Rank ${rank} Legend`,
    badge: `🎖️ R${rank}`,
    gradient: 'from-indigo-600 to-purple-700',
  };
  return {
    rank,
    name: `Rank ${rank}`,
    title: meta.title,
    price,
    badge: meta.badge,
    gradient: meta.gradient,
    directBonus: Math.round(price * 0.3 * 100) / 100, // 30%
    levelBonusTotal: Math.round(price * 0.3 * 100) / 100, // 30%
    upgradeShare: Math.round(price * 0.4 * 100) / 100, // 40%
  };
});

export const getRankPrice = (rank: number): number => {
  const safeRank = Math.max(1, Math.min(MAX_RANK, rank));
  return RANK_PRICES[safeRank - 1] !== undefined ? RANK_PRICES[safeRank - 1] : 5;
};

export const getRankInfo = (rank: number): RankInfo => {
  const safeRank = Math.max(1, Math.min(MAX_RANK, rank));
  return RANKS[safeRank - 1];
};

// 100 Extra Test Wallets (id5 to id104)
export const GENERATED_EXTRA_WALLETS: WalletAccount[] = Array.from({ length: 100 }, (_, i) => {
  const num = i + 1;
  const hexSuffix = num.toString(16).padStart(4, '0');
  // Form standard 42-char EVM address: 0x5555 + 32 zeros + 4 hex chars = 42 chars
  const address = `0x555500000000000000000000000000000000${hexSuffix}`;

  return {
    address,
    name: `id${i + 5}`,
    nodeIds: [],
    balance: 100000000000000, // Initial 100,000,000,000,000 USDT balance
    totalEarned: 0,
    rebirthCount: 0,
    pendingRebirths: 0,
    upgradeVault: 0,
  };
});

export const INITIAL_WALLETS: WalletAccount[] = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'id1',
    nodeIds: [1],
    balance: 100000000000000,
    totalEarned: 0,
    rebirthCount: 0,
    pendingRebirths: 0,
    upgradeVault: 0,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'id2',
    nodeIds: [],
    balance: 100000000000000,
    totalEarned: 0,
    rebirthCount: 0,
    pendingRebirths: 0,
    upgradeVault: 0,
  },
  {
    address: '0x3333333333333333333333333333333333333333',
    name: 'id3',
    nodeIds: [],
    balance: 100000000000000,
    totalEarned: 0,
    rebirthCount: 0,
    pendingRebirths: 0,
    upgradeVault: 0,
  },
  {
    address: '0x4444444444444444444444444444444444444444',
    name: 'id4',
    nodeIds: [],
    balance: 100000000000000,
    totalEarned: 0,
    rebirthCount: 0,
    pendingRebirths: 0,
    upgradeVault: 0,
  },
  ...GENERATED_EXTRA_WALLETS,
];

export class MatrixSimulator {
  nodes: Map<number, MatrixNode> = new Map();
  wallets: Map<string, WalletAccount> = new Map();
  rankQueues: Map<number, RankQueueNode[]> = new Map();
  rankRebirthPool: Map<number, number> = new Map(); // กองกลาง Rebirth แยกราย Rank 1-45
  nextNodeId: number = 2;

  // Helper method to guarantee no ID collision with existing nodes in this.nodes
  public generateNextNodeId(): number {
    while (this.nodes.has(this.nextNodeId)) {
      this.nextNodeId++;
    }
    const id = this.nextNodeId;
    this.nextNodeId++;
    return id;
  }
  rebirthPool: number = 0;
  treasuryBalance: number = 0;
  isPaused: boolean = false;
  treasuryAddress: string = INITIAL_WALLETS[0].address.toLowerCase();
  logs: ActivityLog[] = [];
  notifications: AppNotification[] = [];
  autoRebirthEnabled: boolean = true; // โหมดโคลนนิ่งอัตโนมัติ (Rebirth / Clones)
  autoExcessVaultNewMainIdEnabled: boolean = true; // โหมดเปิดไอดีหลักใหม่อัตโนมัติจากส่วนเกิน 40% Vault
  autoExecutionDelaySec: number = 2; // หน่วงเวลา auto โคลนนิ่ง & เกิดใหม่ (วินาที) (default: 2 วินาที)
  activeAutoCountdown: number = 0;
  activeAutoTaskType: string | null = null;
  activeAutoCurrentRound: number = 0;
  activeAutoTotalRounds: number = 0;
  private autoTimerHandle: any = null;
  private stateChangeListeners: Set<() => void> = new Set();
  private countdownListeners: Set<(countdown: number, taskType: string | null, currentRound?: number, totalRounds?: number) => void> = new Set();
  private autoRebirthQueue: { rank: number; nodeId: number; queueNumber?: number }[] = [];
  private isProcessingAutoRebirth: boolean = false;
  private notificationListeners: Set<(notif: AppNotification) => void> = new Set();

  setAutoExecutionDelay(sec: number) {
    this.autoExecutionDelaySec = Math.max(0, Math.min(60, Number(sec) || 0));
    this.notifyStateChanged();
  }

  setAutoRebirth(enabled: boolean) {
    this.autoRebirthEnabled = enabled;
    if (enabled) {
      this.scheduleAutoActions();
    } else {
      this.cancelScheduledAutoActions();
    }
    this.notifyStateChanged();
  }

  setAutoExcessVaultNewMainId(enabled: boolean) {
    this.autoExcessVaultNewMainIdEnabled = enabled;
    if (enabled) {
      this.scheduleAutoActions();
    } else {
      this.cancelScheduledAutoActions();
    }
    this.notifyStateChanged();
  }

  addStateChangeListener(listener: () => void): () => void {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  addCountdownListener(listener: (countdown: number, taskType: string | null, currentRound?: number, totalRounds?: number) => void): () => void {
    this.countdownListeners.add(listener);
    return () => {
      this.countdownListeners.delete(listener);
    };
  }

  notifyStateChanged() {
    this.stateChangeListeners.forEach((l) => {
      try { l(); } catch (e) { console.error(e); }
    });
  }

  notifyCountdown(count: number, taskType: string | null, currentRound: number = 0, totalRounds: number = 0) {
    this.activeAutoCountdown = count;
    this.activeAutoTaskType = taskType;
    this.activeAutoCurrentRound = currentRound;
    this.activeAutoTotalRounds = totalRounds;
    this.countdownListeners.forEach((l) => {
      try { l(count, taskType, currentRound, totalRounds); } catch (e) { console.error(e); }
    });
  }

  cancelScheduledAutoActions() {
    if (this.autoTimerHandle) {
      clearInterval(this.autoTimerHandle);
      this.autoTimerHandle = null;
    }
    this.notifyCountdown(0, null, 0, 0);
  }

  // ดึงรายการงาน Auto ที่ค้างอยู่ เรียงลำดับจาก ID น้อยไปมาก (Ascending Order)
  getPendingAutoActionsList(): { type: 'rebirth_rank1' | 'rebirth_rank' | 'new_main_id_excess' | 'new_member_rank6'; nodeId: number; rank?: number; label: string }[] {
    const list: { type: 'rebirth_rank1' | 'rebirth_rank' | 'new_main_id_excess' | 'new_member_rank6'; nodeId: number; rank?: number; label: string }[] = [];

    // 1. Rebirth Rank 1: เรียงลำดับไอดีจากน้อยไปมาก (Ascending order)
    if (this.autoRebirthEnabled) {
      let availableRank1Pool = this.rebirthPool;
      const sortedNodes = Array.from(this.nodes.values()).sort((a, b) => a.id - b.id);
      for (const node of sortedNodes) {
        const spawnedCount = this.getNodeRebornIds(node.id).length;
        let effectivePending = Math.max(node.pendingRebirths || 0, node.rebirthCount - spawnedCount);
        while (effectivePending > 0 && availableRank1Pool >= REGISTRATION_FEE) {
          list.push({
            type: 'rebirth_rank1',
            nodeId: node.id,
            rank: 1,
            label: `Auto โคลนนิ่งรหัส #${node.id} (ผัง 1)`,
          });
          availableRank1Pool -= REGISTRATION_FEE;
          effectivePending--;
        }
      }

      // 2. Rebirth Rank 2 ถึง 45: เรียงลำดับจากผัง และเรียงไอดีจากน้อยไปมาก
      for (let r = 2; r <= MAX_RANK; r++) {
        const queue = this.rankQueues.get(r);
        if (!queue || queue.length === 0) continue;
        const rankPrice = getRankPrice(r);
        let availablePool = this.getRankRebirthPool(r);
        const sortedQueue = [...queue].sort((a, b) => a.nodeId - b.nodeId);
        for (const item of sortedQueue) {
          let pending = item.pendingRebirths || 0;
          while (pending > 0 && (availablePool >= rankPrice || availableRank1Pool >= rankPrice)) {
            list.push({
              type: 'rebirth_rank',
              nodeId: item.nodeId,
              rank: r,
              label: `Auto โคลนนิ่งรหัส #${item.nodeId} (ผัง ${r})`,
            });
            if (availablePool >= rankPrice) {
              availablePool -= rankPrice;
            } else {
              availableRank1Pool -= rankPrice;
            }
            pending--;
          }
        }
      }
    }

    // 3. New Main ID จากส่วนเกิน 40% Vault (ผัง 1 ถึง 5): เรียงลำดับจากไอดีน้อยไปมาก
    if (this.autoExcessVaultNewMainIdEnabled) {
      const sortedMainNodes = Array.from(this.nodes.values())
        .filter((n) => !n.isRebirth)
        .sort((a, b) => a.id - b.id);

      for (const mn of sortedMainNodes) {
        const summary = this.getFamilyExcessRebirthVaultSummary(mn.id);
        const possibleCount = summary.newMainIdCountPossible;
        for (let i = 0; i < possibleCount; i++) {
          list.push({
            type: 'new_main_id_excess',
            nodeId: mn.id,
            rank: 1,
            label: `Auto สมัครเปิด New Main ID จากส่วนเกิน Vault ของ #${mn.id}`,
          });
        }
      }

      // 4. New Member จากส่วนเกิน 40% Vault (ผัง 6 ถึง 45): เรียงลำดับจากไอดีน้อยไปมาก
      for (const mn of sortedMainNodes) {
        const summary = this.getFamilyExcessVaultRank6To45Summary(mn.id);
        if (summary.canCreateNewID && summary.eligibleRanks.length > 0) {
          const targetRank = summary.eligibleRanks[0].rank;
          list.push({
            type: 'new_member_rank6',
            nodeId: mn.id,
            rank: targetRank,
            label: `Auto สร้าง New Member ผัง ${targetRank} จากส่วนเกิน Vault ของ #${mn.id}`,
          });
        }
      }
    }

    return list;
  }

  // ประมวลผลรอบละ 1 รหัส (Single Round Execution) ตามลำดับไอดีจากน้อยไปมาก
  executeSingleAutoActionStep(): boolean {
    const pendingList = this.getPendingAutoActionsList();
    if (pendingList.length === 0) return false;

    const task = pendingList[0];
    try {
      if (task.type === 'rebirth_rank1') {
        this.executeRebirth(task.nodeId, undefined, undefined, 1);
        return true;
      } else if (task.type === 'rebirth_rank') {
        this.executeRankRebirth(task.rank || 2, task.nodeId);
        return true;
      } else if (task.type === 'new_main_id_excess') {
        this.executeSingleMainIdRebirthFromExcessVault(task.nodeId);
        return true;
      } else if (task.type === 'new_member_rank6') {
        this.executeSingleRankNewMainIDFromExcessVault(task.nodeId);
        return true;
      }
    } catch (err) {
      console.warn('Auto step execution error:', err);
    }
    return false;
  }

  // สั่งรันทุกรอบจนครบหมดทันที (Execute All Now)
  executeAllPendingAutoActions() {
    this.cancelScheduledAutoActions();
    let safety = 0;
    while (safety < 200) {
      const ran = this.executeSingleAutoActionStep();
      if (!ran) break;
      safety++;
    }
    this.notifyStateChanged();
  }

  // สั่งรันรอบปัจจุบัน 1 รอบทันที (Execute Current Round Now)
  executeNextPendingAutoActionNow() {
    this.cancelScheduledAutoActions();
    this.executeSingleAutoActionStep();
    this.notifyStateChanged();
    this.scheduleAutoActions();
  }

  executeScheduledAutoActionsNow(targetMainId?: number) {
    this.executeAllPendingAutoActions();
  }

  // สั่งประมวลผลเป็นรอบๆ (Round by Round) โดยมีหน่วงเวลาระหว่างรอบ และไล่ลำดับจากน้อยไปมาก
  scheduleAutoActions(targetMainId?: number) {
    if (!this.autoRebirthEnabled && !this.autoExcessVaultNewMainIdEnabled) {
      this.cancelScheduledAutoActions();
      return;
    }

    const pendingList = this.getPendingAutoActionsList();
    if (pendingList.length === 0) {
      this.cancelScheduledAutoActions();
      return;
    }

    const nextTask = pendingList[0];
    const totalRounds = pendingList.length;
    const taskLabel = `${nextTask.label} [เหลืออีก ${totalRounds} รอบ]`;

    if (this.autoExecutionDelaySec <= 0) {
      this.cancelScheduledAutoActions();
      this.executeSingleAutoActionStep();
      this.notifyStateChanged();
      const remainingList = this.getPendingAutoActionsList();
      if (remainingList.length > 0) {
        setTimeout(() => this.scheduleAutoActions(), 20);
      }
      return;
    }

    if (this.autoTimerHandle) {
      clearInterval(this.autoTimerHandle);
      this.autoTimerHandle = null;
    }

    let remaining = this.autoExecutionDelaySec;
    this.notifyCountdown(remaining, taskLabel, 1, totalRounds);

    this.autoTimerHandle = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(this.autoTimerHandle);
        this.autoTimerHandle = null;
        this.notifyCountdown(0, null, 0, 0);

        // ทำงาน 1 รอบ (1 รหัส)!
        this.executeSingleAutoActionStep();
        this.notifyStateChanged();

        // ตรวจสอบว่ายังมีรอบถัดไปหรือไม่ ถ้ามีให้ตั้งเวลารันรอบถัดไปต่ออัตโนมัติ
        const remainingList = this.getPendingAutoActionsList();
        if (remainingList.length > 0) {
          this.scheduleAutoActions();
        }
      } else {
        this.notifyCountdown(remaining, taskLabel, 1, totalRounds);
      }
    }, 1000);
  }

  runAutoActionsImmediately(targetMainId?: number) {
    this.executeAllPendingAutoActions();
  }

  queueAutoRebirth(rank: number = 1, nodeId?: number, queueNumber?: number) {
    this.scheduleAutoActions(nodeId);
  }

  constructor() {
    this.reset();
  }

  reset() {
    this.nodes.clear();
    this.wallets.clear();
    this.rankQueues.clear();
    this.rankRebirthPool.clear();
    for (let r = 1; r <= MAX_RANK; r++) {
      this.rankRebirthPool.set(r, 0);
    }
    this.logs = [];
    this.notifications = [];
    this.nextNodeId = 2;

    this.rebirthPool = 0;
    this.treasuryBalance = 0;
    this.isPaused = false;
    this.autoRebirthEnabled = true;
    this.autoExcessVaultNewMainIdEnabled = true;
    this.autoRebirthQueue = [];
    this.isProcessingAutoRebirth = false;
    this.treasuryAddress = INITIAL_WALLETS[0].address.toLowerCase();

    // Load Wallets
    for (const w of INITIAL_WALLETS) {
      this.wallets.set(w.address.toLowerCase(), { ...w, balance: 100000000000000, nodeIds: [...w.nodeIds] });
    }
    const rootWallet = this.wallets.get(INITIAL_WALLETS[0].address.toLowerCase());
    if (rootWallet) rootWallet.firstSponsor = INITIAL_WALLETS[0].address.toLowerCase();

    const alice = this.wallets.get(INITIAL_WALLETS[1].address.toLowerCase());
    if (alice) alice.firstSponsor = INITIAL_WALLETS[0].address.toLowerCase();

    const bob = this.wallets.get(INITIAL_WALLETS[2].address.toLowerCase());
    if (bob) bob.firstSponsor = INITIAL_WALLETS[1].address.toLowerCase();

    const charlie = this.wallets.get(INITIAL_WALLETS[3].address.toLowerCase());
    if (charlie) charlie.firstSponsor = INITIAL_WALLETS[1].address.toLowerCase();

    // Node #1 (Genesis)
    const rootNode: MatrixNode = {
      id: 1,
      owner: INITIAL_WALLETS[0].address.toLowerCase(),
      parentId: 0,
      leftChild: 0,
      rightChild: 0,
      depth: 0,
      createdAt: Date.now() - 3600000,
      rank: 1,
      rebirthCount: 0,
      pendingRebirths: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      upgradeVault: 0,
      originalAncestorId: 1,
      firstSponsor: INITIAL_WALLETS[0].address.toLowerCase(),
      sponsorNodeId: 1, // Direct Upline ของกระเป๋าที่ 1 ก็คือ ไอดีที่ 1
      queueNumber: 1,
      createdVia: 'Genesis (ระบบเริ่มต้น)',
    };
    this.nodes.set(1, rootNode);

    // Initialize Rank 1 Queue with Genesis Node #1 as Queue #1
    const rank1Root: RankQueueNode = {
      queueNumber: 1,
      nodeId: 1,
      owner: INITIAL_WALLETS[0].address.toLowerCase(),
      rank: 1,
      parentQueueNumber: 0,
      parentNodeId: 0,
      leftChildQueueNumber: 0,
      rightChildQueueNumber: 0,
      isLeft: false,
      upgradeVault: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      rebirthCount: 0,
      pendingRebirths: 0,
      enteredAt: Date.now() - 3600000,
      createdVia: 'Genesis (ระบบเริ่มต้น)',
    };
    this.rankQueues.set(1, [rank1Root]);

    this.addLog({
      type: 'REGISTER',
      title: 'Genesis Node #1 Deployed',
      description: 'System root node established under Treasury (Rank 1 Queue #1 Pioneer).',
      nodeId: 1,
      parentId: 0,
      txHash: '0xgenesis...' + Math.random().toString(16).substring(2, 8),
    });
  }

  topUpAllWallets(amount: number = 100000000000000) {
    this.wallets.forEach((w) => {
      w.balance = Math.max(w.balance, amount);
    });
  }

  private addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
    this.logs.unshift({
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    });
    if (this.logs.length > 80) this.logs.pop();
  }

  emitNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const fullNotif: AppNotification = {
      ...notif,
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      read: false,
    };
    this.notifications.unshift(fullNotif);
    if (this.notifications.length > 100) this.notifications.pop();

    this.notificationListeners.forEach((listener) => {
      try {
        listener(fullNotif);
      } catch (err) {
        console.warn('Error in notification listener:', err);
      }
    });

    return fullNotif;
  }

  onNotification(listener: (notif: AppNotification) => void): () => void {
    this.notificationListeners.add(listener);
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  markNotificationAsRead(id: string) {
    const target = this.notifications.find((n) => n.id === id);
    if (target) {
      target.read = true;
    }
  }

  markAllNotificationsAsRead() {
    this.notifications.forEach((n) => {
      n.read = true;
    });
  }

  clearNotifications() {
    this.notifications = [];
  }


  // Process all pending rebirths immediately across all ranks
  processAllPendingAutoRebirths() {
    if (!this.autoRebirthEnabled) return;
    this.processAllPendingRebirthsPriority();
  }

  // 🌟 บุริมสิทธิ์: โคลนนิ่ง (Rebirth) ต้องทำงานก่อน New Main ID เสมอ!
  // ทำการประมวลผลสิทธิ์โคลนนิ่งที่ค้างอยู่ (Pending Rebirths) ให้เสร็จสิ้นสมบูรณ์ก่อน
  // เพื่อให้รหัสโคลนนิ่งได้ตำแหน่งในผังและไม่ถูกแย่งตำแหน่งโดย New Main ID
  processAllPendingRebirthsPriority() {
    if (!this.autoRebirthEnabled) return;
    let createdAny = true;
    let safetyCounter = 0;
    while (createdAny && safetyCounter < 100) {
      createdAny = false;
      safetyCounter++;

      // 1. ตรวจสอบและคลอดรหัสโคลนนิ่งผังที่ 1 (Rank 1 Rebirth) ที่มีค้างอยู่และกองกลาง Rebirth Pool มีเงินพอ
      const nodesArray = Array.from(this.nodes.values());
      for (const node of nodesArray) {
        const spawnedCount = this.getNodeRebornIds(node.id).length;
        let effectivePending = Math.max(node.pendingRebirths || 0, node.rebirthCount - spawnedCount);
        while (effectivePending > 0 && this.rebirthPool >= REGISTRATION_FEE) {
          try {
            this.executeRebirth(node.id, undefined, undefined, 1);
            createdAny = true;
            effectivePending--;
          } catch (err) {
            console.warn(`Rebirth priority execution error for Rank 1 node #${node.id}:`, err);
            break;
          }
        }
      }

      // 2. ตรวจสอบและคลอดรหัสโคลนนิ่ง Rank 2 ถึง 45 ที่มีค้างอยู่
      for (let r = 2; r <= MAX_RANK; r++) {
        const queue = this.rankQueues.get(r);
        if (!queue || queue.length === 0) continue;
        const rankPrice = getRankPrice(r);
        for (const item of queue) {
          while (
            item.pendingRebirths > 0 &&
            (this.getRankRebirthPool(r) >= rankPrice || this.rebirthPool >= rankPrice)
          ) {
            try {
              this.executeRankRebirth(r, item.nodeId, undefined, undefined, item.queueNumber);
              createdAny = true;
            } catch (err) {
              console.warn(`Rebirth priority execution error for Rank ${r}:`, err);
              break;
            }
          }
        }
      }
    }
  }

  getNode(id: number): MatrixNode | undefined {
    const n = this.nodes.get(id);
    if (n && !n.isRebirth) {
      n.originalAncestorId = n.id;
      n.rebornFromNodeId = undefined;
    }
    return n;
  }

  getAllNodes(): MatrixNode[] {
    const list = Array.from(this.nodes.values()).sort((a, b) => a.id - b.id);
    // Sanitize and ensure reborn nodes always originate from their original main ancestor ID
    for (const n of list) {
      // Ensure queueNumber exists
      if (!n.queueNumber) {
        n.queueNumber = n.id;
      }
      if (n.isRebirth) {
        const mainId = n.originalAncestorId || n.id;
        n.originalAncestorId = mainId;
        if (!n.rebornFromNodeId) {
          n.rebornFromNodeId = mainId;
        }
      } else {
        // หากไม่ใช่โคลนนิ่ง (เป็นไอดีหลัก Main ID) originalAncestorId ต้องเป็นตัวมันเองเสมอ
        n.originalAncestorId = n.id;
        n.rebornFromNodeId = undefined;
      }
    }

    // นับยอดรหัสเกิดใหม่ของแต่ละ ID โดยเฉพาะ (Count spawned rebirth IDs for each node ID)
    for (const n of list) {
      const rebornKids = list.filter(
        (other) =>
          other.isRebirth &&
          (other.originalAncestorId === n.id || other.rebornFromNodeId === n.id)
      );
      n.spawnedRebirthCount = rebornKids.length;
      n.spawnedRebirthIds = rebornKids.map((k) => k.id);
    }

    return list;
  }

  // คำนวณยอดรหัสเกิดใหม่ของแต่ละ ID (นับเฉพาะรหัสเกิดใหม่ที่คลอดมาจาก ID นั้นๆ)
  getNodeRebirthCount(nodeId: number): number {
    return Array.from(this.nodes.values()).filter(
      (n) => n.isRebirth && (n.originalAncestorId === nodeId || n.rebornFromNodeId === nodeId)
    ).length;
  }

  // ดึงรายการรหัสเกิดใหม่ทั้งหมดที่เกิดมาจาก ID นั้น
  getNodeRebornIds(nodeId: number): number[] {
    return Array.from(this.nodes.values())
      .filter((n) => n.isRebirth && (n.originalAncestorId === nodeId || n.rebornFromNodeId === nodeId))
      .map((n) => n.id)
      .sort((a, b) => a - b);
  }

  // ดึงสถิติ Rebirth แบบละเอียดสำหรับ ID นั้นๆ
  getNodeRebirthStats(nodeId: number): {
    nodeId: number;
    isRebirth: boolean;
    mainId: number;
    spawnedCount: number;
    spawnedIds: number[];
    pendingRebirths: number;
    rebirthTriggers: number;
  } {
    const node = this.nodes.get(nodeId);
    const spawnedIds = this.getNodeRebornIds(nodeId);
    return {
      nodeId,
      isRebirth: Boolean(node?.isRebirth),
      mainId: node?.isRebirth ? (node.originalAncestorId || node.rebornFromNodeId || nodeId) : nodeId,
      spawnedCount: spawnedIds.length,
      spawnedIds,
      pendingRebirths: node?.pendingRebirths || 0,
      rebirthTriggers: node?.rebirthCount || 0,
    };
  }

  // ดึงรายการข้อมูลรอบเกิดใหม่ทั้งหมดในระบบ (All Rebirth Rounds in System)
  getAllRebirthRounds(): RebirthRoundInfo[] {
    const allRebirthNodes = Array.from(this.nodes.values())
      .filter((n) => n.isRebirth)
      .sort((a, b) => a.id - b.id);

    const ancestorCounts = new Map<number, number>();

    return allRebirthNodes.map((n) => {
      const mainId = n.originalAncestorId || n.rebornFromNodeId || n.id;
      const count = (ancestorCounts.get(mainId) || 0) + 1;
      ancestorCounts.set(mainId, count);

      const roundInCycle = ((count - 1) % 2) + 1;
      const cycleNumber = Math.floor((count - 1) / 2) + 1;

      const parentNode = this.nodes.get(n.parentId);
      const isLeft = parentNode ? parentNode.leftChild === n.id : true;

      const ruleText = mainId === 1
        ? (roundInCycle === 1
          ? `รอบที่ 1: กรณี ID #1 สูงสุด วนกลับไปต่อใต้ผังของตนเองในตำแหน่งว่างบนสุด (รอบสะสมที่ ${count})`
          : `รอบที่ 2: บอทสแกนเนอร์ (BFS) กระจายช่วยชุมชนทั้งระบบ (รอบสะสมที่ ${count})`)
        : roundInCycle === 1
        ? `รอบที่ 1: ขั้นที่ 1 ติดตัวขาตรงผู้แนะนำ (ซ้ายหรือขวาก็ได้) • ขั้นที่ 2 หากเต็มต่อใต้รหัสโคลนนิ่งของผู้แนะนำ (รอบสะสมที่ ${count})`
        : `รอบที่ 2: บอทสแกนเนอร์ (BFS) กระจายช่วยชุมชนทั้งระบบ (รอบสะสมที่ ${count})`;

      return {
        roundNumber: count,
        rebornNodeId: n.id,
        globalNodeId: n.queueNumber || n.id,
        mainAncestorId: mainId,
        rank: n.rank || 1,
        owner: n.owner,
        parentId: n.parentId,
        isLeft,
        cycleNumber,
        roundInCycle,
        createdAt: n.createdAt,
        ruleType: ruleText,
      };
    });
  }

  // ดึงรายการรอบเกิดใหม่เฉพาะของ ID นั้นๆ
  getNodeRebirthRounds(nodeId: number): RebirthRoundInfo[] {
    const mainId = this.nodes.get(nodeId)?.originalAncestorId || nodeId;
    return this.getAllRebirthRounds().filter((r) => r.mainAncestorId === mainId);
  }

  getWallet(address: string): WalletAccount | undefined {
    return this.wallets.get(address.toLowerCase());
  }

  getWallets(): WalletAccount[] {
    const list = Array.from(this.wallets.values());
    for (const w of list) {
      w.upgradeVault = this.getWalletUpgradeVault(w.address);
    }
    return list;
  }

  // คำนวณยอด rebirthCount อ้างอิงตามเลขกระเป๋า (Wallet Address)
  getWalletRebirthCount(address: string): number {
    const w = this.wallets.get(address.toLowerCase());
    if (w && typeof w.rebirthCount === 'number') {
      return w.rebirthCount;
    }
    return 0;
  }

  getWalletPendingRebirths(address: string): number {
    const addr = address.toLowerCase();
    let sum = 0;
    for (const n of this.nodes.values()) {
      if (n.owner.toLowerCase() === addr) {
        sum += (n.pendingRebirths || 0);
      }
    }
    return sum;
  }

  getWalletRebirthNodes(address: string): MatrixNode[] {
    const addr = address.toLowerCase();
    return Array.from(this.nodes.values()).filter(
      (n) => n.owner.toLowerCase() === addr && n.isRebirth
    );
  }

  // Find next available slot using Breadth-First Search (BFS) exclusively within a specific Rank network
  findNextEmptySlot(rootStartId: number = 1, targetRank: number = 1): SlotTarget | null {
    const safeRank = Math.max(1, Math.min(MAX_RANK, targetRank));
    const targetNodes = this.getMatrixTreeNodes(safeRank);

    if (targetNodes.length === 0) return null;

    const nodeMap = new Map<number, MatrixNode>();
    targetNodes.forEach((n) => nodeMap.set(n.id, n));

    let startId = rootStartId;
    if (!nodeMap.has(startId) && targetNodes.length > 0) {
      startId = targetNodes[0].id;
    }

    const queue: number[] = [startId];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const node = nodeMap.get(currentId);
      if (!node) continue;

      if (node.leftChild === 0) {
        return {
          parentId: currentId,
          isLeft: true,
          parentOwner: node.owner,
          depth: node.depth + 1,
          reason: `📍 [กฎค้นหาเฉพาะผัง Rank ${safeRank}]: ต่อใต้ #${currentId} ฝั่งซ้าย`,
        };
      }
      if (node.rightChild === 0) {
        return {
          parentId: currentId,
          isLeft: false,
          parentOwner: node.owner,
          depth: node.depth + 1,
          reason: `📍 [กฎค้นหาเฉพาะผัง Rank ${safeRank}]: ต่อใต้ #${currentId} ฝั่งขวา`,
        };
      }

      if (node.leftChild !== 0) queue.push(node.leftChild);
      if (node.rightChild !== 0) queue.push(node.rightChild);
    }
    return null;
  }

  // Helper to determine the true Direct Upline (ผู้แนะนำตรง) ID of a node
  getNodeDirectUplineId(nodeId: number): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 1;

    // รหัสกระเป๋าที่ 1 (Root Treasury) -> Direct Upline คือ 1
    if (node.id === 1 || node.owner.toLowerCase() === INITIAL_WALLETS[0].address.toLowerCase()) {
      return 1;
    }

    // ถ้ามี sponsorNodeId ระบุไว้โดยตรง
    if (node.sponsorNodeId && node.sponsorNodeId > 0) {
      return node.sponsorNodeId;
    }

    // ถ้าเป็นรหัสเกิดใหม่ ให้สืบค้นจากไอดีบรรพบุรุษหลัก (originalAncestorId)
    if (node.isRebirth && node.originalAncestorId && node.originalAncestorId !== node.id) {
      const ancestor = this.nodes.get(node.originalAncestorId);
      if (ancestor && ancestor.sponsorNodeId && ancestor.sponsorNodeId > 0) {
        return ancestor.sponsorNodeId;
      }
    }

    // สืบค้นจากกระเป๋า
    return this.getWalletDefaultSponsorNodeId(node.owner);
  }

  // Helper to find next empty slot in tree excluding specific nodes (and optionally owner)
  // ใช้อัลกอริทึม BFS สแกนค้นหาตำแหน่งว่างระดับบนสุด โดยคัดกรองยกเว้น ID #1, รหัสของตนเอง, รหัสเกิดใหม่เดิมของตนเอง, และทุกรหัสภายใต้กระเป๋าเดียวกัน
  findRebirthSlotExcluding(excludeNodeIds: Set<number>, excludeOwner?: string): SlotTarget | null {
    const queue: number[] = [1];
    const visited = new Set<number>();
    const lowerExcludeOwner = excludeOwner ? excludeOwner.toLowerCase() : '';

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const candidate = this.nodes.get(currentId);
      if (!candidate) continue;

      const isExcludedId = excludeNodeIds.has(candidate.id);
      const isExcludedOwner = Boolean(lowerExcludeOwner && candidate.owner.toLowerCase() === lowerExcludeOwner);
      const isEligibleParent = !isExcludedId && !isExcludedOwner;

      if (isEligibleParent) {
        if (candidate.leftChild === 0) {
          return {
            parentId: candidate.id,
            isLeft: true,
            parentOwner: candidate.owner,
            depth: candidate.depth + 1,
            reason: `เกิดรอบสองเป็นต้นไป (Round 2+): ต่อใต้ไอดี #${candidate.id} (ไม่ใช่ไอดี #1 และไม่ใช่ตัวเอง)`,
          };
        }
        if (candidate.rightChild === 0) {
          return {
            parentId: candidate.id,
            isLeft: false,
            parentOwner: candidate.owner,
            depth: candidate.depth + 1,
            reason: `เกิดรอบสองเป็นต้นไป (Round 2+): ต่อใต้ไอดี #${candidate.id} (ไม่ใช่ไอดี #1 และไม่ใช่ตัวเอง)`,
          };
        }
      }

      // เดินหน้าสแกนลูกซ้าย-ขวาต่อไป (จากซ้ายไปขวา) ถึงแม้ candidate จะถูก exclude ก็ตาม เพื่อค้นหาสายงานระดับล่าง
      if (candidate.leftChild !== 0) {
        queue.push(candidate.leftChild);
      }
      if (candidate.rightChild !== 0) {
        queue.push(candidate.rightChild);
      }
    }

    return null;
  }

  // 🌟 กฎการจัดวางตำแหน่งผังของรหัสเกิดใหม่ (วัฏจักร 2 รอบ - 2-Round Loop):
  // 🌱 รอบที่ 1 (Round 1 - ช่วยสายงานผู้แนะนำ):
  //    - วางติดตัวขาตรงของผู้แนะนำ (ซ้ายก่อน ขวา)
  //    - หากขาตรงผู้แนะนำเต็มทั้ง 2 ขา จะไปต่อใต้ รหัสเกิดใหม่ของผู้แนะนำ
  //    - (กรณีเป็น ID #1 สูงสุด: จะวนกลับไปต่อใต้ผังของตนเองในตำแหน่งว่างบนสุด)
  // 🚀 รอบที่ 2 (Round 2 - กระจายช่วยชุมชนทั้งระบบ):
  //    - บอทสแกนเนอร์ (BFS) จะค้นหาตำแหน่งว่างระดับบนสุด จากบนลงล่าง ซ้ายไปขวา (ไปต่อใครก็ได้ในระบบ) เพื่อช่วยดันสมาชิกใหม่และคนในชุมชนที่ยังไม่มีลูก
  // 🔄 วนลูปต่อเนื่อง: ทำงานครบ 2 รอบแล้วจะวนกลับไปเริ่มรอบที่ 1 ใหม่เสมอ (รอบ 1 ➔ รอบ 2 ➔ รอบ 1 ➔ รอบ 2)
  findRebirthSlot(nodeId: number): SlotTarget | null {
    const node = this.nodes.get(nodeId);
    if (!node) return this.findNextEmptySlot(1);

    const mainId = node.originalAncestorId || nodeId;
    const nodeRank = node.rank || 1;
    const lowerOwner = node.owner.toLowerCase();

    // นับจำนวนร่างเกิดใหม่ที่เกิดจากรหัสนี้โดยตรง หรือเกิดจากสายบรรพบุรุษของรหัสนี้
    const existingRebirthsFromNode = Array.from(this.nodes.values()).filter(
      (n) => n.isRebirth && (n.rebornFromNodeId === nodeId || n.originalAncestorId === mainId)
    );

    // ตรวจสอบรอบในวัฏจักร 2 รอบ (2-Round Repeating Cycle):
    // "ทำงานครบ 2 รอบเเล้วให้กลับไปรอรอบ 1 ใหม่"
    // - รอบที่ 1 (Round 1): totalRebirthsDone % 2 === 0
    // - รอบที่ 2 (Round 2): totalRebirthsDone % 2 === 1
    const totalRebirthsDone = existingRebirthsFromNode.length;
    const currentRoundInCycle = (totalRebirthsDone % 2) + 1; // 1 or 2
    const currentCycleNumber = Math.floor(totalRebirthsDone / 2) + 1;
    const currentTotalRebirthIndex = totalRebirthsDone + 1;
    const isRoundOne = currentRoundInCycle === 1;

    // 🌟 กฎการจัดวางตำแหน่งผังของรหัสเกิดใหม่ (วัฏจักร 2 รอบ - 2-Round Loop):
    // 🌱 รอบที่ 1 (Round 1 - ช่วยสายงานผู้แนะนำ):
    //    - กรณีเฉพาะ ID #1: ให้วิ่งไปต่อตำแหน่งคนที่ว่าง จากบนลงล่าง ซ้ายไปขวา (BFS ทั่วทั้งผัง)
    //    - กรณีรหัสทั่วไป: ขั้นที่ 1 วางติดตัวขาตรงของผู้แนะนำ (Sponsor) ก่อน (ซ้ายก่อนขวา) ➔ ขั้นที่ 2 หากขาตรงเต็ม ส่งลงไปต่อใต้รหัสโคลนนิ่งของผู้แนะนำ
    // 🚀 รอบที่ 2 (Round 2 - กระจายช่วยชุมชนทั้งระบบ):
    //    - บอทสแกนเนอร์ (BFS) จะค้นหาตำแหน่งว่างระดับบนสุด จากบนลงล่าง ซ้ายไปขวา (ไปต่อใครก็ได้ในระบบ) เพื่อช่วยดันสมาชิกใหม่และคนในชุมชนที่ยังไม่มีลูก
    // 🔄 วนลูปต่อเนื่อง: ทำงานครบ 2 รอบแล้วจะวนกลับไปเริ่มรอบที่ 1 ใหม่เสมอ (รอบ 1 ➔ รอบ 2 ➔ รอบ 1 ➔ รอบ 2)
    if (nodeId === 1 || mainId === 1) {
      if (isRoundOne) {
        // 🌱 เงื่อนไขเฉพาะ ID #1 รอบแรก (Round 1): ให้ไปต่อคนที่ว่างจากบนลงล่าง ซ้ายไปขวา (BFS ทั่วทั้งผัง)
        const slotUnderTop = this.findNextEmptySlot(1);
        if (slotUnderTop) {
          return {
            ...slotUnderTop,
            reason: `🌱 รอบที่ 1 (เฉพาะ ID #1 รอบแรก): วิ่งไปต่อตำแหน่งคนที่ว่างจากบนลงล่าง ซ้ายไปขวา (ต่อใต้ #${slotUnderTop.parentId} ฝั่ง${slotUnderTop.isLeft ? 'ซ้าย' : 'ขวา'})`,
          };
        }
      } else {
        // 🚀 รอบที่ 2: บอทสแกนเนอร์ (BFS) ค้นหาตำแหน่งว่างระดับบนสุด จากบนลงล่าง ซ้ายไปขวา (ไปต่อใครก็ได้ในระบบ)
        const round2Slot = this.findNextEmptySlot(1);
        if (round2Slot) {
          return {
            ...round2Slot,
            reason: `🚀 รอบที่ 2 (Round 2 - กระจายช่วยชุมชนทั้งระบบ): บอทสแกนเนอร์ (BFS) ค้นหาตำแหน่งว่างระดับบนสุด จากบนลงล่าง ซ้ายไปขวา ไปต่อใครก็ได้ในระบบเพื่อช่วยดันสมาชิกใหม่ (ต่อใต้ #${round2Slot.parentId} ฝั่ง${round2Slot.isLeft ? 'ซ้าย' : 'ขวา'})`,
          };
        }
      }
      return null;
    }

    // 🌟 ตรรกะการจัดวางตำแหน่งเกิดใหม่: รหัสทั่วไป (ที่ไม่ใช่ ID #1)
    if (nodeId !== 1 && mainId !== 1) {
      const cycleNotice = currentCycleNumber > 1 ? ` (วัฏจักรที่ ${currentCycleNumber})` : ``;

      if (isRoundOne) {
        // 🌱 รอบที่ 1 (Round 1 - ช่วยสายงานผู้แนะนำ):
        // ขั้นที่ 1: รหัสโคลนนิ่งรอบ 1 ต้องไปวาง ติดตัวขาตรงของผู้แนะนำ (Sponsor) ก่อน (เลือกขาซ้ายก่อนขาขวา)
        // ขั้นที่ 2 (เงื่อนไขสำคัญ): หากขาตรงของผู้แนะนำเต็มทั้ง 2 ขาแล้ว ➔ ระบบจะส่งลงไป "ต่อใต้รหัสเกิดใหม่ (Rebirth ID) ของ Sponsor ID" ทันที
        const sponsorId = this.getNodeDirectUplineId(nodeId);
        const sponsorNode = (sponsorId > 0 && sponsorId !== nodeId ? this.nodes.get(sponsorId) : null) || this.nodes.get(1);

        if (sponsorNode) {
          // ขั้นที่ 1: วางติดตัวขาตรงของผู้แนะนำ (เลือกขาซ้ายก่อนขาขวา)
          if (sponsorNode.leftChild === 0) {
            return {
              parentId: sponsorNode.id,
              isLeft: true,
              parentOwner: sponsorNode.owner,
              depth: sponsorNode.depth + 1,
              reason: `🌱 รอบที่ 1 (ขั้นที่ 1 ติดตัวขาตรงผู้แนะนำ Sponsor ID)${cycleNotice}: วางติดตัวขาตรงของผู้แนะนำ #${sponsorNode.id} (ฝั่งซ้าย)`,
            };
          }
          if (sponsorNode.rightChild === 0) {
            return {
              parentId: sponsorNode.id,
              isLeft: false,
              parentOwner: sponsorNode.owner,
              depth: sponsorNode.depth + 1,
              reason: `🌱 รอบที่ 1 (ขั้นที่ 1 ติดตัวขาตรงผู้แนะนำ Sponsor ID)${cycleNotice}: วางติดตัวขาตรงของผู้แนะนำ #${sponsorNode.id} (ฝั่งขวา)`,
            };
          }

          // ขั้นที่ 2 (เงื่อนไขสำคัญ): แนะนำโดยไอดี Sponsor ID (แต่ไอดี Sponsor ID เต็มทั้ง 2 ขาแล้ว)
          // ➔ โยนต่อให้รหัสเกิดใหม่ของ Sponsor ID ทันที
          // ระบบจะสแกนค้นหา "รหัสโคลนนิ่งทั้งหมดของผู้แนะนำ" (Rebirth Nodes ของ Sponsor) จากล่างขึ้นบน
          let rebirthNodesOfSponsor = Array.from(this.nodes.values())
            .filter(
              (n) =>
                n.isRebirth &&
                n.id !== sponsorNode.id &&
                (n.rebornFromNodeId === sponsorNode.id ||
                  n.originalAncestorId === sponsorNode.id ||
                  n.owner.toLowerCase() === sponsorNode.owner.toLowerCase())
            )
            .sort((a, b) => (b.depth !== a.depth ? b.depth - a.depth : b.id - a.id));

          // 2.1 ตรวจสอบตำแหน่งติดตัวว่างของรหัสโคลนนิ่งของผู้แนะนำ (เลือกขาซ้ายก่อนขาขวา จากล่างขึ้นบน)
          for (const rNode of rebirthNodesOfSponsor) {
            if (rNode.leftChild === 0) {
              return {
                parentId: rNode.id,
                isLeft: true,
                parentOwner: rNode.owner,
                depth: rNode.depth + 1,
                isRebirthTarget: true,
                targetRebirthNodeId: rNode.id,
                reason: `🌱 รอบที่ 1 (โยนต่อให้รหัสเกิดใหม่ของ Sponsor ID ทันที)${cycleNotice}: แนะนำโดยไอดี Sponsor ID #${sponsorNode.id} (แต่เต็มทั้ง 2 ขาแล้ว) ➔ โยนสายงาน (Auto-Spillover) ไปจัดวางใต้รหัสเกิดใหม่ #${rNode.id} ของ Sponsor ID #${sponsorNode.id} (ฝั่งซ้าย)`,
              };
            }
            if (rNode.rightChild === 0) {
              return {
                parentId: rNode.id,
                isLeft: false,
                parentOwner: rNode.owner,
                depth: rNode.depth + 1,
                isRebirthTarget: true,
                targetRebirthNodeId: rNode.id,
                reason: `🌱 รอบที่ 1 (โยนต่อให้รหัสเกิดใหม่ของ Sponsor ID ทันที)${cycleNotice}: แนะนำโดยไอดี Sponsor ID #${sponsorNode.id} (แต่เต็มทั้ง 2 ขาแล้ว) ➔ โยนสายงาน (Auto-Spillover) ไปจัดวางใต้รหัสเกิดใหม่ #${rNode.id} ของ Sponsor ID #${sponsorNode.id} (ฝั่งขวา)`,
              };
            }
          }

          // 2.2 หากขาติดตัวของรหัสโคลนนิ่งเต็มแล้ว ให้สแกนลงผังใต้รหัสโคลนนิ่งของผู้แนะนำ (จากล่างขึ้นบน)
          for (const rNode of rebirthNodesOfSponsor) {
            const deepSlot = this.findNextEmptySlot(rNode.id);
            if (deepSlot) {
              return {
                ...deepSlot,
                isRebirthTarget: true,
                targetRebirthNodeId: rNode.id,
                reason: `🌱 รอบที่ 1 (โยนสายงานใต้รหัสเกิดใหม่ Sponsor ID)${cycleNotice}: ส่งลงไปต่อใต้สายงานรหัสเกิดใหม่ #${rNode.id} ของ Sponsor ID #${sponsorNode.id} (ต่อใต้ #${deepSlot.parentId} ฝั่ง${deepSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
              };
            }
          }

          // 2.3 หากผู้แนะนำยังไม่มีรหัสโคลนนิ่ง ให้สแกนหาตำแหน่งว่างใต้สายงานผู้แนะนำ
          const sponsorTreeSlot = this.findNextEmptySlot(sponsorNode.id);
          if (sponsorTreeSlot) {
            return {
              ...sponsorTreeSlot,
              reason: `🌱 รอบที่ 1 (ช่วยสายงานผู้แนะนำ)${cycleNotice}: ขาตรง Sponsor ID #${sponsorNode.id} เต็มทั้ง 2 ขาและยังไม่มีรหัสโคลนนิ่ง ➔ ต่อใต้ผังสายงานผู้แนะนำ #${sponsorNode.id} (ต่อใต้ #${sponsorTreeSlot.parentId} ฝั่ง${sponsorTreeSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
            };
          }
        }

        // Fallback รอบที่ 1
        const fallbackSlot = this.findNextEmptySlot(1);
        if (fallbackSlot) {
          return {
            ...fallbackSlot,
            reason: `🌱 รอบที่ 1 (Round 1 - ช่วยสายงานผู้แนะนำ)${cycleNotice}: สแกนตำแหน่งว่างบนสุดในระบบ (ต่อใต้ #${fallbackSlot.parentId} ฝั่ง${fallbackSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
          };
        }
      } else {
        // 🚀 รอบที่ 2 (Round 2 - กระจายช่วยชุมชนทั้งระบบ):
        // บอทสแกนเนอร์ (BFS) จะค้นหาตำแหน่งว่างระดับบนสุด จากบนลงล่าง ซ้ายไปขวา (ไปต่อใครก็ได้ในระบบ) เพื่อช่วยดันสมาชิกใหม่และคนในชุมชนที่ยังไม่มีลูก
        // 🔄 วนลูปต่อเนื่อง: ทำงานครบ 2 รอบแล้วจะวนกลับไปเริ่มรอบที่ 1 ใหม่เสมอ (รอบ 1 ➔ รอบ 2 ➔ รอบ 1 ➔ รอบ 2)
        const round2Slot = this.findNextEmptySlot(1);
        if (round2Slot) {
          return {
            ...round2Slot,
            reason: `🚀 รอบที่ 2 (Round 2 - กระจายช่วยชุมชนทั้งระบบ): บอทสแกนเนอร์ (BFS) ค้นหาตำแหน่งว่างระดับบนสุด จากบนลงล่าง ซ้ายไปขวา ไปต่อใครก็ได้ในระบบเพื่อช่วยดันสมาชิกใหม่ (ต่อใต้ #${round2Slot.parentId} ฝั่ง${round2Slot.isLeft ? 'ซ้าย' : 'ขวา'}) [รอบสะสมที่ ${currentTotalRebirthIndex}]`,
          };
        }
      }
    }

    // สแกนผังรวมสำรอง
    const globalSlot = this.findNextEmptySlot(1);
    if (globalSlot) {
      return {
        ...globalSlot,
        reason: `ระบบสำรอง: ต่อตำแหน่งว่างระดับบนสุดใต้ผังรวม (เลือกขาซ้ายก่อนขาขวา)`,
      };
    }

    return null;
  }

  // ค้นหาตำแหน่งจัดวางสำหรับสมาชิกใหม่ / สมัครเปิดไอดีหลักใหม่เฉพาะในผัง Rank นั้นๆ (Target Rank Only)
  findSlotForSponsor(sponsorId: number = 1, targetRank: number = 1): SlotTarget | null {
    const safeRank = Math.max(1, Math.min(MAX_RANK, targetRank));
    const targetNodes = this.getMatrixTreeNodes(safeRank);

    if (targetNodes.length === 0) {
      return this.findNextEmptySlot(1, safeRank);
    }

    const nodeMap = new Map<number, MatrixNode>();
    targetNodes.forEach((n) => nodeMap.set(n.id, n));

    const sponsor = nodeMap.get(sponsorId) || targetNodes[0];
    if (!sponsor) {
      return this.findNextEmptySlot(1, safeRank);
    }

    // 1. ให้ไปต่อใต้ตัวเองก่อน (ตรวจตำแหน่งว่างติดตัวของผู้แนะนำเฉพาะในผัง Rank นั้น: ซ้ายก่อน ขวา)
    if (sponsor.leftChild === 0) {
      return {
        parentId: sponsor.id,
        isLeft: true,
        parentOwner: sponsor.owner,
        depth: sponsor.depth + 1,
        reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: ต่อติดตัวผู้แนะนำ #${sponsor.id} (ฝั่งซ้าย)`,
      };
    }
    if (sponsor.rightChild === 0) {
      return {
        parentId: sponsor.id,
        isLeft: false,
        parentOwner: sponsor.owner,
        depth: sponsor.depth + 1,
        reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: ต่อติดตัวผู้แนะนำ #${sponsor.id} (ฝั่งขวา)`,
      };
    }

    // 2. ถ้าหากเต็มทั้ง 2 ขาแล้ว ➔ ค้นหาโคลนนิ่งของผู้แนะนำในผัง Rank เดียวกันนี้
    const allRebirths = targetNodes.filter(
      (n) =>
        n.isRebirth &&
        n.id !== sponsor.id &&
        (n.rebornFromNodeId === sponsor.id ||
          n.originalAncestorId === sponsor.id ||
          n.owner.toLowerCase() === sponsor.owner.toLowerCase())
    );

    const directRebirthNodes = allRebirths
      .filter((n) => n.rebornFromNodeId === sponsor.id || n.originalAncestorId === sponsor.id)
      .sort((a, b) => (a.depth !== b.depth ? a.depth - b.depth : a.id - b.id));

    const otherRebirthNodes = allRebirths
      .filter((n) => n.rebornFromNodeId !== sponsor.id && n.originalAncestorId !== sponsor.id)
      .sort((a, b) => (a.depth !== b.depth ? a.depth - b.depth : a.id - b.id));

    // ตรวจหาตำแหน่งว่างติดตัวของโคลนใน Rank นั้นก่อน
    for (const rNode of directRebirthNodes) {
      if (rNode.leftChild === 0) {
        return {
          parentId: rNode.id,
          isLeft: true,
          parentOwner: rNode.owner,
          depth: rNode.depth + 1,
          isRebirthTarget: true,
          targetRebirthNodeId: rNode.id,
          reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: ผู้แนะนำ #${sponsor.id} เต็ม 2 ขา ➔ โยนลงโคลนนิ่ง #${rNode.id} ใน Rank ${safeRank} (ฝั่งซ้าย)`,
        };
      }
      if (rNode.rightChild === 0) {
        return {
          parentId: rNode.id,
          isLeft: false,
          parentOwner: rNode.owner,
          depth: rNode.depth + 1,
          isRebirthTarget: true,
          targetRebirthNodeId: rNode.id,
          reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: ผู้แนะนำ #${sponsor.id} เต็ม 2 ขา ➔ โยนลงโคลนนิ่ง #${rNode.id} ใน Rank ${safeRank} (ฝั่งขวา)`,
        };
      }
    }

    for (const rNode of otherRebirthNodes) {
      if (rNode.leftChild === 0) {
        return {
          parentId: rNode.id,
          isLeft: true,
          parentOwner: rNode.owner,
          depth: rNode.depth + 1,
          isRebirthTarget: true,
          targetRebirthNodeId: rNode.id,
          reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: ผู้แนะนำ #${sponsor.id} เต็ม 2 ขา ➔ โยนลงโคลนนิ่งบัญชีเดียวกัน #${rNode.id} ใน Rank ${safeRank} (ฝั่งซ้าย)`,
        };
      }
      if (rNode.rightChild === 0) {
        return {
          parentId: rNode.id,
          isLeft: false,
          parentOwner: rNode.owner,
          depth: rNode.depth + 1,
          isRebirthTarget: true,
          targetRebirthNodeId: rNode.id,
          reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: ผู้แนะนำ #${sponsor.id} เต็ม 2 ขา ➔ โยนลงโคลนนิ่งบัญชีเดียวกัน #${rNode.id} ใน Rank ${safeRank} (ฝั่งขวา)`,
        };
      }
    }

    // 3. หากตำแหน่งติดตัวของไอดีโคลนนิ่งทุกตัวเต็ม ให้สแกนสายงานใต้ไอดีโคลนนิ่งของตัวเองใน Rank นั้น
    for (const rNode of [...directRebirthNodes, ...otherRebirthNodes]) {
      const deepSlot = this.findNextEmptySlot(rNode.id, safeRank);
      if (deepSlot) {
        return {
          ...deepSlot,
          isRebirthTarget: true,
          targetRebirthNodeId: rNode.id,
          reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: โยนสายงานใต้โคลนนิ่ง #${rNode.id} ใน Rank ${safeRank} (ต่อใต้ #${deepSlot.parentId} ฝั่ง${deepSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
        };
      }
    }

    // 4. สแกน BFS ใต้สายงานของผู้แนะนำเฉพาะในผัง Rank นั้น
    const subSlot = this.findNextEmptySlot(sponsor.id, safeRank);
    if (subSlot) {
      return {
        ...subSlot,
        reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: โยนสายงานอัตโนมัติ (BFS) ใต้สายงานผู้แนะนำ #${sponsor.id} ใน Rank ${safeRank} (ต่อใต้ #${subSlot.parentId} ฝั่ง${subSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
      };
    }

    // 5. ผังรวมเฉพาะ Rank นั้น
    const globalSlot = this.findNextEmptySlot(1, safeRank);
    if (globalSlot) {
      return {
        ...globalSlot,
        reason: `📍 [กฎเฉพาะผัง Rank ${safeRank}]: จัดวางตามผังรวมเฉพาะ Rank ${safeRank} (ต่อใต้ #${globalSlot.parentId} ฝั่ง${globalSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
      };
    }
    return null;
  }

  // Helper to determine the true Direct Upline (ผู้แนะนำตรง)
  // - รหัสกระเป๋า 1 (Root Treasury) -> Direct Upline คือ #1
  // - รหัสกระเป๋า Alice (รวมถึงรหัสเกิดใหม่ / รหัสลูกในเครือ) -> Direct Upline คือ #1 (เพราะไอดี #1 เป็นผู้แนะนำของไอดี #2)
  // - รหัสที่ระบุ sponsorNodeId มาโดยตรง -> ใช้ตามที่ระบุ
  getWalletDefaultSponsorNodeId(ownerAddress: string, sponsorNodeId?: number): number {
    if (sponsorNodeId && sponsorNodeId > 0 && this.nodes.has(sponsorNodeId)) {
      return sponsorNodeId;
    }

    const addr = ownerAddress.toLowerCase();
    const isWallet1 = addr === INITIAL_WALLETS[0].address.toLowerCase();
    if (isWallet1) return 1;

    const wallet = this.wallets.get(addr);
    if (wallet) {
      // ตรวจสอบว่ากระเป๋านี้มีรหัสก่อนหน้าที่มี sponsorNodeId หรือไม่ (เช่น ไอดี #2 มี sponsor #1)
      if (wallet.nodeIds.length > 0) {
        const firstNode = this.nodes.get(wallet.nodeIds[0]);
        if (firstNode && firstNode.sponsorNodeId && firstNode.sponsorNodeId > 0) {
          return firstNode.sponsorNodeId;
        }
      }

      // ตรวจสอบจาก firstSponsor address ของกระเป๋า
      if (wallet.firstSponsor) {
        const sponsorWallet = this.wallets.get(wallet.firstSponsor.toLowerCase());
        if (sponsorWallet && sponsorWallet.nodeIds.length > 0) {
          return sponsorWallet.nodeIds[0];
        }
      }
    }

    // Default fallback เข้า Genesis Node #1 (Root Treasury)
    return 1;
  }

  // Register single Node
  register(
    ownerAddress: string,
    parentId: number,
    isLeft: boolean,
    isRebirth: boolean = false,
    ancestorId: number = 0,
    sponsorNodeId?: number,
    rank: number = 1,
    rebornFromNodeId?: number,
    paymentSource: RegistrationPaymentSource = 'wallet',
    vaultSourceNodeId?: number,
    placementReason?: string,
    createdVia?: string
  ): number {
    if (this.isPaused) {
      throw new Error('ระบบถูกระงับการทำงานชั่วคราวโดยผู้ดูแลระบบ (Contract is Paused by Admin)');
    }

    let parent = this.nodes.get(parentId);
    if (!parent) throw new Error(`Parent Node #${parentId} does not exist`);

    // Resolve sponsor:
    // - หากระบุ sponsorNodeId ให้ใช้ตามนั้น
    // - สำหรับ Alice (เจ้าของรหัส #2 และรหัสลูกหลาน/เกิดใหม่) -> Direct Upline ต้องเป็น ไอดี 1 เสมอ (เพราะไอดี 1 คือผู้แนะนำของไอดี 2)
    // - สำหรับ Root Treasury (กระเป๋าที่ 1) -> Direct Upline คือ ไอดี 1
    const effectiveSponsorNodeId = this.getWalletDefaultSponsorNodeId(ownerAddress, sponsorNodeId);

    let autoPlacementReason = placementReason || '';

    // เงื่อนไข: "ถ้ารหัสผู้เเนะนำที่เรากรอก และเต็มทั้ง 2 ขาแล้ว ให้ไปหารหัสที่เกิดใหม่ ของ id ที่เรากรอกตรงรหัสผู้เเนะนำ"
    if (!isRebirth && effectiveSponsorNodeId && this.nodes.has(effectiveSponsorNodeId)) {
      const spNode = this.nodes.get(effectiveSponsorNodeId)!;
      const isTargetOccupied = (isLeft && parent.leftChild !== 0) || (!isLeft && parent.rightChild !== 0);
      const isSponsorFull = spNode.leftChild !== 0 && spNode.rightChild !== 0;
      if ((parentId === effectiveSponsorNodeId && isSponsorFull) || isTargetOccupied) {
        const redirected = paymentSource === 'excess_vault'
          ? this.findSlotForNewMainIdFromVault(effectiveSponsorNodeId)
          : this.findSlotForSponsor(effectiveSponsorNodeId, rank);
        if (redirected && this.nodes.has(redirected.parentId)) {
          parentId = redirected.parentId;
          isLeft = redirected.isLeft;
          parent = this.nodes.get(parentId)!;
          if (!autoPlacementReason) {
            autoPlacementReason = redirected.reason || `โยนสายงานตามผู้แนะนำ #${effectiveSponsorNodeId}`;
          }
        }
      } else if (!autoPlacementReason) {
        autoPlacementReason = `จัดวางติดตัวผู้แนะนำ #${effectiveSponsorNodeId} (ฝั่ง${isLeft ? 'ซ้าย' : 'ขวา'})`;
      }
    }

    const wallet = this.wallets.get(ownerAddress.toLowerCase());
    if (!wallet) throw new Error(`Wallet ${ownerAddress} not registered`);

    let paidFromVault = 0;
    let paidFromWallet = 0;

    if (!isRebirth) {
      const availableVault = this.getWalletUpgradeVault(ownerAddress);

      if (paymentSource === 'excess_vault') {
        // ค่าสมัคร 5.00 USDT ถูกตรวจสอบและหักออกจากส่วนเกิน 40% Upgrade Vault เรียบร้อยแล้ว (ไม่หักซ้ำ)
        paidFromVault = REGISTRATION_FEE;
      } else if (paymentSource === 'vault') {
        if (availableVault < REGISTRATION_FEE) {
          throw new Error(
            `ยอด Upgrade Vault ไม่เพียงพอ! ต้องใช้ ${REGISTRATION_FEE} USDT (ปัจจุบันมีใน Vault: ${availableVault.toFixed(2)} USDT)`
          );
        }
        const deducted = this.deductWalletUpgradeVault(ownerAddress, REGISTRATION_FEE, vaultSourceNodeId);
        if (deducted < REGISTRATION_FEE) {
          throw new Error(`ไม่สามารถหักเงินจาก Upgrade Vault ได้ครบจำนวน (${deducted.toFixed(2)} / ${REGISTRATION_FEE} USDT)`);
        }
        paidFromVault = REGISTRATION_FEE;
      } else if (paymentSource === 'wallet') {
        if (wallet.balance < REGISTRATION_FEE) {
          throw new Error(
            `ยอดเงินในกระเป๋าไม่เพียงพอ! ต้องใช้ ${REGISTRATION_FEE} USDT (ปัจจุบันมี: ${wallet.balance.toFixed(2)} USDT)`
          );
        }
        wallet.balance = Math.round((wallet.balance - REGISTRATION_FEE) * 100) / 100;
        paidFromWallet = REGISTRATION_FEE;
      } else {
        // 'combined': ตัดเงินกระเป๋าเป็นอันดับแรก หากไม่พอจึงดึงส่วนต่างจาก Upgrade Vault
        if (wallet.balance >= REGISTRATION_FEE) {
          wallet.balance = Math.round((wallet.balance - REGISTRATION_FEE) * 100) / 100;
          paidFromWallet = REGISTRATION_FEE;
        } else {
          if (wallet.balance > 0) {
            paidFromWallet = wallet.balance;
            wallet.balance = 0;
          }
          const neededFromVault = Math.round((REGISTRATION_FEE - paidFromWallet) * 100) / 100;
          if (availableVault < neededFromVault) {
            throw new Error(
              `ยอดเงินไม่เพียงพอ! ค่าสมัคร ${REGISTRATION_FEE} USDT (มีกระเป๋า ${paidFromWallet.toFixed(2)} USDT + Upgrade Vault ${availableVault.toFixed(2)} USDT = รวม ${(paidFromWallet + availableVault).toFixed(2)} USDT)`
            );
          }
          this.deductWalletUpgradeVault(ownerAddress, neededFromVault, vaultSourceNodeId);
          paidFromVault = neededFromVault;
        }
      }
    }

    const currentId = this.generateNextNodeId();

    // ป้องกันการวางทับซ้อน (Slot Collision Protection):
    // ตรวจสอบว่าตำแหน่งเป้าหมาย (isLeft / rightChild) ของ parentId ว่างจริงหรือไม่
    // หากถูกเติมเต็มไปแล้วจากคิวอื่น ให้สแกนหาตำแหน่งว่างถัดไปโดยอัตโนมัติ ไม่เกิดการชนหรือทับรหัสเดิม
    if (isLeft && parent.leftChild !== 0) {
      const altSlot = this.findNextEmptySlot(parentId, rank) || this.findNextEmptySlot(1, rank);
      if (altSlot) {
        parentId = altSlot.parentId;
        isLeft = altSlot.isLeft;
        parent = this.nodes.get(parentId)!;
        autoPlacementReason = `ป้องกันการวางทับซ้อน ➔ โยนลงตำแหน่งว่าง Parent #${parentId} (${isLeft ? 'ขาซ้าย' : 'ขาขวา'})`;
      }
    } else if (!isLeft && parent.rightChild !== 0) {
      const altSlot = this.findNextEmptySlot(parentId, rank) || this.findNextEmptySlot(1, rank);
      if (altSlot) {
        parentId = altSlot.parentId;
        isLeft = altSlot.isLeft;
        parent = this.nodes.get(parentId)!;
        autoPlacementReason = `ป้องกันการวางทับซ้อน ➔ โยนลงตำแหน่งว่าง Parent #${parentId} (${isLeft ? 'ขาซ้าย' : 'ขาขวา'})`;
      }
    }

    // Enforce that the Left child must be filled first before the Right child can be filled
    // If trying to place on the Right (!isLeft) but the Left is empty (parent.leftChild === 0),
    // automatically swap to Left child (isLeft = true) to ensure correct math and sequence!
    if (!isLeft && parent.leftChild === 0) {
      isLeft = true;
      autoPlacementReason = autoPlacementReason 
        ? autoPlacementReason + ' | 🔄 ปรับจากขวาเป็นซ้าย (เนื่องจากขาซ้ายยังว่างอยู่)'
        : 'ปรับจากขวาเป็นซ้าย (เนื่องจากขาซ้ายยังว่างอยู่)';
    }

    if (isLeft && parent.leftChild !== 0) {
      throw new Error(`Parent #${parentId} already has a Left Child (#${parent.leftChild})`);
    }
    if (!isLeft && parent.rightChild !== 0) {
      throw new Error(`Parent #${parentId} already has a Right Child (#${parent.rightChild})`);
    }

    if (isLeft) {
      parent.leftChild = currentId;
    } else {
      parent.rightChild = currentId;
    }

    const sponsorNode = this.nodes.get(effectiveSponsorNodeId);
    const resolvedSponsorAddress = sponsorNode ? sponsorNode.owner.toLowerCase() : INITIAL_WALLETS[0].address.toLowerCase();

    // Ensure wallet has firstSponsor registered
    if (!wallet.firstSponsor) {
      wallet.firstSponsor = resolvedSponsorAddress;
    }

    const walletRebirthCount = wallet.rebirthCount || 0;
    const resolvedAncestorId = ancestorId === 0 ? currentId : ancestorId;

    // Keep Rank 1 Queue in sync
    const r1Queue = this.rankQueues.get(1) || [];
    const qNum = r1Queue.length + 1;

    const isFromVault = Boolean(
      paymentSource === 'excess_vault' || paymentSource === 'vault' || paidFromVault > 0
    );

    const resolvedCreatedVia = createdVia || (isRebirth ? 'Rebirth (ระบบโคลนนิ่งอัตโนมัติ)' : 'Single Registration (สมัครปกติ)');

    const newNode: MatrixNode = {
      id: currentId,
      owner: ownerAddress.toLowerCase(),
      parentId: parentId,
      leftChild: 0,
      rightChild: 0,
      depth: parent.depth + 1,
      createdAt: Date.now(),
      rank: rank, // Starts at specified Rank (1-45)
      rebirthCount: walletRebirthCount, // อ้างอิงตามเลขกระเป๋า
      pendingRebirths: 0, // รหัสเปิดใหม่ต้องเริ่มต้นด้วย 0 เม็ดเสมอ (ยังไม่มีลูกขาขวา)
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      upgradeVault: 0,
      originalAncestorId: resolvedAncestorId,
      rebornFromNodeId: isRebirth ? (rebornFromNodeId || resolvedAncestorId) : undefined,
      isRebirth,
      isFromVault: !isRebirth && isFromVault, // ไอดีที่เกิดจากการสมัครจากยอด 40% (Upgrade Vault / Excess Vault)
      paymentSource: paymentSource,
      firstSponsor: wallet.firstSponsor,
      sponsorNodeId: effectiveSponsorNodeId,
      queueNumber: qNum,
      createdVia: resolvedCreatedVia,
    };

    this.nodes.set(currentId, newNode);
    wallet.nodeIds.push(currentId);

    const parentItem = r1Queue.find((q) => q.nodeId === parentId) || (qNum > 1 ? r1Queue[Math.floor(qNum / 2) - 1] : undefined);
    const parentQ = parentItem ? parentItem.queueNumber : Math.floor(qNum / 2);
    const r1QueueItem: RankQueueNode = {
      queueNumber: qNum,
      nodeId: currentId,
      owner: ownerAddress.toLowerCase(),
      rank: 1,
      parentQueueNumber: parentQ,
      parentNodeId: parentItem ? parentItem.nodeId : parentId,
      leftChildQueueNumber: 0,
      rightChildQueueNumber: 0,
      isLeft,
      upgradeVault: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      rebirthCount: walletRebirthCount,
      pendingRebirths: 0,
      enteredAt: Date.now(),
      isRebirth,
      rebornFromNodeId: isRebirth ? (rebornFromNodeId || resolvedAncestorId) : undefined,
      originalAncestorId: resolvedAncestorId,
      createdVia: resolvedCreatedVia,
    };
    if (parentItem) {
      if (isLeft) parentItem.leftChildQueueNumber = qNum;
      else parentItem.rightChildQueueNumber = qNum;
    }
    r1Queue.push(r1QueueItem);
    this.rankQueues.set(1, r1Queue);

    // Execute 100% Math Routing AFTER Queue state is committed
    if (isLeft) {
      this.handleLeftChildPayout(currentId, parentId, ownerAddress, effectiveSponsorNodeId);
    } else {
      this.handleRightChildRebirth(parentId);
    }

    // If registering for Rank > 1 directly, also enter the target Rank queue
    if (rank > 1) {
      this.enterRankQueue(rank, currentId, ownerAddress, false);
    }

    const paymentDetailText = !isRebirth
      ? (paidFromVault > 0 && paidFromWallet > 0
          ? ` [ชำระด้วยกระเป๋า ${paidFromWallet.toFixed(2)} + Upgrade Vault ${paidFromVault.toFixed(2)} USDT (ตัดกระเป๋าก่อน)]`
          : paidFromVault > 0
          ? ` [ชำระด้วย Upgrade Vault 100% (5.00 USDT)]`
          : ` [ชำระด้วยกระเป๋าเงิน USDT (5.00 USDT) - ตัดกระเป๋าเป็นอันดับแรก]`)
      : '';

    const reasonSuffix = autoPlacementReason ? ` | 📍 [เหตุผลการจัดวาง]: ${autoPlacementReason}` : '';

    this.addLog({
      type: isRebirth ? 'REBIRTH_EXECUTED' : 'REGISTER',
      title: isRebirth
        ? `🌱 Rebirth Spawned: Node #${currentId} (เกิดจาก #${resolvedAncestorId})`
        : `🎉 New Registration: Node #${currentId}`,
      description: isRebirth
        ? `รหัสเกิดใหม่ #${currentId} เกิดมาจากรหัส #${resolvedAncestorId} (ต่อใต้ Parent #${parentId} ${isLeft ? 'ขาซ้าย' : 'ขาขวา'}) โดย ${wallet.name}${reasonSuffix}`
        : `เข้าผังต่อใต้ Parent #${parentId} (${isLeft ? 'ขาซ้าย' : 'ขาขวา'}) โดย ${wallet.name}${paymentDetailText}${reasonSuffix}`,
      nodeId: currentId,
      parentId,
      amount: REGISTRATION_FEE,
      txHash: '0x' + Math.random().toString(16).substring(2, 10),
    });

    if (isRebirth) {
      this.emitNotification({
        type: 'REBIRTH',
        title: `🌱 รหัสเกิดใหม่ทำงานสำเร็จ (Rebirth Node #${currentId})`,
        message: `รหัส #${currentId} แตกหน่อมาจากไอดีหลัก #${resolvedAncestorId} วางติดใต้ #${parentId} (${isLeft ? 'ขาซ้าย' : 'ขาขวา'}) โดย ${wallet.name}`,
        nodeId: currentId,
        rank: 1,
        amount: REGISTRATION_FEE,
        walletName: wallet.name,
        walletAddress: ownerAddress,
        details: {
          parentId,
          isLeft,
          rebornFromNodeId: resolvedAncestorId,
        },
      });
    } else {
      this.emitNotification({
        type: 'REGISTRATION',
        title: `🎉 สมัครสมาชิกสำเร็จ (New Member #${currentId})`,
        message: `รหัส #${currentId} (${wallet.name}) เข้าผังใต้ #${parentId} (${isLeft ? 'ขาซ้าย' : 'ขาขวา'}) ผู้แนะนำ: #${effectiveSponsorNodeId || 1}${paidFromVault > 0 ? ` [ใช้ Vault ${paidFromVault.toFixed(2)} U]` : ''}`,
        nodeId: currentId,
        rank: 1,
        amount: REGISTRATION_FEE,
        walletName: wallet.name,
        walletAddress: ownerAddress,
        details: {
          parentId,
          isLeft,
          sponsorId: effectiveSponsorNodeId,
          vaultUsed: paidFromVault,
          walletPaid: paidFromWallet,
        },
      });
    }

    return currentId;

  }

  // Handle 100% Math Payout (Both Left and Right downlines):
  // 1. 30% (1.5 USDT) -> เข้ากระเป๋าผู้แนะนำเราครั้งแรก (First Referrer / Sponsor)
  // 2. 30% (1.5 USDT) -> โบนัส 15 ชั้น เริ่มจ่ายตั้งแต่ชั้นที่ 0 เลย (0.1 USDT ต่อชั้น)
  // 3. 40% (2.0 USDT) -> เข้า Upgrade Vault ของรหัสแม่ (parentId)
  private handleLeftChildPayout(childId: number, parentId: number, childOwner: string, sponsorNodeId?: number, isLeft: boolean = true) {
    const parent = this.nodes.get(parentId)!;
    const childNode = this.nodes.get(childId);
    const childWallet = this.wallets.get(childOwner.toLowerCase())!;
    const isChildWallet1 = childOwner.toLowerCase() === INITIAL_WALLETS[0].address.toLowerCase();
    
    // Direct Upline: จ่ายให้รหัสแม่ (parentId) ที่เป็นผู้รับเงินโดยตรง (1.5 USDT)
    const parentWallet = this.wallets.get(parent.owner.toLowerCase())!;
    parentWallet.balance += DIRECT_BONUS;
    parentWallet.totalEarned += DIRECT_BONUS;
    parent.totalDirectEarned += DIRECT_BONUS;

    // Log Direct Bonus for Parent
    this.addLog({
      type: 'DIRECT_BONUS',
      title: `Direct Bonus Received: Node #${parentId} (+${DIRECT_BONUS.toFixed(2)} USDT)`,
      description: `ได้รับค่าแนะนำตรง 30% จำนวน ${DIRECT_BONUS.toFixed(2)} USDT จากรหัส #${childId} (ผัง 1)`,
      nodeId: parentId,
      amount: DIRECT_BONUS,
      txHash: '0xdirect_bonus_' + Math.random().toString(16).substring(2, 8),
      details: {
        rank: 1,
        fromNodeId: childId,
        amount: DIRECT_BONUS,
      }
    });

    // Sync to Rank 1 queue item for parent
    const r1Queue = this.rankQueues.get(1) || [];
    const parentQueueItem = r1Queue.find((q) => q.nodeId === parentId);
    if (parentQueueItem) {
      parentQueueItem.totalDirectEarned = Math.round((parentQueueItem.totalDirectEarned + DIRECT_BONUS) * 100) / 100;
    }

    // 2. 40% Upgrade Vault (2.0 USDT)
    parent.upgradeVault += UPGRADE_VAULT_SHARE;
    if (parentWallet) {
      parentWallet.upgradeVault = this.getWalletUpgradeVault(parent.owner);
    }
    if (parentQueueItem) {
      parentQueueItem.upgradeVault = parent.upgradeVault;
    }

    // 3. 30% โบนัส 15 ชั้น เริ่มจ่ายตั้งแต่ชั้นที่ 0 เลย (0.1 USDT per level, max 15 levels)
    // ชั้นที่ 0 คือ parentId (รหัสแม่) ทันที
    let currentUplineId = parentId;
    let distributedLevels = 0;

    while (currentUplineId !== 0 && distributedLevels < MAX_LEVELS) {
      const uplineNode = this.nodes.get(currentUplineId);
      if (!uplineNode) break;

      const uplineWallet = this.wallets.get(uplineNode.owner.toLowerCase());
      if (uplineWallet) {
        uplineNode.totalLevelEarned += LEVEL_BONUS;
        uplineWallet.balance += LEVEL_BONUS;
        uplineWallet.totalEarned += LEVEL_BONUS;
      }

      // Log Level Bonus for Upline
      this.addLog({
        type: 'LEVEL_BONUS',
        title: `Level Bonus Received: Node #${uplineNode.id} (+${LEVEL_BONUS.toFixed(2)} USDT)`,
        description: `ได้รับโบนัส 15 ชั้น (ชั้นที่ ${distributedLevels}) จำนวน ${LEVEL_BONUS.toFixed(2)} USDT จากการสมัครสมาชิกใหม่ของ Node #${childId} (ผัง 1)`,
        nodeId: uplineNode.id,
        amount: LEVEL_BONUS,
        txHash: '0xlevel_bonus_' + Math.random().toString(16).substring(2, 8),
        details: {
          rank: 1,
          fromNodeId: childId,
          depth: distributedLevels,
          amount: LEVEL_BONUS,
        }
      });

      // Sync to Rank 1 queue item for upline node
      const uplineQueueItem = r1Queue.find((q) => q.nodeId === currentUplineId);
      if (uplineQueueItem) {
        uplineQueueItem.totalLevelEarned = Math.round((uplineQueueItem.totalLevelEarned + LEVEL_BONUS) * 100) / 100;
      }

      distributedLevels++;
      currentUplineId = uplineNode.parentId;
    }

    // If lineage < 15 levels, residual flows to treasury (โอนเงินค่าชั้นส่วนที่เหลือเข้ากระเป๋ากลาง)
    if (distributedLevels < MAX_LEVELS) {
      const remainder = (MAX_LEVELS - distributedLevels) * LEVEL_BONUS;
      this.creditTreasuryResidual(remainder, distributedLevels, 1, childId, parentId);
    }

    this.addLog({
      type: 'PAYOUT_LEFT',
      title: `100% Left Child Math Executed (5.0 USDT)`,
      description: `30% Direct Upline (${DIRECT_BONUS} USDT) -> รหัส #${parentId} (${parentWallet.name}), 40% Upgrade Vault (${UPGRADE_VAULT_SHARE} USDT) -> รหัส #${parentId}, 30% โบนัส 15 ชั้นเริ่มตั้งแต่ชั้นที่ 0 (${distributedLevels} ชั้น * 0.1 USDT)${distributedLevels < MAX_LEVELS ? `, ค่าชั้นส่วนที่เหลือ ${((MAX_LEVELS - distributedLevels) * LEVEL_BONUS).toFixed(2)} USDT โอนเข้ากระเป๋ากลาง Treasury` : ''}`,
      nodeId: childId,
      parentId,
      amount: REGISTRATION_FEE,
      txHash: '0xpayout...' + Math.random().toString(16).substring(2, 8),
      details: {
        rank: 1,
        childId,
        parentId,
        directBonus: {
          sponsorNodeId: parentId,
          sponsorAddress: parent.owner.toLowerCase(),
          sponsorName: parentWallet.name,
          amount: DIRECT_BONUS,
        },
        levelBonus: {
          distributedLevels,
          perLevelBonus: LEVEL_BONUS,
          totalDistributed: distributedLevels * LEVEL_BONUS,
          remainderToTreasury: (MAX_LEVELS - distributedLevels) * LEVEL_BONUS,
        },
        upgradeVault: {
          targetNodeId: parentId,
          amount: UPGRADE_VAULT_SHARE,
          newBalance: parent.upgradeVault,
        },
      },
    });

    // AUTO-UPGRADE CHECK: If Upgrade Vault balance reaches the price of next Rank (Rank 1-15)
    this.checkAndAutoUpgradeRank(parentId);
    const rootId = (parent.originalAncestorId && parent.originalAncestorId > 0) ? parent.originalAncestorId : parent.id;
    if (rootId !== parentId) {
      this.checkAndAutoUpgradeRank(rootId);
    }

    // 🌟 ระบบ Auto Rebirth & Auto New ID เมื่อเปิดใช้งาน (พร้อมระบบหน่วงเวลา)
    if (this.autoRebirthEnabled || this.autoExcessVaultNewMainIdEnabled) {
      this.scheduleAutoActions(rootId);
    }
  }

  // โอนเงินค่าชั้นส่วนที่เหลือ (กรณีสายงานอัพไลน์ไม่ครบ 15 ชั้น) เข้ากระเป๋ากลาง (Treasury)
  private creditTreasuryResidual(remainder: number, distributedLevels: number, rank: number, nodeId?: number, parentId?: number) {
    if (remainder <= 0) return;
    this.treasuryBalance += remainder;
    const treasuryAddr = this.treasuryAddress ? this.treasuryAddress.toLowerCase() : INITIAL_WALLETS[0].address.toLowerCase();
    let treasuryWallet = this.wallets.get(treasuryAddr);
    if (!treasuryWallet) {
      treasuryWallet = this.wallets.get(INITIAL_WALLETS[0].address.toLowerCase());
    }
    if (treasuryWallet) {
      treasuryWallet.balance += remainder;
      treasuryWallet.totalEarned += remainder;
    }

    const unreachedLevels = MAX_LEVELS - distributedLevels;
    const rankLabel = rank > 1 ? `Rank ${rank}` : 'Rank 1';
    this.addLog({
      type: 'LEVEL_BONUS',
      title: `🏛️ [${rankLabel}] ค่าชั้นส่วนที่เหลือโอนเข้ากระเป๋ากลาง (${remainder.toFixed(2)} USDT)`,
      description: `สายงาน ${rankLabel} มีอัพไลน์ไม่ครบ 15 ชั้น (จ่ายจริง ${distributedLevels} ชั้น) ค่าชั้นส่วนที่เหลือ ${unreachedLevels} ชั้น (${remainder.toFixed(2)} USDT) โอนเข้ากระเป๋ากลาง (Treasury: ${treasuryWallet?.name || 'Root Treasury'}) เรียบร้อย`,
      nodeId,
      parentId,
      amount: remainder,
      txHash: '0xtreasury_residual_' + Math.random().toString(16).substring(2, 8),
      details: {
        rank,
        distributedLevels,
        unreachedLevels,
        remainder,
        treasuryAddress: treasuryAddr,
        treasuryWalletName: treasuryWallet?.name,
        newTreasuryBalance: this.treasuryBalance,
      },
    });
  }

  // ดึงยอดสะสม Upgrade Vault (40% เม็ดซ้าย) ของไอดีหลัก รวมกับไอดีเกิดใหม่ทั้งหมดที่เกิดมาจากไอดีหลักนี้
  // กฎ: รวมรายได้นับถอยหลังไป 5 ผัง (Up to 5 preceding matrix ranks)
  getNodeFamilyUpgradeVault(nodeId: number, targetRank?: number): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    const mainId = (node.isRebirth && node.originalAncestorId)
      ? node.originalAncestorId
      : (node.isRebirth && node.rebornFromNodeId)
      ? node.rebornFromNodeId
      : node.id;

    const mainNode = this.nodes.get(mainId) || node;
    const effTargetRank = targetRank ? Math.max(1, Math.min(MAX_RANK, targetRank)) : Math.min(MAX_RANK, (mainNode.rank || 1) + 1);
    const minRank = Math.max(1, effTargetRank - 5);
    const maxRank = Math.max(1, effTargetRank - 1);

    // เก็บรวบรวม ID ในตระกูลเดียวกัน (Main ID + Rebirth IDs ทั้งหมดที่เกิดจาก Main ID)
    const familyNodeIds = new Set<number>([mainId]);
    for (const n of this.nodes.values()) {
      if (
        n.id !== mainId &&
        n.isRebirth &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
      ) {
        familyNodeIds.add(n.id);
      }
    }

    let total = 0;

    // 1. รวมยอดสะสมจาก Base Nodes (Rank 1) หากผัง Rank 1 อยู่ในช่วง 5 ผังย้อนหลัง
    if (minRank === 1) {
      for (const fId of familyNodeIds) {
        const fn = this.nodes.get(fId);
        if (fn) {
          total += (fn.upgradeVault || 0);
        }
      }
    }

    // 2. รวมยอดสะสมจาก Rank Queues สำหรับผังที่ 2 ถึง 45 ที่อยู่ในช่วง 5 ผังย้อนหลัง (minRank ถึง maxRank)
    for (let r = Math.max(2, minRank); r <= maxRank; r++) {
      const q = this.rankQueues.get(r);
      if (q) {
        for (const qItem of q) {
          if (familyNodeIds.has(qItem.nodeId)) {
            total += (qItem.upgradeVault || 0);
          }
        }
      }
    }

    return Math.round(total * 100) / 100;
  }

  // หักเงินจาก Upgrade Vault ของไอดีหลัก และไอดีเกิดใหม่ทั้งหมดที่เกิดมาจากไอดีหลักนี้ (นับถอยหลังไป 5 ผัง)
  deductNodeFamilyUpgradeVault(nodeId: number, amountToDeduct: number, targetRank?: number): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    const mainId = (node.isRebirth && node.originalAncestorId)
      ? node.originalAncestorId
      : (node.isRebirth && node.rebornFromNodeId)
      ? node.rebornFromNodeId
      : node.id;
    const mainNode = this.nodes.get(mainId) || node;
    let remaining = amountToDeduct;

    const effTargetRank = targetRank ? Math.max(1, Math.min(MAX_RANK, targetRank)) : Math.min(MAX_RANK, (mainNode.rank || 1) + 1);
    const minRank = Math.max(1, effTargetRank - 5);
    const maxRank = Math.max(1, effTargetRank - 1);

    const familyNodeIds = new Set<number>([mainId]);
    for (const n of this.nodes.values()) {
      if (
        n.id !== mainId &&
        n.isRebirth &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
      ) {
        familyNodeIds.add(n.id);
      }
    }

    // 1. หักจาก ID หลัก และไอดีเกิดใหม่ใน Base Nodes ก่อน (หาก Rank 1 อยู่ในระยะ 5 ผัง)
    if (minRank === 1) {
      if (mainNode.upgradeVault > 0) {
        const take = Math.min(mainNode.upgradeVault, remaining);
        mainNode.upgradeVault = Math.round((mainNode.upgradeVault - take) * 100) / 100;
        remaining = Math.round((remaining - take) * 100) / 100;
      }

      if (remaining > 0) {
        for (const n of this.nodes.values()) {
          if (n.id === mainId || n.upgradeVault <= 0) continue;
          if (familyNodeIds.has(n.id)) {
            const take = Math.min(n.upgradeVault, remaining);
            n.upgradeVault = Math.round((n.upgradeVault - take) * 100) / 100;
            remaining = Math.round((remaining - take) * 100) / 100;
            if (remaining <= 0) break;
          }
        }
      }
    }

    // 2. หากยังเหลือ ให้ไล่หักจาก Rank Queues ในช่วง 5 ผังย้อนหลัง
    if (remaining > 0) {
      for (let r = Math.max(2, minRank); r <= maxRank; r++) {
        const q = this.rankQueues.get(r);
        if (q) {
          for (const qItem of q) {
            if (familyNodeIds.has(qItem.nodeId) && qItem.upgradeVault > 0) {
              const take = Math.min(qItem.upgradeVault, remaining);
              qItem.upgradeVault = Math.round((qItem.upgradeVault - take) * 100) / 100;
              remaining = Math.round((remaining - take) * 100) / 100;
              if (remaining <= 0) break;
            }
          }
        }
        if (remaining <= 0) break;
      }
    }

    // ซิงค์ยอดกับกระเป๋าเจ้าของ
    const addr = mainNode.owner.toLowerCase();
    const ownerWallet = this.wallets.get(addr);
    if (ownerWallet) {
      ownerWallet.upgradeVault = this.getWalletUpgradeVault(addr);
    }

    return Math.round((amountToDeduct - remaining) * 100) / 100;
  }

  // =========================================================================
  // --- การเกิดใหม่ไอดีหลักที่ผัง 1 จากยอดส่วนเกิน 40% UPGRADE VAULT ---
  // กฎ: (40% Upgrade Vault ทั้งหมด) - (40% Upgrade Vault ตู้เซฟอัปเกรดสะสมย้อนหลัง 5 ผัง)
  // ถ้ามียอดส่วนเกิน >= มูลค่าผัง 1 (5.00 USDT) ให้เกิดใหม่ไอดีหลักที่ผัง 1 ทันที
  // =========================================================================

  // 1. คำนวณ 40% Upgrade Vault ทั้งหมดในระบบของตระกูลไอดีหลักนี้ (ทุกผัง 1 ถึง 45 รวมรหัสเกิดใหม่ทั้งหมด)
  getTotalFamilyAllUpgradeVault(nodeId: number): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    const mainId = (node.isRebirth && node.originalAncestorId)
      ? node.originalAncestorId
      : (node.isRebirth && node.rebornFromNodeId)
      ? node.rebornFromNodeId
      : node.id;

    const familyNodeIds = new Set<number>([mainId]);
    for (const n of this.nodes.values()) {
      if (
        n.id !== mainId &&
        n.isRebirth &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
      ) {
        familyNodeIds.add(n.id);
      }
    }

    let total = 0;

    // 1.1 รวมจากผังที่ 1 (Base Nodes)
    for (const fId of familyNodeIds) {
      const fn = this.nodes.get(fId);
      if (fn) {
        total += (fn.upgradeVault || 0);
      }
    }

    // 1.2 รวมจากผังที่ 2 ถึง 45 (Rank Queues)
    for (let r = 2; r <= MAX_RANK; r++) {
      const q = this.rankQueues.get(r);
      if (q) {
        for (const qItem of q) {
          if (familyNodeIds.has(qItem.nodeId)) {
            total += (qItem.upgradeVault || 0);
          }
        }
      }
    }

    return Math.round(total * 100) / 100;
  }

  // 1.1 คำนวณ 40% Upgrade Vault รวมเฉพาะผังที่ 1 ถึงผังที่ 5 ในระบบของตระกูลไอดีหลักนี้
  getFamilyVaultRank1To5(nodeId: number): number {
    return this.getFamilyVaultInRankRange(nodeId, 1, 5);
  }

  // 1.2 คำนวณ 40% Upgrade Vault รวมผังที่ 1 ถึงผังที่ 10 ในระบบของตระกูลไอดีหลักนี้
  getFamilyVaultRank1To10(nodeId: number): number {
    return this.getFamilyVaultInRankRange(nodeId, 1, 10);
  }

  // 1.3 รวม 40% Upgrade Vault ตามช่วง Rank ที่ระบุ
  getFamilyVaultInRankRange(nodeId: number, fromRank: number, toRank: number): number {
    const node = this.nodes.get(nodeId);
    const mainId = node
      ? (node.isRebirth && node.originalAncestorId)
        ? node.originalAncestorId
        : (node.isRebirth && node.rebornFromNodeId)
        ? node.rebornFromNodeId
        : node.id
      : nodeId;

    const familyNodeIds = new Set<number>([mainId]);
    for (const n of this.nodes.values()) {
      if (
        n.id !== mainId &&
        n.isRebirth &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
      ) {
        familyNodeIds.add(n.id);
      }
    }

    let total = 0;
    if (fromRank <= 1 && toRank >= 1) {
      for (const fId of familyNodeIds) {
        const fn = this.nodes.get(fId);
        if (fn) total += (fn.upgradeVault || 0);
      }
    }

    const startQ = Math.max(2, fromRank);
    const endQ = Math.min(MAX_RANK, toRank);
    for (let r = startQ; r <= endQ; r++) {
      const q = this.rankQueues.get(r);
      if (q) {
        for (const qItem of q) {
          if (familyNodeIds.has(qItem.nodeId)) {
            total += (qItem.upgradeVault || 0);
          }
        }
      }
    }
    return Math.round(total * 100) / 100;
  }

  // =========================================================================
  // --- [ฟังก์ชันที่ 1]: สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID Registration) จากส่วนเกิน 40% Vault (ผัง 1 ถึง 5) ---
  // กฎสูตรการคำนวณยอดส่วนเกิน:
  // 1. ถ้าไอดีหลักอัปเกรดยังไม่ถึงผัง 11 (และยังไม่ถึงผัง 10):
  //    สูตรคำนวณ: (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 5) − (40% Upgrade Vault สำรองย้อนหลัง 5 ผัง)
  // 2. ถ้าไอดีหลักอัปเกรดถึงผัง 10 (แต่ยังไม่ถึงผัง 11):
  //    สำรองย้อนหลัง 5 ผังคือ ผัง 6 ถึง 10 (ยอดสำรองในผัง 1 ถึง 5 = 0.00 USDT)
  //    สูตรคำนวณ: (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 5) − 0.00 USDT = ปลดล็อกผัง 1 ถึง 5 เต็มจำนวน
  // 3. ถ้าไอดีหลักอัปเกรดผ่านผัง 11 ขึ้นไปแล้ว (Rank >= 11):
  //    สูตรคำนวณ: (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 5) [รับเต็ม 100% ผัง 1 ถึง 5 โดยไม่ต้องสำรอง]
  // เมื่อยอดส่วนเกิน >= 5.00 USDT นำไปสมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID) ในผังที่ 1 ได้ทันที (ไม่ใช่โคลนนิ่ง)
  // =========================================================================
  getFamilyExcessRebirthVaultSummary(nodeId: number): ExcessRebirthVaultSummary {
    const node = this.nodes.get(nodeId);
    const mainId = node
      ? (node.isRebirth && node.originalAncestorId)
        ? node.originalAncestorId
        : (node.isRebirth && node.rebornFromNodeId)
        ? node.rebornFromNodeId
        : node.id
      : 1;
    const mainNode = this.nodes.get(mainId) || node;
    const mainRank = mainNode?.rank || 1;
    const isRank11OrAbove = mainRank >= 11;
    const isRank10OrAbove = mainRank >= 10;

    // 1. (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 5)
    const vaultRank1To5 = this.getFamilyVaultRank1To5(mainId);
    const totalAllVault = vaultRank1To5;

    // 2. (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 10) - สำหรับข้อมูลเปรียบเทียบ
    const vaultRank1To10 = this.getFamilyVaultRank1To10(mainId);

    // 3. คำนวณยอดส่วนเกินตามสูตร:
    let reserved5RanksVault = 0; // ยอดสำรองที่อยู่ในช่วงผัง 1 ถึง 5 ที่ต้องหักออก
    let reserved5RanksFullVault = 0; // ยอดสำรอง 5 ผังเต็มช่วง
    let reservedRanksText = '';
    let excessVault = 0;
    let formulaText = '';

    if (isRank11OrAbove) {
      // ไอดีหลักผ่านผัง 11 ขึ้นไปแล้ว: รับเต็ม 100% ผัง 1 ถึง 5 ไม่ต้องสำรอง
      reserved5RanksVault = 0;
      reserved5RanksFullVault = this.getFamilyVaultInRankRange(mainId, Math.max(1, mainRank - 4), mainRank);
      reservedRanksText = `0.00 USDT (ผัง #${mainRank} ≥ 11: รับเต็ม 100% ผัง 1-5)`;
      excessVault = Math.max(0, Math.round(vaultRank1To5 * 100) / 100);
      formulaText = `(40% Upgrade Vault ผัง 1-5: ${vaultRank1To5.toFixed(2)} USDT) − 0.00 USDT = ${excessVault.toFixed(2)} USDT [ผัง #${mainRank} ≥ 11: รับเต็ม 100% ผัง 1-5]`;
    } else if (mainRank === 10) {
      // ไอดีหลักอยู่ที่ผัง 10: สำรองย้อนหลัง 5 ผังคือ ผัง 6 ถึง 10 (ยอดสำรองในผัง 1 ถึง 5 = 0.00 USDT)
      reserved5RanksFullVault = this.getFamilyVaultInRankRange(mainId, 6, 10);
      reserved5RanksVault = 0;
      reservedRanksText = `ผัง 6 ถึง 10 (${reserved5RanksFullVault.toFixed(2)} U อยู่นอกผัง 1-5)`;
      excessVault = Math.max(0, Math.round(vaultRank1To5 * 100) / 100);
      formulaText = `(40% Upgrade Vault ผัง 1-5: ${vaultRank1To5.toFixed(2)} USDT) − (สำรองย้อนหลัง 5 ผัง [ผัง 6-10]: 0.00 USDT) = ${excessVault.toFixed(2)} USDT [ผัง #10: ปลดล็อกเต็ม 100% ผัง 1-5]`;
    } else {
      // ไอดีหลักยังไม่ถึงผัง 10 (และยังไม่ถึงผัง 11): คำนวณสำรองย้อนหลัง 5 ผัง
      const startReserve = Math.max(1, mainRank - 4);
      const endReserve = mainRank;
      const startIn1To5 = startReserve;
      const endIn1To5 = Math.min(5, endReserve);

      reserved5RanksVault = this.getFamilyVaultInRankRange(mainId, startIn1To5, endIn1To5);
      reserved5RanksFullVault = this.getFamilyVaultInRankRange(mainId, startReserve, endReserve);

      const reserveRangeStr = startIn1To5 === endIn1To5 ? `ผัง ${startIn1To5}` : `ผัง ${startIn1To5} ถึง ${endIn1To5}`;
      reservedRanksText = `${reserveRangeStr} (${reserved5RanksVault.toFixed(2)} USDT)`;

      excessVault = Math.max(0, Math.round((vaultRank1To5 - reserved5RanksVault) * 100) / 100);
      formulaText = `(40% Upgrade Vault ผัง 1-5: ${vaultRank1To5.toFixed(2)} USDT) − (40% Upgrade Vault สำรองย้อนหลัง 5 ผัง [${reserveRangeStr}]: ${reserved5RanksVault.toFixed(2)} USDT) = ${excessVault.toFixed(2)} USDT [ผัง #${mainRank} < 10/11]`;
    }

    const rank1Price = REGISTRATION_FEE; // 5.00 USDT
    const canRegisterNewMainId = excessVault >= rank1Price;
    const newMainIdCountPossible = Math.floor(excessVault / rank1Price);
    const canRebirthRank1 = canRegisterNewMainId;
    const rebirthCountPossible = newMainIdCountPossible;

    return {
      mainId,
      mainRank,
      totalAllVault,
      vaultRank1To5,
      vaultRank1To10,
      reserved5RanksVault,
      reservedRanksText,
      reserved5RanksFullVault,
      vaultRolling5Ranks: reserved5RanksVault,
      isRank11OrAbove,
      isRank10OrAbove,
      excessVault,
      rank1Price,
      canRebirthRank1,
      rebirthCountPossible,
      canRegisterNewMainId,
      newMainIdCountPossible,
      formulaText,
    };
  }

  // 1.4 เติมยอดทดสอบ 40% Vault ให้ผัง 1-5 หรือผัง 1-10 สำหรับทดสอบสูตร
  addTestVaultToRank1To5(mainId: number, amount: number = 5.0, targetRank: number = 1): void {
    const mainNode = this.nodes.get(mainId);
    if (!mainNode) return;

    const effRank = Math.min(10, Math.max(1, targetRank));
    if (effRank === 1) {
      mainNode.upgradeVault = Math.round((mainNode.upgradeVault + amount) * 100) / 100;
      const q1 = this.rankQueues.get(1);
      if (q1) {
        const qItem = q1.find((q) => q.nodeId === mainId);
        if (qItem) qItem.upgradeVault = mainNode.upgradeVault;
      }
    } else {
      if (!this.rankQueues.has(effRank)) {
        this.rankQueues.set(effRank, []);
      }
      const q = this.rankQueues.get(effRank)!;
      let qItem = q.find((item) => item.nodeId === mainId);
      if (!qItem) {
        const queueNumber = q.length + 1;
        const parentQueueNumber = Math.floor(queueNumber / 2);
        const parentNodeId = parentQueueNumber > 0 ? (q[parentQueueNumber - 1]?.nodeId || 1) : 0;
        qItem = {
          queueNumber,
          nodeId: mainId,
          owner: mainNode.owner,
          sponsorNodeId: mainNode.sponsorNodeId || 1,
          rank: effRank,
          parentQueueNumber,
          parentNodeId,
          leftChildQueueNumber: queueNumber * 2,
          rightChildQueueNumber: queueNumber * 2 + 1,
          isLeft: queueNumber % 2 === 0,
          upgradeVault: 0,
          totalDirectEarned: 0,
          totalLevelEarned: 0,
          pendingRebirths: 0,
          rebirthCount: 0,
          enteredAt: Date.now(),
          originalAncestorId: mainId,
        };
        q.push(qItem);
      }
      qItem.upgradeVault = Math.round((qItem.upgradeVault + amount) * 100) / 100;
    }

    const ownerWallet = this.wallets.get(mainNode.owner.toLowerCase());
    if (ownerWallet) {
      ownerWallet.upgradeVault = this.getWalletUpgradeVault(mainNode.owner);
    }

    this.addLog({
      type: 'UPGRADE_VAULT',
      title: `⚡ เติมยอดทดสอบ 40% Vault ผัง ${effRank}: +${amount.toFixed(2)} USDT ให้ไอดี #${mainId}`,
      description: `เพิ่มยอดทดสอบ 40% Upgrade Vault ผัง ${effRank} (${getRankInfo(effRank).title}) จำนวน ${amount.toFixed(2)} USDT เพื่อทดสอบระบบสมัครสมาชิกเปิดไอดีหลักใหม่จากส่วนเกิน 40% Vault (ผัง 1 ถึง 5)`,
      nodeId: mainId,
      amount,
      txHash: '0xtest_vault_rank1_5_' + Date.now().toString(16),
    });
  }

  // 3. หักยอดส่วนเกิน 40% Upgrade Vault (ตัดออกจากโหนดหรือผังที่อยู่นอกระยะ 5 ผังก่อน หรือผังเก่า)
  deductFamilyExcessRebirthVault(mainId: number, amountToDeduct: number): number {
    const mainNode = this.nodes.get(mainId);
    if (!mainNode) return 0;
    let remaining = amountToDeduct;

    const mainRank = mainNode.rank || 1;
    const startReserve = mainRank >= 10 ? 6 : Math.max(1, mainRank - 4);

    const familyNodeIds = new Set<number>([mainId]);
    for (const n of this.nodes.values()) {
      if (
        n.id !== mainId &&
        n.isRebirth &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
      ) {
        familyNodeIds.add(n.id);
      }
    }

    // 3.1 ตัดจากผังเก่าที่อยู่นอกระยะ 5 ผังย้อนหลังก่อน (r < startReserve)
    if (startReserve > 1) {
      for (const fId of familyNodeIds) {
        const fn = this.nodes.get(fId);
        if (fn && fn.upgradeVault > 0) {
          const take = Math.min(fn.upgradeVault, remaining);
          fn.upgradeVault = Math.round((fn.upgradeVault - take) * 100) / 100;
          remaining = Math.round((remaining - take) * 100) / 100;
          if (remaining <= 0) break;
        }
      }

      if (remaining > 0) {
        for (let r = 2; r < startReserve; r++) {
          const q = this.rankQueues.get(r);
          if (q) {
            for (const qItem of q) {
              if (familyNodeIds.has(qItem.nodeId) && qItem.upgradeVault > 0) {
                const take = Math.min(qItem.upgradeVault, remaining);
                qItem.upgradeVault = Math.round((qItem.upgradeVault - take) * 100) / 100;
                remaining = Math.round((remaining - take) * 100) / 100;
                if (remaining <= 0) break;
              }
            }
          }
          if (remaining <= 0) break;
        }
      }
    }

    // 3.2 ถ้ายังไม่พอ ให้หักจากผัง 1 ถึง 5 ที่มียอด
    if (remaining > 0) {
      for (const fId of familyNodeIds) {
        const fn = this.nodes.get(fId);
        if (fn && fn.upgradeVault > 0) {
          const take = Math.min(fn.upgradeVault, remaining);
          fn.upgradeVault = Math.round((fn.upgradeVault - take) * 100) / 100;
          remaining = Math.round((remaining - take) * 100) / 100;
          if (remaining <= 0) break;
        }
      }
    }

    if (remaining > 0) {
      for (let r = 2; r <= 5; r++) {
        const q = this.rankQueues.get(r);
        if (q) {
          for (const qItem of q) {
            if (familyNodeIds.has(qItem.nodeId) && qItem.upgradeVault > 0) {
              const take = Math.min(qItem.upgradeVault, remaining);
              qItem.upgradeVault = Math.round((qItem.upgradeVault - take) * 100) / 100;
              remaining = Math.round((remaining - take) * 100) / 100;
              if (remaining <= 0) break;
            }
          }
        }
        if (remaining <= 0) break;
      }
    }

    // ซิงค์ยอดกับกระเป๋าและคิวผังที่ 1
    const q1 = this.rankQueues.get(1);
    if (q1) {
      for (const qItem of q1) {
        const fn = this.nodes.get(qItem.nodeId);
        if (fn) {
          qItem.upgradeVault = fn.upgradeVault;
        }
      }
    }

    const ownerWallet = this.wallets.get(mainNode.owner.toLowerCase());
    if (ownerWallet) {
      ownerWallet.upgradeVault = this.getWalletUpgradeVault(mainNode.owner);
    }

    return Math.round((amountToDeduct - remaining) * 100) / 100;
  }

  // 🔍 ค้นหาตำแหน่งจัดวางเฉพาะสำหรับฟังก์ชัน "สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID) จากส่วนเกิน 40% Vault (ผัง 1 ถึง 5)"
  // กฎการจัดวาง:
  // ขั้นที่ 1: บอทจะค้นหาตำแหน่งว่างติดตัว ผู้แนะนำตรง (Sponsor ID) ก่อน (ลงซ้ายหรือขวาก็ได้)จากล่างสุดขึ้นบน
  // ขั้นที่ 2: หากติดตัวผู้แนะนำเต็มทั้ง 2 ขาแล้ว ระบบจะโยนสายงาน (Auto-Spillover) ลงไปจัดวางใต้ รหัสโคลนของผู้แนะนำเท่านั้น จากล่างสุดขึ้นบน ที่ยังว่างอยู่ (ลงซ้ายหรือขวาก็ได้)
  // (เช่น ผู้แนะนำคือ #1 แต่ #1 เต็มทั้ง 2 ขาแล้ว ระบบจะไปหาไอดีโคลนนิ่งของ Sponsor ID เท่านั้น ที่ยังว่างอยู่ จากล่างสุดขึ้นบน ลงซ้ายหรือขวาก็ได้)
  findSlotForNewMainIdFromVault(sponsorId: number = 1): SlotTarget | null {
    const sponsor = this.nodes.get(sponsorId);
    if (!sponsor) {
      return this.findNextEmptySlot(1, 1);
    }

    // ขั้นที่ 1: บอทจะค้นหาตำแหน่งว่างติดตัว ผู้แนะนำตรง (Sponsor ID) ก่อน (ลงซ้ายหรือขวาก็ได้)
    if (sponsor.leftChild === 0) {
      return {
        parentId: sponsor.id,
        isLeft: true,
        parentOwner: sponsor.owner,
        depth: sponsor.depth + 1,
        reason: `ขั้นที่ 1: จัดวางตำแหน่งว่างติดตัวผู้แนะนำตรง #${sponsor.id} (ฝั่งซ้าย)`,
      };
    }
    if (sponsor.rightChild === 0) {
      return {
        parentId: sponsor.id,
        isLeft: false,
        parentOwner: sponsor.owner,
        depth: sponsor.depth + 1,
        reason: `ขั้นที่ 1: จัดวางตำแหน่งว่างติดตัวผู้แนะนำตรง #${sponsor.id} (ฝั่งขวา)`,
      };
    }

    // ขั้นที่ 2: หากติดตัวผู้แนะนำเต็มทั้ง 2 ขาแล้ว ระบบจะโยนสายงาน (Auto-Spillover) ลงไปจัดวางใต้ รหัสโคลนของผู้แนะนำเท่านั้น จากล่างสุดขึ้นบน ที่ยังว่างอยู่ (ลงซ้ายหรือขวาก็ได้)
    // ค้นหารหัสโคลนทั้งหมดของ Sponsor ID ในผังที่ 1 เรียงลำดับจากล่างสุดขึ้นบน (Depth มากไปน้อย และ ID มากไปน้อย / รหัสใหม่ล่าสุดก่อน)
    const sponsorOwner = sponsor.owner.toLowerCase();
    const cloneNodes = Array.from(this.nodes.values())
      .filter(
        (n) =>
          n.isRebirth &&
          n.id !== sponsor.id &&
          (n.originalAncestorId === sponsor.id ||
            n.rebornFromNodeId === sponsor.id ||
            n.owner.toLowerCase() === sponsorOwner)
      )
      .sort((a, b) => (a.depth !== b.depth ? b.depth - a.depth : b.id - a.id));

    // 2.1 ค้นหาตำแหน่งว่างติดตัวของรหัสโคลนของ Sponsor ID เท่านั้น จากล่างสุดขึ้นบน (ลงซ้ายหรือขวาก็ได้)
    for (const cNode of cloneNodes) {
      if (cNode.leftChild === 0) {
        return {
          parentId: cNode.id,
          isLeft: true,
          parentOwner: cNode.owner,
          depth: cNode.depth + 1,
          isRebirthTarget: true,
          targetRebirthNodeId: cNode.id,
          reason: `ขั้นที่ 2: ผู้แนะนำ #${sponsor.id} เต็ม 2 ขา ➔ โยนสายงานจัดวางใต้รหัสโคลนของผู้แนะนำ #${cNode.id} เท่านั้น จากล่างสุดขึ้นบน (ฝั่งซ้าย)`,
        };
      }
      if (cNode.rightChild === 0) {
        return {
          parentId: cNode.id,
          isLeft: false,
          parentOwner: cNode.owner,
          depth: cNode.depth + 1,
          isRebirthTarget: true,
          targetRebirthNodeId: cNode.id,
          reason: `ขั้นที่ 2: ผู้แนะนำ #${sponsor.id} เต็ม 2 ขา ➔ โยนสายงานจัดวางใต้รหัสโคลนของผู้แนะนำ #${cNode.id} เท่านั้น จากล่างสุดขึ้นบน (ฝั่งขวา)`,
        };
      }
    }

    // 2.2 หากตำแหน่งติดตัวของรหัสโคลนทุกตัวเต็มทั้ง 2 ขา ให้สแกนสายงาน (Subtree Spillover) ใต้รหัสโคลนของผู้แนะนำเท่านั้น เรียงจากล่างขึ้นบน
    for (const cNode of cloneNodes) {
      const deepSlot = this.findNextEmptySlot(cNode.id, 1);
      if (deepSlot) {
        return {
          ...deepSlot,
          isRebirthTarget: true,
          targetRebirthNodeId: cNode.id,
          reason: `ขั้นที่ 2: โยนสายงาน (Auto-Spillover) ลงใต้สายงานรหัสโคลนของผู้แนะนำ #${cNode.id} เท่านั้น จากล่างขึ้นบน (ต่อใต้ #${deepSlot.parentId} ฝั่ง${deepSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
        };
      }
    }

    // 2.3 กรณีผู้แนะนำยังไม่มีรหัสโคลนเกิดขึ้น ให้โยนสายงานลงใต้สายงานของผู้แนะนำตรง
    const subSlot = this.findNextEmptySlot(sponsor.id, 1);
    if (subSlot) {
      return {
        ...subSlot,
        reason: `ขั้นที่ 2: ผู้แนะนำ #${sponsor.id} ยังไม่มีรหัสโคลน ➔ โยนสายงาน (Auto-Spillover) ลงใต้สายงานผู้แนะนำตรง #${sponsor.id} (ต่อใต้ #${subSlot.parentId} ฝั่ง${subSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
      };
    }

    // 2.4 Fallback ผังรวม
    const globalSlot = this.findNextEmptySlot(1, 1);
    if (globalSlot) {
      return {
        ...globalSlot,
        reason: `ขั้นที่ 2: โยนสายงานระดับบนสุดใต้ผังรวม (ต่อใต้ #${globalSlot.parentId} ฝั่ง${globalSlot.isLeft ? 'ซ้าย' : 'ขวา'})`,
      };
    }

    return null;
  }

  // สั่งสร้างไอดีหลักใหม่ (New Main ID) 1 รหัส ในผังที่ 1 ด้วยยอดส่วนเกิน 40% Upgrade Vault (5.00 USDT)
  executeSingleMainIdRebirthFromExcessVault(mainId: number): number {
    // 🌟 บุริมสิทธิ์: โคลนนิ่ง (Rebirth) ต้องทำงานก่อน New Main ID เสมอ!
    this.processAllPendingRebirthsPriority();

    const mainNode = this.nodes.get(mainId);
    if (!mainNode) {
      throw new Error(`ไม่พบรหัสหลัก #${mainId}`);
    }

    const summary = this.getFamilyExcessRebirthVaultSummary(mainId);
    if (summary.excessVault < REGISTRATION_FEE) {
      throw new Error(
        `ยอดส่วนเกิน 40% Upgrade Vault ไม่เพียงพอ (${summary.excessVault.toFixed(2)} USDT / ต้องการ ${REGISTRATION_FEE.toFixed(2)} USDT)`
      );
    }

    // หักยอด 5.00 USDT จากส่วนเกิน Vault
    this.deductFamilyExcessRebirthVault(mainId, REGISTRATION_FEE);

    // หาตำแหน่งว่างตามกฎ 2 ขั้นตอนเฉพาะ:
    // ขั้นที่ 1: ค้นหาตำแหน่งว่างติดตัว ผู้แนะนำตรง (Sponsor ID) ก่อน (ลงซ้ายก่อนขวา)
    // ขั้นที่ 2: หากติดตัวผู้แนะนำเต็มทั้ง 2 ขาแล้ว ระบบจะโยนสายงาน (Auto-Spillover) ลงไปจัดวางใต้ รหัสโคลนของผู้แนะนำ
    const slot = this.findSlotForNewMainIdFromVault(mainId) || this.findSlotForNewMainIdFromVault(1);
    if (!slot) {
      throw new Error('ไม่พบตำแหน่งว่างในผังที่ 1');
    }

    // ลงทะเบียนเปิดไอดีหลักใหม่ (New Main ID) ในผัง 1 จากยอดส่วนเกิน Upgrade Vault (5.00 USDT) [ไม่ใช่โคลนนิ่ง: isRebirth = false]
    const newMainNodeId = this.register(
      mainNode.owner,
      slot.parentId,
      slot.isLeft,
      false, // isRebirth = false (เปิดเป็นไอดีหลักใหม่ ไม่ใช่โคลนนิ่ง)
      0, // ancestorId = 0 (เพื่อให้เป็น Main ID ของตัวมันเองเหมือนสมัครสมาชิกใหม่)
      mainId, // sponsorNodeId = mainId (ผู้แนะนำคือ mainId)
      1, // rank 1
      undefined, // rebornFromNodeId (ไม่ใช่โคลนนิ่ง)
      'excess_vault', // paymentSource (หักจากส่วนเกินแล้ว ไม่หักซ้ำ)
      mainId, // vaultSourceNodeId
      slot.reason || `จัดวาง New Main ID จากส่วนเกิน 40% Vault ของ #${mainId}`,
      'Vault New Main ID (ไอดีหลักใหม่จากส่วนเกิน 40%)'
    );

    const newMainNode = this.nodes.get(newMainNodeId);
    if (newMainNode) {
      newMainNode.originalAncestorId = newMainNodeId; // เป็นไอดีหลักของตัวเอง 100%
      newMainNode.rebirthCount = 0; // ไอดีหลักใหม่เริ่มที่ 0
      newMainNode.pendingRebirths = 0;
    }

    const r1Queue = this.rankQueues.get(1);
    if (r1Queue) {
      const qItem = r1Queue.find((q) => q.nodeId === newMainNodeId);
      if (qItem) {
        qItem.originalAncestorId = newMainNodeId;
        qItem.rebirthCount = 0;
        qItem.pendingRebirths = 0;
      }
    }

    const ownerWallet = this.wallets.get(mainNode.owner.toLowerCase());
    const rank1Meta = getRankInfo(1);
    const formulaDesc = summary.formulaText;

    this.addLog({
      type: 'REGISTER',
      title: `✨ Auto สมัคร New Main ID #${newMainNodeId} จากส่วนเกิน 40% Vault ของ #${mainId}`,
      description: `คำนวณจากสูตร: ${formulaDesc} = ยอดส่วนเกิน ${summary.excessVault.toFixed(2)} U. หัก ${REGISTRATION_FEE.toFixed(2)} USDT สมัครสมาชิกเปิดไอดีหลักใหม่ #${newMainNodeId} ในผังที่ 1 ต่อใต้ #${slot.parentId} (${slot.isLeft ? 'ซ้าย' : 'ขวา'}) สำเร็จ!`,
      nodeId: newMainNodeId,
      parentId: slot.parentId,
      amount: REGISTRATION_FEE,
      txHash: '0xautoregister_excess_vault_' + Date.now().toString(16),
      details: {
        mainId,
        newMainNodeId,
        isNewMainId: true,
        isRebirth: false,
        parentId: slot.parentId,
        isLeft: slot.isLeft,
        excessVaultBefore: summary.excessVault,
        excessVaultAfter: Math.max(0, summary.excessVault - REGISTRATION_FEE),
      },
    });

    this.emitNotification({
      type: 'REGISTRATION',
      title: `✨ Auto สมัคร New Main ID #${newMainNodeId} (จาก #${mainId})`,
      message: `ระบบ Auto สมัครสมาชิกเปิดไอดีหลักใหม่ (New Main ID) #${newMainNodeId} ในผังที่ 1 (${rank1Meta.title}) ต่อใต้ #${slot.parentId}`,
      nodeId: newMainNodeId,
      rank: 1,
      amount: REGISTRATION_FEE,
      walletName: ownerWallet?.name,
      walletAddress: mainNode.owner,
      details: {
        parentId: slot.parentId,
        isLeft: slot.isLeft,
        sponsorId: mainId,
        newRank: 1,
        vaultUsed: REGISTRATION_FEE,
      },
    });

    return newMainNodeId;
  }

  // 4. สั่งสร้างไอดีหลักใหม่ (New Main ID) ในผังที่ 1 ด้วยยอดส่วนเกิน 40% Upgrade Vault (5.00 USDT) [ไม่ใช่โคลนนิ่ง]
  executeMainIdRebirthFromExcessVault(mainId: number): number {
    return this.executeSingleMainIdRebirthFromExcessVault(mainId);
  }

  // 5. ตรวจสอบและสั่งเกิดใหม่อัตโนมัติจากยอดส่วนเกิน (Auto-trigger Check)
  checkAndAutoRebirthFromExcessVault(specificMainId?: number): number[] {
    if (!this.autoExcessVaultNewMainIdEnabled) return [];
    // 🌟 บุริมสิทธิ์: โคลนนิ่ง (Rebirth) ต้องทำงานก่อน New Main ID เสมอ!
    this.processAllPendingRebirthsPriority();

    const rebornNodeIds: number[] = [];
    const targets = specificMainId
      ? [specificMainId]
      : Array.from(this.nodes.values()).filter((n) => !n.isRebirth).map((n) => n.id);

    for (const mainId of targets) {
      let safetyCount = 0;
      while (safetyCount < 50) {
        const summary = this.getFamilyExcessRebirthVaultSummary(mainId);
        if (summary.excessVault >= REGISTRATION_FEE) {
          try {
            const newId = this.executeMainIdRebirthFromExcessVault(mainId);
            rebornNodeIds.push(newId);
            safetyCount++;
          } catch (err) {
            console.warn(`Rebirth from excess vault failed for main #${mainId}:`, err);
            break;
          }
        } else {
          break;
        }
      }
    }

    return rebornNodeIds;
  }

  // =========================================================================
  // --- สร้างไอดีหลักใหม่ (New Main ID) (จากส่วนเกิน 40% Vault ผัง 6 ถึง 45) [ไม่ใช่โคลนนิ่ง] ---
  // สูตรคำนวณ: (40% Vault ผัง6ถึงผัง45) − (40% Vault สะสมย้อนหลัง 5 ผัง) = ยอดส่วนเกิน
  // เงื่อนไข: ให้ไล่ผัง 45 ลงมาถึงผัง 2 ถ้า ยอดสะสมครบ มากกว่าเท่ากับ ราคาผังไหนลงทันที ไปต่อตัวเอง
  // สร้างเป็นไอดีหลักใหม่ (New Main ID) ไม่ใช่โคลนนิ่ง (isRebirth: false)
  // เงื่อนไขผลประโยชน์:
  // - 30% Direct Upline: ไอดีผู้สร้าง
  // - 30% Level Bonus (15 ชั้น): ไอดีผู้สร้าง
  // - 40% Upgrade Vault (เฉพาะรหัสนี้): ไอดีผู้สร้าง
  // =========================================================================

  // 1. คำนวณ 40% Vault ผัง 6 ถึง ผัง 45 รวมทุกรหัสในตระกูลไอดีหลักนี้
  getFamilyVaultRank6To45(nodeId: number): number {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    const mainId = (node.isRebirth && node.originalAncestorId)
      ? node.originalAncestorId
      : (node.isRebirth && node.rebornFromNodeId)
      ? node.rebornFromNodeId
      : node.id;

    const familyNodeIds = new Set<number>([mainId]);
    for (const n of this.nodes.values()) {
      if (
        n.id !== mainId &&
        n.isRebirth &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
      ) {
        familyNodeIds.add(n.id);
      }
    }

    let total = 0;
    for (let r = 6; r <= MAX_RANK; r++) {
      const q = this.rankQueues.get(r);
      if (q) {
        for (const qItem of q) {
          if (familyNodeIds.has(qItem.nodeId)) {
            total += (qItem.upgradeVault || 0);
          }
        }
      }
    }

    return Math.round(total * 100) / 100;
  }

  // 2. ดึงข้อมูลสรุปยอดส่วนเกิน 40% Vault (ผัง 6 ถึง 45) สำหรับสร้าง ID ใหม่
  getFamilyExcessVaultRank6To45Summary(nodeId: number): {
    mainId: number;
    mainRank: number;
    vaultRank6To45: number;
    reserved5RanksVault: number;
    excessVault: number;
    eligibleRanks: { rank: number; price: number; name: string }[];
    canCreateNewID: boolean;
  } {
    const node = this.nodes.get(nodeId);
    const mainId = node
      ? (node.isRebirth && node.originalAncestorId)
        ? node.originalAncestorId
        : (node.isRebirth && node.rebornFromNodeId)
        ? node.rebornFromNodeId
        : node.id
      : 1;

    const mainNode = this.nodes.get(mainId) || node;
    const mainRank = mainNode?.rank || 1;

    const vaultRank6To45 = this.getFamilyVaultRank6To45(mainId);
    // สูตรคำนวณ: (40% Vault ผัง6ถึงผัง45) − (40% Vault สะสมย้อนหลัง 5 ผัง) = ยอดส่วนเกิน
    // เมื่อไอดีอยู่ในผัง 6 ถึง 45 ยอดสะสมทั้งหมดในผัง 6 ถึง 45 ถือเป็นยอดส่วนเกินพร้อมสำหรับสร้าง New Member
    // โดยไล่ผัง 45 ลงมาถึงผัง 2 ถ้ายอดสะสมครบ >= ราคาผังไหนลงทันที ไปต่อตัวเอง
    const minActiveRank = Math.max(6, mainRank - 4);
    const reserved5RanksVault = mainRank >= 6 ? this.getFamilyVaultInRankRange(mainId, minActiveRank, mainRank) : 0;
    const excessVault = Math.max(0, Math.round((vaultRank6To45 - reserved5RanksVault) * 100) / 100);

    const eligibleRanks: { rank: number; price: number; name: string }[] = [];
    let tempExcess = excessVault;
    for (let r = MAX_RANK; r >= 2; r--) {
      const price = getRankPrice(r);
      if (tempExcess >= price) {
        eligibleRanks.push({ rank: r, price, name: getRankInfo(r).title });
        tempExcess = Math.round((tempExcess - price) * 100) / 100;
      }
    }

    return {
      mainId,
      mainRank,
      vaultRank6To45,
      reserved5RanksVault,
      excessVault,
      eligibleRanks,
      canCreateNewID: eligibleRanks.length > 0,
    };
  }

  // หักยอด Vault ส่วนเกินออกจากผัง 6 ถึง 45 โดยตรง
  deductFamilyExcessVaultRank6To45(mainId: number, amountToDeduct: number): number {
    const familyNodeIds = new Set<number>([mainId]);
    for (const n of this.nodes.values()) {
      if (
        n.id !== mainId &&
        n.isRebirth &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
      ) {
        familyNodeIds.add(n.id);
      }
    }

    let remaining = amountToDeduct;

    // ไล่หักจากคิวผัง 6 ถึง 45 (จากผัง 6 ขึ้นไป)
    for (let r = 6; r <= MAX_RANK; r++) {
      const q = this.rankQueues.get(r);
      if (q) {
        for (const qItem of q) {
          if (familyNodeIds.has(qItem.nodeId) && (qItem.upgradeVault || 0) > 0) {
            const take = Math.min(qItem.upgradeVault, remaining);
            qItem.upgradeVault = Math.round((qItem.upgradeVault - take) * 100) / 100;
            remaining = Math.round((remaining - take) * 100) / 100;
            if (remaining <= 0) break;
          }
        }
      }
      if (remaining <= 0) break;
    }

    // ซิงค์ยอดรวมกับกระเป๋าของเจ้าของ
    const creator = this.nodes.get(mainId);
    if (creator) {
      const ownerWallet = this.wallets.get(creator.owner.toLowerCase());
      if (ownerWallet) {
        ownerWallet.upgradeVault = this.getWalletUpgradeVault(creator.owner);
      }
    }

    return Math.round((amountToDeduct - remaining) * 100) / 100;
  }

  // คำนวณยอดรวมส่วนเกิน 40% Vault (ผัง 1 ถึง 5) ทั้งระบบ (ทุก Main ID)
  getTotalSystemExcessVaultRank1To5(): number {
    const mainNodes = Array.from(this.nodes.values()).filter((n) => !n.isRebirth);
    let total = 0;
    for (const mn of mainNodes) {
      const summary = this.getFamilyExcessRebirthVaultSummary(mn.id);
      total += summary.excessVault;
    }
    return Math.round(total * 100) / 100;
  }

  // คำนวณยอดรวมส่วนเกิน 40% Vault (ผัง 6 ถึง 45) ทั้งระบบ (ทุก Main ID)
  getTotalSystemExcessVaultRank6To45(): number {
    const mainNodes = Array.from(this.nodes.values()).filter((n) => !n.isRebirth);
    let total = 0;
    for (const mn of mainNodes) {
      const summary = this.getFamilyExcessVaultRank6To45Summary(mn.id);
      total += summary.excessVault;
    }
    return Math.round(total * 100) / 100;
  }

  // ดึงข้อมูลสรุป 3 กองกลางระบบครบถ้วน (3 Central Pools Summary)
  getThreeCentralPoolsSummary(nodeId: number = 1, targetRankPool1: number = 1) {
    const node = this.nodes.get(nodeId);
    const mainId = node
      ? (node.isRebirth && node.originalAncestorId)
        ? node.originalAncestorId
        : (node.isRebirth && node.rebornFromNodeId)
        ? node.rebornFromNodeId
        : node.id
      : 1;

    // กองที่ 1: Rebirth Pool สำหรับโคลนนิ่ง
    const safeRank = Math.max(1, Math.min(MAX_RANK, targetRankPool1 || 1));
    const rankPrice = getRankPrice(safeRank);
    const rank1Amount = this.rebirthPool;
    const pool1RankAmount = safeRank === 1 ? this.rebirthPool : (this.rankRebirthPool.get(safeRank) || 0);

    let pool1AllRanks = rank1Amount;
    for (let r = 2; r <= MAX_RANK; r++) {
      pool1AllRanks += (this.rankRebirthPool.get(r) || 0);
    }
    const pendingTotal = Array.from(this.nodes.values()).reduce((sum, n) => sum + (n.pendingRebirths || 0), 0);
    const mainPending = this.nodes.get(mainId)?.pendingRebirths || 0;
    const pendingInCurrentRank = safeRank === 1
      ? Array.from(this.nodes.values()).filter((n) => (n.pendingRebirths || 0) > 0).length
      : (this.rankQueues.get(safeRank) || []).filter((q) => (q.pendingRebirths || 0) > 0).length;

    // กองที่ 2: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 1 ถึง 5)
    const pool2Summary = this.getFamilyExcessRebirthVaultSummary(mainId);
    const pool2SystemTotal = this.getTotalSystemExcessVaultRank1To5();

    // กองที่ 3: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 6 ถึง 45)
    const pool3Summary = this.getFamilyExcessVaultRank6To45Summary(mainId);
    const pool3SystemTotal = this.getTotalSystemExcessVaultRank6To45();

    return {
      selectedMainId: mainId,
      pool1: {
        id: 1,
        title: 'กองที่ 1: Rebirth Pool สำหรับโคลนนิ่ง',
        amount: pool1RankAmount,
        rank1Amount,
        rankPrice,
        pendingInCurrentRank,
        amountAllRanks: Math.round(pool1AllRanks * 100) / 100,
        pendingTotal,
        mainPending,
        purpose: 'สำหรับคลอดรหัสโคลนนิ่ง (Rebirth Node) จาก 100% เม็ดขวา (5.00 USDT) จัดวางตามวัฏจักร 2 รอบ (รอบ 1 ช่วยผู้แนะนำ / รอบ 2 บอท BFS ช่วยชุมชนทั้งระบบ)',
      },
      pool2: {
        id: 2,
        title: 'กองที่ 2: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 1 ถึง 5)',
        excessVault: pool2Summary?.excessVault ?? 0,
        systemTotal: pool2SystemTotal ?? 0,
        canRegisterNewMainId: Boolean(pool2Summary?.canRegisterNewMainId),
        newMainIdCountPossible: pool2Summary?.newMainIdCountPossible ?? 0,
        formulaText: pool2Summary?.formulaText || '',
        vaultRank1To5: pool2Summary?.vaultRank1To5 ?? 0,
        reserved5RanksVault: pool2Summary?.reserved5RanksVault ?? 0,
        purpose: 'นำยอดส่วนเกินที่เหลือจากการสำรอง 5 ผัง มาสมัครเปิดเป็น New Main ID ในผัง 1 (5.00 USDT) [ไม่ใช่โคลนนิ่ง เป็นไอดีหลักใหม่]',
      },
      pool3: {
        id: 3,
        title: 'กองที่ 3: กองกลาง สร้างจากส่วนเกิน 40% Vault (ผัง 6 ถึง 45)',
        excessVault: pool3Summary?.excessVault ?? 0,
        systemTotal: pool3SystemTotal ?? 0,
        canCreateNewID: Boolean(pool3Summary?.canCreateNewID),
        eligibleRanks: pool3Summary?.eligibleRanks || [],
        vaultRank6To45: pool3Summary?.vaultRank6To45 ?? 0,
        reserved5RanksVault: pool3Summary?.reserved5RanksVault ?? 0,
        purpose: 'ระบบสแกนส่วนเกินจากผัง 45 ลงมาถึงผัง 2 เมื่อยอดส่วนเกินครบตามราคาผังใด จะเปิดรหัส New Member ในผังนั้นทันที ("ไปต่อตัวเอง")',
      },
    };
  }

  // สั่งสร้าง New Member 1 รหัส จากส่วนเกิน 40% Vault (ผัง 6 ถึง 45)
  executeSingleRankNewMainIDFromExcessVault(mainId: number): number {
    // 🌟 บุริมสิทธิ์: โคลนนิ่ง (Rebirth) ต้องทำงานก่อน New Main ID เสมอ!
    this.processAllPendingRebirthsPriority();

    const summary = this.getFamilyExcessVaultRank6To45Summary(mainId);
    if (!summary.canCreateNewID || summary.eligibleRanks.length === 0) {
      throw new Error(`ยอดส่วนเกิน 40% Vault (ผัง 6 ถึง 45) ไม่เพียงพอ`);
    }

    const target = summary.eligibleRanks[0];
    this.deductFamilyExcessVaultRank6To45(mainId, target.price);
    return this.executeRankNewMainIDFromExcessVault(mainId, target.rank, target.price);
  }

  // 3. สั่งสร้าง ID ใหม่ จากส่วนเกิน 40% Vault (ผัง 6 ถึง 45) โดยไล่จากผัง 45 ลงมาถึงผัง 2
  executeCreateIDFromExcessVault(mainId: number): number[] {
    // 🌟 บุริมสิทธิ์: โคลนนิ่ง (Rebirth) ต้องทำงานก่อน New Main ID เสมอ!
    this.processAllPendingRebirthsPriority();

    const summary = this.getFamilyExcessVaultRank6To45Summary(mainId);
    if (summary.excessVault <= 0 || summary.eligibleRanks.length === 0) {
      throw new Error(
        `ยอดส่วนเกิน 40% Vault (ผัง 6 ถึง 45) ไม่เพียงพอสำหรับสร้าง ID ใหม่ (ยอดส่วนเกิน: ${summary.excessVault.toFixed(2)} USDT / Vault ผัง 6-45: ${summary.vaultRank6To45.toFixed(2)} U / สำรอง 5 ผัง: ${summary.reserved5RanksVault.toFixed(2)} U)`
      );
    }

    const creatorNode = this.nodes.get(mainId);
    if (!creatorNode) {
      throw new Error(`ไม่พบไอดีผู้สร้าง #${mainId}`);
    }

    const createdNodeIds: number[] = [];
    let remainingExcess = summary.excessVault;

    // ไล่ผัง 45 ลงมาถึงผัง 2
    for (let r = MAX_RANK; r >= 2; r--) {
      const price = getRankPrice(r);
      while (remainingExcess >= price) {
        // หักยอดราคาผังจาก Vault ผัง 6 ถึง 45
        this.deductFamilyExcessVaultRank6To45(mainId, price);
        remainingExcess = Math.round((remainingExcess - price) * 100) / 100;

        // สร้างไอดีหลักใหม่ (New Main ID) ใน Rank r [ไม่ใช่โคลนนิ่ง]
        const newId = this.executeRankNewMainIDFromExcessVault(mainId, r, price);
        createdNodeIds.push(newId);
      }
    }

    return createdNodeIds;
  }

  // Helper สำหรับสร้างไอดีหลักใหม่ (New Main ID) ใน Rank queue [ไม่ใช่โคลนนิ่ง]
  private executeRankNewMainIDFromExcessVault(mainId: number, targetRank: number, rankPrice: number): number {
    const creatorNode = this.nodes.get(mainId);
    if (!creatorNode) throw new Error(`Creator node #${mainId} not found`);

    const ownerAddress = creatorNode.owner.toLowerCase();
    const wallet = this.wallets.get(ownerAddress);

    const newId = this.generateNextNodeId();

    // สร้าง MatrixNode สำหรับไอดีหลักใหม่ (New Main ID) - ไม่ใช่โคลนนิ่ง (isRebirth = false)
    const newMainNode: MatrixNode = {
      id: newId,
      owner: ownerAddress,
      parentId: 0,
      leftChild: 0,
      rightChild: 0,
      depth: 1,
      createdAt: Date.now(),
      rank: targetRank,
      rebirthCount: 0,
      pendingRebirths: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      upgradeVault: 0,
      originalAncestorId: newId, // ไอดีหลักของตัวเอง 100% (ไม่ใช่โคลนนิ่ง)
      rebornFromNodeId: undefined, // ไม่ใช่รหัสเกิดใหม่ (ไม่ใช่โคลนนิ่ง)
      isRebirth: false, // เป็นไอดีหลักใหม่ (New Main ID) ไม่ใช่โคลนนิ่ง
      isFromVault: true, // ไอดีที่เกิดจากการสมัครจากยอด 40% (ส่วนเกินผัง 6-45) -> กรอบสีเหลืองเข้ม
      paymentSource: 'excess_vault',
      sponsorNodeId: mainId, // 30% Direct Upline: ไอดีผู้สร้าง
    };
    this.nodes.set(newId, newMainNode);
    if (wallet) wallet.nodeIds.push(newId);

    // เข้าสู่คิวประจำ Rank targetRank (ไปต่อตัวเอง under mainId) - isRebirth = false (ไม่ใช่โคลนนิ่ง)
    const qNode = this.enterRankQueue(targetRank, newId, ownerAddress, false);

    const rankMeta = getRankInfo(targetRank);
    const directBonus = Math.round(rankPrice * 0.30 * 100) / 100;
    const levelBonusTotal = Math.round(rankPrice * 0.30 * 100) / 100;
    const vaultShare = Math.round(rankPrice * 0.40 * 100) / 100;

    // หมายเหตุ: enterRankQueue ได้จัดสรรรายได้ตามระบบ 100% Math (Direct 30%, Level 30%, Vault 40%) ให้แก่ผู้มีสิทธิ์อย่างถูกต้องครบถ้วนแล้ว
    if (wallet) {
      wallet.upgradeVault = this.getWalletUpgradeVault(ownerAddress);
    }

    this.addLog({
      type: 'REGISTER',
      title: `✨ สร้าง New Memberจากส่วนเกิน 40% Vault #${newId} ใน Rank ${targetRank} (${rankMeta.title})`,
      description: `สร้าง New Memberจากส่วนเกิน 40% Vault #${newId} (ไม่ใช่โคลนนิ่ง) ใน Rank ${targetRank} ต่อใต้ #${qNode.parentNodeId || mainId} (${rankPrice} USDT) สำเร็จ`,
      nodeId: newId,
      parentId: qNode.parentNodeId || mainId,
      amount: rankPrice,
      txHash: '0xexcess_vault_new_main_id_' + Date.now().toString(16),
      details: {
        creatorMainId: mainId,
        newId,
        rank: targetRank,
        rankPrice,
        isNewMainId: true,
        isRebirth: false,
        directBonusToCreator: directBonus,
        levelBonusToCreator: levelBonusTotal,
        vaultShareToCreator: vaultShare,
      },
    });

    this.emitNotification({
      type: 'REGISTRATION',
      title: `✨ สร้าง New Memberจากส่วนเกิน 40% Vault #${newId} (ผัง ${targetRank})`,
      message: `สร้าง New Memberจากส่วนเกิน 40% Vault #${newId} (ไม่ใช่โคลนนิ่ง) ในผังที่ ${targetRank} (${rankMeta.title}) ต่อตัวเอง (#${mainId}) [จ่าย Direct 30%, Level 30%, Vault 40% ให้ไอดีผู้สร้าง #${mainId}]`,
      nodeId: newId,
      rank: targetRank,
      amount: rankPrice,
      walletName: wallet?.name,
      walletAddress: ownerAddress,
      details: {
        parentId: qNode.parentNodeId || mainId,
        isLeft: qNode.isLeft,
        sponsorId: mainId,
        newRank: targetRank,
        vaultUsed: rankPrice,
      },
    });

    return newId;
  }

  // เติมยอด 40% Vault จำลองในผัง 6 ถึง 45 เพื่อทดสอบระบบ
  addTestVaultToRank6To45(mainId: number, targetRank: number = 6, amount: number = 100): void {
    const mainNode = this.nodes.get(mainId);
    if (!mainNode) throw new Error(`ไม่พบไอดีหลัก #${mainId}`);

    const effRank = Math.max(6, Math.min(MAX_RANK, targetRank));
    let q = this.rankQueues.get(effRank);
    if (!q) {
      q = [];
      this.rankQueues.set(effRank, q);
    }

    let qItem = q.find((item) => item.nodeId === mainId);
    if (!qItem) {
      const qNum = q.length + 1;
      const parentQ = Math.floor(qNum / 2);
      const isLeft = qNum % 2 === 0;
      qItem = {
        queueNumber: qNum,
        nodeId: mainId,
        owner: mainNode.owner.toLowerCase(),
        rank: effRank,
        parentQueueNumber: parentQ,
        parentNodeId: mainId,
        leftChildQueueNumber: 0,
        rightChildQueueNumber: 0,
        isLeft,
        upgradeVault: 0,
        totalDirectEarned: 0,
        totalLevelEarned: 0,
        rebirthCount: 0,
        pendingRebirths: 0,
        enteredAt: Date.now(),
        originalAncestorId: mainId,
      };
      q.push(qItem);
    }

    qItem.upgradeVault = Math.round((qItem.upgradeVault + amount) * 100) / 100;
    const ownerWallet = this.wallets.get(mainNode.owner.toLowerCase());
    if (ownerWallet) {
      ownerWallet.upgradeVault = this.getWalletUpgradeVault(mainNode.owner);
    }

    this.addLog({
      type: 'UPGRADE_VAULT',
      title: `⚡ เติมยอดทดสอบ 40% Vault ผัง ${effRank}: +${amount.toFixed(2)} USDT ให้ไอดี #${mainId}`,
      description: `เพิ่มยอดทดสอบ 40% Upgrade Vault ผัง ${effRank} (${getRankInfo(effRank).title}) จำนวน ${amount.toFixed(2)} USDT เพื่อทดสอบระบบการสร้าง New Member จากส่วนเกิน 40% Vault (ผัง 6 ถึง 45)`,
      nodeId: mainId,
      amount,
      txHash: '0xtest_vault_rank6_' + Date.now().toString(16),
    });
  }

  // 4. บอทสแกนระบบสำหรับสร้าง ID ใหม่จากส่วนเกิน 40% Vault อัตโนมัติ
  checkAndAutoCreateIDFromExcessVault(specificMainId?: number): number[] {
    if (!this.autoExcessVaultNewMainIdEnabled) return [];
    // 🌟 บุริมสิทธิ์: โคลนนิ่ง (Rebirth) ต้องทำงานก่อน New Main ID เสมอ!
    this.processAllPendingRebirthsPriority();

    const createdNodeIds: number[] = [];
    const targets = specificMainId
      ? [specificMainId]
      : Array.from(this.nodes.values()).filter((n) => !n.isRebirth).map((n) => n.id);

    for (const mainId of targets) {
      try {
        let safetyCount = 0;
        while (safetyCount < 50) {
          const summary = this.getFamilyExcessVaultRank6To45Summary(mainId);
          if (summary.canCreateNewID) {
            const ids = this.executeCreateIDFromExcessVault(mainId);
            createdNodeIds.push(...ids);
            safetyCount++;
          } else {
            break;
          }
        }
      } catch (err) {
        console.warn(`Auto create ID from excess vault failed for main #${mainId}:`, err);
      }
    }

    return createdNodeIds;
  }

  // ดึงยอดสะสม Upgrade Vault (40% เม็ดซ้าย) ทั้งหมดที่เป็นกระเป๋าเดียวกัน (รวม Rank 1 Base Nodes และ Rank Queues 2-45)
  getWalletUpgradeVault(walletAddress: string): number {
    const addr = walletAddress.toLowerCase();
    let total = 0;
    // 1. Base Nodes (Rank 1)
    for (const node of this.nodes.values()) {
      if (node.owner.toLowerCase() === addr) {
        total += (node.upgradeVault || 0);
      }
    }
    // 2. Rank Queues (Ranks 2 ถึง 45)
    for (let r = 2; r <= MAX_RANK; r++) {
      const q = this.rankQueues.get(r);
      if (q) {
        for (const qItem of q) {
          if (qItem.owner.toLowerCase() === addr) {
            total += (qItem.upgradeVault || 0);
          }
        }
      }
    }
    return Math.round(total * 100) / 100;
  }

  // หักเงินจาก Upgrade Vault ของรหัสในกระเป๋าเดียวกัน (รองรับทั้งระบุ preferredNodeId หรือหักจากทุกโหนดของกระเป๋า)
  deductWalletUpgradeVault(
    ownerAddress: string,
    amountToDeduct: number,
    preferredNodeId?: number
  ): number {
    const addr = ownerAddress.toLowerCase();
    let remaining = amountToDeduct;

    // 1. หากระบุ preferredNodeId ให้หักจาก Node นั้น / ครอบครัว Node นั้นก่อน
    if (preferredNodeId && preferredNodeId > 0 && this.nodes.has(preferredNodeId)) {
      const taken = this.deductNodeFamilyUpgradeVault(preferredNodeId, remaining);
      remaining = Math.round((remaining - taken) * 100) / 100;
    }

    // 2. หากยังเหลือ ให้ไล่หักจากทุกโหนดที่เป็นของกระเป๋านี้ใน Base Nodes (Rank 1)
    if (remaining > 0) {
      for (const node of this.nodes.values()) {
        if (node.owner.toLowerCase() === addr && (node.upgradeVault || 0) > 0) {
          const take = Math.min(node.upgradeVault, remaining);
          node.upgradeVault = Math.round((node.upgradeVault - take) * 100) / 100;
          remaining = Math.round((remaining - take) * 100) / 100;
          if (remaining <= 0) break;
        }
      }
    }

    // 3. หากยังเหลือ ให้ไล่หักจาก Rank Queues (Rank 2 ถึง 45)
    if (remaining > 0) {
      for (let r = 2; r <= MAX_RANK; r++) {
        const q = this.rankQueues.get(r);
        if (q) {
          for (const qItem of q) {
            if (qItem.owner.toLowerCase() === addr && (qItem.upgradeVault || 0) > 0) {
              const take = Math.min(qItem.upgradeVault, remaining);
              qItem.upgradeVault = Math.round((qItem.upgradeVault - take) * 100) / 100;
              remaining = Math.round((remaining - take) * 100) / 100;
              if (remaining <= 0) break;
            }
          }
        }
        if (remaining <= 0) break;
      }
    }

    // ซิงค์ยอดกับกระเป๋า
    const ownerWallet = this.wallets.get(addr);
    if (ownerWallet) {
      ownerWallet.upgradeVault = this.getWalletUpgradeVault(addr);
    }

    return Math.round((amountToDeduct - remaining) * 100) / 100;
  }

  // Check and automatically promote rank if upgradeVault has enough balance (ดึงทั้งหมดที่เป็น iD เดียวกัน + ไอดีเกิดใหม่)
  checkAndAutoUpgradeRank(nodeId: number): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // เงื่อนไขสำคัญ: Rank 2 - 45 เฉพาะไอดีหลักเท่านั้น ถึงจะมีสิทธิ์อัพได้
    if (node.isRebirth) {
      // หากเป็นไอดีเกิดใหม่ ไม่ให้อัพเกรด แต่ให้ตรวจสอบและส่งเสริมไอดีหลัก (rootId) แทน
      const rootId = (node.originalAncestorId && node.originalAncestorId > 0) ? node.originalAncestorId : 0;
      if (rootId && rootId !== nodeId) {
        return this.checkAndAutoUpgradeRank(rootId);
      }
      return false;
    }

    let promoted = false;

    while (node.rank < MAX_RANK) {
      const nextRank = node.rank + 1;
      const nextRankCost = getRankPrice(nextRank);
      const totalFamilyVault = this.getNodeFamilyUpgradeVault(node.id, nextRank);

      if (totalFamilyVault >= nextRankCost) {
        this.deductNodeFamilyUpgradeVault(node.id, nextRankCost, nextRank);
        const oldRank = node.rank;
        node.rank = nextRank;
        promoted = true;

        const rankMeta = getRankInfo(nextRank);
        this.addLog({
          type: 'RANK_UPGRADE',
          title: `Auto-Upgrade Success: Main ID #${node.id} -> ${rankMeta.name}`,
          description: `Upgrade Vault (ดึงรวม iD เดียวกัน + ไอดีเกิดใหม่ ย้อนหลัง 5 ผัง) ครบ ${nextRankCost} USDT. ไอดีหลักเลื่อนขั้นจาก Rank ${oldRank} เป็น Rank ${nextRank} (${rankMeta.title}) อัตโนมัติ!`,
          nodeId: node.id,
          amount: nextRankCost,
          txHash: '0xautoupgrade...' + Math.random().toString(16).substring(2, 8),
          details: { oldRank, newRank: nextRank, cost: nextRankCost, remainingVault: this.getNodeFamilyUpgradeVault(node.id, nextRank) },
        });

        const nodeWallet = this.wallets.get(node.owner.toLowerCase());
        this.emitNotification({
          type: 'UPGRADE',
          title: `🚀 Auto-Upgrade Success! (รหัส #${node.id})`,
          message: `ยอด Upgrade Vault ของรหัสหลัก #${node.id} (${nodeWallet?.name || 'Wallet'}) สะสมครบตามเกณฑ์ ${nextRankCost.toLocaleString()} USDT! ระบบทำการเลื่อนขั้นสู่ ผังที่ ${nextRank} (${rankMeta.title}) ให้อัตโนมัติเรียบร้อยแล้ว`,
          nodeId: node.id,
          rank: nextRank,
          amount: nextRankCost,
          walletName: nodeWallet?.name,
          walletAddress: node.owner,
          details: { oldRank, newRank: nextRank, vaultUsed: nextRankCost },
        });

        // Automatically enter next rank's 1-to-2 Queue Matrix

        this.enterRankQueue(nextRank, node.id, node.owner, true);
      } else {
        break;
      }
    }

    return promoted;
  }

  // Manual Upgrade from Upgrade Vault (ดึงทั้งหมดที่เป็น iD เดียวกัน รวมถึงไอดีเกิดใหม่ ย้อนหลัง 5 ผัง)
  upgradeNodeRank(nodeId: number): boolean {
    if (this.isPaused) {
      throw new Error('ระบบถูกระงับชั่วคราวโดยผู้ดูแลระบบ (Contract is Paused by Admin)');
    }
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node #${nodeId} does not exist`);

    // เงื่อนไข: Rank 2 - 45 เฉพาะไอดีหลักเท่านั้น ถึงจะมีสิทธิ์อัพได้
    if (node.isRebirth) {
      const rootId = (node.originalAncestorId && node.originalAncestorId > 0) ? node.originalAncestorId : 0;
      throw new Error(`รหัส #${nodeId} เป็นไอดีเกิดใหม่ (Rebirth ID) — เงื่อนไขของระบบระบุว่า Rank 2 - ${MAX_RANK} เฉพาะไอดีหลักเท่านั้น (#${rootId}) ถึงจะมีสิทธิ์อัพเกรดได้`);
    }

    if (node.rank >= MAX_RANK) throw new Error(`Node #${nodeId} is already at MAX Rank ${MAX_RANK}`);

    const nextRank = node.rank + 1;
    const cost = getRankPrice(nextRank);
    const totalFamilyVault = this.getNodeFamilyUpgradeVault(node.id, nextRank);

    if (totalFamilyVault < cost) {
      throw new Error(`Insufficient Upgrade Vault: requires ${cost} USDT (Available in same ID & rebirth: ${totalFamilyVault.toFixed(2)} USDT)`);
    }

    this.deductNodeFamilyUpgradeVault(node.id, cost, nextRank);
    const oldRank = node.rank;
    node.rank = nextRank;
    const rankMeta = getRankInfo(nextRank);

    this.addLog({
      type: 'RANK_UPGRADE',
      title: `Rank Upgraded: Main ID #${node.id} -> ${rankMeta.name}`,
      description: `ดึง ${cost} USDT จาก Upgrade Vault (รวม iD เดียวกัน + ไอดีโคลนนิ่ง ย้อนหลัง 5 ผัง). เลื่อนขั้นนิวไอดี (หลัก) เป็น Rank ${nextRank} (${rankMeta.title})!`,
      nodeId: node.id,
      amount: cost,
      txHash: '0xrank_upgrade...' + Math.random().toString(16).substring(2, 8),
      details: { oldRank, newRank: nextRank, cost, remainingVault: this.getNodeFamilyUpgradeVault(node.id, nextRank) },
    });

    const upWallet = this.wallets.get(node.owner.toLowerCase());
    this.emitNotification({
      type: 'UPGRADE',
      title: `⭐ เลื่อนขั้นสำเร็จ (Rank Upgraded #${node.id})`,
      message: `รหัสหลัก #${node.id} (${upWallet?.name || 'Wallet'}) เลื่อนขั้นสู่ ผัง ${nextRank} (${rankMeta.title}) โดยใช้ Upgrade Vault ${cost.toLocaleString()} USDT`,
      nodeId: node.id,
      rank: nextRank,
      amount: cost,
      walletName: upWallet?.name,
      walletAddress: node.owner,
      details: { oldRank, newRank: nextRank, vaultUsed: cost },
    });

    // Enter next rank's Queue Matrix
    this.enterRankQueue(nextRank, node.id, node.owner, false);

    return true;
  }

  // Fast-track upgrade by combining Upgrade Vault with wallet balance top-up (ดึงทั้งหมดที่เป็น iD เดียวกัน + ไอดีเกิดใหม่ ย้อนหลัง 5 ผัง)
  upgradeNodeRankWithTopup(nodeId: number, walletAddress: string): boolean {
    if (this.isPaused) {
      throw new Error('ระบบถูกระงับชั่วคราวโดยผู้ดูแลระบบ (Contract is Paused by Admin)');
    }
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node #${nodeId} does not exist`);

    // เงื่อนไข: Rank 2 - 45 เฉพาะนิวไอดี (หลัก) เท่านั้น ถึงจะมีสิทธิ์อัพได้
    if (node.isRebirth) {
      const rootId = (node.originalAncestorId && node.originalAncestorId > 0) ? node.originalAncestorId : 0;
      throw new Error(`รหัส #${nodeId} เป็นรหัสโคลนนิ่ง (Cloning ID) — เงื่อนไขของระบบระบุว่า Rank 2 - ${MAX_RANK} เฉพาะนิวไอดี (หลัก) เท่านั้น (#${rootId}) ถึงจะมีสิทธิ์อัพเกรดได้`);
    }

    if (node.rank >= MAX_RANK) throw new Error(`Node #${nodeId} is already at MAX Rank ${MAX_RANK}`);

    const wallet = this.wallets.get(walletAddress.toLowerCase());
    if (!wallet) throw new Error(`Wallet not found`);

    const nextRank = node.rank + 1;
    const cost = getRankPrice(nextRank);

    // ดึงยอดสะสม Upgrade Vault ทั้งหมดที่เป็น iD เดียวกัน รวมถึงไอดีโคลนนิ่ง ย้อนหลัง 5 ผัง
    const totalFamilyVault = this.getNodeFamilyUpgradeVault(node.id, nextRank);
    const vaultUsable = Math.min(totalFamilyVault, cost);
    const deficit = Math.round((cost - vaultUsable) * 100) / 100;

    if (wallet.balance < deficit) {
      throw new Error(`Insufficient wallet balance. Top-up deficit requires ${deficit.toFixed(2)} USDT (Wallet has: ${wallet.balance.toFixed(2)} USDT)`);
    }

    if (deficit > 0) {
      wallet.balance = Math.round((wallet.balance - deficit) * 100) / 100;
    }
    if (vaultUsable > 0) {
      this.deductNodeFamilyUpgradeVault(node.id, vaultUsable, nextRank);
    }

    const oldRank = node.rank;
    node.rank = nextRank;
    const rankMeta = getRankInfo(nextRank);

    this.addLog({
      type: 'RANK_UPGRADE',
      title: `Fast-Track Upgrade: Node #${node.id} -> ${rankMeta.name}`,
      description: `ดึง ${vaultUsable.toFixed(2)} USDT จาก Upgrade Vault (รวม iD เดียวกัน + ไอดีโคลนนิ่ง ย้อนหลัง 5 ผัง) + เติมเงิน ${deficit.toFixed(2)} USDT. เลื่อนขั้นเป็น Rank ${nextRank} (${rankMeta.title})!`,
      nodeId: node.id,
      amount: cost,
      txHash: '0xtopup_upgrade...' + Math.random().toString(16).substring(2, 8),
      details: { oldRank, newRank: nextRank, cost, vaultUsed: vaultUsable, topupPaid: deficit },
    });

    this.emitNotification({
      type: 'UPGRADE',
      title: `⭐ เติมเงินอัพเกรดด่วนสำเร็จ (Fast-Track #${node.id})`,
      message: `รหัสหลัก #${node.id} (${wallet.name}) เลื่อนขั้นสู่ ผัง ${nextRank} (${rankMeta.title}) [ใช้ Vault ${vaultUsable.toFixed(2)} U + เติมเงิน ${deficit.toFixed(2)} U]`,
      nodeId: node.id,
      rank: nextRank,
      amount: cost,
      walletName: wallet.name,
      walletAddress: walletAddress,
      details: { oldRank, newRank: nextRank, vaultUsed: vaultUsable, walletPaid: deficit },
    });

    // Enter next rank's Queue Matrix
    this.enterRankQueue(nextRank, node.id, node.owner, false);

    return true;
  }

  // Purchase / Upgrade to a specific Rank (Rank 1 to 45) using 40% Left-Leg Vault (combining Main ID + all Rebirth IDs up to 5 preceding ranks) + Wallet USDT
  purchaseRank(
    targetRank: number,
    nodeId?: number,
    walletAddress?: string
  ): { success: boolean; vaultUsed: number; walletPaid: number; newRank: number; targetRank: number; nodeId: number } {
    if (this.isPaused) {
      throw new Error('ระบบถูกระงับชั่วคราวโดยผู้ดูแลระบบ (Contract is Paused by Admin)');
    }
    const safeRank = Math.max(1, Math.min(MAX_RANK, targetRank));
    const cost = getRankPrice(safeRank);

    // 1. Resolve Target Node & Main ID
    let targetNode: MatrixNode | undefined;
    if (nodeId && this.nodes.has(nodeId)) {
      targetNode = this.nodes.get(nodeId);
    } else if (walletAddress) {
      const wallet = this.wallets.get(walletAddress.toLowerCase());
      if (wallet && wallet.nodeIds.length > 0) {
        for (const nId of wallet.nodeIds) {
          const n = this.nodes.get(nId);
          if (n && !n.isRebirth) {
            targetNode = n;
            break;
          }
        }
        if (!targetNode && wallet.nodeIds.length > 0) {
          targetNode = this.nodes.get(wallet.nodeIds[0]);
        }
      }
    }

    const ownerAddr = (walletAddress || (targetNode ? targetNode.owner : INITIAL_WALLETS[0].address)).toLowerCase();
    const wallet = this.wallets.get(ownerAddr);
    if (!wallet) {
      throw new Error('ไม่พบข้อมูลกระเป๋าเงินสำหรับชำระค่าผัง');
    }

    // Special Case: Rank 1 Registration / Purchase (5.0 USDT)
    if (safeRank === 1) {
      if (wallet.balance < cost) {
        throw new Error(
          `ยอดเงิน USDT ในกระเป๋าไม่เพียงพอสำหรับสมัคร/ซื้อผังที่ 1 (${cost} USDT): ในกระเป๋ามี ${wallet.balance.toFixed(2)} USDT`
        );
      }
      const sponsorId = targetNode ? targetNode.id : 1;
      const slot = this.findSlotForSponsor(sponsorId);
      if (!slot) {
        throw new Error('ไม่พบตำแหน่งว่างในผังต้นไม้ Rank 1');
      }

      wallet.balance = Math.round((wallet.balance - cost) * 100) / 100;
      const newNodeId = this.register(wallet.address, slot.parentId, slot.isLeft, false, 0, sponsorId, 1);

      const rankMeta = getRankInfo(1);
      this.addLog({
        type: 'REGISTER',
        title: `💎 ซื้อ/เปิดรหัสใหม่ในผังที่ 1: Node #${newNodeId} (${rankMeta.name})`,
        description: `เปิดรหัสใหม่ในผังที่ 1 (${cost} USDT) สำเร็จ ต่อใต้ Node #${slot.parentId} (${slot.isLeft ? 'ซ้าย' : 'ขวา'})`,
        nodeId: newNodeId,
        amount: cost,
        txHash: '0xreg_rank1_' + Date.now().toString(16),
        details: { rank: 1, cost, nodeId: newNodeId, parentId: slot.parentId, isLeft: slot.isLeft },
      });

      this.emitNotification({
        type: 'REGISTRATION',
        title: `⭐ ซื้อและเปิดรหัสใหม่ในผังที่ 1 สำเร็จ`,
        message: `เปิดรหัส #${newNodeId} (${wallet.name}) ในผังที่ 1 (${rankMeta.title}) [5.00 USDT]`,
        nodeId: newNodeId,
        rank: 1,
        amount: cost,
        walletName: wallet.name,
        walletAddress: wallet.address,
      });

      return {
        success: true,
        vaultUsed: 0,
        walletPaid: cost,
        newRank: 1,
        targetRank: 1,
        nodeId: newNodeId,
      };
    }

    if (!targetNode) {
      throw new Error('ไม่พบรหัสสมาชิกสำหรับดำเนินการซื้อผัง (กรุณาลงทะเบียนรหัสก่อน)');
    }

    // Resolve Main ID (Rank 2-45 is for Main ID only, all Rebirth IDs pool Vault into Main ID)
    const mainId = (targetNode.isRebirth && targetNode.originalAncestorId)
      ? targetNode.originalAncestorId
      : (targetNode.isRebirth && targetNode.rebornFromNodeId)
      ? targetNode.rebornFromNodeId
      : targetNode.id;

    const mainNode = this.nodes.get(mainId) || targetNode;
    const rankMeta = getRankInfo(safeRank);

    // 🔍 Smart Contract / Core Engine Check: ตรวจสอบว่า ID ที่เลือก (targetNode) มีรายชื่ออยู่ในผังที่เลือก (Rank 2–45) หรือยังก่อนทำรายการเสมอ
    if (safeRank >= 2) {
      // 1. ตรวจสอบเงื่อนไขซื้อทีละผังห้ามข้าม (Sequential Rank Upgrade Check)
      const requiredPreviousRank = safeRank - 1;
      const prevQueue = this.rankQueues.get(requiredPreviousRank) || [];
      const prevRankQueueNodes = this.getRankQueue(requiredPreviousRank);

      const hasReachedPrevRank =
        requiredPreviousRank === 1 ||
        targetNode.rank >= requiredPreviousRank ||
        prevQueue.some(
          (q) =>
            q.nodeId === targetNode.id ||
            q.originalAncestorId === targetNode.id
        ) ||
        prevRankQueueNodes.some(
          (rn) =>
            rn.nodeId === targetNode.id ||
            rn.originalAncestorId === targetNode.id
        );

      if (!hasReachedPrevRank) {
        throw new Error(
          `⚠️ [Smart Contract Validation] ต้องซื้อผังเรียงตามลำดับทีละผังเท่านั้น ห้ามซื้อข้ามผัง! รหัส #${targetNode.id} ปัจจุบันอยู่ที่ผังที่ ${targetNode.rank} กรุณาซื้อผังที่ ${requiredPreviousRank} ให้เรียบร้อยก่อน`
        );
      }

      // 2. ตรวจสอบว่า ID นี้อยู่ในผังที่เลือกอยู่แล้วหรือไม่ (Duplicate Check)
      const queue = this.rankQueues.get(safeRank) || [];
      const rankQueueNodes = this.getRankQueue(safeRank);

      const isAlreadyInRank =
        targetNode.rank >= safeRank ||
        queue.some(
          (q) =>
            q.nodeId === targetNode.id ||
            q.originalAncestorId === targetNode.id
        ) ||
        rankQueueNodes.some(
          (rn) =>
            rn.nodeId === targetNode.id ||
            rn.originalAncestorId === targetNode.id
        );

      if (isAlreadyInRank) {
        throw new Error(
          `⚠️ [Smart Contract Validation] ID #${targetNode.id} (${wallet.name}) มีรายชื่ออยู่ในผังที่ ${safeRank} (${rankMeta.title}) เรียบร้อยแล้ว ไม่สามารถสั่งซื้อผังเดิมซ้ำได้!`
        );
      }
    }

    // 2. Calculate 40% Upgrade Vault (ดึงรวม Vault ไอดีหลัก + ไอดีเกิดใหม่ทั้งหมด ย้อนหลัง 5 ผัง)
    const totalFamilyVault = this.getNodeFamilyUpgradeVault(mainNode.id, safeRank);
    const vaultUsable = Math.min(totalFamilyVault, cost);
    const deficit = Math.round((cost - vaultUsable) * 100) / 100;

    if (wallet.balance < deficit) {
      throw new Error(
        `ยอดเงิน USDT ในกระเป๋าไม่เพียงพอสำหรับซื้อผังที่ ${safeRank} (${cost.toLocaleString()} USDT): ดึง 40% Vault เม็ดซ้าย (รวมไอดีหลัก+เกิดใหม่ ย้อนหลัง 5 ผัง) ได้ ${vaultUsable.toLocaleString()} USDT, ยังขาดอีก ${deficit.toLocaleString()} USDT (กระเป๋ามี ${wallet.balance.toLocaleString()} USDT)`
      );
    }

    // 3. Deduct funds
    if (deficit > 0) {
      wallet.balance = Math.round((wallet.balance - deficit) * 100) / 100;
    }
    if (vaultUsable > 0) {
      this.deductNodeFamilyUpgradeVault(mainNode.id, vaultUsable, safeRank);
    }

    // 4. Update Node rank
    const oldRank = targetNode.rank;
    targetNode.rank = Math.max(targetNode.rank, safeRank);
    if (mainNode.id !== targetNode.id) {
      mainNode.rank = Math.max(mainNode.rank, safeRank);
    }

    this.addLog({
      type: 'RANK_UPGRADE',
      title: `💎 ซื้อผังที่ ${safeRank}: รหัส #${targetNode.id} ➔ ${rankMeta.name}`,
      description: `ซื้อผังที่ ${safeRank} (${rankMeta.title} - ${cost.toLocaleString()} USDT): ใช้ 40% Vault เม็ดซ้าย (รวมไอดีหลัก+เกิดใหม่ ย้อนหลัง 5 ผัง) ${vaultUsable.toLocaleString()} USDT + จ่ายเพิ่มจากกระเป๋า ${deficit.toLocaleString()} USDT`,
      nodeId: targetNode.id,
      amount: cost,
      txHash: '0xbuy_rank_' + safeRank + '_' + Date.now().toString(16),
      details: { oldRank, newRank: targetNode.rank, targetRank: safeRank, cost, vaultUsed: vaultUsable, walletPaid: deficit },
    });

    this.emitNotification({
      type: 'UPGRADE',
      title: `⭐ ซื้อและเปิดผังที่ ${safeRank} สำเร็จ (${rankMeta.name})`,
      message: `รหัส #${targetNode.id} (${wallet.name}) ปลดล็อคเข้าสู่ ผัง ${safeRank} (${rankMeta.title}) [ใช้ Vault ${vaultUsable.toLocaleString()} U + ชำระ ${deficit.toLocaleString()} U]`,
      nodeId: targetNode.id,
      rank: safeRank,
      amount: cost,
      walletName: wallet.name,
      walletAddress: targetNode.owner,
      details: { oldRank, newRank: targetNode.rank, vaultUsed: vaultUsable, walletPaid: deficit },
    });

    // 5. Enter Rank Queue Matrix
    this.enterRankQueue(safeRank, targetNode.id, targetNode.owner, false);

    return {
      success: true,
      vaultUsed: vaultUsable,
      walletPaid: deficit,
      newRank: targetNode.rank,
      targetRank: safeRank,
      nodeId: targetNode.id,
    };
  }

  // Get Vault & Cost summary for buying a target rank
  getRankVaultSummary(targetRank: number, nodeId?: number, walletAddress?: string) {
    const safeRank = Math.max(1, Math.min(MAX_RANK, targetRank));
    const cost = getRankPrice(safeRank);

    if (safeRank === 1) {
      return {
        targetRank: 1,
        cost: 5.0,
        totalFamilyVault: 0,
        vaultUsable: 0,
        deficit: 5.0,
        canAfford: true,
        isEligibleMain: true,
        mainId: nodeId || 1,
      };
    }

    let targetNode: MatrixNode | undefined;
    if (nodeId && this.nodes.has(nodeId)) {
      targetNode = this.nodes.get(nodeId);
    } else if (walletAddress) {
      const wallet = this.wallets.get(walletAddress.toLowerCase());
      if (wallet && wallet.nodeIds.length > 0) {
        for (const nId of wallet.nodeIds) {
          const n = this.nodes.get(nId);
          if (n && !n.isRebirth) {
            targetNode = n;
            break;
          }
        }
        if (!targetNode && wallet.nodeIds.length > 0) {
          targetNode = this.nodes.get(wallet.nodeIds[0]);
        }
      }
    }

    const mainId = targetNode
      ? (targetNode.isRebirth && targetNode.originalAncestorId)
        ? targetNode.originalAncestorId
        : (targetNode.isRebirth && targetNode.rebornFromNodeId)
        ? targetNode.rebornFromNodeId
        : targetNode.id
      : (nodeId || 1);

    const mainNode = targetNode ? (this.nodes.get(mainId) || targetNode) : undefined;
    const ownerAddr = (walletAddress || mainNode?.owner || '').toLowerCase();
    const wallet = this.wallets.get(ownerAddr);

    const familyVault = mainNode ? this.getNodeFamilyUpgradeVault(mainNode.id, safeRank) : 0;
    const vaultUsable = Math.min(familyVault, cost);
    const deficit = Math.max(0, Math.round((cost - vaultUsable) * 100) / 100);
    const walletBalance = wallet ? wallet.balance : 0;
    const canAfford = walletBalance >= deficit;
    const queue = this.getRankQueue(safeRank);
    const isAlreadyInQueue = mainNode
      ? mainNode.rank >= safeRank ||
        queue.some(
          (q) =>
            q.nodeId === mainNode.id ||
            q.originalAncestorId === mainNode.id ||
            (q.owner.toLowerCase() === mainNode.owner.toLowerCase() && !q.isRebirth)
        )
      : false;
    const currentQueueItem = mainNode ? queue.find((q) => q.nodeId === mainNode.id) : undefined;

    return {
      targetRank: safeRank,
      cost,
      mainNodeId: mainNode?.id || mainId,
      mainNodeRank: mainNode?.rank || 1,
      familyVault,
      vaultUsable,
      deficit,
      walletBalance,
      canAfford,
      isAlreadyInQueue,
      currentQueueNumber: currentQueueItem?.queueNumber,
    };
  }

  // Auto determine the next eligible rank and financial preview
  getNextEligibleRankSummary(nodeId?: number, walletAddress?: string) {
    let targetNode: MatrixNode | undefined;
    if (nodeId && this.nodes.has(nodeId)) {
      targetNode = this.nodes.get(nodeId);
    } else if (walletAddress) {
      const wallet = this.wallets.get(walletAddress.toLowerCase());
      if (wallet && wallet.nodeIds.length > 0) {
        for (const nId of wallet.nodeIds) {
          const n = this.nodes.get(nId);
          if (n && !n.isRebirth) {
            targetNode = n;
            break;
          }
        }
        if (!targetNode && wallet.nodeIds.length > 0) {
          targetNode = this.nodes.get(wallet.nodeIds[0]);
        }
      }
    }

    if (!targetNode) {
      return null;
    }

    const mainId = (targetNode.isRebirth && targetNode.originalAncestorId)
      ? targetNode.originalAncestorId
      : (targetNode.isRebirth && targetNode.rebornFromNodeId)
      ? targetNode.rebornFromNodeId
      : targetNode.id;
    const mainNode = this.nodes.get(mainId) || targetNode;
    const ownerAddr = (walletAddress || mainNode.owner).toLowerCase();
    const wallet = this.wallets.get(ownerAddr);

    // Determine highest rank reached across rank queues and node rank
    let highestRank = Math.max(1, mainNode.rank || 1);
    for (let r = 2; r <= MAX_RANK; r++) {
      const q = this.getRankQueue(r);
      if (q.some((item) => item.nodeId === mainNode.id || item.originalAncestorId === mainNode.id)) {
        highestRank = Math.max(highestRank, r);
      }
    }

    const nextRank = highestRank < MAX_RANK ? highestRank + 1 : null;
    if (!nextRank) {
      return {
        mainNodeId: mainNode.id,
        currentRank: mainNode.rank || 1,
        highestRank,
        nextRank: null,
        nextRankMeta: null,
        cost: 0,
        familyVault: 0,
        vaultUsable: 0,
        deficit: 0,
        canAfford: false,
        walletBalance: wallet?.balance || 0,
        missingBalance: 0,
        affordableChain: [],
      };
    }

    const nextRankMeta = getRankInfo(nextRank);
    const cost = getRankPrice(nextRank);
    const familyVault = this.getNodeFamilyUpgradeVault(mainNode.id, nextRank);
    const vaultUsable = Math.min(familyVault, cost);
    const deficit = Math.max(0, Math.round((cost - vaultUsable) * 100) / 100);
    const walletBalance = wallet ? wallet.balance : 0;
    const canAfford = walletBalance >= deficit;
    const missingBalance = Math.max(0, Math.round((deficit - walletBalance) * 100) / 100);

    // Calculate affordable continuous chain
    const affordableChain: { rank: number; cost: number; vaultUsed: number; walletPaid: number; title: string }[] = [];
    let tempBal = walletBalance;
    for (let r = nextRank; r <= MAX_RANK; r++) {
      const rPrice = getRankPrice(r);
      const rVault = this.getNodeFamilyUpgradeVault(mainNode.id, r);
      const rVaultUsed = Math.min(rVault, rPrice);
      const rDeficit = Math.max(0, Math.round((rPrice - rVaultUsed) * 100) / 100);
      if (tempBal >= rDeficit) {
        affordableChain.push({
          rank: r,
          cost: rPrice,
          vaultUsed: rVaultUsed,
          walletPaid: rDeficit,
          title: getRankInfo(r).title,
        });
        tempBal = Math.round((tempBal - rDeficit) * 100) / 100;
      } else {
        break;
      }
    }

    return {
      mainNodeId: mainNode.id,
      currentRank: mainNode.rank || 1,
      highestRank,
      nextRank,
      nextRankMeta,
      cost,
      familyVault,
      vaultUsable,
      deficit,
      canAfford,
      walletBalance,
      missingBalance,
      affordableChain,
    };
  }

  // Auto purchase the next eligible rank
  purchaseNextRank(nodeId?: number, walletAddress?: string) {
    const analysis = this.getNextEligibleRankSummary(nodeId, walletAddress);
    if (!analysis) {
      throw new Error('ไม่พบข้อมูลรหัสสมาชิกสำหรับตรวจสอบผังถัดไป');
    }
    if (!analysis.nextRank) {
      throw new Error('รหัสนี้ได้ปลดล็อคถึงผังสูงสุด (Rank 45) ครบถ้วนแล้ว');
    }
    return this.purchaseRank(analysis.nextRank, analysis.mainNodeId, walletAddress);
  }

  // Auto purchase multiple consecutive next ranks that are affordable
  purchaseNextRanksBatch(maxSteps: number = 45, nodeId?: number, walletAddress?: string) {
    const results: any[] = [];
    let count = 0;
    while (count < maxSteps) {
      const analysis = this.getNextEligibleRankSummary(nodeId, walletAddress);
      if (!analysis || !analysis.nextRank || !analysis.canAfford) {
        break;
      }
      const res = this.purchaseRank(analysis.nextRank, analysis.mainNodeId, walletAddress);
      results.push(res);
      count++;
    }
    return results;
  }

  // Add balance to wallet (e.g. Test Faucet / Deposit)
  fundWallet(address: string, amount: number): number {
    const addr = address.toLowerCase();
    let wallet = this.wallets.get(addr);
    if (!wallet) {
      wallet = {
        address: addr,
        name: `Wallet ${addr.slice(0, 6)}...${addr.slice(-4)}`,
        nodeIds: [],
        balance: 0,
        totalEarned: 0,
        rebirthCount: 0,
        pendingRebirths: 0,
        upgradeVault: 0,
      };
      this.wallets.set(addr, wallet);
    }
    wallet.balance = Math.round((wallet.balance + amount) * 100) / 100;
    this.addLog({
      type: 'ADMIN_ACTION',
      title: `💰 เติมเงินเข้ากระเป๋า: +${amount.toLocaleString()} USDT`,
      description: `เติมยอดเงินเข้า ${wallet.name} สำเร็จ (ยอดคงเหลือใหม่: ${wallet.balance.toLocaleString()} USDT)`,
      amount,
      txHash: '0xfund_' + Date.now().toString(16),
      details: { address: addr, addedAmount: amount, newBalance: wallet.balance },
    });
    return wallet.balance;
  }

  // Batch upgrade eligible nodes (ดึงทั้งหมดที่เป็น iD เดียวกัน + ไอดีเกิดใหม่)
  batchUpgradeRanks(nodeIds: number[]): number[] {
    const upgraded: number[] = [];
    for (const nId of nodeIds) {
      const node = this.nodes.get(nId);
      // เงื่อนไข: Rank 2 - 45 เฉพาะไอดีหลักเท่านั้น ถึงจะมีสิทธิ์อัพได้
      if (!node || node.rank >= MAX_RANK || node.isRebirth) continue;
      const nextRank = node.rank + 1;
      const cost = getRankPrice(nextRank);
      const totalFamilyVault = this.getNodeFamilyUpgradeVault(node.id, nextRank);
      if (totalFamilyVault >= cost) {
        this.deductNodeFamilyUpgradeVault(node.id, cost, nextRank);
        const oldRank = node.rank;
        node.rank = nextRank;
        upgraded.push(nId);
        const rankMeta = getRankInfo(nextRank);
        this.addLog({
          type: 'RANK_UPGRADE',
          title: `Batch Upgraded Main ID #${node.id} -> ${rankMeta.name}`,
          description: `ดึง ${cost} USDT จาก Upgrade Vault (รวม iD เดียวกัน + ไอดีเกิดใหม่ ย้อนหลัง 5 ผัง) เลื่อนขั้นไอดีหลักสู่ Rank ${nextRank} (${rankMeta.title})!`,
          nodeId: node.id,
          amount: cost,
          txHash: '0xbatch_rank_up...' + Math.random().toString(16).substring(2, 8),
          details: { oldRank, newRank: nextRank, cost, isAuto: false },
        });
        const batchWallet = this.wallets.get(node.owner.toLowerCase());
        this.emitNotification({
          type: 'UPGRADE',
          title: `⭐ เลื่อนขั้นชุดสำเร็จ (Batch Upgrade #${node.id})`,
          message: `รหัสหลัก #${node.id} (${batchWallet?.name || 'Wallet'}) เลื่อนขั้นสู่ ผัง ${nextRank} (${rankMeta.title})`,
          nodeId: node.id,
          rank: nextRank,
          amount: cost,
          walletName: batchWallet?.name,
          walletAddress: node.owner,
          details: { oldRank, newRank: nextRank, vaultUsed: cost },
        });
        this.enterRankQueue(nextRank, node.id, node.owner, false);

      }
    }
    return upgraded;
  }

  // Handle Right Child (Downline #2) Rebirth Trigger
  // 100% (5.0 USDT) goes to rebirthPool
  // Parent status changes to pending rebirth (rebirthCount += 1, pendingRebirths += 1)
  private handleRightChildRebirth(parentId: number) {
    this.rebirthPool += REGISTRATION_FEE;
    this.rankRebirthPool.set(1, this.rebirthPool);
    const parent = this.nodes.get(parentId)!;
    parent.rebirthCount = (parent.rebirthCount || 0) + 1;
    parent.pendingRebirths = (parent.pendingRebirths || 0) + 1;

    const targetRank = 1;
    const qList = this.rankQueues.get(targetRank) || [];
    const qItem = qList.find((q) => q.nodeId === parentId);
    if (qItem) {
      qItem.rebirthCount = (qItem.rebirthCount || 0) + 1;
      qItem.pendingRebirths = (qItem.pendingRebirths || 0) + 1;
    }

    const wallet = this.wallets.get(parent.owner.toLowerCase());
    if (wallet) {
      wallet.rebirthCount = (wallet.rebirthCount || 0) + 1;
      wallet.pendingRebirths = this.getWalletPendingRebirths(parent.owner);
    }

    this.addLog({
      type: 'REBIRTH_TRIGGER',
      title: `Right Child Filled -> Rebirth Queued for Node #${parentId}`,
      description: `5.0 USDT added to Rebirth Pool (Total: ${this.rebirthPool.toFixed(2)} USDT). Node #${parentId} marked pending rebirth (Pending: ${parent.pendingRebirths}).`,
      nodeId: parentId,
      amount: REGISTRATION_FEE,
      txHash: '0xrebirth_queue...' + Math.random().toString(16).substring(2, 8),
    });

    // ระบบ Auto Rebirth อัตโนมัติ (พร้อมระบบหน่วงเวลา)
    if (this.autoRebirthEnabled || this.autoExcessVaultNewMainIdEnabled) {
      this.scheduleAutoActions(parentId);
    }
  }

  // Execute Rebirth via Off-chain Scanner / Bot logic
  executeRebirth(nodeId: number, targetParentId?: number, targetIsLeft?: boolean, rank?: number): number {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node #${nodeId} does not exist`);

    // If a specific rank >= 2 is passed
    if (rank !== undefined && rank >= 2) {
      return this.executeRankRebirth(rank, nodeId, targetParentId, targetIsLeft);
    }

    // If rank is undefined, scan higher ranks ONLY if that higher rank queue item actually has pendingRebirths > 0
    if (rank === undefined) {
      for (let r = MAX_RANK; r >= 2; r--) {
        const q = this.rankQueues.get(r);
        if (!q) continue;
        const qItem = q.find((item) => item.nodeId === nodeId && item.pendingRebirths > 0);
        const pool = this.getRankRebirthPool(r);
        const price = getRankPrice(r);
        if (qItem && qItem.pendingRebirths > 0 && pool >= price) {
          return this.executeRankRebirth(r, nodeId, targetParentId, targetIsLeft);
        }
      }
    }

    // Check pending count for Rank 1
    const pendingCount = node.pendingRebirths || 0;
    if (pendingCount <= 0) {
      throw new Error(`รหัส #${nodeId} ยังไม่มีคิวโคลนนิ่งค้างอยู่ (ต้องมีลูกขาขวาครบ 100% 5.00 USDT ก่อน)`);
    }

    if (this.rebirthPool < REGISTRATION_FEE) {
      throw new Error(`กองกลาง Rebirth Rank 1 ไม่เพียงพอ (มี ${this.rebirthPool.toFixed(1)} USDT, ต้องการ ${REGISTRATION_FEE} USDT)`);
    }

    let pId = targetParentId;
    let isLeft = targetIsLeft;
    let placementReason = '';

    // If keeper scanner didn't provide target, run auto-finder
    if (pId === undefined || isLeft === undefined) {
      const slot = this.findRebirthSlot(nodeId);
      if (!slot) throw new Error(`ไม่พบตำแหน่งว่างในผังสำหรับโคลนนิ่ง`);
      pId = slot.parentId;
      isLeft = slot.isLeft;
      placementReason = slot.reason || '';
    } else {
      const slot = this.findRebirthSlot(nodeId);
      placementReason = slot?.reason || `ระบุตำแหน่งวาง (Parent #${pId} ${isLeft ? 'ขาซ้าย' : 'ขาขวา'})`;
    }

    // Decrement pending rebirths and consume from pool
    node.pendingRebirths = Math.max(0, (node.pendingRebirths || 0) - 1);
    this.rebirthPool = Math.max(0, Math.round((this.rebirthPool - REGISTRATION_FEE) * 100) / 100);
    this.rankRebirthPool.set(1, this.rebirthPool);

    const r1List = this.rankQueues.get(1) || [];
    const r1Item = r1List.find((q) => q.nodeId === nodeId && q.pendingRebirths > 0) || r1List.find((q) => q.nodeId === nodeId);
    if (r1Item && r1Item.pendingRebirths > 0) {
      r1Item.pendingRebirths -= 1;
    }

    const wallet = this.wallets.get(node.owner.toLowerCase());
    if (wallet) {
      wallet.pendingRebirths = this.getWalletPendingRebirths(node.owner);
    }

    // Direct Upline ของรหัสโคลนนิ่ง:
    // ดึงจากผู้แนะนำตรงของ id หลัก (เช่น ไอดี #2 Alice มี Direct Upline คือ ไอดี #1)
    const mainId = node.originalAncestorId || nodeId;
    const effectiveSponsorId = this.getNodeDirectUplineId(nodeId);
    const newNodeId = this.register(
      node.owner,
      pId,
      isLeft,
      true,
      mainId,
      effectiveSponsorId,
      1,
      mainId,
      'wallet',
      undefined,
      placementReason,
      'Rebirth (ระบบโคลนนิ่งอัตโนมัติ)'
    );

    return newNodeId;
  }

  // Execute Rebirth specifically for Rank 2-45 to ensure rebirth in that exact rank
  executeRankRebirth(rank: number, nodeId: number, targetParentId?: number, targetIsLeft?: boolean, queueNumber?: number): number {
    const safeRank = Math.max(1, Math.min(MAX_RANK, rank));
    if (safeRank === 1) {
      return this.executeRebirth(nodeId, targetParentId, targetIsLeft, 1);
    }

    const rankPrice = getRankPrice(safeRank);
    const currentRankPool = this.getRankRebirthPool(safeRank);

    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node #${nodeId} does not exist`);

    const queue = this.rankQueues.get(safeRank) || [];
    let qItem: RankQueueNode | undefined;
    if (queueNumber !== undefined) {
      qItem = queue.find((q) => q.queueNumber === queueNumber);
    }
    if (!qItem) {
      qItem = queue.find((q) => q.nodeId === nodeId && q.pendingRebirths > 0) || queue.find((q) => q.nodeId === nodeId);
    }

    const hasQueuePending = Boolean(qItem && qItem.pendingRebirths > 0);

    if (!hasQueuePending) {
      throw new Error(`Node #${nodeId} ไม่มีสิทธิ์รอโคลนนิ่งใน Rank ${safeRank}`);
    }

    if (currentRankPool < rankPrice && this.rebirthPool < rankPrice) {
      throw new Error(`กองกลาง Rebirth Rank ${safeRank} ไม่เพียงพอ (มี ${currentRankPool.toFixed(1)} USDT, ต้องการ ${rankPrice.toFixed(1)} USDT)`);
    }

    // Consume from Rank Rebirth pool
    if (currentRankPool >= rankPrice) {
      this.rankRebirthPool.set(safeRank, Math.round((currentRankPool - rankPrice) * 100) / 100);
    } else {
      this.rebirthPool = Math.max(0, Math.round((this.rebirthPool - rankPrice) * 100) / 100);
    }

    // Decrement pending rebirth count
    if (qItem && qItem.pendingRebirths > 0) qItem.pendingRebirths -= 1;
    if (node.pendingRebirths > 0) node.pendingRebirths -= 1;

    const wallet = this.wallets.get(node.owner.toLowerCase());
    if (wallet && wallet.pendingRebirths && wallet.pendingRebirths > 0) {
      wallet.pendingRebirths -= 1;
    }

    const mainId = node.originalAncestorId || nodeId;
    const ancestorNode = this.nodes.get(mainId);
    const effectiveSponsorId = ancestorNode?.sponsorNodeId || this.getWalletDefaultSponsorNodeId(node.owner);

    // Rank 2-45 Rebirth: Placement follows the 1 แตก 2 Global Binary Queue for this Rank
    // Next open slot in the binary heap: newQueueNumber = queue.length + 1
    const newId = this.generateNextNodeId();
    const nextQueueNum = queue.length + 1;
    const parentQueueNum = Math.floor(nextQueueNum / 2);
    const parentQItem = parentQueueNum > 0 ? queue[parentQueueNum - 1] : undefined;
    const parentNodeId = parentQItem ? parentQItem.nodeId : nodeId;

    const rebornNode: MatrixNode = {
      id: newId,
      owner: node.owner.toLowerCase(),
      parentId: parentNodeId,
      leftChild: 0,
      rightChild: 0,
      depth: (parentQItem ? (this.nodes.get(parentQItem.nodeId)?.depth || 1) : (node.depth || 1)) + 1,
      createdAt: Date.now(),
      rank: safeRank, // โคลนนิ่งตาม Rank นั้น!
      rebirthCount: 0,
      pendingRebirths: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      upgradeVault: 0,
      originalAncestorId: mainId,
      rebornFromNodeId: nodeId,
      isRebirth: true,
      sponsorNodeId: effectiveSponsorId,
      createdVia: 'Rank Rebirth (ระบบโคลนนิ่งคิวสะสม)',
    };
    this.nodes.set(newId, rebornNode);
    if (wallet) wallet.nodeIds.push(newId);

    // Join the Rank safeRank Global Queue directly!
    const qNode = this.enterRankQueue(safeRank, newId, node.owner, true);
    rebornNode.parentId = qNode.parentNodeId;

    const rankMeta = getRankInfo(safeRank);
    this.addLog({
      type: 'REBIRTH_EXECUTED',
      title: `🔄 โคลนนิ่งตาม Rank ${safeRank} (${rankMeta.title}): รหัส #${newId} เข้าสู่คิว #${qNode.queueNumber}`,
      description: `รหัส #${nodeId} (นิวไอดี (หลัก) #${mainId}) โคลนนิ่งตาม Rank ${safeRank} สำเร็จ! ใช้กองกลาง Rebirth Rank ${safeRank} (${rankPrice} USDT) เข้าสู่คิวที่ #${qNode.queueNumber} ของ Rank ${safeRank} (อยู่ใต้คิว #${qNode.parentQueueNumber} ${qNode.isLeft ? 'ฝั่งซ้าย' : 'ฝั่งขวา'}) พร้อมส่งมอบ Vault 40% ให้นิวไอดี (หลัก) #${mainId}`,
      nodeId: newId,
      parentId: parentNodeId,
      amount: rankPrice,
      txHash: '0xrank_rebirth_' + safeRank + '_' + Math.random().toString(16).substring(2, 8),
      details: {
        rank: safeRank,
        queueNumber: qNode.queueNumber,
        mainId,
        rebornNodeId: newId,
        parentQueueNumber: qNode.parentQueueNumber,
        isLeft: qNode.isLeft,
      },
    });

    this.emitNotification({
      type: 'REBIRTH',
      title: `🌱 รหัสโคลนนิ่ง Rank ${safeRank} (${rankMeta.title})`,
      message: `รหัส #${nodeId} (นิวไอดี (หลัก) #${mainId}) โคลนนิ่งในผัง Rank ${safeRank} เข้าสู่คิวที่ #${qNode.queueNumber} (ใต้คิว #${qNode.parentQueueNumber} ${qNode.isLeft ? 'ขาซ้าย' : 'ขาขวา'})`,
      nodeId: newId,
      rank: safeRank,
      amount: rankPrice,
      walletName: wallet?.name,
      walletAddress: node.owner,
      details: {
        parentId: parentNodeId,
        isLeft: qNode.isLeft,
        rebornFromNodeId: mainId,
        newRank: safeRank,
      },
    });

    return newId;

  }

  // Batch Register (Simulate single contract batch transaction)
  batchRegister(
    ownerAddress: string,
    count: number,
    sponsorId: number = 1,
    paymentSource: RegistrationPaymentSource = 'wallet',
    rank: number = 1
  ): number[] {
    const wallet = this.wallets.get(ownerAddress.toLowerCase());
    if (!wallet) throw new Error(`Wallet not found`);
    const rankPrice = getRankPrice(rank);
    const totalCost = count * rankPrice;
    const availableVault = this.getWalletUpgradeVault(ownerAddress);

    if (paymentSource === 'vault') {
      if (availableVault < totalCost) {
        throw new Error(
          `ยอด Upgrade Vault ไม่พอสำหรับสมัครแบบชุด (${count} รหัส = ${totalCost} USDT, ใน Vault มี ${availableVault.toFixed(2)} USDT)`
        );
      }
    } else if (paymentSource === 'wallet') {
      if (wallet.balance < totalCost) {
        throw new Error(
          `ยอดเงินในกระเป๋าไม่พอสำหรับสมัครแบบชุด (${count} รหัส = ${totalCost} USDT, ในกระเป๋ามี ${wallet.balance.toFixed(2)} USDT)`
        );
      }
    } else {
      if ((availableVault + wallet.balance) < totalCost) {
        throw new Error(
          `ยอดเงินรวมไม่พอสำหรับสมัครแบบชุด (${count} รหัส = ${totalCost} USDT, กระเป๋า ${wallet.balance.toFixed(2)} + Upgrade Vault ${availableVault.toFixed(2)} = รวม ${(wallet.balance + availableVault).toFixed(2)} USDT)`
        );
      }
    }

    const createdIds: number[] = [];
    for (let i = 0; i < count; i++) {
      const slot = this.findSlotForSponsor(sponsorId, rank);
      if (!slot) break;
      const id = this.register(
        ownerAddress,
        slot.parentId,
        slot.isLeft,
        false,
        0,
        sponsorId,
        rank,
        undefined,
        paymentSource,
        undefined,
        undefined,
        'Batch Registration (สมัครแบบกลุ่ม)'
      );
      createdIds.push(id);
    }

    const paymentLabel = paymentSource === 'vault'
      ? 'ชำระด้วย Upgrade Vault 100%'
      : paymentSource === 'wallet'
      ? 'ชำระด้วยกระเป๋าเงิน USDT (ตัดกระเป๋าเป็นอันดับแรก)'
      : 'ชำระแบบอัตโนมัติ (ตัดเงินกระเป๋าก่อน + เสริม Vault)';

    this.addLog({
      type: 'BATCH_REGISTER',
      title: `Batch Register Executed (${createdIds.length} Nodes Rank ${rank})`,
      description: `สร้างรหัสชุด ${createdIds.length} รหัส [${createdIds.join(', ')}] ในผัง Rank ${rank} 1 ธุรกรรม (${paymentLabel}).`,
      amount: createdIds.length * rankPrice,
      txHash: '0xbatch_reg...' + Math.random().toString(16).substring(2, 8),
    });

    return createdIds;
  }

  // Batch Execute All Pending Rebirths (Keeper Bot action)
  batchExecuteAllRebirths(): number[] {
    const createdIds: number[] = [];

    // 1. Process Rank 1 pending rebirths
    const nodesArray = Array.from(this.nodes.values());
    for (const node of nodesArray) {
      const spawnedCount = this.getNodeRebornIds(node.id).length;
      let effectivePending = Math.max(node.pendingRebirths || 0, node.rebirthCount - spawnedCount);
      while (effectivePending > 0 && this.rebirthPool >= REGISTRATION_FEE) {
        try {
          const newId = this.executeRebirth(node.id, undefined, undefined, 1);
          createdIds.push(newId);
          effectivePending--;
        } catch (err) {
          console.warn(`Could not execute Rank 1 rebirth for node #${node.id}:`, err);
          break;
        }
      }
    }

    // 2. Process Rank 2 to MAX_RANK pending rebirths
    for (let r = 2; r <= MAX_RANK; r++) {
      const q = this.rankQueues.get(r);
      if (!q || q.length === 0) continue;
      const rankPrice = getRankPrice(r);

      for (const item of q) {
        while (item.pendingRebirths > 0 && (this.getRankRebirthPool(r) >= rankPrice || this.rebirthPool >= rankPrice)) {
          try {
            const newId = this.executeRankRebirth(r, item.nodeId, undefined, undefined, item.queueNumber);
            createdIds.push(newId);
          } catch (err) {
            console.warn(`Could not execute Rank ${r} rebirth for node #${item.nodeId}:`, err);
            break;
          }
        }
      }
    }

    if (createdIds.length > 0) {
      this.addLog({
        type: 'BATCH_REBIRTH',
        title: `Keeper Bot Executed Batch Rebirth (${createdIds.length} Placements)`,
        description: `Off-chain bot auto-scanned and executed batch rebirth transaction across ranks.`,
        amount: createdIds.length * REGISTRATION_FEE,
        txHash: '0xkeeper_batch...' + Math.random().toString(16).substring(2, 8),
      });
    }

    return createdIds;
  }

  getPendingRebirthsList(): MatrixNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.pendingRebirths > 0);
  }

  // ==========================================
  // RANK QUEUE 1-TO-2 MATRIX METHODS
  // ==========================================

  getRankQueue(rank: number): RankQueueNode[] {
    const safeRank = Math.max(1, Math.min(MAX_RANK, rank));
    return this.rankQueues.get(safeRank) || [];
  }

  getRankRebirthPool(rank: number): number {
    const safeRank = Math.max(1, Math.min(MAX_RANK, rank));
    return this.rankRebirthPool.get(safeRank) || 0;
  }

  getRankQueueCount(rank: number): number {
    return this.getRankQueue(rank).length;
  }

  // แปลงข้อมูลสมาชิกในผังประจำ Rank (1-45) ให้อยู่ในโครงสร้าง MatrixNode 1 แตก 2 สำหรับแสดงในผังต้นไม้
  getMatrixTreeNodes(rank: number): MatrixNode[] {
    const safeRank = Math.max(1, Math.min(MAX_RANK, rank));
    const queue = this.getRankQueue(safeRank);
    if (!queue || queue.length === 0) {
      return [];
    }

    // คำนวณ Depth ลำดับชั้นแบบถูกต้องตาม Parent-Child Relationship
    const depthMap = new Map<number, number>();
    queue.forEach((item) => {
      if (item.parentQueueNumber <= 0) {
        depthMap.set(item.queueNumber, 1);
      } else {
        const parentDepth = depthMap.get(item.parentQueueNumber) || 1;
        depthMap.set(item.queueNumber, parentDepth + 1);
      }
    });

    return queue.map((item) => {
      const parentItem = item.parentQueueNumber > 0 ? queue[item.parentQueueNumber - 1] : undefined;
      const leftItem = item.leftChildQueueNumber > 0 ? queue[item.leftChildQueueNumber - 1] : undefined;
      const rightItem = item.rightChildQueueNumber > 0 ? queue[item.rightChildQueueNumber - 1] : undefined;
      const depth = depthMap.get(item.queueNumber) || 1;

      const baseNode = this.nodes.get(item.nodeId);
      // ข้อมูล Direct Upline ไม่ต้องเปลี่ยน: ดึงจากผู้แนะนำตรงเดิม (sponsorNodeId) ของรหัสนั้นเสมอ
      const effectiveSponsorId = item.sponsorNodeId || baseNode?.sponsorNodeId || this.getNodeDirectUplineId(item.nodeId);

      const node: MatrixNode = {
        id: item.nodeId,
        owner: item.owner,
        parentId: parentItem ? parentItem.nodeId : (item.parentNodeId || 0),
        leftChild: leftItem ? leftItem.nodeId : 0,
        rightChild: rightItem ? rightItem.nodeId : 0,
        depth: depth,
        createdAt: item.enteredAt || Date.now(),
        rank: safeRank,
        rebirthCount: item.rebirthCount || 0,
        pendingRebirths: item.pendingRebirths || 0,
        totalDirectEarned: item.totalDirectEarned || 0,
        totalLevelEarned: item.totalLevelEarned || 0,
        upgradeVault: item.upgradeVault || 0,
        originalAncestorId: item.originalAncestorId || item.nodeId,
        rebornFromNodeId: item.rebornFromNodeId,
        isRebirth: item.isRebirth,
        isFromVault: baseNode?.isFromVault,
        paymentSource: baseNode?.paymentSource,
        sponsorNodeId: effectiveSponsorId, // Direct Upline คงเดิม ไม่เปลี่ยน
        firstSponsor: baseNode?.firstSponsor,
        queueNumber: item.queueNumber, // Global Node ID ประจำผังนี้
      };
      return node;
    });
  }

  // ค้นหาตำแหน่งการจัดวางโหนดสำหรับผัง 2-45 ตาม Placement Rules
  private findSlotInRankQueue(
    queue: RankQueueNode[],
    effectiveSponsorId: number
  ): { parentItem: RankQueueNode; isLeft: boolean } | null {
    if (queue.length === 0) return null;

    const sponsorNode = this.nodes.get(effectiveSponsorId);
    const sponsorOwner = sponsorNode ? sponsorNode.owner.toLowerCase() : '';

    // 1. ถ้ามีผู้แนะนำตรงอยู่ในผัง (Check if direct sponsor exists in rank queue)
    // 1.1 หาโหนดหลักของผู้แนะนำตรงในคิวผังนี้
    const primarySponsorItem = queue.find(
      (q) => q.nodeId === effectiveSponsorId
    );

    // 1.2 หาโหนดเกิดใหม่ทั้งหมดของผู้แนะนำตรงในคิวผังนี้
    const rebirthSponsorItems = queue.filter(
      (q) =>
        q.isRebirth &&
        (q.originalAncestorId === effectiveSponsorId ||
          q.rebornFromNodeId === effectiveSponsorId)
    );

    const allSponsorItems = primarySponsorItem
      ? [primarySponsorItem, ...rebirthSponsorItems.filter((r) => r.queueNumber !== primarySponsorItem.queueNumber)]
      : rebirthSponsorItems;

    if (allSponsorItems.length > 0) {
      // 🎯 1.1 ต่อติดตัวผู้แนะนำตรง (Direct Sponsor Priority): หากผู้แนะนำยังมีตำแหน่งติดตัวว่าง
      for (const item of allSponsorItems) {
        if (item.leftChildQueueNumber === 0) {
          return { parentItem: item, isLeft: true };
        }
        if (item.rightChildQueueNumber === 0) {
          return { parentItem: item, isLeft: false };
        }
      }

      // 🌐 1.2 สแกนลึกตามสายงานใต้โหนดผู้แนะนำ (BFS Spillover Search)
      const bfsQueue = [...allSponsorItems];
      const visited = new Set<number>();

      while (bfsQueue.length > 0) {
        const curr = bfsQueue.shift()!;
        if (visited.has(curr.queueNumber)) continue;
        visited.add(curr.queueNumber);

        if (curr.leftChildQueueNumber === 0) {
          return { parentItem: curr, isLeft: true };
        }
        if (curr.rightChildQueueNumber === 0) {
          return { parentItem: curr, isLeft: false };
        }

        if (curr.leftChildQueueNumber > 0) {
          const lChild = queue[curr.leftChildQueueNumber - 1];
          if (lChild) bfsQueue.push(lChild);
        }
        if (curr.rightChildQueueNumber > 0) {
          const rChild = queue[curr.rightChildQueueNumber - 1];
          if (rChild) bfsQueue.push(rChild);
        }
      }
    }

    // 2. ถ้าไม่มีผู้แนะนำตรงอยู่ในผัง (หรือใต้ผู้แนะนำเต็มหมดแล้ว):
    // สแกนผังรวมจากบนลงล่าง ซ้ายไปขวา (Global Matrix BFS)
    for (const item of queue) {
      if (item.leftChildQueueNumber === 0) {
        return { parentItem: item, isLeft: true };
      }
      if (item.rightChildQueueNumber === 0) {
        return { parentItem: item, isLeft: false };
      }
    }

    const lastItem = queue[queue.length - 1];
    return { parentItem: lastItem, isLeft: true };
  }

  enterRankQueue(
    rank: number,
    nodeId: number,
    ownerAddress: string,
    isAuto: boolean = false
  ): RankQueueNode {
    const safeRank = Math.max(1, Math.min(MAX_RANK, rank));
    if (!this.rankQueues.has(safeRank)) {
      this.rankQueues.set(safeRank, []);
    }
    const queue = this.rankQueues.get(safeRank)!;
    const newQueueNumber = queue.length + 1;
    const rankPrice = getRankPrice(safeRank);

    const existingNode = this.nodes.get(nodeId);
    const isRebirthNode = existingNode?.isRebirth || false;
    const rebornFromNodeId = existingNode?.rebornFromNodeId;
    const originalAncestorId = existingNode?.originalAncestorId;
    // ข้อมูล Direct Upline ไม่ต้องเปลี่ยน: ดึงจากผู้แนะนำตรงเดิม (sponsorNodeId) ของรหัสนี้
    const effectiveSponsorId = existingNode?.sponsorNodeId || this.getNodeDirectUplineId(nodeId);

    const resolvedCreatedVia = existingNode?.createdVia || (isRebirthNode ? 'Rebirth (ระบบโคลนนิ่งอัตโนมัติ)' : 'Rank Upgrade (อัปเกรดผัง)');
    if (existingNode && !existingNode.createdVia) {
      existingNode.createdVia = resolvedCreatedVia;
    }

    // Smart Contract Guard: สำหรับผัง 2-45 หาก ID นี้มีคิวในผังนี้อยู่แล้ว ให้ส่งคืนคิวเดิม (ป้องกัน duplicate entry)
    if (safeRank >= 2 && !isRebirthNode) {
      const existingInQueue = queue.find((q) => q.nodeId === nodeId);
      if (existingInQueue) {
        return existingInQueue;
      }
    }

    let parentQueueNumber = 0;
    let parentNodeId = 0;
    let isLeft = false;

    if (newQueueNumber > 1) {
      const slot = this.findSlotInRankQueue(queue, effectiveSponsorId);
      if (slot) {
        parentQueueNumber = slot.parentItem.queueNumber;
        parentNodeId = slot.parentItem.nodeId;
        isLeft = slot.isLeft;

        if (isLeft) {
          slot.parentItem.leftChildQueueNumber = newQueueNumber;
        } else {
          slot.parentItem.rightChildQueueNumber = newQueueNumber;
        }
      }
    }

    const newQueueItem: RankQueueNode = {
      queueNumber: newQueueNumber,
      nodeId,
      owner: ownerAddress.toLowerCase(),
      rank: safeRank,
      parentQueueNumber,
      parentNodeId,
      leftChildQueueNumber: 0,
      rightChildQueueNumber: 0,
      isLeft,
      upgradeVault: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      rebirthCount: 0,
      pendingRebirths: 0,
      enteredAt: Date.now(),
      isRebirth: isRebirthNode,
      rebornFromNodeId,
      originalAncestorId,
      sponsorNodeId: effectiveSponsorId,
      createdVia: resolvedCreatedVia,
    };

    queue.push(newQueueItem);

    if (existingNode) {
      existingNode.queueNumber = newQueueNumber;
    }

    // If newQueueNumber === 1, this is the root pioneer of this rank
    if (newQueueNumber === 1) {
      const isGlobal = safeRank >= 2;
      this.addLog({
        type: 'RANK_UPGRADE',
        title: isGlobal
          ? `👑 Global Pioneer: Node #${nodeId} (คิวที่ #1 ของโลก Rank ${safeRank})`
          : `👑 Rank ${safeRank} Pioneer: Node #${nodeId}`,
        description: isGlobal
          ? `Node #${nodeId} เป็นรหัสแรกของโลกที่ขึ้นถึง Rank ${safeRank} (${getRankInfo(safeRank).title}) ได้รับตำแหน่งคิวที่ #1 ของโลก (Global Queue #1)!`
          : `Node #${nodeId} became Queue #1 (Pioneer Root) of Rank ${safeRank} (${getRankInfo(safeRank).title})!`,
        nodeId,
        amount: rankPrice,
        txHash: '0xqueue_root_' + Math.random().toString(16).substring(2, 8),
        details: { rank: safeRank, queueNumber: 1, isPioneer: true, isGlobalQueue: isGlobal },
      });
      return newQueueItem;
    }

    const parentItem = queue[parentQueueNumber - 1];
    if (!parentItem) return newQueueItem;

    const parentWallet = this.wallets.get(parentItem.owner.toLowerCase());
    const isGlobal = safeRank >= 2;

    if (isLeft) {
      // Condition 1: 100% Math for Left Child (Downline #1)
      const directBonus = rankPrice * 0.30;
      const perLevelBonus = (rankPrice * 0.30) / 15;
      const vaultShare = rankPrice * 0.40;

      // 30% Direct Upline goes to the Original Sponsor Node in Rank 1 (effectiveSponsorId)
      const directSponsorNodeId = effectiveSponsorId || 1;
      const sponsorNode = this.nodes.get(directSponsorNodeId);
      const isChildWallet1 = ownerAddress.toLowerCase() === INITIAL_WALLETS[0].address.toLowerCase();
      const sponsorAddress = sponsorNode ? sponsorNode.owner.toLowerCase() : (existingNode?.firstSponsor || (isChildWallet1 ? INITIAL_WALLETS[0].address.toLowerCase() : parentItem.owner.toLowerCase()));
      const sponsorWallet = this.wallets.get(sponsorAddress) || this.wallets.get(parentItem.owner.toLowerCase());

      if (sponsorNode) {
        sponsorNode.totalDirectEarned = Math.round((sponsorNode.totalDirectEarned + directBonus) * 100) / 100;
      }
      
      // Also update the queue item for the sponsor in this rank queue
      const sponsorQueueItem = queue.find((q) => q.nodeId === directSponsorNodeId) || queue.find((q) => q.owner.toLowerCase() === sponsorAddress.toLowerCase());
      if (sponsorQueueItem) {
        sponsorQueueItem.totalDirectEarned = Math.round((sponsorQueueItem.totalDirectEarned + directBonus) * 100) / 100;
      }

      if (sponsorWallet) {
        sponsorWallet.balance = Math.round((sponsorWallet.balance + directBonus) * 100) / 100;
        sponsorWallet.totalEarned = Math.round((sponsorWallet.totalEarned + directBonus) * 100) / 100;
      }

      // Log Direct Bonus for Sponsor
      this.addLog({
        type: 'DIRECT_BONUS',
        title: `Direct Bonus Received: Node #${directSponsorNodeId} (+${directBonus.toFixed(2)} USDT)`,
        description: `ได้รับค่าแนะนำตรง 30% จำนวน ${directBonus.toFixed(2)} USDT จากการขึ้นผัง Rank ${safeRank} ของรหัส #${nodeId}`,
        nodeId: directSponsorNodeId,
        amount: directBonus,
        txHash: '0xdirect_bonus_' + Math.random().toString(16).substring(2, 8),
        details: {
          rank: safeRank,
          fromNodeId: nodeId,
          amount: directBonus,
        }
      });

      parentItem.upgradeVault += vaultShare;
      if (safeRank === 1) {
        const baseParentNode = this.nodes.get(parentItem.nodeId);
        if (baseParentNode) {
          baseParentNode.upgradeVault = parentItem.upgradeVault;
        }
      }
      if (parentWallet) {
        parentWallet.upgradeVault = this.getWalletUpgradeVault(parentItem.owner);
      }

      // 15-Level uplines loop up the binary queue starting from parentQueueNumber
      let curQ = parentQueueNumber;
      let distributedLevels = 0;
      while (curQ >= 1 && distributedLevels < MAX_LEVELS) {
        if (curQ > queue.length) break;
        const uplineItem = queue[curQ - 1];
        if (!uplineItem) break;

        uplineItem.totalLevelEarned += perLevelBonus;
        const baseNode = this.nodes.get(uplineItem.nodeId);
        if (baseNode) {
          baseNode.totalLevelEarned += perLevelBonus;
        }

        const uplineWallet = this.wallets.get(uplineItem.owner.toLowerCase());
        if (uplineWallet) {
          uplineWallet.balance = Math.round((uplineWallet.balance + perLevelBonus) * 100) / 100;
          uplineWallet.totalEarned = Math.round((uplineWallet.totalEarned + perLevelBonus) * 100) / 100;
        }

        // Log Level Bonus for Upline
        this.addLog({
          type: 'LEVEL_BONUS',
          title: `Level Bonus Received: Node #${uplineItem.nodeId} (+${perLevelBonus.toFixed(2)} USDT)`,
          description: `ได้รับโบนัส 15 ชั้น (ชั้นที่ ${distributedLevels}) จำนวน ${perLevelBonus.toFixed(2)} USDT จากการขึ้นผังของ Node #${nodeId} ใน Rank ${safeRank}`,
          nodeId: uplineItem.nodeId,
          amount: perLevelBonus,
          txHash: '0xlevel_bonus_' + Math.random().toString(16).substring(2, 8),
          details: {
            rank: safeRank,
            fromNodeId: nodeId,
            depth: distributedLevels,
            amount: perLevelBonus,
          }
        });

        distributedLevels++;
        curQ = uplineItem.parentQueueNumber;
      }

      // โอนเงินค่าชั้นส่วนที่เหลือ (ไม่ครบ 15 ชั้น) เข้ากระเป๋ากลาง (Treasury)
      if (distributedLevels < MAX_LEVELS) {
        const remainder = (MAX_LEVELS - distributedLevels) * perLevelBonus;
        this.creditTreasuryResidual(remainder, distributedLevels, safeRank, nodeId, parentItem.nodeId);
      }

      this.addLog({
        type: 'PAYOUT_LEFT',
        title: isGlobal
          ? `🌍 [Global Queue Rank ${safeRank}] Node #${nodeId} (คิว #${newQueueNumber} ของโลก) ➔ ซ้ายของ คิว #${parentItem.queueNumber}`
          : `Rank ${safeRank} Queue: Node #${nodeId} (Q#${newQueueNumber}) -> Left of #${parentItem.nodeId}`,
        description: isGlobal
          ? `สมาชิกทั่วโลกขึ้น Rank ${safeRank}: จ่าย Direct Upline 30% (${directBonus.toFixed(1)} USDT) ให้ผู้แนะนำตรง #${directSponsorNodeId}, Vault 40% (+${vaultShare.toFixed(1)} USDT) ให้คิว #${parentItem.queueNumber}, Level 30% (${distributedLevels} ชั้นทั่วโลก)${distributedLevels < MAX_LEVELS ? `, ค่าชั้นส่วนที่เหลือ ${((MAX_LEVELS - distributedLevels) * perLevelBonus).toFixed(2)} USDT โอนเข้ากระเป๋ากลาง Treasury` : ''}.`
          : `Paid 30% Direct (${directBonus.toFixed(1)} USDT) to Sponsor #${directSponsorNodeId}, 40% Vault (+${vaultShare.toFixed(1)} USDT) to #${parentItem.nodeId}, 30% Level (${distributedLevels} levels * ${perLevelBonus.toFixed(2)} USDT)${distributedLevels < MAX_LEVELS ? `, Residual ${((MAX_LEVELS - distributedLevels) * perLevelBonus).toFixed(2)} USDT to Treasury` : ''} in Rank ${safeRank}.`,
        nodeId,
        parentId: parentItem.nodeId,
        amount: rankPrice,
        txHash: '0xqueue_payout_' + Math.random().toString(16).substring(2, 8),
        details: {
          rank: safeRank,
          nodeId,
          queueNumber: newQueueNumber,
          parentQueueNumber,
          parentId: parentItem.nodeId,
          isGlobalQueue: isGlobal,
          directBonus: {
            sponsorNodeId: directSponsorNodeId,
            sponsorAddress,
            sponsorName: sponsorWallet?.name,
            amount: directBonus,
          },
          levelBonus: {
            distributedLevels,
            perLevelBonus,
            totalDistributed: distributedLevels * perLevelBonus,
            remainderToTreasury: (MAX_LEVELS - distributedLevels) * perLevelBonus,
          },
          upgradeVault: {
            targetNodeId: parentItem.nodeId,
            amount: vaultShare,
            newBalance: parentItem.upgradeVault,
          },
        },
      });

      // AUTO-UPGRADE CHECK: Check and promote parent main ID if Upgrade Vault (5 preceding ranks) is sufficient
      if (safeRank < MAX_RANK) {
        this.checkAndAutoUpgradeRank(parentItem.nodeId);
      }

      // AUTO-CREATION FROM EXCESS 40% UPGRADE VAULT CHECK
      const baseNode = this.nodes.get(parentItem.nodeId);
      const rootMainId = (baseNode?.isRebirth && baseNode.originalAncestorId) ? baseNode.originalAncestorId : parentItem.nodeId;
      this.checkAndAutoRebirthFromExcessVault(rootMainId);
      this.checkAndAutoCreateIDFromExcessVault(rootMainId);
    } else {
      // Condition 2: Right Child triggers Rebirth in this rank
      const currentRankPool = this.getRankRebirthPool(safeRank);
      this.rankRebirthPool.set(safeRank, currentRankPool + rankPrice);
      if (safeRank === 1) {
        this.rebirthPool += rankPrice;
      }
      parentItem.rebirthCount += 1;
      parentItem.pendingRebirths += 1;

      const baseParentNode = this.nodes.get(parentItem.nodeId);
      if (baseParentNode) {
        baseParentNode.rebirthCount += 1;
        baseParentNode.pendingRebirths += 1;
      }

      const queueWallet = this.wallets.get(parentItem.owner.toLowerCase());
      if (queueWallet) {
        queueWallet.rebirthCount = (queueWallet.rebirthCount || 0) + 1;
        queueWallet.pendingRebirths = this.getWalletPendingRebirths(parentItem.owner);
      }

      this.addLog({
        type: 'REBIRTH_TRIGGER',
        title: isGlobal
          ? `🔄 [Global Rebirth Rank ${safeRank}] คิว #${parentItem.queueNumber} ครบคู่ซ้าย-ขวาทั่วโลก!`
          : `🔄 Rank ${safeRank} Rebirth Triggered: Node #${parentItem.nodeId} (Q#${parentQueueNumber})`,
        description: isGlobal
          ? `Node #${nodeId} เข้าเป็นลูกขวาทั่วโลก (คิว #${newQueueNumber}) ➔ 100% (${rankPrice} USDT) เข้า Rebirth Pool ของโลก และส่งคิว #${parentItem.queueNumber} (Node #${parentItem.nodeId}) ไปรอเกิดใหม่ทั่วโลก!`
          : `Node #${nodeId} entered as Right Child (Q#${newQueueNumber}). 100% (${rankPrice} USDT) pooled. Node #${parentItem.nodeId} marked pending rebirth!`,
        nodeId: parentItem.nodeId,
        parentId: parentItem.nodeId,
        amount: rankPrice,
        txHash: '0xqueue_rebirth_' + Math.random().toString(16).substring(2, 8),
        details: { rank: safeRank, queueNumber: newQueueNumber, parentQueueNumber, rebirthCount: parentItem.rebirthCount, isGlobalQueue: isGlobal },
      });

      if (this.autoRebirthEnabled || this.autoExcessVaultNewMainIdEnabled) {
        this.scheduleAutoActions(parentItem.nodeId);
      }
    }

    return newQueueItem;
  }

  // Demonstration: Simulates the exact user condition:
  // "idที่1 ขึ้นมาก่อนได้เป็นคิวที่1 ต่อมา idที่2 อัพ rankขึ้นมา เป็นคิวที่2 เเละไปอยู่ใต้ idที่1
  //  ต่อมา idที่3 อัพ rankขึ้นมา เป็นคิวที่3 เเละไปอยู่ใต้ idที่1"
  simulateRankQueueRun(targetRank: number): number[] {
    const safeRank = Math.max(1, Math.min(MAX_RANK, targetRank));
    const walletList = Array.from(this.wallets.values());
    const addedIds: number[] = [];

    // Special Simulation for Rank 1 Personal Binary Matrix (1 แตก 2 + Rebirth)
    if (safeRank === 1) {
      // Step 1: Add Left child under Node 1 (or next available slot)
      const slot1 = this.findSlotForSponsor(1);
      if (slot1) {
        const wallet2 = walletList[1] || walletList[0];
        const id1 = this.register(wallet2.address, slot1.parentId, slot1.isLeft, false, 0, 1, 1);
        addedIds.push(id1);
      }

      // Step 2: Add Right child under Node 1 (or next available slot) -> triggers Rebirth
      const slot2 = this.findSlotForSponsor(1);
      if (slot2) {
        const wallet3 = walletList[2] || walletList[0];
        const id2 = this.register(wallet3.address, slot2.parentId, slot2.isLeft, false, 0, 1, 1);
        addedIds.push(id2);
      }

      // Step 3: Auto-execute pending rebirth if pool has enough
      const node1 = this.nodes.get(1);
      if (node1 && node1.pendingRebirths > 0 && this.rebirthPool >= REGISTRATION_FEE) {
        try {
          const rebornId = this.executeRebirth(1, undefined, undefined, 1);
          addedIds.push(rebornId);
        } catch (err) {
          console.warn('Rank 1 rebirth auto-trigger warning:', err);
        }
      }

      return addedIds;
    }

    const existingQueue = this.getRankQueue(safeRank);

    // If queue is empty, ensure ID 1 is Queue #1
    if (existingQueue.length === 0) {
      const q1 = this.enterRankQueue(safeRank, 1, INITIAL_WALLETS[0].address);
      addedIds.push(q1.nodeId);
    }

    // Step 2: Add ID 2 as Queue #2 (Left child of Queue #1 -> pays 30% Unit + 40% Vault)
    const wallet2 = walletList[1] || walletList[0];
    const n2Id = this.generateNextNodeId();
    const node2: MatrixNode = {
      id: n2Id,
      owner: wallet2.address.toLowerCase(),
      parentId: 1,
      leftChild: 0,
      rightChild: 0,
      depth: 1,
      createdAt: Date.now(),
      rank: safeRank,
      rebirthCount: 0,
      pendingRebirths: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      upgradeVault: 0,
      originalAncestorId: n2Id,
    };
    this.nodes.set(n2Id, node2);
    wallet2.nodeIds.push(n2Id);
    const q2 = this.enterRankQueue(safeRank, n2Id, wallet2.address);
    addedIds.push(q2.nodeId);

    // Step 3: Add ID 3 as Queue #3 (Right child of Queue #1 -> triggers Rebirth for Queue #1)
    const wallet3 = walletList[2] || walletList[0];
    const n3Id = this.generateNextNodeId();
    const node3: MatrixNode = {
      id: n3Id,
      owner: wallet3.address.toLowerCase(),
      parentId: 1,
      leftChild: 0,
      rightChild: 0,
      depth: 1,
      createdAt: Date.now(),
      rank: safeRank,
      rebirthCount: 0,
      pendingRebirths: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      upgradeVault: 0,
      originalAncestorId: n3Id,
    };
    this.nodes.set(n3Id, node3);
    wallet3.nodeIds.push(n3Id);
    const q3 = this.enterRankQueue(safeRank, n3Id, wallet3.address);
    addedIds.push(q3.nodeId);

    // Step 4: สั่งเกิดใหม่ของ Rank 2 ถึง 45 (หากยังไม่ได้เกิดใหม่อัตโนมัติ)
    const q1Item = this.getRankQueue(safeRank)[0];
    if (q1Item && q1Item.pendingRebirths > 0) {
      try {
        const rebornNodeId = this.executeRankRebirth(safeRank, q1Item.nodeId, undefined, undefined, q1Item.queueNumber);
        if (!addedIds.includes(rebornNodeId)) {
          addedIds.push(rebornNodeId);
        }
      } catch (err) {
        console.warn('Rank rebirth simulation trigger warning:', err);
      }
    }

    // เก็บรหัสทั้งหมดที่ถูกเพิ่มในคิวรอบนี้ (รวมรหัสที่เกิดใหม่อัตโนมัติ)
    const finalQueue = this.getRankQueue(safeRank);
    for (const q of finalQueue) {
      if (!addedIds.includes(q.nodeId)) {
        addedIds.push(q.nodeId);
      }
    }

    return addedIds;
  }

  // Add individual next member into target Rank queue
  addMemberToRankQueue(targetRank: number, walletAddress?: string): RankQueueNode {
    const safeRank = Math.max(1, Math.min(MAX_RANK, targetRank));
    const walletList = Array.from(this.wallets.values());
    const queue = this.getRankQueue(safeRank);
    const walletIdx = (queue.length + 1) % walletList.length;
    const selectedWallet = walletAddress ? (this.wallets.get(walletAddress.toLowerCase()) || walletList[0]) : walletList[walletIdx];

    if (safeRank === 1) {
      const slot = this.findSlotForSponsor(1);
      if (!slot) throw new Error('ไม่พบตำแหน่งว่างในผัง Rank 1');
      const newId = this.register(selectedWallet.address, slot.parentId, slot.isLeft, false, 0, 1, 1);
      const createdNode = this.nodes.get(newId)!;
      return {
        queueNumber: this.nodes.size,
        nodeId: newId,
        owner: selectedWallet.address.toLowerCase(),
        rank: 1,
        parentQueueNumber: slot.parentId,
        parentNodeId: slot.parentId,
        leftChildQueueNumber: 0,
        rightChildQueueNumber: 0,
        isLeft: slot.isLeft,
        upgradeVault: createdNode?.upgradeVault || 0,
        totalDirectEarned: 0,
        totalLevelEarned: 0,
        rebirthCount: 0,
        pendingRebirths: 0,
        enteredAt: Date.now(),
        isRebirth: false,
        sponsorNodeId: 1,
      };
    }

    const currentId = this.generateNextNodeId();
    const newNode: MatrixNode = {
      id: currentId,
      owner: selectedWallet.address.toLowerCase(),
      parentId: 0,
      leftChild: 0,
      rightChild: 0,
      depth: 1,
      createdAt: Date.now(),
      rank: safeRank,
      rebirthCount: 0,
      pendingRebirths: 0,
      totalDirectEarned: 0,
      totalLevelEarned: 0,
      upgradeVault: 0,
      originalAncestorId: currentId,
    };
    this.nodes.set(currentId, newNode);
    selectedWallet.nodeIds.push(currentId);

    return this.enterRankQueue(safeRank, currentId, selectedWallet.address);
  }

  // ==========================================
  // --- ADMIN FUNCTIONS (แผงฟังก์ชันผู้ดูแลระบบ) ---
  // ==========================================

  // 1. Emergency Pause / Unpause
  adminSetPause(paused: boolean) {
    this.isPaused = paused;
    this.addLog({
      type: 'ADMIN_ACTION',
      title: paused ? '🔴 Emergency Pause Activated' : '🟢 Contract Resumed / Unpaused',
      description: paused
        ? 'แอดมินเปิดโหมดระงับการทำงานฉุกเฉิน (ห้ามลงทะเบียนใหม่ และห้ามอัปเกรดชั่วคราว)'
        : 'แอดมินปลดการระงับระบบ สมาชิกสามารถทำรายการได้ตามปกติ',
      txHash: '0xadmin_pause_' + Date.now().toString(16),
    });
  }

  // 2. Change Treasury Address
  adminSetTreasury(newTreasury: string) {
    const oldTreasury = this.treasuryAddress;
    this.treasuryAddress = newTreasury.toLowerCase();

    // Ensure wallet exists
    if (!this.wallets.has(this.treasuryAddress)) {
      this.wallets.set(this.treasuryAddress, {
        address: this.treasuryAddress,
        name: `Treasury (${this.treasuryAddress.slice(0, 6)})`,
        nodeIds: [],
        balance: 0,
        totalEarned: 0,
      });
    }

    this.addLog({
      type: 'ADMIN_ACTION',
      title: '👑 Treasury Address Updated',
      description: `แอดมินเปลี่ยนกระเป๋า Treasury จาก ${oldTreasury.slice(0, 8)}... เป็น ${newTreasury.slice(0, 8)}...`,
      txHash: '0xadmin_treasury_' + Date.now().toString(16),
    });
  }

  // 3. Admin Force Set Rank (Rank 1 - 45)
  adminForceSetRank(nodeId: number, targetRank: number): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`ไม่พบรหัสสมาชิก #${nodeId}`);
    const safeRank = Math.max(1, Math.min(MAX_RANK, targetRank));
    const oldRank = node.rank;
    node.rank = safeRank;

    const rankMeta = getRankInfo(safeRank);
    this.addLog({
      type: 'ADMIN_ACTION',
      title: `⚡ Admin Force Set Rank: #${nodeId} -> Rank ${safeRank}`,
      description: `แอดมินปรับ Rank ของรหัส #${nodeId} (${node.owner.slice(0, 6)}...) จาก Rank ${oldRank} เป็น Rank ${safeRank} (${rankMeta.title}) ทันที`,
      nodeId,
      txHash: '0xadmin_rank_' + Date.now().toString(16),
      details: { oldRank, newRank: safeRank },
    });

    // Also place in that rank's queue if not present
    this.enterRankQueue(safeRank, node.id, node.owner, false);
    return true;
  }

  // 4. Admin Adjust Upgrade Vault
  adminAdjustVault(nodeId: number, newVaultAmount: number): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`ไม่พบรหัสสมาชิก #${nodeId}`);
    const oldVault = node.upgradeVault;
    node.upgradeVault = Math.max(0, Number(newVaultAmount));

    this.addLog({
      type: 'ADMIN_ACTION',
      title: `💼 Admin Adjusted Vault: #${nodeId}`,
      description: `แอดมินปรับ Upgrade Vault ของรหัส #${nodeId} จาก ${oldVault.toFixed(2)} USDT เป็น ${node.upgradeVault.toFixed(2)} USDT`,
      nodeId,
      amount: node.upgradeVault,
      txHash: '0xadmin_vault_' + Date.now().toString(16),
    });

    // Check if new vault qualifies for auto-promotion
    this.checkAndAutoUpgradeRank(nodeId);
    return true;
  }

  // 5. Admin Transfer Node Ownership
  adminTransferNodeOwner(nodeId: number, newOwnerAddress: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`ไม่พบรหัสสมาชิก #${nodeId}`);
    const targetAddr = newOwnerAddress.toLowerCase();
    const oldOwner = node.owner;

    // Remove from old owner
    const oldWallet = this.wallets.get(oldOwner);
    if (oldWallet) {
      oldWallet.nodeIds = oldWallet.nodeIds.filter((id) => id !== nodeId);
    }

    // Ensure new owner wallet exists
    let newWallet = this.wallets.get(targetAddr);
    if (!newWallet) {
      newWallet = {
        address: targetAddr,
        name: `Wallet (${targetAddr.slice(0, 6)})`,
        nodeIds: [nodeId],
        balance: 50,
        totalEarned: 0,
      };
      this.wallets.set(targetAddr, newWallet);
    } else {
      if (!newWallet.nodeIds.includes(nodeId)) {
        newWallet.nodeIds.push(nodeId);
      }
    }

    node.owner = targetAddr;

    this.addLog({
      type: 'ADMIN_ACTION',
      title: `🔄 Admin Transferred Ownership: #${nodeId}`,
      description: `แอดมินโอนรหัส #${nodeId} จาก ${oldOwner.slice(0, 8)}... ไปยัง ${targetAddr.slice(0, 8)}...`,
      nodeId,
      txHash: '0xadmin_transfer_' + Date.now().toString(16),
    });
    return true;
  }

  // 6. Admin Airdrop USDT to Wallet
  adminAirdrop(walletAddress: string, amount: number): boolean {
    const addr = walletAddress.toLowerCase();
    let wallet = this.wallets.get(addr);
    if (!wallet) {
      wallet = {
        address: addr,
        name: `Wallet (${addr.slice(0, 6)})`,
        nodeIds: [],
        balance: 0,
        totalEarned: 0,
      };
      this.wallets.set(addr, wallet);
    }
    wallet.balance += amount;

    this.addLog({
      type: 'ADMIN_ACTION',
      title: `🎁 Admin Airdrop: +${amount.toFixed(2)} USDT`,
      description: `แอดมินเติมเหรียญทดสอบ ${amount.toFixed(2)} USDT เข้ากระเป๋า ${wallet.name} (${addr.slice(0, 8)}...) ยอดใหม่: ${wallet.balance.toFixed(2)} USDT`,
      amount,
      txHash: '0xadmin_airdrop_' + Date.now().toString(16),
    });
    return true;
  }

  // 7. Relocate/Move Node Under Target Parent (เช่น ย้ายรหัสโคลนไปต่อใต้รหัสโคลนของผู้แนะนำ)
  relocateNode(nodeId: number, newParentId: number, isLeft: boolean): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`ไม่พบรหัส #${nodeId}`);
    const newParent = this.nodes.get(newParentId);
    if (!newParent) throw new Error(`ไม่พบรหัสเป้าหมาย #${newParentId}`);

    if (isLeft && newParent.leftChild !== 0 && newParent.leftChild !== nodeId) {
      throw new Error(`รหัส #${newParentId} มีขาซ้ายอยู่แล้ว (#${newParent.leftChild})`);
    }
    if (!isLeft && newParent.rightChild !== 0 && newParent.rightChild !== nodeId) {
      throw new Error(`รหัส #${newParentId} มีขาขวาอยู่แล้ว (#${newParent.rightChild})`);
    }

    // Detach from current parent
    if (node.parentId !== 0 && this.nodes.has(node.parentId)) {
      const oldParent = this.nodes.get(node.parentId)!;
      if (oldParent.leftChild === nodeId) {
        oldParent.leftChild = 0;
      }
      if (oldParent.rightChild === nodeId) {
        oldParent.rightChild = 0;
      }
    }

    // Attach to new parent
    if (isLeft) {
      newParent.leftChild = nodeId;
    } else {
      newParent.rightChild = nodeId;
    }
    node.parentId = newParentId;
    node.depth = newParent.depth + 1;

    // Recursively update depth for children
    const updateDepths = (currId: number, d: number) => {
      const curr = this.nodes.get(currId);
      if (!curr) return;
      curr.depth = d;
      if (curr.leftChild !== 0) updateDepths(curr.leftChild, d + 1);
      if (curr.rightChild !== 0) updateDepths(curr.rightChild, d + 1);
    };
    if (node.leftChild !== 0) updateDepths(node.leftChild, node.depth + 1);
    if (node.rightChild !== 0) updateDepths(node.rightChild, node.depth + 1);

    this.addLog({
      type: 'REBIRTH_TRIGGER',
      title: `🔄 ย้ายรหัส #${nodeId} ไปต่อใต้ #${newParentId} (${isLeft ? 'ฝั่งซ้าย' : 'ฝั่งขวา'}) สำเร็จ`,
      description: `ย้ายตำแหน่งรหัส #${nodeId} ไปต่อใต้รหัส #${newParentId} (${isLeft ? 'ขาซ้าย' : 'ขาขวา'}) ตามเงื่อนไขการจัดวางของผังเครือข่าย`,
      nodeId,
      parentId: newParentId,
      txHash: '0xrelocate_' + Date.now().toString(16),
    });
    return true;
  }

  // 8. Admin Add Test Wallet
  adminAddWallet(address: string, name: string, initialBalance: number = 100): WalletAccount {
    const addr = address.toLowerCase();
    if (this.wallets.has(addr)) throw new Error('กระเป๋านี้มีอยู่ในระบบแล้ว');

    const newW: WalletAccount = {
      address: addr,
      name: name || `User (${addr.slice(0, 6)})`,
      nodeIds: [],
      balance: initialBalance,
      totalEarned: 0,
      firstSponsor: INITIAL_WALLETS[0].address.toLowerCase(),
    };
    this.wallets.set(addr, newW);

    this.addLog({
      type: 'ADMIN_ACTION',
      title: `👤 Admin Created Wallet: ${newW.name}`,
      description: `สร้างกระเป๋าทดสอบใหม่ ${newW.name} (${addr}) ด้วยยอดเริ่มต้น ${initialBalance} USDT`,
      amount: initialBalance,
      txHash: '0xadmin_wallet_' + Date.now().toString(16),
    });
    return newW;
  }

  // 8. Admin Sweep Rebirth Pool
  adminSweepRebirthPool(recipientAddress: string): number {
    const poolAmount = this.rebirthPool;
    if (poolAmount <= 0) throw new Error('กองกลาง Rebirth ไม่มีเงินคงเหลือ (0 USDT)');

    const addr = recipientAddress.toLowerCase();
    let recipient = this.wallets.get(addr);
    if (!recipient) {
      recipient = this.wallets.get(INITIAL_WALLETS[0].address.toLowerCase())!;
    }

    recipient.balance += poolAmount;
    recipient.totalEarned += poolAmount;
    this.rebirthPool = 0;

    this.addLog({
      type: 'ADMIN_ACTION',
      title: `🧹 Admin Sweep Rebirth Pool: ${poolAmount.toFixed(2)} USDT`,
      description: `แอดมินกวาดเงินกองกลาง Rebirth จำนวน ${poolAmount.toFixed(2)} USDT เข้ากระเป๋า ${recipient.name}`,
      amount: poolAmount,
      txHash: '0xadmin_sweep_' + Date.now().toString(16),
    });
    return poolAmount;
  }

  // 9. Admin Force Trigger Rebirth on Node
  adminForceTriggerRebirth(nodeId: number): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`ไม่พบรหัส #${nodeId}`);

    node.rebirthCount += 1;
    node.pendingRebirths += 1;
    this.rebirthPool += REGISTRATION_FEE;

    this.addLog({
      type: 'ADMIN_ACTION',
      title: `⚡ Admin Forced Rebirth Queue: #${nodeId}`,
      description: `แอดมินสั่งเพิ่มคิวโคลนนิ่งให้รหัส #${nodeId} (คิวรอโคลนนิ่ง: ${node.pendingRebirths}, ยอดกองกลาง +5 USDT)`,
      nodeId,
      amount: REGISTRATION_FEE,
      txHash: '0xadmin_rebirth_' + Date.now().toString(16),
    });
    return true;
  }

  // 10. Emergency Withdraw ERC-20 Tokens (emergencyWithdrawERC20)
  emergencyWithdrawERC20(
    tokenAddress: string,
    recipientAddress: string,
    requestedAmount?: number
  ): {
    token: string;
    to: string;
    amount: number;
    txHash: string;
  } {
    const token = tokenAddress?.trim() || '0x55d398326f99059fF775485246999027B3197955'; // Default USDT Contract
    const targetAddr = (recipientAddress?.trim() || this.treasuryAddress).toLowerCase();

    // Available contract balance in simulation comes from the rebirth pool (or test token reserve)
    const availableBalance = this.rebirthPool;
    const amount =
      requestedAmount === undefined || requestedAmount === null || requestedAmount <= 0 || requestedAmount > availableBalance
        ? availableBalance
        : Number(requestedAmount);

    if (amount <= 0) {
      throw new Error('ยอดเหรียญในสัญญาคงเหลือ 0 USDT ไม่สามารถถอนได้ (Contract Balance is 0)');
    }

    // Deduct from contract pool
    this.rebirthPool = Math.max(0, this.rebirthPool - amount);

    // Credit recipient wallet
    let recipient = this.wallets.get(targetAddr);
    if (!recipient) {
      recipient = {
        address: targetAddr,
        name: `Wallet (${targetAddr.slice(0, 6)})`,
        nodeIds: [],
        balance: 0,
        totalEarned: 0,
      };
      this.wallets.set(targetAddr, recipient);
    }

    recipient.balance += amount;
    recipient.totalEarned += amount;

    const txHash = '0xemergency_erc20_' + Date.now().toString(16);
    this.addLog({
      type: 'ADMIN_ACTION',
      title: `🚨 Emergency Withdraw ERC-20: ${amount.toFixed(2)} tokens`,
      description: `แอดมินเรียกใช้งาน emergencyWithdrawERC20 ถอนเหรียญ (${token.slice(0, 10)}...) จำนวน ${amount.toFixed(2)} USDT ส่งเข้ากระเป๋า ${recipient.name} (${targetAddr.slice(0, 8)}...) เรียบร้อย`,
      amount,
      txHash,
      details: {
        function: 'emergencyWithdrawERC20',
        token,
        to: targetAddr,
        amount,
      },
    });

    return {
      token,
      to: targetAddr,
      amount,
      txHash,
    };
  }

  // 10. Admin Batch Simulation (Stress Test)
  adminBatchSimulate(count: number, sponsorId?: number): number[] {
    if (this.isPaused) throw new Error('ระบบถูกระงับชั่วคราวโดยแอดมิน');
    const created: number[] = [];
    const walletList = Array.from(this.wallets.values());
    const effectiveSponsorId = sponsorId || 1;

    for (let i = 0; i < count; i++) {
      const slot = this.findSlotForSponsor(effectiveSponsorId);
      if (!slot) break;
      const w = walletList[(i + 1) % walletList.length];
      if (w.balance < REGISTRATION_FEE) {
        w.balance += REGISTRATION_FEE * 5; // Auto-faucet for stress test
      }
      const newId = this.register(w.address, slot.parentId, slot.isLeft, false, 0, effectiveSponsorId);
      created.push(newId);
    }

    this.addLog({
      type: 'ADMIN_ACTION',
      title: `🚀 Admin Batch Stress Test (${created.length} รหัส)`,
      description: `แอดมินรัน Stress Test อัตโนมัติ ${created.length} รหัสผ่าน Auto-Spillover สำเร็จครบถ้วน`,
      amount: created.length * REGISTRATION_FEE,
      txHash: '0xadmin_stress_' + Date.now().toString(16),
    });
    return created;
  }

  // ดึงยอดรวมรายได้ Direct Bonus และ Level Bonus สะสมจากทุกผัง (Rank 1 ถึง 45) ของรหัสในตระกูล (ไม่นับซ้ำ)
  getFamilyEarningsSummary(nodeId: number): { totalDirectEarned: number; totalLevelEarned: number } {
    const node = this.nodes.get(nodeId);
    if (!node) return { totalDirectEarned: 0, totalLevelEarned: 0 };
    const mainId = (node.isRebirth && node.originalAncestorId)
      ? node.originalAncestorId
      : (node.isRebirth && node.rebornFromNodeId)
      ? node.rebornFromNodeId
      : node.id;

    // เก็บรวบรวม ID ในตระกูลเดียวกัน (Main ID + Rebirth IDs ทั้งหมดที่เกิดจาก Main ID)
    const familyNodeIds = new Set<number>([mainId]);
    for (const n of this.nodes.values()) {
      if (
        n.id !== mainId &&
        n.isRebirth &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
      ) {
        familyNodeIds.add(n.id);
      }
    }

    let totalDirect = 0;
    let totalLevel = 0;

    // รวมรายได้จากผังที่ 1 ถึง 45 จาก rankQueues โดยตรง (ป้องกันการนับซ้ำกับ this.nodes)
    for (let r = 1; r <= MAX_RANK; r++) {
      const q = this.rankQueues.get(r);
      if (q) {
        for (const qItem of q) {
          // ค่าแนะนำตรง (Direct Sponsor) รวมยอดของตระกูล (ID หลัก + รหัสโคลนนิ่ง)
          if (familyNodeIds.has(qItem.nodeId)) {
            totalDirect += (qItem.totalDirectEarned || 0);
          }
          // Level Bonus คิดเฉพาะของรหัส ID นี้ตามลำดับชั้นของสายงาน
          if (qItem.nodeId === nodeId) {
            totalLevel += (qItem.totalLevelEarned || 0);
          }
        }
      }
    }

    return {
      totalDirectEarned: Math.round(totalDirect * 100) / 100,
      totalLevelEarned: Math.round(totalLevel * 100) / 100,
    };
  }

  // 11. Financial Audit Reconciler (ตรวจสอบสมดุลบัญชี 100%)
  getFinancialAudit() {
    const allNodes = this.getAllNodes();
    const paidRegistrations = allNodes.filter((n) => n.id !== 1 && !n.isRebirth);
    const rebirthNodes = allNodes.filter((n) => n.isRebirth);

    const totalRegistrationInflow = paidRegistrations.length * REGISTRATION_FEE;
    const totalRebirthFunded = rebirthNodes.length * REGISTRATION_FEE;

    const totalDirectBonuses = allNodes.reduce((acc, n) => acc + (n.totalDirectEarned || 0), 0);
    const totalLevelBonuses = allNodes.reduce((acc, n) => acc + (n.totalLevelEarned || 0), 0);
    const totalInUpgradeVaults = allNodes.reduce((acc, n) => acc + (n.upgradeVault || 0), 0);
    const currentRebirthPool = this.rebirthPool;
    const treasuryBalance = this.treasuryBalance;

    // Total gross funds accounted for
    const totalOutflowAndLocked =
      totalDirectBonuses + totalLevelBonuses + totalInUpgradeVaults + currentRebirthPool + treasuryBalance;

    const discrepancy = Math.abs(totalRegistrationInflow - totalOutflowAndLocked);
    const isPerfect = discrepancy < 0.01;

    return {
      totalNodes: allNodes.length,
      paidRegistrationsCount: paidRegistrations.length,
      rebirthCount: rebirthNodes.length,
      totalRegistrationInflow,
      totalRebirthFunded,
      totalDirectBonuses,
      totalLevelBonuses,
      totalInUpgradeVaults,
      currentRebirthPool,
      treasuryBalance,
      totalOutflowAndLocked,
      discrepancy,
      isPerfect,
    };
  }
}
