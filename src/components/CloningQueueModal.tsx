import React, { useState } from 'react';
import { MatrixNode, WalletAccount } from '../types';
import { getRankInfo } from '../lib/matrixSimulator';
import {
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Coins,
  Search,
  User,
  ArrowRight,
  Play,
  Layers,
  ChevronRight,
  Flame,
  ShieldAlert,
} from 'lucide-react';

interface CloningQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRank: number;
  activeNodes: MatrixNode[];
  allNodes: MatrixNode[];
  wallets: WalletAccount[];
  activeRebirthPool: number;
  onSelectNode: (nodeId: number) => void;
  onExecuteRankRebirth?: (rank: number, nodeId: number) => void;
  onExecuteRebirth?: (nodeId: number, targetParentId?: number, isLeft?: boolean) => void;
  onBatchExecuteRebirths?: () => void;
  onTopupRebirthPool?: (amount: number) => void;
}

export const CloningQueueModal: React.FC<CloningQueueModalProps> = ({
  isOpen,
  onClose,
  selectedRank,
  activeNodes,
  allNodes,
  wallets,
  activeRebirthPool,
  onSelectNode,
  onExecuteRankRebirth,
  onExecuteRebirth,
  onBatchExecuteRebirths,
  onTopupRebirthPool,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const rankInfo = getRankInfo(selectedRank);
  const rankPrice = rankInfo.price || 5.0;

  // Filter nodes with pendingRebirths > 0, SORTED ascending by ID (น้อยไปมาก)
  const currentPendingNodes = activeNodes
    .filter((n) => n.pendingRebirths && n.pendingRebirths > 0)
    .sort((a, b) => a.id - b.id);

  const allPendingNodes = allNodes
    .filter((n) => n.pendingRebirths && n.pendingRebirths > 0)
    .sort((a, b) => a.id - b.id);

  const targetList = activeTab === 'current' ? currentPendingNodes : allPendingNodes;

  const filteredNodes = targetList.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.id.toString().includes(q) ||
      n.owner.toLowerCase().includes(q) ||
      (n.rank && n.rank.toString().includes(q))
    );
  });

  const totalCurrentPendingCount = currentPendingNodes.reduce(
    (sum, n) => sum + (n.pendingRebirths || 0),
    0
  );

  const totalAllPendingCount = allPendingNodes.reduce(
    (sum, n) => sum + (n.pendingRebirths || 0),
    0
  );

  const handleExecuteSingleNode = (node: MatrixNode) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const targetRank = activeTab === 'current' ? selectedRank : (selectedRank === 1 ? 1 : (node.rank || selectedRank));
      if (targetRank > 1 && onExecuteRankRebirth) {
        onExecuteRankRebirth(targetRank, node.id);
        setSuccessMsg(`สั่งโคลนนิ่งสำเร็จสำหรับรหัส #${node.id} ใน Rank ${targetRank}!`);
      } else if (onExecuteRebirth) {
        onExecuteRebirth(node.id);
        setSuccessMsg(`สั่งโคลนนิ่งสำเร็จสำหรับรหัส #${node.id}!`);
      } else if (onExecuteRankRebirth) {
        onExecuteRankRebirth(1, node.id);
        setSuccessMsg(`สั่งโคลนนิ่งสำเร็จสำหรับรหัส #${node.id}!`);
      } else {
        throw new Error('ไม่พบฟังก์ชั่นสั่งทำรายการโคลนนิ่งในระบบ');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสั่งโคลนนิ่ง');
    }
  };

  const handleExecuteAllInQueue = () => {
    setSuccessMsg(null);
    setErrorMsg(null);

    if (targetList.length === 0) {
      setErrorMsg('ไม่มีคิวที่รอโคลนนิ่งในขณะนี้');
      return;
    }

    if (activeRebirthPool < rankPrice) {
      setErrorMsg(`กองกลาง Rebirth Pool ไม่เพียงพอ (ปัจจุบันมี ${activeRebirthPool.toFixed(2)} USDT / ต้องการ ${rankPrice.toFixed(2)} USDT ต่อรอบ) — ต้องรอลูกขาขวา 100% หรือเติมเงินกองกลางก่อน`);
      return;
    }

    if (onBatchExecuteRebirths) {
      try {
        onBatchExecuteRebirths();
        setSuccessMsg(`🚀 ส่งคำสั่งประมวลผลระบบคิวเรียบร้อยแล้ว! ระบบกำลังเริ่มรันทีละรอบจาก ID น้อยไปมาก...`);
        return;
      } catch (err: any) {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาด');
        return;
      }
    }

    let successCount = 0;
    const nodesToProcess = [...targetList].sort((a, b) => a.id - b.id);

    try {
      for (const node of nodesToProcess) {
        const targetRank = activeTab === 'current' ? selectedRank : (selectedRank === 1 ? 1 : (node.rank || selectedRank));
        if (targetRank > 1 && onExecuteRankRebirth) {
          onExecuteRankRebirth(targetRank, node.id);
          successCount++;
        } else if (onExecuteRebirth) {
          onExecuteRebirth(node.id);
          successCount++;
        } else if (onExecuteRankRebirth) {
          onExecuteRankRebirth(1, node.id);
          successCount++;
        }
      }
      setSuccessMsg(`ประมวลผลระบบคิวเรียบร้อยแล้ว! ส่งคำสั่งสั่งโคลนนิ่งได้ ${successCount} รายการ (ไล่ลำดับจากน้อยไปมาก)`);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดระหว่างประมวลผลคิวโคลนนิ่ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in notranslate" translate="no">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  ระบบคิวรอโคลนนิ่ง (Cloning Pending Queue)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold">
                  Rank {selectedRank}: {rankInfo.title}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                รายการรหัสที่ติดคิวรอโคลนนิ่งเพื่อรับรหัสโคลนนิ่งเข้าผังอย่างสมบูรณ์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </span>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-400 hover:text-emerald-200 text-xs ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-300 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </span>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-rose-200 text-xs ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Metric Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-medium">รหัสรอโคลนนิ่ง (ผังนี้)</div>
              <div className="text-base sm:text-lg font-mono font-bold text-amber-300 flex items-center space-x-1">
                <span>{currentPendingNodes.length}</span>
                <span className="text-xs text-slate-400">รหัส</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-medium">รวมคิวรอทั้งหมด</div>
              <div className="text-base sm:text-lg font-mono font-bold text-purple-300 flex items-center space-x-1">
                <span>{totalCurrentPendingCount}</span>
                <span className="text-xs text-slate-400">คิว</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-medium">กองกลาง Rebirth Pool</div>
              <div className={`text-base sm:text-lg font-mono font-bold ${activeRebirthPool >= rankPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeRebirthPool.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-medium">ราคาโคลนนิ่งต่อรอบ</div>
              <div className="text-base sm:text-lg font-mono font-bold text-amber-400">
                {rankPrice.toFixed(2)} <span className="text-xs font-normal text-slate-400">USDT</span>
              </div>
            </div>
          </div>

          {/* ⚠️ Pool Notice if Insufficient */}
          {targetList.length > 0 && activeRebirthPool < rankPrice && (
            <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>สถานะกองกลาง:</strong> มี {activeRebirthPool.toFixed(2)} USDT (ต้องการ {rankPrice.toFixed(2)} USDT ต่อรอบ) — รหัสที่รอคิวจะโคลนนิ่งอัตโนมัติเมื่อมีสมาชิกใหม่มาต่อขาขวา 100% (5.00 USDT)
                </span>
              </div>
              {onTopupRebirthPool && (
                <button
                  type="button"
                  onClick={() => onTopupRebirthPool(targetList.length * rankPrice)}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow transition"
                >
                  + เติมกองกลาง (+{(targetList.length * rankPrice).toFixed(0)} U เพื่อทดสอบ)
                </button>
              )}
            </div>
          )}

          {/* Scope Selector Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800">
            <div className="flex items-center space-x-1 border border-slate-800 rounded-xl p-1 bg-slate-950/70 text-xs">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'current'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>คิวในผังนี้ (Rank {selectedRank})</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-200 text-[10px] font-mono border border-amber-500/30">
                  {currentPendingNodes.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>คิวทั้งหมดในระบบ (ทุก Rank)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-200 text-[10px] font-mono border border-purple-500/30">
                  {allPendingNodes.length}
                </span>
              </button>
            </div>

            {/* Batch execution button if items present */}
            {targetList.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteAllInQueue}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 border border-amber-400/40"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                <span>⚡ สั่งประมวลผลโคลนนิ่งทั้งหมด ({targetList.length} รายการ • ไล่จากน้อยไปมาก)</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามรหัส ID (#1, #2...) หรือที่อยู่กระเป๋า..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Queue List Table / Cards */}
          {filteredNodes.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 px-1 flex items-center justify-between">
                <span>รายการรหัสที่รอการโคลนนิ่ง ({filteredNodes.length} รหัส):</span>
                <span>เรียงตามลำดับการเข้าคิว</span>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {filteredNodes.map((node, index) => {
                  const ownerWallet = wallets.find(
                    (w) => w.address.toLowerCase() === node.owner.toLowerCase()
                  );
                  const targetNodeRank = activeTab === 'current' ? selectedRank : (selectedRank === 1 ? 1 : (node.rank || selectedRank));
                  const nodePrice = getRankInfo(targetNodeRank).price || 5.0;
                  const isReadyToExecute = activeRebirthPool >= nodePrice;

                  return (
                    <div
                      key={`queue-item-${node.id}-${index}`}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-2.5 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Left: Node Info */}
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-white text-sm">
                                {node.isRebirth ? (
                                  <>
                                    รหัสหลัก <span className="text-amber-300">#{node.originalAncestorId || node.rebornFromNodeId || node.id}</span>
                                    <span className="text-purple-300 font-bold ml-1">#{node.id}</span>
                                    <span className="text-indigo-300 font-normal ml-0.5">({node.queueNumber || node.id})</span>
                                  </>
                                ) : (
                                  <>
                                    รหัส <span className="text-amber-300">#{node.id}</span>
                                    <span className="text-indigo-300 font-normal ml-0.5">({node.queueNumber || node.id})</span>
                                  </>
                                )}
                              </span>
                              {node.isRebirth && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700/60 text-[10px] font-mono flex items-center gap-1">
                                  <span>โคลนนิ่งจาก #{node.originalAncestorId || node.rebornFromNodeId}</span>
                                  <span className="text-[9px] px-1 py-0.1 bg-amber-950 text-amber-300 border border-amber-800 rounded font-bold">
                                    {node.cloneSource === 'VAULT_EXCESS'
                                      ? `ส่วนเกิน Vault 40% (${node.cloneLabel || `#${node.originalAncestorId || node.rebornFromNodeId || 1} #${node.id} #${node.vaultCloneRankCount ?? 0} รอบ ${node.vaultCloneRound || 1}`})`
                                      : 'ผังขาว'}
                                  </span>
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-mono font-bold">
                                Rank {targetNodeRank}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="flex items-center space-x-1 font-mono">
                                <User className="w-3 h-3 text-slate-500" />
                                <span>{ownerWallet?.name || 'กระเป๋า'}</span>
                                <span className="text-slate-500">
                                  ({node.owner.slice(0, 6)}...{node.owner.slice(-4)})
                                </span>
                              </span>
                              <span>•</span>
                              <span>ชั้นที่ {node.depth}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Pending Count & Pool Status */}
                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono block">
                              รอโคลนนิ่ง {node.pendingRebirths} คิว
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              ต้องการ {nodePrice.toFixed(2)} USDT / รอบ
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          {isReadyToExecute ? (
                            <span className="text-emerald-400 font-semibold flex items-center space-x-1 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>กองกลางพร้อมสั่งโคลนนิ่ง</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium flex items-center space-x-1 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/60">
                              <AlertCircle className="w-3 h-3" />
                              <span>รอกองกลางสะสมเพิ่มเติม ({activeRebirthPool.toFixed(2)}/{nodePrice.toFixed(2)} USDT)</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectNode(node.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1 border border-slate-700"
                            title="คลิกเพื่อเลือกและดูตำแหน่งรหัสนี้ในผัง"
                          >
                            <Search className="w-3 h-3 text-indigo-300" />
                            <span>ดูตำแหน่งในผัง</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExecuteSingleNode(node)}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-1"
                          >
                            <Play className="w-3 h-3 text-amber-200 fill-amber-200" />
                            <span>สั่งโคลนนิ่งทันที</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/50 border border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-slate-200">
                ไม่มีรหัสที่รอการโคลนนิ่งในขณะนี้
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                เมื่อสมาชิกลงตำแหน่งลูกขาขวาเต็ม รหัสเจ้าของผังจะถูกส่งเข้าสู่ระบบคิวรอโคลนนิ่งโดยอัตโนมัติ
              </p>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-800/40 space-y-2 text-xs">
            <div className="font-bold text-purple-200 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>หลักการทำงานของระบบคิวรอโคลนนิ่ง (Cloning Queue Rule):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <li>
                <strong className="text-amber-300">เข้าคิวอัตโนมัติ:</strong> เมื่อสมาชิกเติมเต็มตำแหน่งเม็ดลูกขาขวา เงิน 100% จะเข้าสู่ Rebirth Pool และสั่งรหัสเดิมเข้าสู่คิวรอโคลนนิ่ง (Pending Queue +1)
              </li>
              <li>
                <strong className="text-emerald-300">การออกไอดีโคลนนิ่ง:</strong> เมื่อกองกลาง Rebirth Pool มีสะสมครบ {rankPrice.toFixed(2)} USDT ระบบหรือ Keeper Bot จะส่งคำสั่งประมวลผลดึงรหัสจากคิวมาลงตำแหน่งว่างใหม่ในผังทันที
              </li>
              <li>
                <strong className="text-indigo-300">ประโยชน์สิทธิ:</strong> รหัสโคลนนิ่งใหม่ได้รับสิทธิประโยชน์และสร้างรายได้ให้ไอดีหลักเสมือนรหัสจริง 100%
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            คิวรวมทั้งหมดในระบบ: <strong className="text-white font-mono">{totalAllPendingCount} คิว</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
