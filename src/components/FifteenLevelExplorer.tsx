import React, { useState, useMemo } from 'react';
import { MatrixNode, WalletAccount } from '../types';
import { RebirthModal } from './RebirthModal';
import {
  Layers,
  Coins,
  ChevronDown,
  ChevronRight,
  User,
  ArrowDownLeft,
  ArrowDownRight,
  Sparkles,
  Shield,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Zap,
  Eye,
  Filter,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getRankPrice, MAX_RANK } from '../lib/matrixSimulator';
import { getRebirthSeqForMain } from '../lib/rebirthUtils';

interface FifteenLevelExplorerProps {
  nodes: MatrixNode[];
  wallets: WalletAccount[];
  rootId: number;
  onChangeRootId: (id: number) => void;
  selectedNodeId: number;
  onSelectNode: (id: number) => void;
  onQuickRegisterUnder: (parentId: number, isLeft: boolean) => void;
  rankPrice?: number;
}

export interface DownlineNodeItem {
  node: MatrixNode;
  parent: MatrixNode | undefined;
  isLeft: boolean;
  relativeLevel: number;
  path: string;
}

export interface LevelSummary {
  level: number;
  capacity: number;
  nodes: DownlineNodeItem[];
  earnedUsdt: number;
}

export const FifteenLevelExplorer: React.FC<FifteenLevelExplorerProps> = ({
  nodes,
  wallets,
  rootId,
  onChangeRootId,
  selectedNodeId,
  onSelectNode,
  onQuickRegisterUnder,
  rankPrice = 5.0,
}) => {
  const { t } = useLanguage();
  const currentRank = nodes[0]?.rank || 1;
  const perLevelBonus = useMemo(() => +(rankPrice * 0.02).toFixed(2), [rankPrice]);
  const [filterOnlyActive, setFilterOnlyActive] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Rebirth Modal state
  const [isRebirthModalOpen, setIsRebirthModalOpen] = useState<boolean>(false);
  const [rebornModalNodeId, setRebornModalNodeId] = useState<number | null>(null);
  
  const nodeMap = useMemo(() => {
    const map = new Map<number, MatrixNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const rootNode = nodeMap.get(rootId) || nodeMap.get(1);

  const getWalletName = (address: string) => {
    const w = wallets.find((item) => item.address.toLowerCase() === address.toLowerCase());
    if (w) return w.name;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Compute all 15 downline levels using Breadth-First Search (BFS)
  const fifteenLevels = useMemo(() => {
    const levels: LevelSummary[] = [];

    // Pre-create levels 1 through 15
    for (let lvl = 1; lvl <= 15; lvl++) {
      levels.push({
        level: lvl,
        capacity: Math.pow(2, lvl),
        nodes: [],
        earnedUsdt: 0,
      });
    }

    if (!rootNode) return levels;

    interface QueueItem {
      nodeId: number;
      parent: MatrixNode;
      isLeft: boolean;
      relLevel: number;
      path: string;
    }

    const queue: QueueItem[] = [];

    if (rootNode.leftChild !== 0) {
      queue.push({
        nodeId: rootNode.leftChild,
        parent: rootNode,
        isLeft: true,
        relLevel: 1,
        path: 'ซ้าย (1)',
      });
    }
    if (rootNode.rightChild !== 0) {
      queue.push({
        nodeId: rootNode.rightChild,
        parent: rootNode,
        isLeft: false,
        relLevel: 1,
        path: 'ขวา (2)',
      });
    }

    while (queue.length > 0) {
      const item = queue.shift()!;
      const curr = nodeMap.get(item.nodeId);
      if (!curr) continue;

      if (item.relLevel >= 1 && item.relLevel <= 15) {
        levels[item.relLevel - 1].nodes.push({
          node: curr,
          parent: item.parent,
          isLeft: item.isLeft,
          relativeLevel: item.relLevel,
          path: item.path,
        });
        levels[item.relLevel - 1].earnedUsdt = +(
          levels[item.relLevel - 1].nodes.length * perLevelBonus
        ).toFixed(2);
      }

      if (item.relLevel < 15) {
        if (curr.leftChild !== 0) {
          queue.push({
            nodeId: curr.leftChild,
            parent: curr,
            isLeft: true,
            relLevel: item.relLevel + 1,
            path: `${item.path} → ซ้าย`,
          });
        }
        if (curr.rightChild !== 0) {
          queue.push({
            nodeId: curr.rightChild,
            parent: curr,
            isLeft: false,
            relLevel: item.relLevel + 1,
            path: `${item.path} → ขวา`,
          });
        }
      }
    }

    return levels;
  }, [nodes, nodeMap, rootNode]);

  // Track expanded levels (default: expand all 15 levels)
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(() => {
    const all = new Set<number>();
    for (let i = 1; i <= 15; i++) all.add(i);
    return all;
  });

  const toggleLevel = (lvl: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) {
        next.delete(lvl);
      } else {
        next.add(lvl);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<number>();
    for (let i = 1; i <= 15; i++) all.add(i);
    setExpandedLevels(all);
  };

  const collapseAll = () => {
    setExpandedLevels(new Set<number>());
  };

  // High-level statistics
  const totalDownlineNodes = useMemo(() => {
    return fifteenLevels.reduce((acc, lvl) => acc + lvl.nodes.length, 0);
  }, [fifteenLevels]);

  const total15LevelBonus = useMemo(() => {
    return +(totalDownlineNodes * perLevelBonus).toFixed(2);
  }, [totalDownlineNodes, perLevelBonus]);

  const deepestActiveLevel = useMemo(() => {
    let max = 0;
    fifteenLevels.forEach((lvl) => {
      if (lvl.nodes.length > 0) max = lvl.level;
    });
    return max;
  }, [fifteenLevels]);

  return (
    <div className="space-y-4">
      {/* 15-Level Summary Header (Designed specifically for Mobile) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  {t('fifteenLevelTitle')}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-semibold">
                  {t('full15LevelsBadge')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {t('fifteenLevelSub')}
              </p>
            </div>
          </div>

          {/* Root Selector & Quick Jump */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 shrink-0">{t('focusIdLabel')}:</span>
            <select
              value={rootId}
              onChange={(e) => onChangeRootId(Number(e.target.value))}
              className="bg-slate-800 text-slate-100 text-xs rounded-xl border border-slate-700 px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {nodes.map((n, idx) => {
                const mainId = n.originalAncestorId || n.rebornFromNodeId || n.id;
                const globalNodeId = n.queueNumber || n.id;
                return (
                  <option key={`explorer-root-${n.id}-${idx}`} value={n.id}>
                    {currentRank === 1
                      ? `#${n.id} ${n.isRebirth ? '🌱' : ''}`
                      : n.isRebirth
                      ? `#${mainId}#${n.id}(${globalNodeId}) 🌱 Rebirth`
                      : `#${mainId}(${globalNodeId})`}{ ' ' }
                    ({getWalletName(n.owner)})
                  </option>
                );
              })}
            </select>
            {rootId !== 1 && (
              <button
                onClick={() => onChangeRootId(1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white"
                title={t('backToRoot1')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4-Box Mobile Bento Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-3.5">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{t('members15Levels')}</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-slate-100">
                {totalDownlineNodes}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/ 65,534</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{t('total15LevelBonus')}</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                +{total15LevelBonus.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold">USDT</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{t('deepestActiveLevel')}</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-indigo-300">
                {t('unitLevel')} {deepestActiveLevel}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/ 15</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{t('earningsPerNode')}</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-amber-300">
                {perLevelBonus.toFixed(2)}
              </span>
              <span className="text-[10px] text-amber-500 font-mono">USDT (2%)</span>
            </div>
          </div>
        </div>

        {/* Treasury 15-Level Residual Notice */}
        <div className="mt-3.5 px-3.5 py-2 rounded-xl bg-amber-950/25 border border-amber-800/40 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>กฎค่าชั้น 100%:</strong> หากสายงานอัพไลน์มีไม่ครบ 15 ชั้น เงินโบนัสค่าชั้นส่วนที่เหลือจะถูกโอนเข้า<strong>กระเป๋ากลาง (Root Treasury)</strong> ทันที
            </span>
          </div>
        </div>

        {/* Filter & Expand/Collapse Controls for Mobile */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3.5 mt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              {t('expandAllLevels')}
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              {t('collapseAllLevels')}
            </button>
            <button
              onClick={() => setFilterOnlyActive(!filterOnlyActive)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1 ${
                filterOnlyActive
                  ? 'bg-indigo-900/60 border-indigo-600 text-indigo-200 font-semibold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{filterOnlyActive ? t('showOnlyActive') : t('showAll15')}</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            {t('tapLevelHint')}
          </span>
        </div>
      </div>

      {/* 15 Levels Accordion List (Mobile Friendly & Clean) */}
      <div className="space-y-2.5">
        {fifteenLevels.map((lvlSummary) => {
          const isExpanded = expandedLevels.has(lvlSummary.level);
          const hasMembers = lvlSummary.nodes.length > 0;
          const fillPercentage = Math.min(100, Math.round((lvlSummary.nodes.length / lvlSummary.capacity) * 100));

          if (filterOnlyActive && !hasMembers) {
            return null;
          }

          return (
            <div
              key={lvlSummary.level}
              className={`rounded-2xl border transition-all overflow-hidden ${
                hasMembers
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-900/40 border-slate-800/50 opacity-80'
              }`}
            >
              {/* Level Accordion Header */}
              <button
                onClick={() => toggleLevel(lvlSummary.level)}
                className="w-full px-3.5 sm:px-5 py-3 sm:py-3.5 text-left flex items-center justify-between hover:bg-slate-800/40 transition-colors cursor-pointer gap-2"
              >
                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      hasMembers
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    L{lvlSummary.level}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-100">
                        ชั้นที่ {lvlSummary.level}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden xs:inline">
                        (ความจุ: {lvlSummary.capacity.toLocaleString()} ที่)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span>
                        มีสมาชิก: <strong className={hasMembers ? 'text-indigo-300 font-mono' : 'text-slate-500 font-mono'}>
                          {lvlSummary.nodes.length.toLocaleString()}
                        </strong> / {lvlSummary.capacity.toLocaleString()} รหัส
                      </span>
                      {hasMembers && (
                        <span className="font-mono text-emerald-400 text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                          +{lvlSummary.earnedUsdt.toFixed(2)} USDT
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                  {/* Status pill */}
                  {hasMembers ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-semibold hidden sm:inline-block">
                      {fillPercentage === 100 ? 'เต็ม 100%' : `มี ${lvlSummary.nodes.length} รหัส`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 hidden sm:inline-block">
                      ว่างทั้งหมด
                    </span>
                  )}

                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Level Accordion Content */}
              {isExpanded && (
                <div className="px-3.5 sm:px-5 pb-4 pt-1 border-t border-slate-800/80 space-y-3 bg-slate-950/50">
                  {hasMembers ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>
                          รายชื่อรหัสในชั้นที่ {lvlSummary.level} (สร้างโบนัส 0.10 USDT ต่อรหัสให้ #{rootId})
                        </span>
                        <span className="font-mono text-emerald-400">
                          รวมชั้นนี้: +{lvlSummary.earnedUsdt.toFixed(2)} USDT
                        </span>
                      </div>

                      {/* Members Grid on Mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                        {lvlSummary.nodes.map(({ node, parent, isLeft, path }, nIdx) => {
                          const isSelected = node.id === selectedNodeId;
                          const hasLeftEmpty = node.leftChild === 0;
                          const hasRightEmpty = node.rightChild === 0;

                          return (
                            <div
                              key={`explorer-node-${node.id}-${nIdx}`}
                              onClick={() => onSelectNode(node.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                                isSelected
                                  ? 'bg-indigo-900/60 border-indigo-400 ring-2 ring-indigo-400/40 shadow-lg'
                                  : 'bg-slate-900/90 hover:bg-slate-850 border-slate-700/70 hover:border-slate-600'
                              }`}
                            >
                              {/* Header: ID, Badge, Level */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center space-x-1.5">
                                  {node.isRebirth ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRebornModalNodeId(node.id);
                                        setIsRebirthModalOpen(true);
                                      }}
                                      className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950/90 border border-purple-500/70 text-purple-200 hover:text-white transition-all flex items-center space-x-0.5 shadow-sm group cursor-pointer"
                                      title={`ผัง ${node.rank || currentRank}: รหัสหลัก #${node.originalAncestorId || node.rebornFromNodeId || 1} | รหัสเกิดใหม่ #${node.id} | Global Node ID #${node.queueNumber || node.id} - คลิกเพื่อเปิดป๊อปอัพ Rebirth`}
                                    >
                                      <span className="text-amber-300 font-extrabold" title={`ไอดีหลัก #${node.originalAncestorId || node.rebornFromNodeId || 1}`}>
                                        #{node.originalAncestorId || node.rebornFromNodeId || 1}
                                      </span>
                                      <span className="text-purple-300 font-bold bg-purple-900/60 px-1 rounded text-[10px]" title={`รหัสโคลนนิ่งลำดับที่ #${getRebirthSeqForMain(node, nodes)} ของผังนี้`}>
                                        โคลน {getRebirthSeqForMain(node, nodes)}
                                      </span>
                                      <span className="text-indigo-200" title={`Global Node ID #${node.id}`}>
                                        ({node.queueNumber || node.id})
                                      </span>
                                      <Sparkles className="w-2.5 h-2.5 ml-0.5 text-purple-300 group-hover:rotate-12 transition-transform" />
                                    </button>
                                  ) : (
                                    <span
                                      className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 border border-indigo-500/60 text-indigo-200 flex items-center space-x-0.5 shadow-sm"
                                      title={`ผัง ${node.rank || currentRank}: รหัสหลัก #${node.id} | Global Node ID #${node.queueNumber || node.id}`}
                                    >
                                      <span className="text-amber-300 font-extrabold">
                                        #{node.id}
                                      </span>
                                      <span className="text-indigo-200">({node.queueNumber || node.id})</span>
                                    </span>
                                  )}
                                  <span
                                    className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    title={`Rank ${node.rank || 1} (${getRankPrice(node.rank || 1)} USDT)`}
                                  >
                                    R{node.rank || 1}
                                  </span>
                                </div>

                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center ${
                                    isLeft
                                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                                      : 'bg-purple-950/70 text-purple-300 border border-purple-800/60'
                                  }`}
                                >
                                  {isLeft ? (
                                    <>
                                      <ArrowDownLeft className="w-3 h-3 mr-0.5 text-emerald-400" />
                                      ฝั่งซ้าย (1)
                                    </>
                                  ) : (
                                    <>
                                      <ArrowDownRight className="w-3 h-3 mr-0.5 text-purple-400" />
                                      ฝั่งขวา (2)
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* Owner & Parent Lineage */}
                              <div className="text-xs space-y-1 mb-2">
                                <div className="flex items-center space-x-1.5 text-slate-200 truncate">
                                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-medium truncate">{getWalletName(node.owner)}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                  <span>ต่อใต้รหัสพ่อ:</span>
                                  <span className="font-mono text-indigo-300 font-semibold">
                                    #{node.parentId} ({isLeft ? 'ขาซ้าย' : 'ขาขวา'})
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate font-mono">
                                  เส้นทาง: {path}
                                </div>
                              </div>

                              {/* Upgrade Vault & Rebirth indicator */}
                              <div className="flex items-center justify-between text-[10px] bg-slate-950/70 px-2 py-1 rounded border border-slate-800/80 mb-2.5">
                                <span className="text-amber-300 font-mono flex items-center" title="ยอดสะสมใน Vault / เป้าหมาย Rank ถัดไป">
                                  <Shield className="w-2.5 h-2.5 mr-1 text-amber-400" />
                                  Vault: {node.upgradeVault.toFixed(1)}/{(node.rank || 1) < MAX_RANK ? getRankPrice((node.rank || 1) + 1) : getRankPrice(MAX_RANK)} U
                                </span>
                                {node.pendingRebirths > 0 ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRebornModalNodeId(node.id);
                                      setIsRebirthModalOpen(true);
                                    }}
                                    className="text-amber-400 font-bold animate-pulse hover:underline cursor-pointer"
                                    title="คลิกเพื่อเปิดหน้าต่างป๊อปอัพจัดการเกิดใหม่"
                                  >
                                    รอเกิดใหม่ ({node.pendingRebirths}) ⇲
                                  </button>
                                ) : node.isRebirth ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRebornModalNodeId(node.id);
                                      setIsRebirthModalOpen(true);
                                    }}
                                    className="text-purple-300 hover:text-purple-100 font-medium hover:underline cursor-pointer"
                                    title="คลิกเพื่อเปิดหน้าต่างป๊อปอัพข้อมูลรหัสเกิดใหม่"
                                  >
                                    เกิดจาก #{node.rebornFromNodeId || node.originalAncestorId} ({node.cloneSource === 'VAULT_EXCESS' ? `ส่วนเกิน Vault 40%: ${node.cloneLabel || `#${node.originalAncestorId || node.rebornFromNodeId || 1} #${node.id} #${node.vaultCloneRankCount ?? 0} รอบ ${node.vaultCloneRound || 1}`}` : 'ผังขาว'}) (กดดู ⇲)
                                  </button>
                                ) : node.rebirthCount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRebornModalNodeId(node.id);
                                      setIsRebirthModalOpen(true);
                                    }}
                                    className="text-purple-400 hover:text-purple-200 hover:underline cursor-pointer"
                                    title="คลิกเพื่อเปิดหน้าต่างป๊อปอัพดูข้อมูลการเกิดใหม่"
                                  >
                                    เกิด {node.rebirthCount} รอบ ⇲
                                  </button>
                                ) : (
                                  <span className="text-slate-500">ปกติ</span>
                                )}
                              </div>

                              {/* Action Buttons for Mobile */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onChangeRootId(node.id);
                                  }}
                                  className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-200 hover:text-white transition-all flex items-center justify-center space-x-1"
                                  title="โฟกัสดูผัง 15 ชั้นใต้รหัสนี้"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>โฟกัสรหัสนี้</span>
                                </button>

                                {hasLeftEmpty || hasRightEmpty ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onQuickRegisterUnder(node.id, hasLeftEmpty);
                                    }}
                                    className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all flex items-center justify-center space-x-1 ${
                                      hasLeftEmpty
                                        ? 'bg-emerald-600/30 hover:bg-emerald-600 border-emerald-500/50 text-emerald-200 hover:text-white'
                                        : 'bg-purple-600/30 hover:bg-purple-600 border-purple-500/50 text-purple-200 hover:text-white'
                                    }`}
                                    title="ต่อสายงานใต้รหัสนี้"
                                  >
                                    <Zap className="w-3 h-3" />
                                    <span>{hasLeftEmpty ? '+ ลงซ้าย' : '+ ลงขวา'}</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-500 flex items-center justify-center font-mono">
                                    ลูกเต็ม 2/2
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center space-y-1.5">
                      <p className="text-xs text-slate-400">
                        ชั้นที่ {lvlSummary.level} ยังไม่มีสมาชิกลงสายงานใต้รหัส #{rootId}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ความจุของชั้นนี้คือ {lvlSummary.capacity.toLocaleString()} รหัส (เมื่อเต็มจะสร้างโบนัส {+(lvlSummary.capacity * 0.1).toLocaleString()} USDT)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rebirth Modal Popup */}
      <RebirthModal
        isOpen={isRebirthModalOpen}
        onClose={() => setIsRebirthModalOpen(false)}
        selectedNodeId={rebornModalNodeId}
        nodes={nodes}
        wallets={wallets}
        onFocusNodeInTree={(id) => {
          onSelectNode(id);
          onChangeRootId(id);
        }}
      />
    </div>
  );
};
