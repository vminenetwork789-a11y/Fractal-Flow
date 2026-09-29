export type CloneSourceType = 'WHITE_MATRIX' | 'VAULT_EXCESS';

export interface MatrixNode {
  id: number;
  owner: string;
  parentId: number;
  leftChild: number;
  rightChild: number;
  depth: number;
  createdAt: number;
  rank: number;              // Rank 1 to 15 (default 1)
  rebirthCount: number;
  pendingRebirths: number;
  totalDirectEarned: number; // 30% bonus (1.5 tokens)
  totalLevelEarned: number;  // 15-levels (0.1 token per level)
  upgradeVault: number;      // 40% (2.0 tokens)
  originalAncestorId: number;
  rebornFromNodeId?: number; // รหัสไอดีต้นทางที่ให้กำเนิดรหัสโคลนนิ่งนี้ (เช่น เกิดมาจาก #1)
  isRebirth?: boolean;
  isFromVault?: boolean;        // ไอดีที่เกิดจากการสมัครจากยอด 40% (Upgrade Vault / Excess Vault)
  paymentSource?: RegistrationPaymentSource; // แหล่งเงินที่ใช้สมัคร ('wallet', 'vault', 'combined', 'excess_vault')
  cloneSource?: CloneSourceType; // 'WHITE_MATRIX' (ผังขาว) หรือ 'VAULT_EXCESS' (จากส่วนเกิน 40% Vault ผัง 6 ถึง ผัง 45)
  createdVia?: string;          // แหล่งกำเนิดการสร้างไอดี (เช่น 'register', 'batchRegister', 'executeRebirth', 'executeRankRebirth', 'excess_vault_cloning', 'addMemberToRankQueue')
  vaultCloneRankCount?: number; // จำนวนการเกิดโคลนนิ่งจากส่วนเกิน 40% Vault ของผังนั้นๆ
  vaultCloneRound?: number;     // รอบการเกิดโคลนนิ่งอ้างอิงจากฟังก์ชัน
  cloneLabel?: string;          // ข้อความกำกับ เช่น "#1 #15 #1 รอบ 1"
  firstSponsor?: string; // กระเป๋าผู้แนะนำเราครั้งแรก
  sponsorNodeId?: number; // หมายเลขรหัสผู้แนะนำที่กรอก
  spawnedRebirthCount?: number; // ยอดรวมรหัสโคลนนิ่งที่กำเนิดมาจาก ID นี้
  spawnedRebirthIds?: number[]; // รายการหมายเลขรหัสโคลนนิ่งที่กำเนิดมาจาก ID นี้
  queueNumber?: number; // หมายเลข Global Node ID / คิวประจำผังนั้น (ผัง 2-45)
}

export interface RankInfo {
  rank: number;
  name: string;
  price: number;      // 5, 10, 15, ... 75 USDT
  title: string;
  badge: string;
  gradient: string;
  directBonus: number; // 30%
  levelBonusTotal: number; // 30%
  upgradeShare: number; // 40%
}

export type RegistrationPaymentSource = 'wallet' | 'vault' | 'combined' | 'excess_vault';

export interface WalletAccount {
  address: string;
  name: string;
  nodeIds: number[];
  balance: number; // Token balance (USDT)
  totalEarned: number;
  firstSponsor?: string; // กระเป๋าผู้แนะนำเราครั้งแรก
  rebirthCount?: number; // ยอดรอบเกิดใหม่สะสม อ้างอิงตามเลขกระเป๋า
  pendingRebirths?: number; // ยอดรอเกิดใหม่ อ้างอิงตามเลขกระเป๋า
  upgradeVault?: number; // ยอดสะสม Upgrade Vault (40% เม็ดซ้าย) รวมทั้งหมดที่เป็นกระเป๋าเดียวกัน
}

export interface MathBreakdown {
  fee: number; // 5.0
  directBonus: number; // 1.5 (30%)
  levelBonusTotal: number; // 1.5 (30% = 15 levels * 0.1)
  perLevelBonus: number; // 0.1 (2%)
  upgradeVault: number; // 2.0 (40%)
  rebirthPool: number; // 5.0 (100% on Right Child)
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: 'REGISTER' | 'PAYOUT_LEFT' | 'REBIRTH_TRIGGER' | 'REBIRTH_EXECUTED' | 'LEVEL_BONUS' | 'DIRECT_BONUS' | 'UPGRADE_VAULT' | 'VAULT_DEDUCTION' | 'BATCH_REGISTER' | 'BATCH_REBIRTH' | 'RANK_UPGRADE' | 'ADMIN_ACTION';
  title: string;
  description: string;
  nodeId?: number;
  parentId?: number;
  amount?: number;
  txHash: string;
  details?: Record<string, any>;
}

export interface PendingRebirthItem {
  nodeId: number;
  owner: string;
  round: number; // 1 = round 1 under itself, 2 = round 2 global spillover
  originalAncestorId: number;
  queuedAt: number;
}

export interface SlotTarget {
  parentId: number;
  isLeft: boolean;
  parentOwner: string;
  depth: number;
  isRebirthTarget?: boolean;
  targetRebirthNodeId?: number;
  reason?: string;
}

export interface RankQueueNode {
  queueNumber: number;          // คิวที่ 1, 2, 3... ใน Rank นี้
  nodeId: number;               // ID ของรหัสสมาชิก เช่น ID 1, 2, 3...
  owner: string;                // กระเป๋าเจ้าของ
  rank: number;                 // Rank 1 ถึง 15
  parentQueueNumber: number;    // Math.floor(queueNumber / 2) -> รหัสที่อยู่ด้านบน
  parentNodeId: number;         // ID ของรหัสที่อยู่ด้านบน
  leftChildQueueNumber: number; // คิวลูกซ้าย (queueNumber * 2)
  rightChildQueueNumber: number;// คิวลูกขวา (queueNumber * 2 + 1)
  isLeft: boolean;              // true ถ้าเป็นลูกซ้าย (queueNumber % 2 === 0)
  upgradeVault: number;         // ยอด 40% ใน Rank นี้
  totalDirectEarned: number;    // 30% Unit
  totalLevelEarned: number;     // 30% 15-level loop
  rebirthCount: number;         // จำนวน Rebirth (เมื่อมีลูกขวา)
  pendingRebirths: number;
  enteredAt: number;
  isRebirth?: boolean;
  rebornFromNodeId?: number;    // รหัสที่ให้กำเนิดรอบนี้
  originalAncestorId?: number;  // รหัสต้นกำเนิดหลัก
  sponsorNodeId?: number;       // Direct Upline ผู้แนะนำตรงเดิม (ไม่เปลี่ยน)
  cloneSource?: CloneSourceType; // 'WHITE_MATRIX' หรือ 'VAULT_EXCESS'
  createdVia?: string;          // แหล่งกำเนิดการสร้างไอดี (เช่น 'register', 'batchRegister', 'executeRebirth', 'executeRankRebirth', 'excess_vault_cloning', 'addMemberToRankQueue')
  vaultCloneRankCount?: number; // จำนวนการเกิดโคลนนิ่งจากส่วนเกิน 40% Vault ของผังนั้นๆ
  vaultCloneRound?: number;     // รอบการเกิดโคลนนิ่งอ้างอิงจากฟังก์ชัน
  cloneLabel?: string;          // ข้อความกำกับ เช่น "#1 #15 #1 รอบ 1"
}

export type NotificationType = 'REGISTRATION' | 'REBIRTH' | 'UPGRADE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  nodeId: number;
  rank?: number;
  amount?: number;
  walletName?: string;
  walletAddress?: string;
  details?: {
    parentId?: number;
    isLeft?: boolean;
    sponsorId?: number;
    rebornFromNodeId?: number;
    round?: number;
    vaultUsed?: number;
    walletPaid?: number;
    levelCount?: number;
    oldRank?: number;
    newRank?: number;
    cloneLabel?: string;
    txHash?: string;
  };
  read: boolean;
}

export interface RebirthRoundInfo {
  roundNumber: number;          // รอบที่เกิดใหม่สะสมของไอดีนั้น (1, 2, 3...)
  rebornNodeId: number;         // หมายเลข ID เกิดใหม่ เช่น #6
  globalNodeId: number;         // หมายเลข Global Node ID (queueNumber)
  mainAncestorId: number;       // รหัสหลักต้นทาง เช่น #2
  rank: number;                 // Rank ประจำผัง
  owner: string;                // กระเป๋าผู้ถือนิตินัย
  parentId: number;             // ติดตั้งต่อใต้รหัสพ่อ #...
  isLeft: boolean;              // ฝั่งซ้าย หรือ ฝั่งขวา
  cycleNumber: number;          // วัฏจักรที่ (เช่น 1, 2, 3...)
  roundInCycle: number;         // รอบในวัฏจักร (1 = ติดตัวผู้แนะนำ, 2 = ช่วยชุมชน)
  createdAt: number;            // Timestamp
  ruleType: string;             // รายละเอียดคำอธิบายกฎการจัดวาง
}

export interface ExcessRebirthVaultSummary {
  mainId: number;
  mainRank: number;
  totalAllVault: number;           // (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 5)
  vaultRank1To5: number;           // (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 5)
  vaultRank1To10: number;          // (40% Upgrade Vault ยอดสะสม ผัง 1 ถึง 10 - legacy ref)
  reserved5RanksVault: number;     // 40% Upgrade Vault สำรองย้อนหลัง 5 ผัง (ส่วนที่หักจากผัง 1 ถึง 5)
  reservedRanksText: string;       // ข้อความระบุช่วงผังสำรอง เช่น "ผัง 4 ถึง 5" หรือ "0.00 U (ผ่านผัง 10 แล้ว)"
  reserved5RanksFullVault: number; // ยอดสำรองย้อนหลัง 5 ผังเต็มจำนวน (เช่น ผัง 4 ถึง 8)
  vaultRolling5Ranks: number;      // alias
  isRank11OrAbove: boolean;        // ไอดีหลักอัปเกรดผ่านผัง 11 ขึ้นไปแล้วหรือไม่ (mainRank >= 11)
  isRank10OrAbove: boolean;        // ไอดีหลักอัปเกรดถึงผัง 10 ขึ้นไปแล้วหรือไม่ (mainRank >= 10)
  excessVault: number;             // ยอดส่วนเกินคำนวณตามสูตร
  rank1Price: number;              // 5.00 USDT
  canRebirthRank1: boolean;
  rebirthCountPossible: number;
  canRegisterNewMainId: boolean;
  newMainIdCountPossible: number;
  formulaText: string;
}

