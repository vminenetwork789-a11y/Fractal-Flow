import React, { useState } from 'react';
import {
  Sparkles,
  X,
  GitBranch,
  ArrowRight,
  ArrowDownLeft,
  ArrowDownRight,
  Shield,
  Wallet,
  Coins,
  Cpu,
  Layers,
  Flame,
  CheckCircle2,
  Zap,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { MatrixNode, WalletAccount, SlotTarget } from '../types';
import { REGISTRATION_FEE } from '../lib/matrixSimulator';

interface RebirthModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeId: number | null;
  nodes: MatrixNode[];
  wallets: WalletAccount[];
  onFocusNodeInTree?: (nodeId: number) => void;
  onExecuteRebirth?: (nodeId: number, targetParentId?: number, isLeft?: boolean) => void;
  findRebirthSlot?: (nodeId: number, targetRank?: number) => SlotTarget | null;
  rebirthPool?: number;
}

export const RebirthModal: React.FC<RebirthModalProps> = ({
  isOpen,
  onClose,
  selectedNodeId,
  nodes,
  wallets,
  onFocusNodeInTree,
  onExecuteRebirth,
  findRebirthSlot,
  rebirthPool = 0,
}) => {
  const [activeRebornId, setActiveRebornId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const nodeMap = new Map<number, MatrixNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Find all reborn nodes in system
  const allRebornNodes = nodes.filter((n) => n.isRebirth);

  // Determine current node to display in modal
  const initialTargetNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;
  
  // If current focused node is rebirth, pick it, else pick the first rebirth node or initialTargetNode
  const effectiveNodeId =
    activeRebornId !== null
      ? activeRebornId
      : initialTargetNode?.isRebirth
      ? initialTargetNode.id
      : allRebornNodes[0]?.id || (initialTargetNode ? initialTargetNode.id : 1);

  const currentNode = nodeMap.get(effectiveNodeId);

  const getWalletName = (address: string) => {
    const w = wallets.find((item) => item.address.toLowerCase() === address.toLowerCase());
    if (w) return w.name;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const ancestorId = currentNode?.rebornFromNodeId || currentNode?.originalAncestorId || 1;
  const ancestorNode = nodeMap.get(ancestorId);
  const parentNode = currentNode?.parentId ? nodeMap.get(currentNode.parentId) : null;

  const isLeftChild = parentNode ? parentNode.leftChild === currentNode?.id : false;

  // Sibling rebirth nodes from the same original ancestor / wallet
  const siblingRebornNodes = currentNode
    ? nodes.filter(
        (n) =>
          n.isRebirth &&
          (n.originalAncestorId === ancestorId || n.owner.toLowerCase() === currentNode.owner.toLowerCase())
      )
    : [];

  const handleExecute = (targetId: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!onExecuteRebirth || !findRebirthSlot) return;

    try {
      const targetNode = nodes.find((n) => n.id === targetId);
      const slot = findRebirthSlot(targetId, targetNode?.rank);
      if (!slot) {
        throw new Error('ไม่พบตำแหน่งว่างสำหรับเกิดใหม่');
      }
      onExecuteRebirth(targetId, slot.parentId, slot.isLeft);
      setSuccessMsg(`สั่งเกิดใหม่สำเร็จ! รหัส #${targetId} คลอดรหัสเกิดใหม่เรียบร้อยแล้ว`);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสั่งเกิดใหม่');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Glowing Gradient */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 px-4 sm:px-6 py-4 border-b border-purple-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  หน้าต่างข้อมูลรหัสโคลนนิ่ง (Cloning Modal)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 font-bold">
                  100% Cloning Pool
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                รายละเอียดสายการโคลนนิ่ง, ผังความเชื่อมโยง, และผลประโยชน์ของระบบ Infinite Loop
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/60 cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Messages */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </span>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-400 hover:text-emerald-200 text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </span>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-rose-200 text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Sibling Rebirth Selectors / All Reborn Nodes in System */}
          {allRebornNodes.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  <span>เลือกรหัสโคลนนิ่งที่ต้องการดู ({allRebornNodes.length} รหัสในระบบ):</span>
                </span>
                <span className="text-[10px] text-purple-300 font-mono">
                  กำลังดู: #{currentNode?.id}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {allRebornNodes.map((rn) => {
                  const isCur = rn.id === currentNode?.id;
                  const fromId = rn.rebornFromNodeId || rn.originalAncestorId || 1;
                  return (
                    <button
                      key={`reborn-sel-${rn.id}`}
                      onClick={() => {
                        setActiveRebornId(rn.id);
                        setSuccessMsg(null);
                        setErrorMsg(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold shrink-0 transition-all flex items-center space-x-1 border cursor-pointer ${
                        isCur
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105'
                          : 'bg-slate-800/90 text-purple-200 hover:bg-slate-700 border-slate-700 hover:border-purple-500/50'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>#{rn.id}</span>
                      <span className="text-[9px] opacity-80 font-normal">
                        (จาก #{fromId} | {rn.cloneSource === 'VAULT_EXCESS' ? 'Vault 6-45' : 'ผังขาว'})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentNode ? (
            <>
              {/* Main Rebirth Identity Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-indigo-950/40 border border-purple-700/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-800/40 pb-3">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="font-mono text-base sm:text-lg font-bold px-2.5 py-1 rounded-xl bg-purple-950 border border-purple-500/60 text-purple-200 flex items-center space-x-1">
                      <span className="text-amber-300 font-extrabold">
                        #{currentNode.rebornFromNodeId || currentNode.originalAncestorId || 1}
                      </span>
                      <span className="text-purple-300 font-bold">#{currentNode.id}</span>
                      <span className="text-indigo-200 text-xs font-normal">
                        ({currentNode.queueNumber || currentNode.id})
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>รหัสโคลนนิ่ง (Rebirth Node)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      ผูกติดกับไอดีหลัก #{currentNode.rebornFromNodeId || currentNode.originalAncestorId || 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
                      {currentNode.cloneSource === 'VAULT_EXCESS'
                        ? 'ที่มา: จากส่วนเกิน 40% Vault ผัง 6 ถึง ผัง 45'
                        : 'ที่มา: ผังขาว'}
                    </span>
                    {currentNode.cloneSource === 'VAULT_EXCESS' && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold">
                        {currentNode.cloneLabel ||
                          `#${currentNode.originalAncestorId || currentNode.rebornFromNodeId || 1} #${currentNode.id} #${currentNode.vaultCloneRankCount ?? 0} รอบ ${currentNode.vaultCloneRound || 1}`}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                      Rank {currentNode.rank || 1}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300">
                    ความลึกในผัง: <strong className="text-indigo-300 font-mono">ชั้นที่ {currentNode.depth}</strong>
                  </div>
                </div>

                {/* 2-Column Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Left Column: Origin & Owner */}
                  <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">กำเนิดมาจาก (Original Ancestor)</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-purple-300 flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5 text-purple-400" />
                        <span>รหัสต้นทาง #{ancestorId}</span>
                      </span>
                      {onFocusNodeInTree && (
                        <button
                          onClick={() => {
                            onFocusNodeInTree(ancestorId);
                            onClose();
                          }}
                          className="px-2 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[10px] font-bold border border-purple-700 transition-colors flex items-center space-x-1 cursor-pointer"
                          title="สลับผังไปดูรหัสต้นทาง"
                        >
                          <span>ไปดูรหัส #{ancestorId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 pt-1 border-t border-slate-800">
                      <Wallet className="w-3 h-3 text-slate-400" />
                      <span className="truncate">เจ้าของ: {getWalletName(currentNode.owner)}</span>
                      <span className="text-emerald-400 font-semibold">(กระเป๋าเดียวกัน)</span>
                    </div>
                  </div>

                  {/* Right Column: Parent Slot in Matrix */}
                  <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">ตำแหน่งติดตั้งในผัง (Parent Slot)</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-indigo-200">
                        ต่อใต้รหัสพ่อ: <strong className="text-indigo-400 font-bold">#{currentNode.parentId}</strong>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center ${
                          isLeftChild
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}
                      >
                        {isLeftChild ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3 mr-0.5 text-emerald-400" />
                            ขาซ้าย (1)
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-3 h-3 mr-0.5 text-purple-400" />
                            ขาขวา (2)
                          </>
                        )}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>ลูกติดตัวซ้าย: #{currentNode.leftChild || 'ว่าง'}</span>
                      <span>ลูกติดตัวขวา: #{currentNode.rightChild || 'ว่าง'}</span>
                    </div>
                  </div>
                </div>

                {/* Genealogy Visual Flow Diagram */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-800/40 space-y-2">
                  <div className="text-[11px] font-semibold text-purple-300 flex items-center space-x-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                    <span>สายการกำเนิด (Rebirth Lineage Flow)</span>
                  </div>

                  <div className="flex items-center justify-center space-x-2 sm:space-x-4 py-2 px-1 overflow-x-auto text-xs">
                    {/* Ancestor Node */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-center shrink-0 min-w-[90px]">
                      <div className="text-[9px] text-slate-400">รหัสต้นทาง</div>
                      <div className="font-mono font-bold text-indigo-300">#{ancestorId}</div>
                      <div className="text-[8px] text-slate-500 truncate max-w-[80px]">
                        {getWalletName(ancestorNode?.owner || currentNode.owner)}
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0 text-purple-400">
                      <span className="text-[8px] font-mono text-purple-300 font-semibold">100% ขาขวา</span>
                      <ArrowRight className="w-4 h-4 text-purple-400 animate-pulse" />
                      <span className="text-[7.5px] text-slate-400">5.0 USDT</span>
                    </div>

                    {/* Keeper Bot Placement */}
                    <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-700 text-center shrink-0 min-w-[90px]">
                      <div className="text-[9px] text-purple-300 flex items-center justify-center space-x-0.5">
                        <Cpu className="w-2.5 h-2.5" />
                        <span>Keeper Bot</span>
                      </div>
                      <div className="font-mono font-bold text-purple-200">Auto Placement</div>
                      <div className="text-[8px] text-emerald-400">ใต้ #{currentNode.parentId}</div>
                    </div>

                    <div className="flex flex-col items-center shrink-0 text-purple-400">
                      <ArrowRight className="w-4 h-4 text-purple-400" />
                      <span className="text-[7.5px] text-slate-400">คลอดรหัส</span>
                    </div>

                    {/* This Rebirth Node */}
                    <div className="p-2 rounded-xl bg-purple-900/80 border-2 border-purple-400 text-center shrink-0 min-w-[90px] shadow-lg">
                      <div className="text-[9px] text-purple-200 font-semibold">รหัสโคลนนิ่ง</div>
                      <div className="font-mono font-bold text-white text-sm">#{currentNode.id}</div>
                      <div className="text-[8px] text-purple-200 font-medium">กระเป๋าเดิม 100%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Rebirth Rounds Summary Table */}
              {siblingRebornNodes.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-800/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-100">
                        ตารางสรุปประวัติรอบเกิดใหม่ทั้งหมดของสายงานนี้ (รวม {siblingRebornNodes.length} รอบ)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-700/60">
                      รหัสหลัก #{ancestorId}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-900/60">
                          <th className="p-2">รอบที่</th>
                          <th className="p-2">รหัสเกิดใหม่</th>
                          <th className="p-2">ผัง Rank</th>
                          <th className="p-2">กฎรอบ / รูปแบบวาง</th>
                          <th className="p-2">ตำแหน่งเข้าต่อ</th>
                          <th className="p-2 text-right">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {siblingRebornNodes.map((rn, idx) => {
                          const roundNum = idx + 1;
                          const cycleNum = Math.floor(idx / 2) + 1;
                          const roundInCycle = (idx % 2) + 1;
                          const isCur = rn.id === currentNode.id;
                          const pNode = nodeMap.get(rn.parentId);
                          const isLeft = pNode ? pNode.leftChild === rn.id : true;

                          return (
                            <tr
                              key={`round-row-${rn.id}`}
                              className={`transition-colors ${
                                isCur ? 'bg-purple-950/50 font-bold text-white' : 'hover:bg-slate-900/50 text-slate-300'
                              }`}
                            >
                              <td className="p-2 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50 text-[10px] font-bold">
                                  รอบที่ {roundNum} (วัฏจักร {cycleNum})
                                </span>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <div className="flex items-center space-x-1">
                                  <span className="text-amber-300 font-extrabold">#{ancestorId}</span>
                                  <span className="text-purple-300 font-bold">#{rn.id}</span>
                                  <span className="text-indigo-200 text-[10px]">({rn.queueNumber || rn.id})</span>
                                </div>
                              </td>
                              <td className="p-2 whitespace-nowrap text-amber-300">
                                Rank {rn.rank || 1}
                              </td>
                              <td className="p-2 whitespace-nowrap text-[10px] text-slate-300 font-sans">
                                {ancestorId === 1 ? (
                                  <span className="text-emerald-300">กรณี ID #1: วนกลับต่อผังตนเอง</span>
                                ) : roundInCycle === 1 ? (
                                  <span className="text-purple-300">🌱 รอบ 1: วางติดตัวผู้แนะนำ</span>
                                ) : (
                                  <span className="text-indigo-300">🌐 รอบ 2: กระจายช่วยชุมชน</span>
                                )}
                              </td>
                              <td className="p-2 whitespace-nowrap text-[10px] text-slate-400">
                                ต่อใต้ #{rn.parentId} ({isLeft ? 'ขาซ้าย' : 'ขาขวา'})
                              </td>
                              <td className="p-2 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveRebornId(rn.id);
                                    if (onFocusNodeInTree) {
                                      onFocusNodeInTree(rn.id);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    isCur
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-slate-800 text-purple-200 hover:bg-purple-900/60 border border-slate-700'
                                  }`}
                                >
                                  {isCur ? 'กำลังดู' : 'ดูรอบนี้'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rebirth Superpowers & Benefits */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>สิทธิประโยชน์ที่รหัสโคลนนิ่ง #{currentNode.id} ได้รับเหมือนรหัสจริงทุกประการ:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-300 block">รับค่าแนะนำตรง 30% (1.5 USDT)</strong>
                      <span className="text-slate-400 text-[11px]">
                        เมื่อมีคนมาต่อติดตัว ค่าแนะนำจะส่งเข้ากระเป๋าเดิมของท่าน
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-indigo-300 block">รับโบนัสบริหาร 15 ชั้นลึก (2%)</strong>
                      <span className="text-slate-400 text-[11px]">
                        รับ 0.10 USDT ทุกๆ รหัสที่เกิดขึ้นใน 15 ชั้นลึกใต้รหัสนี้
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 block">สะสม Upgrade Vault 40% (2.0 USDT)</strong>
                      <span className="text-slate-400 text-[11px]">
                        ปัจจุบันสะสม: {currentNode.upgradeVault.toFixed(1)} USDT เตรียมอัปเกรด Rank ถัดไป
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-purple-300 block">วงจรเกิดใหม่ไม่สิ้นสุด (Infinite Loop)</strong>
                      <span className="text-slate-400 text-[11px]">
                        เมื่อรหัสนี้มีคนมาต่อขาขวา (เม็ด 2) จะส่งเงิน 100% เข้า Rebirth Pool คลอดรหัสรุ่นถัดไป
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Rebirth Section if any */}
              {currentNode.pendingRebirths > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                      <span className="text-xs font-bold text-amber-200">
                        รหัสนี้มียอดรอเกิดใหม่ (Pending Rebirth): {currentNode.pendingRebirths} รอบ
                      </span>
                    </div>
                    {onExecuteRebirth && findRebirthSlot && (
                      <button
                        onClick={() => handleExecute(currentNode.id)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-300" />
                        <span>สั่งเกิดใหม่ทันที (Execute)</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-300/80">
                    มีเงินใน Rebirth Pool พร้อมประมวลผล สามารถกดสั่งคลอดรหัสใหม่ไปต่อยังตำแหน่งว่างใต้ผังได้ทันที
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีรหัสเกิดใหม่ที่ถูกสร้างในระบบ</p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            {currentNode && onFocusNodeInTree && (
              <button
                type="button"
                onClick={() => {
                  onFocusNodeInTree(currentNode.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>โฟกัสรหัส #{currentNode.id} ในผังต้นไม้</span>
              </button>
            )}

            {ancestorId && ancestorId !== currentNode?.id && onFocusNodeInTree && (
              <button
                type="button"
                onClick={() => {
                  onFocusNodeInTree(ancestorId);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <span>ไปดูรหัสต้นทาง (#{ancestorId})</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
