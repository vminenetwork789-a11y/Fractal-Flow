import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MatrixNode, WalletAccount } from '../types';
import {
  X,
  Search,
  GitBranch,
  Shield,
  User,
  Sparkles,
  ArrowRight,
  Check,
  Filter,
  Layers,
  Crown,
  Target,
  Info,
} from 'lucide-react';
import { getRankInfo, RANKS } from '../lib/matrixSimulator';

interface TreeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRank: number;
  activeNodes: MatrixNode[];
  allNodes: MatrixNode[];
  wallets: WalletAccount[];
  getRankMatrixNodes?: (rank: number) => MatrixNode[];
  onFocusNode: (nodeId: number, targetRank: number) => void;
}

export const TreeSearchModal: React.FC<TreeSearchModalProps> = ({
  isOpen,
  onClose,
  selectedRank,
  activeNodes,
  allNodes,
  wallets,
  getRankMatrixNodes,
  onFocusNode,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchScope, setSearchScope] = useState<'currentRank' | 'allRanks'>('currentRank');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'MAIN' | 'REBIRTH' | 'MY_WALLET'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to map wallet address to wallet name
  const getWalletName = (ownerAddress: string) => {
    const w = wallets.find((item) => item.address.toLowerCase() === ownerAddress?.toLowerCase());
    return w ? w.name : ownerAddress ? `${ownerAddress.substring(0, 6)}...` : 'Unknown';
  };

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Aggregate nodes for search based on scope
  const poolNodes = useMemo(() => {
    if (searchScope === 'currentRank') {
      return activeNodes.map((n) => ({ ...n, matrixRank: selectedRank }));
    }

    // Search across all ranks
    const allRankNodes: (MatrixNode & { matrixRank: number })[] = [];
    
    // Check all ranks from 1 to 45
    for (let r = 1; r <= 45; r++) {
      let rNodes: MatrixNode[] = [];
      if (r === 1) {
        rNodes = allNodes;
      } else if (getRankMatrixNodes) {
        rNodes = getRankMatrixNodes(r);
      }

      rNodes.forEach((n) => {
        allRankNodes.push({ ...n, matrixRank: r });
      });
    }

    return allRankNodes;
  }, [searchScope, selectedRank, activeNodes, allNodes, getRankMatrixNodes]);

  // Filter and search nodes
  const searchResults = useMemo(() => {
    let result = poolNodes;

    // Apply Category Filter
    if (filterCategory === 'MAIN') {
      result = result.filter((n) => !n.isRebirth);
    } else if (filterCategory === 'REBIRTH') {
      result = result.filter((n) => n.isRebirth);
    } else if (filterCategory === 'MY_WALLET') {
      const activeWallet = wallets[0]; // Primary wallet
      if (activeWallet) {
        result = result.filter((n) => n.owner.toLowerCase() === activeWallet.address.toLowerCase());
      }
    }

    // Apply Search Term
    const term = searchTerm.trim().toLowerCase();
    if (!term) return result;

    return result.filter((n) => {
      const nodeIdStr = String(n.id);
      const queueNumStr = n.queueNumber ? String(n.queueNumber) : '';
      const mainIdStr = n.originalAncestorId ? String(n.originalAncestorId) : String(n.rebornFromNodeId || '');
      const walletName = getWalletName(n.owner).toLowerCase();
      const ownerAddr = n.owner.toLowerCase();
      const rankTitle = getRankInfo(n.matrixRank).title.toLowerCase();

      // Keyword match
      const matchId = nodeIdStr === term || nodeIdStr.includes(term);
      const matchQueue = queueNumStr === term || queueNumStr.includes(term);
      const matchMainId = mainIdStr === term || mainIdStr.includes(term);
      const matchWallet = walletName.includes(term) || ownerAddr.includes(term);
      const matchRank = rankTitle.includes(term) || `ผังที่ ${n.matrixRank}`.includes(term);
      const matchType = term === 'rebirth' || term === 'โคลน' ? n.isRebirth : true;

      return matchId || matchQueue || matchMainId || matchWallet || matchRank;
    });
  }, [poolNodes, filterCategory, searchTerm, wallets]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-16 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center space-x-3 z-10">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  ค้นหารหัสในผังไบนารี่ (Tree Search)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold">
                  {searchResults.length} ผลลัพธ์
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ค้นหาด้วย Node ID, Main ID, ชื่อกระเป๋า หรือรหัสโคลนนิ่ง เพื่อกระโดดไปยังผังทันที
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="พิมพ์ ID เช่น 1, 2, 10 หรือชื่อกระเป๋า id1, id2..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-950 border border-indigo-500/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-inner transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Tag Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-slate-500 font-medium whitespace-nowrap">แท็กทางลัด:</span>
            {['#1 (id1)', '#2', '#3', '#4', '#5', 'Rebirth'].map((tag) => (
              <button
                key={`quick-tag-${tag}`}
                onClick={() => setSearchTerm(tag.replace('#', '').split(' ')[0])}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10.5px] border border-slate-700/80 transition-colors whitespace-nowrap"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Controls Bar: Scope & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-800">
            {/* Scope Selector */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setSearchScope('currentRank')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  searchScope === 'currentRank'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>ผังปัจจุบัน (ผัง {selectedRank})</span>
              </button>
              <button
                onClick={() => setSearchScope('allRanks')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  searchScope === 'allRanks'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>ค้นหาทุกผัง (1-45)</span>
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterCategory === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterCategory('MAIN')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterCategory === 'MAIN'
                    ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
                    : 'bg-slate-800/80 text-slate-400 hover:text-indigo-300'
                }`}
              >
                รหัสหลัก
              </button>
              <button
                onClick={() => setFilterCategory('REBIRTH')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterCategory === 'REBIRTH'
                    ? 'bg-purple-950 border border-purple-700 text-purple-300'
                    : 'bg-slate-800/80 text-slate-400 hover:text-purple-300'
                }`}
              >
                🌱 โคลนนิ่ง
              </button>
            </div>
          </div>

          {/* Search Results List */}
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-400">
                  ไม่พบรหัสที่ตรงกับ "{searchTerm}"
                </p>
                <p className="text-xs text-slate-500">
                  {searchScope === 'currentRank'
                    ? 'ลองสลับโหมดเป็น "ค้นหาทุกผัง (1-45)" เพื่อค้นหาข้ามผังทั้งหมด'
                    : 'ลองพิมพ์เฉพาะตัวเลข ID หรือชื่อกระเป๋า'}
                </p>
              </div>
            ) : (
              searchResults.map((node) => {
                const mainId = node.originalAncestorId || node.rebornFromNodeId || node.id;
                const globalNodeId = node.queueNumber || node.id;
                const ownerName = getWalletName(node.owner);
                const rankInfo = getRankInfo(node.matrixRank);

                return (
                  <div
                    key={`search-result-${node.matrixRank}-${node.id}`}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    {/* Left: Node Specs */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {/* ID Badge */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-300 font-mono font-bold text-xs flex items-center space-x-1">
                          {node.id === 1 ? (
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                          ) : node.isRebirth ? (
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span>
                            #{node.matrixRank === 1 ? node.id : `${mainId}(${globalNodeId})`}
                          </span>
                        </span>

                        {/* Rank Badge */}
                        <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800 text-purple-300 text-[10.5px] font-medium">
                          ผังที่ {node.matrixRank}: {rankInfo.title}
                        </span>

                        {/* Rebirth Tag */}
                        {node.isRebirth && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                            🌱 Rebirth
                          </span>
                        )}
                      </div>

                      {/* Owner & Parent Info */}
                      <div className="flex items-center space-x-3 text-slate-400 text-[11px] pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-200">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{ownerName}</span>
                        </span>
                        <span>•</span>
                        <span>
                          {node.parentId === 0 ? '👑 Root Pioneer' : `อยู่ใต้พ่อ #${node.parentId}`}
                        </span>
                      </div>
                    </div>

                    {/* Right: Action Jump Button */}
                    <button
                      onClick={() => {
                        onFocusNode(node.id, node.matrixRank);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md shrink-0 active:scale-95"
                    >
                      <Target className="w-3.5 h-3.5 text-amber-300" />
                      <span>🎯 โฟกัสผังรหัสนี้</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>คลิกปุ่มเพื่อแสดงผังและเลือกไฮไลท์รหัสทันที</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
