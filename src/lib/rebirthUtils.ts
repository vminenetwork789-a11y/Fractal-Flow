import { MatrixNode } from '../types';

export interface IdRebirthStat {
  id: number;
  owner: string;
  rank: number;
  isRebirth: boolean;
  originalAncestorId: number;
  spawnedCount: number;
  spawnedIds: number[];
  pendingRebirths: number;
  rebirthTriggers: number;
}

/**
 * คำนวณจำนวนรหัสโคลนนิ่ง (Cloning IDs) ที่เกิดมาจาก นิวไอดี (หลัก) หรือบรรพบุรุษที่ระบุ
 * อ้างอิงตามผัง Rank นั้นๆ
 */
export function getRebirthNodeCount(mainId: number, nodes: MatrixNode[], rank?: number): number {
  if (!mainId || !nodes || nodes.length === 0) return 0;
  return nodes.filter(
    (n) =>
      n.isRebirth &&
      (rank === undefined || (n.rank || 1) === rank) &&
      (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
  ).length;
}

/**
 * ดึงรายการหมายเลขรหัสโคลนนิ่ง (Cloning Node IDs) ทั้งหมดที่เกิดมาจาก นิวไอดี (หลัก) นั้น
 * อ้างอิงตามผัง Rank นั้นๆ
 */
export function getRebirthNodeIds(mainId: number, nodes: MatrixNode[], rank?: number): number[] {
  if (!mainId || !nodes || nodes.length === 0) return [];
  return nodes
    .filter(
      (n) =>
        n.isRebirth &&
        (rank === undefined || (n.rank || 1) === rank) &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
    )
    .map((n) => n.id)
    .sort((a, b) => a - b);
}

/**
 * สถิติ Cloning รายละเอียดครบถ้วนสำหรับ 1 ID
 */
export function getIdRebirthDetail(nodeId: number, nodes: MatrixNode[]): IdRebirthStat | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const effectiveMainId = node.isRebirth
    ? (node.originalAncestorId || node.rebornFromNodeId || node.id)
    : node.id;

  const spawnedIds = getRebirthNodeIds(effectiveMainId, nodes);

  return {
    id: node.id,
    owner: node.owner,
    rank: node.rank || 1,
    isRebirth: Boolean(node.isRebirth),
    originalAncestorId: effectiveMainId,
    spawnedCount: spawnedIds.length,
    spawnedIds,
    pendingRebirths: node.pendingRebirths || 0,
    rebirthTriggers: node.rebirthCount || 0,
  };
}

/**
 * ดึงตารางสรุปสถิติรหัสโคลนนิ่งของทุก นิวไอดี (หลัก) (Main IDs) ทั้งหมด
 */
export function getAllMainIdRebirthStats(nodes: MatrixNode[]): IdRebirthStat[] {
  const mainNodes = nodes.filter((n) => !n.isRebirth);
  return mainNodes
    .map((mainNode) => {
      const spawnedIds = getRebirthNodeIds(mainNode.id, nodes);
      return {
        id: mainNode.id,
        owner: mainNode.owner,
        rank: mainNode.rank || 1,
        isRebirth: false,
        originalAncestorId: mainNode.id,
        spawnedCount: spawnedIds.length,
        spawnedIds,
        pendingRebirths: mainNode.pendingRebirths || 0,
        rebirthTriggers: mainNode.rebirthCount || 0,
      };
    })
    .sort((a, b) => a.id - b.id);
}

/**
 * คำนวณสรุปจำนวน Node ID แยกประเภท (สมัคร vs เกิดใหม่/โคลนนิ่ง)
 */
export function getNodeTypeCounts(nodes: MatrixNode[]): {
  total: number;
  mainCount: number;
  rebirthCount: number;
} {
  if (!nodes || nodes.length === 0) return { total: 0, mainCount: 0, rebirthCount: 0 };
  const mainCount = nodes.filter((n) => !n.isRebirth).length;
  const rebirthCount = nodes.filter((n) => n.isRebirth).length;
  return {
    total: nodes.length,
    mainCount,
    rebirthCount,
  };
}

export interface NodeSequenceInfo {
  globalId: number;
  isRebirth: boolean;
  mainSeqNumber: number | null; // e.g. 1, 2, 3 (ลำดับรหัสสมัคร)
  rebirthSeqNumber: number | null; // e.g. 1, 2, 3 (ลำดับรหัสโคลนนิ่งรวมในระบบ)
  rebirthIndexForMain: number | null; // e.g. 1 (ลำดับโคลนนิ่งเม็ดที่เท่าไหร่ของไอดีหลักนั้นๆ)
  originalAncestorId: number;
}

/**
 * ดึงลำดับหมายเลขการนับแยก (Main Index / Rebirth Index) สำหรับแต่ละ Node ID
 */
export function getNodeSequenceInfo(nodeId: number, nodes: MatrixNode[]): NodeSequenceInfo | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const sortedNodes = [...nodes].sort((a, b) => a.id - b.id);
  const mainNodes = sortedNodes.filter((n) => !n.isRebirth);
  const rebirthNodes = sortedNodes.filter((n) => n.isRebirth);

  if (!node.isRebirth) {
    const mainSeqIndex = mainNodes.findIndex((n) => n.id === nodeId);
    return {
      globalId: node.id,
      isRebirth: false,
      mainSeqNumber: mainSeqIndex !== -1 ? mainSeqIndex + 1 : null,
      rebirthSeqNumber: null,
      rebirthIndexForMain: null,
      originalAncestorId: node.id,
    };
  } else {
    const rebirthSeqIndex = rebirthNodes.findIndex((n) => n.id === nodeId);
    const ancestorId = node.originalAncestorId || node.rebornFromNodeId || node.id;
    const sameMainRebirths = rebirthNodes.filter(
      (n) => n.originalAncestorId === ancestorId || n.rebornFromNodeId === ancestorId
    );
    const indexForMain = sameMainRebirths.findIndex((n) => n.id === nodeId);

    return {
      globalId: node.id,
      isRebirth: true,
      mainSeqNumber: null,
      rebirthSeqNumber: rebirthSeqIndex !== -1 ? rebirthSeqIndex + 1 : null,
      rebirthIndexForMain: indexForMain !== -1 ? indexForMain + 1 : null,
      originalAncestorId: ancestorId,
    };
  }
}

/**
 * คำนวณลำดับรหัสโคลนนิ่งเฉพาะของไอดีหลักนั้นๆ อ้างอิงตามผัง Rank นั้นๆ (นับของใครผังมัน: 1, 2, 3...)
 */
export function getRebirthSeqForMain(node: MatrixNode, nodes: MatrixNode[], rank?: number): number {
  if (!node || !node.isRebirth) return 0;
  const targetRank = rank !== undefined ? rank : (node.rank || 1);
  const ancestorId = node.originalAncestorId || node.rebornFromNodeId || node.id;
  const sameMainRebirths = nodes
    .filter(
      (n) =>
        n.isRebirth &&
        (n.rank || 1) === targetRank &&
        (n.originalAncestorId === ancestorId || n.rebornFromNodeId === ancestorId)
    )
    .sort((a, b) => a.id - b.id);
  const index = sameMainRebirths.findIndex((n) => n.id === node.id);
  return index !== -1 ? index + 1 : 1;
}

/**
 * รูปแบบข้อความแสดงชื่อรหัสโคลนนิ่งตามเงื่อนไข:
 * #ไอดีหลัก#เลขidตัวมัน#จำนวนการเกิดโคลนนิ่งจากยอด40% โคลนนิ่งรอบ X
 * เช่น (#1#1#0 โคลนนิ่งรอบ 1) (#1#1#1 โคลนนิ่งรอบ 1) (#1#2#2 โคลนนิ่งรอบ 1)
 */
export function formatNodeCloneLabel(node: MatrixNode, nodes: MatrixNode[], rank?: number, roundOverride?: number): string {
  if (!node) return '';
  if (!node.isRebirth) {
    return `#${node.id}`;
  }
  const parts = formatNodeCloneBadgeParts(node, nodes, rank, roundOverride);
  return parts.fullLabel;
}

export function formatNodeCloneBadgeParts(node: MatrixNode, nodes: MatrixNode[], rank?: number, roundOverride?: number) {
  if (!node || !node.isRebirth) {
    return {
      isRebirth: false,
      mainId: node?.id || 0,
      nodeId: node?.id || 0,
      vaultCloneIndex: 0,
      round: 1,
      fullLabel: `#${node?.id || 0}`,
    };
  }
  const targetRank = rank !== undefined ? rank : (node.rank || 1);
  const mainId = node.originalAncestorId || node.rebornFromNodeId || node.id;
  const sameMainRebirths = nodes
    .filter(
      (n) =>
        n.isRebirth &&
        (n.rank || 1) === targetRank &&
        (n.originalAncestorId === mainId || n.rebornFromNodeId === mainId)
    )
    .sort((a, b) => a.id - b.id);
  const index = sameMainRebirths.findIndex((n) => n.id === node.id);
  const vaultCloneIndex =
    node.vaultCloneRankCount !== undefined
      ? node.vaultCloneRankCount
      : index !== -1
      ? index
      : 0;
  const seq =
    roundOverride !== undefined
      ? roundOverride
      : node.vaultCloneRound !== undefined
      ? node.vaultCloneRound
      : index !== -1
      ? (index % 2) + 1
      : 1;

  return {
    isRebirth: true,
    mainId,
    nodeId: node.id,
    vaultCloneIndex,
    round: seq,
    fullLabel: `#${mainId}#${node.id}#${vaultCloneIndex} โคลนนิ่งรอบ ${seq}`,
  };
}



