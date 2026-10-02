import React, { useState, useMemo, useEffect } from 'react';
import { ActivityLog, MatrixNode } from '../types';
import {
  X,
  History,
  Shield,
  Target,
  Layers,
  ArrowDownLeft,
  Sparkles,
  Search,
  Copy,
  Check,
  TrendingUp,
  ArrowUpRight,
  Filter,
  DollarSign,
  Info,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BonusAndVaultHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  nodes?: MatrixNode[];
  selectedNodeId?: number;
}

export const BonusAndVaultHistoryModal: React.FC<BonusAndVaultHistoryModalProps> = ({
  isOpen,
  onClose,
  logs,
  nodes = [],
  selectedNodeId,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ALL' | 'VAULT' | 'DIRECT' | 'LEVEL' | 'DEDUCTION' | 'REBIRTH'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // New filters for specific Node ID and Rank
  const [selectedLogNodeId, setSelectedLogNodeId] = useState<string>('ALL');
  const [selectedLogRank, setSelectedLogRank] = useState<string>('ALL');

  // Sync selectedLogNodeId with prop selectedNodeId when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedNodeId !== undefined && selectedNodeId > 0) {
        setSelectedLogNodeId(String(selectedNodeId));
      } else {
        setSelectedLogNodeId('ALL');
      }
    }
  }, [selectedNodeId, isOpen]);

  // Extract all unique Node IDs present in system nodes or logs
  const availableNodeIds = useMemo(() => {
    const ids = new Set<number>();
    nodes.forEach((n) => ids.add(n.id));
    logs.forEach((l) => {
      if (l.nodeId !== undefined) ids.add(l.nodeId);
      if (l.parentId !== undefined) ids.add(l.parentId);
      if (l.details?.fromNodeId !== undefined) ids.add(l.details.fromNodeId);
      if (l.details?.sponsorNodeId !== undefined) ids.add(l.details.sponsorNodeId);
      if (l.details?.directBonus?.sponsorNodeId !== undefined) ids.add(l.details.directBonus.sponsorNodeId);
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [nodes, logs]);

  // Process logs to extract relevant financial events
  const processedLogs = useMemo(() => {
    return logs.map((log) => {
      const details = log.details || {};
      const rank = details.rank || (log as any).rank || 1;
      const directAmt = details.directBonus?.amount || (log.type === 'PAYOUT_LEFT' ? log.amount! * 0.3 : (log.type === 'DIRECT_BONUS' ? log.amount! : 0));
      const levelAmt = details.levelBonus?.totalDistributed || (log.type === 'PAYOUT_LEFT' ? log.amount! * 0.3 : (log.type === 'LEVEL_BONUS' ? log.amount! : 0));
      const vaultAmt = details.upgradeVault?.amount || (log.type === 'PAYOUT_LEFT' ? log.amount! * 0.4 : 0);

      return {
        ...log,
        rank,
        directAmt,
        levelAmt,
        vaultAmt,
      };
    });
  }, [logs]);

  // Extract all unique ranks from processed logs
  const availableRanks = useMemo(() => {
    const ranks = new Set<number>();
    processedLogs.forEach((l) => {
      if (l.rank) ranks.add(l.rank);
      if (l.details?.rank) ranks.add(l.details.rank);
    });
    return Array.from(ranks).sort((a, b) => a - b);
  }, [processedLogs]);

  // Filter logs based on active tab, Node ID, Rank, and search query
  const filteredLogs = useMemo(() => {
    return processedLogs.filter((log) => {
      // Tab filter
      if (activeTab === 'VAULT' && !(log.type === 'PAYOUT_LEFT' || log.type === 'UPGRADE_VAULT')) return false;
      if (activeTab === 'DIRECT' && !(log.type === 'PAYOUT_LEFT' || log.type === 'DIRECT_BONUS')) return false;
      if (activeTab === 'LEVEL' && !(log.type === 'PAYOUT_LEFT' || log.type === 'LEVEL_BONUS')) return false;
      if (activeTab === 'DEDUCTION' && !(log.type === 'VAULT_DEDUCTION' || log.type === 'RANK_UPGRADE')) return false;
      if (activeTab === 'REBIRTH' && !(log.type === 'REBIRTH_TRIGGER' || log.type === 'REBIRTH_EXECUTED' || log.type === 'BATCH_REBIRTH')) return false;

      // Node ID filter
      if (selectedLogNodeId !== 'ALL') {
        const targetId = parseInt(selectedLogNodeId, 10);
        const matchMain = log.nodeId === targetId;
        const matchParent = log.parentId === targetId;
        const matchFrom = log.details?.fromNodeId === targetId;
        const matchSponsor = log.details?.sponsorNodeId === targetId || log.details?.directBonus?.sponsorNodeId === targetId;
        const matchTreasury = targetId === 0 && (
          log.nodeId === 0 ||
          log.parentId === 0 ||
          log.details?.treasuryWalletName === 'id0' ||
          log.details?.treasuryAddress === '0x0000000000000000000000000000000000000000' ||
          log.title.includes('โอนเข้ากระเป๋ากลาง') ||
          log.title.includes('Node #0')
        );
        if (!matchMain && !matchParent && !matchFrom && !matchSponsor && !matchTreasury) return false;
      }

      // Rank filter
      if (selectedLogRank !== 'ALL') {
        const targetRank = parseInt(selectedLogRank, 10);
        if ((log as any).rank !== targetRank && log.details?.rank !== targetRank) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = log.title.toLowerCase().includes(query);
        const matchDesc = log.description.toLowerCase().includes(query);
        const matchTx = log.txHash.toLowerCase().includes(query);
        const matchNode = log.nodeId ? String(log.nodeId).includes(query) : false;
        const matchParent = log.parentId ? String(log.parentId).includes(query) : false;
        return matchTitle || matchDesc || matchTx || matchNode || matchParent;
      }

      return true;
    });
  }, [processedLogs, activeTab, selectedLogNodeId, selectedLogRank, searchTerm]);

  // Calculations for summary stats - dynamically reflecting active filters
  const stats = useMemo(() => {
    let totalVaultDeposited = 0;
    let totalDirectPaid = 0;
    let totalLevelPaid = 0;
    let totalVaultDeducted = 0;

    filteredLogs.forEach((item) => {
      if (item.type === 'PAYOUT_LEFT') {
        totalVaultDeposited += item.vaultAmt;
        totalDirectPaid += item.directAmt;
        totalLevelPaid += item.levelAmt;
      } else if (item.type === 'VAULT_DEDUCTION' || item.type === 'RANK_UPGRADE') {
        totalVaultDeducted += item.amount || item.details?.vaultUsed || 0;
      } else if (item.type === 'LEVEL_BONUS') {
        totalLevelPaid += item.amount || 0;
      } else if (item.type === 'DIRECT_BONUS') {
        totalDirectPaid += item.amount || 0;
      }
    });

    return {
      totalVaultDeposited,
      totalDirectPaid,
      totalLevelPaid,
      totalVaultDeducted,
    };
  }, [filteredLogs]);

  const handleCopy = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-20 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center space-x-3 z-10">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-extrabold text-white">
                  ประวัติรายการค่าชั้น, ค่าแนะนำตรง & 40% Upgrade Vault
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono font-bold">
                  {filteredLogs.length} รายการ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                บันทึกการจัดสรรรายได้ 100% Math: ค่าแนะนำตรง (30%), ค่าชั้น 15 ชั้น (30%), และเข้า Upgrade Vault (40%)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>40% Upgrade Vault</span>
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-amber-300">
                +{stats.totalVaultDeposited.toFixed(2)} <span className="text-xs font-mono text-amber-400">USDT</span>
              </div>
              <p className="text-[10px] text-slate-400">เข้าเซฟสำหรับอัปเกรดผังถัดไป</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-medium">
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ค่าแนะนำตรง (30%)</span>
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-300">
                +{stats.totalDirectPaid.toFixed(2)} <span className="text-xs font-mono text-emerald-400">USDT</span>
              </div>
              <p className="text-[10px] text-slate-400">จ่ายเข้ากระเป๋าผู้แนะนำตรง 100%</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-1">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ค่าชั้น 15 ชั้น (30%)</span>
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-indigo-300">
                +{stats.totalLevelPaid.toFixed(2)} <span className="text-xs font-mono text-indigo-400">USDT</span>
              </div>
              <p className="text-[10px] text-slate-400">กระจาย 2%/ชั้น ตามสายงาน</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-1">
              <div className="flex items-center justify-between text-xs text-rose-300 font-medium">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                  <span>ใช้อัปเกรด/เกิดใหม่</span>
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-rose-300">
                -{stats.totalVaultDeducted.toFixed(2)} <span className="text-xs font-mono text-rose-400">USDT</span>
              </div>
              <p className="text-[10px] text-slate-400">ถอนจาก Vault ไปซื้อผัง/สมัคร</p>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'ALL'
                    ? 'bg-slate-700 text-white shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveTab('VAULT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'VAULT'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-amber-300'
                }`}
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span>🔒 40% Upgrade Vault</span>
              </button>
              <button
                onClick={() => setActiveTab('DIRECT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'DIRECT'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-emerald-300'
                }`}
              >
                <Target className="w-3 h-3 text-emerald-400" />
                <span>🎯 ค่าแนะนำ (30%)</span>
              </button>
              <button
                onClick={() => setActiveTab('LEVEL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'LEVEL'
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-indigo-300'
                }`}
              >
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>🌐 ค่าชั้น 15 ชั้น</span>
              </button>
              <button
                onClick={() => setActiveTab('DEDUCTION')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'DEDUCTION'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-rose-300'
                }`}
              >
                <span>🔻 ใช้ Upgrade Vault</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหา ID, กระเป๋า, หรือ Tx..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Filters for Node ID and Rank */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/45 border border-slate-800/80">
            {/* ID Filter Dropdown */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-semibold shrink-0">👥 กรองราย ID:</span>
              <select
                value={selectedLogNodeId}
                onChange={(e) => setSelectedLogNodeId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="ALL">🔍 ทุกไอดี (All IDs)</option>
                {availableNodeIds.map((id) => (
                  <option key={`filter-node-${id}`} value={String(id)}>
                    👤 ID #{id}
                  </option>
                ))}
              </select>
            </div>

            {/* Rank Filter Dropdown */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-semibold shrink-0">📈 กรองรายผัง:</span>
              <select
                value={selectedLogRank}
                onChange={(e) => setSelectedLogRank(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="ALL">🌍 ทุกผัง (All Ranks)</option>
                {availableRanks.map((rank) => (
                  <option key={`filter-rank-${rank}`} value={String(rank)}>
                    📈 ผังที่ {rank}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters button if active */}
            {(selectedLogNodeId !== 'ALL' || selectedLogRank !== 'ALL' || searchTerm !== '') ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedLogNodeId('ALL');
                  setSelectedLogRank('ALL');
                  setSearchTerm('');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>🧹 ล้างตัวกรองทั้งหมด</span>
              </button>
            ) : (
              <div className="text-[10px] text-slate-500 flex items-center justify-center italic font-sans">
                เลือกกรองข้อมูลเพื่อดูสถิติแยกรายตัว
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 border border-slate-800 rounded-2xl space-y-2">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-400">ไม่พบประวัติรายการที่ค้นหา</p>
                <p className="text-xs text-slate-500">ลองสลับตัวกรองหรือล้างคำค้นหา</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const details = log.details || {};
                const rank = (log as any).rank || 1;
                const directInfo = details.directBonus;
                const levelInfo = details.levelBonus;
                const vaultInfo = details.upgradeVault;

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-xs space-y-2.5 hover:border-slate-700 transition-colors"
                  >
                    {/* Log Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {log.type === 'PAYOUT_LEFT' ? (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                            <span>100% Math (ลูกซ้าย)</span>
                          </span>
                        ) : log.type === 'VAULT_DEDUCTION' || log.type === 'RANK_UPGRADE' ? (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3 text-rose-400" />
                            <span>เบิกถอน Upgrade Vault</span>
                          </span>
                        ) : log.type === 'LEVEL_BONUS' ? (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            <span>ค่าชั้นส่วนเหลือ</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {log.type}
                          </span>
                        )}

                        <span className="font-bold text-slate-100">{log.title}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono text-[10px]">
                          ผังที่ {rank}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-300 text-[11.5px] leading-relaxed font-sans">{log.description}</p>

                    {/* 3-Part Math Breakdown Cards for PAYOUT_LEFT */}
                    {log.type === 'PAYOUT_LEFT' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {/* Direct Sponsor 30% */}
                        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-emerald-400 font-semibold block">🎯 ค่าแนะนำตรง (30%)</span>
                            <span className="text-[10.5px] text-slate-300 block">
                              โอนให้ #{directInfo?.sponsorNodeId || details.directSponsorNodeId || log.parentId || 1}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-300 text-xs">
                            +{((log as any).directAmt || (log.amount! * 0.3)).toFixed(2)} U
                          </span>
                        </div>

                        {/* Level Bonus 30% */}
                        <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-indigo-400 font-semibold block">🌐 ค่าชั้น 15 ชั้น (30%)</span>
                            <span className="text-[10.5px] text-slate-300 block">
                              กระจาย {levelInfo?.distributedLevels || 15} ชั้น
                            </span>
                          </div>
                          <span className="font-mono font-bold text-indigo-300 text-xs">
                            +{((log as any).levelAmt || (log.amount! * 0.3)).toFixed(2)} U
                          </span>
                        </div>

                        {/* Upgrade Vault 40% */}
                        <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-amber-400 font-semibold block">🔒 เข้า Vault (40%)</span>
                            <span className="text-[10.5px] text-slate-300 block">
                              เข้า Vault ของ #{log.parentId || 1}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-amber-300 text-xs">
                            +{((log as any).vaultAmt || (log.amount! * 0.4)).toFixed(2)} U
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bottom Action / Tx Bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">Tx: {log.txHash}</span>
                        <button
                          onClick={() => handleCopy(log.txHash)}
                          className="hover:text-indigo-400 transition-colors p-0.5 rounded"
                          title="คัดลอก Tx Hash"
                        >
                          {copiedTx === log.txHash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'ซ่อนรายละเอียด' : 'ดูคำนวณละเอียด ⇲'}</span>
                      </button>
                    </div>

                    {/* Expanded Detail Drawer */}
                    {isExpanded && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-[11px] animate-in fade-in duration-150">
                        <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1">
                          📊 รายละเอียดสมการการเงิน (100% Math Allocation Breakdown)
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                          <div>
                            <span className="text-slate-500 block">รหัสสมาชิกเจ้าของเหตุการณ์:</span>
                            <span className="font-semibold text-white font-mono">
                              Node #{log.nodeId || '-'} {log.parentId ? `(อยู่ใต้ Parent #${log.parentId})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">ผังการทำงาน (Rank):</span>
                            <span className="font-semibold text-amber-300 font-mono">Rank {rank}</span>
                          </div>
                        </div>

                        {directInfo && (
                          <div className="p-2 rounded-lg bg-slate-950 border border-emerald-500/20 text-emerald-300">
                            <strong>🎯 รายละเอียดค่าแนะนำตรง 30%:</strong> โอนเข้ากระเป๋าผู้แนะนำหลัก #{directInfo.sponsorNodeId || '-'} ({directInfo.sponsorName || 'Wallet'}) จำนวน {directInfo.amount?.toFixed(2)} USDT
                          </div>
                        )}

                        {levelInfo && (
                          <div className="p-2 rounded-lg bg-slate-950 border border-indigo-500/20 text-indigo-300">
                            <strong>🌐 รายละเอียดค่าชั้น 15 ชั้น 30%:</strong> จ่ายสายงานอัพไลน์ {levelInfo.distributedLevels} ชั้น (ชั้นละ {levelInfo.perLevelBonus?.toFixed(2)} USDT) รวมจ่าย {levelInfo.totalDistributed?.toFixed(2)} USDT {levelInfo.remainderToTreasury > 0 ? `| ค่าชั้นที่ไม่มีอัพไลน์รองรับ ${levelInfo.remainderToTreasury.toFixed(2)} USDT โอนเข้ากระเป๋ากลาง Treasury` : ''}
                          </div>
                        )}

                        {vaultInfo && (
                          <div className="p-2 rounded-lg bg-slate-950 border border-amber-500/20 text-amber-300">
                            <strong>🔒 รายละเอียด 40% Upgrade Vault:</strong> ฝากเข้า Vault ของรหัสแม่ #{vaultInfo.targetNodeId} จำนวน +{vaultInfo.amount?.toFixed(2)} USDT (ยอดสะสมใหม่: {vaultInfo.newBalance?.toFixed(2)} USDT)
                          </div>
                        )}
                      </div>
                    )}
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
            <span>คำนวณและตรวจสอบด้วย Smart Contract 100% Math Engine</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
