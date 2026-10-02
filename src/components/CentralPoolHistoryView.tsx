import React, { useState, useMemo } from 'react';
import { CentralPoolTransaction, CentralPoolType } from '../types';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Search,
  Copy,
  Check,
  Filter,
  Coins,
  Shield,
  Layers,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CentralPoolHistoryViewProps {
  history: CentralPoolTransaction[];
  rebirthPoolBalance?: number;
  totalSystemVaultRank1To5?: number;
  totalSystemVaultRank6To45?: number;
  selectedNodeId?: number;
  onSelectNodeId?: (id: number) => void;
}

export const CentralPoolHistoryView: React.FC<CentralPoolHistoryViewProps> = ({
  history = [],
  rebirthPoolBalance = 0,
  totalSystemVaultRank1To5 = 0,
  totalSystemVaultRank6To45 = 0,
  selectedNodeId,
  onSelectNodeId,
}) => {
  const { t } = useLanguage();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | 'DIRECT' | 'RESIDUAL' | 'LEVEL'>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [selectedRank, setSelectedRank] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(text);
    setTimeout(() => setCopiedTx(null), 2500);
  };

  // KPIs calculation for ID 0 Treasury
  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let directBonusCount = 0;
    let residualCount = 0;
    let levelBonusCount = 0;

    history.forEach((tx) => {
      if (tx.direction === 'IN') totalInflow += tx.amount;
      if (tx.direction === 'OUT') totalOutflow += tx.amount;
      if (tx.actionType === 'DIRECT_BONUS_INFLOW') directBonusCount++;
      if (tx.actionType === 'TREASURY_RESIDUAL_INFLOW') residualCount++;
      if (tx.actionType === 'LEVEL_BONUS_INFLOW') levelBonusCount++;
    });

    const netBalance = Math.round((totalInflow - totalOutflow) * 100) / 100;

    return {
      totalInflow: Math.round(totalInflow * 100) / 100,
      totalOutflow: Math.round(totalOutflow * 100) / 100,
      netBalance,
      totalCount: history.length,
      directBonusCount,
      residualCount,
      levelBonusCount,
    };
  }, [history]);

  // Filtered List
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Category filter
      if (selectedCategoryFilter === 'DIRECT' && item.actionType !== 'DIRECT_BONUS_INFLOW') {
        return false;
      }
      if (selectedCategoryFilter === 'RESIDUAL' && item.actionType !== 'TREASURY_RESIDUAL_INFLOW') {
        return false;
      }
      if (selectedCategoryFilter === 'LEVEL' && item.actionType !== 'LEVEL_BONUS_INFLOW') {
        return false;
      }
      // Direction filter
      if (selectedDirection !== 'ALL' && item.direction !== selectedDirection) {
        return false;
      }
      // Rank filter
      if (selectedRank !== 'ALL' && item.rank !== Number(selectedRank)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesTx = item.txHash?.toLowerCase().includes(q);
        const matchesSource = item.sourceNodeId && String(item.sourceNodeId).includes(q);
        const matchesBeneficiary = item.beneficiaryNodeId && String(item.beneficiaryNodeId).includes(q);
        const matchesRank = `ผัง ${item.rank}`.toLowerCase().includes(q) || `rank ${item.rank}`.toLowerCase().includes(q);
        if (!matchesDesc && !matchesTx && !matchesSource && !matchesBeneficiary && !matchesRank) {
          return false;
        }
      }
      return true;
    });
  }, [history, selectedCategoryFilter, selectedDirection, selectedRank, searchQuery]);

  const getActionBadge = (actionType: CentralPoolTransaction['actionType'], direction: 'IN' | 'OUT') => {
    if (direction === 'IN') {
      if (actionType === 'DIRECT_BONUS_INFLOW') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <TrendingDown className="w-3 h-3 text-amber-400" />
            <span>🎯 ค่าแนะนำตรงโคลนนิ่ง ➔ id0 (30%)</span>
          </span>
        );
      }
      if (actionType === 'LEVEL_BONUS_INFLOW') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <TrendingDown className="w-3 h-3 text-indigo-400" />
            <span>🌐 โบนัส 15 ชั้น ➔ id0</span>
          </span>
        );
      }
      if (actionType === 'TREASURY_RESIDUAL_INFLOW') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <TrendingDown className="w-3 h-3 text-sky-400" />
            <span>🏛️ ค่าชั้นส่วนที่เหลือ 15 ชั้น ➔ id0</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <TrendingDown className="w-3 h-3 text-emerald-400" />
          <span>เงินเข้ากระเป๋ากลาง</span>
        </span>
      );
    }

    // OUT
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
        <TrendingUp className="w-3 h-3 text-rose-400" />
        <span>ถอนเงินออกจากกระเป๋ากลาง</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>เงินเข้ากระเป๋า id0</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">INFLOW</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-400">
            +{stats.totalInflow.toFixed(2)} <span className="text-[10px] text-emerald-300/80 font-normal">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">ค่าแนะนำตรง & ค่าชั้นส่วนที่เหลือ</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>เงินออกจากกระเป๋า id0</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">OUTFLOW</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-extrabold text-purple-300">
            -{stats.totalOutflow.toFixed(2)} <span className="text-[10px] text-purple-400/80 font-normal">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">ถอน / กวาดเงินกระเป๋ากลาง</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
              <span>ยอดคงเหลือ id0 (สุทธิ)</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">BALANCE</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-extrabold text-indigo-300">
            {stats.netBalance.toFixed(2)} <span className="text-[10px] text-indigo-400/80 font-normal">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            เข้า ({stats.totalInflow.toFixed(2)}) - ออก ({stats.totalOutflow.toFixed(2)})
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>ประวัติบันทึกทั้งหมด</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">TOTAL</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-extrabold text-amber-400">
            {stats.totalCount} <span className="text-[10px] text-slate-400 font-normal">รายการ</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            แนะตรง: {stats.directBonusCount} | ค่าชั้นเหลือ: {stats.residualCount}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              ทั้งหมด ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('DIRECT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedCategoryFilter === 'DIRECT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-300 hover:bg-amber-950/40 bg-slate-900 border border-slate-800'
              }`}
            >
              <span>🎯 ค่าแนะนำตรง ({stats.directBonusCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('RESIDUAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedCategoryFilter === 'RESIDUAL'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-sky-300 hover:bg-sky-950/40 bg-slate-900 border border-slate-800'
              }`}
            >
              <span>🏛️ ค่าชั้นส่วนที่เหลือ ({stats.residualCount})</span>
            </button>
            {stats.levelBonusCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('LEVEL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedCategoryFilter === 'LEVEL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-300 hover:bg-indigo-950/40 bg-slate-900 border border-slate-800'
                }`}
              >
                <span>🌐 โบนัส 15 ชั้น ({stats.levelBonusCount})</span>
              </button>
            )}
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 self-start md:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedDirection('ALL')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                selectedDirection === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setSelectedDirection('IN')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedDirection === 'IN' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-950/30'
              }`}
            >
              <span>🟢 เงินเข้า (IN)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDirection('OUT')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                selectedDirection === 'OUT' ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-950/30'
              }`}
            >
              <span>🔴 เงินออก (OUT)</span>
            </button>
          </div>
        </div>

        {/* Search & Rank Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-slate-800/80">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วย Node ID, คำอธิบาย หรือ Tx Hash..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-400">ผัง (Rank):</span>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">ทุกผัง (1 - 45)</option>
              {Array.from({ length: 45 }, (_, i) => i + 1).map((r) => (
                <option key={r} value={r}>
                  ผัง {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>สมุดบัญชีกระเป๋ากลาง (ID #0 Treasury Ledger)</span>
            <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredHistory.length} รายการ
            </span>
          </span>
          <span className="text-[11px] text-slate-400">เรียงตามลำดับเวลาล่าสุด (Real-time Audit Log)</span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <p className="text-sm text-slate-400 font-medium">ไม่พบประวัติธุรกรรมตามเงื่อนไขที่เลือก</p>
            <p className="text-xs text-slate-400">
              เมื่อมีการแนะนำตรงรหัสโคลนนิ่งของ #1 หรือค่าชั้นที่ไม่มีอัพไลน์รองรับ เงินจะโอนเข้ากระเป๋ากลาง ID #0 และแสดงที่นี่
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredHistory.map((tx) => {
              const isIn = tx.direction === 'IN';
              const dateStr = new Date(tx.timestamp).toLocaleTimeString('th-TH');

              return (
                <div
                  key={tx.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    isIn
                      ? 'bg-slate-900/90 border-emerald-500/20 hover:border-emerald-500/40'
                      : 'bg-slate-900/90 border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    {/* Left: Badges + Description */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getActionBadge(tx.actionType, tx.direction)}

                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ผัง {tx.rank}
                        </span>

                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{dateStr}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 font-medium leading-relaxed break-words">
                        {tx.description}
                      </p>

                      {/* Meta Node Info */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                        {tx.sourceNodeId !== undefined && (
                          <span>
                            จากรหัสต้นทาง:{' '}
                            <button
                              type="button"
                              onClick={() => onSelectNodeId && onSelectNodeId(tx.sourceNodeId!)}
                              className="font-mono text-indigo-300 font-bold hover:underline cursor-pointer"
                            >
                              #{tx.sourceNodeId}
                            </button>
                          </span>
                        )}
                        {tx.txHash && (
                          <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                            <span>Tx:</span>
                            <span className="text-slate-400">{tx.txHash.slice(0, 10)}...</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(tx.txHash)}
                              className="p-0.5 hover:text-white transition-colors"
                              title="คัดลอก Tx Hash"
                            >
                              {copiedTx === tx.txHash ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="sm:text-right shrink-0">
                      <div
                        className={`text-base sm:text-lg font-mono font-extrabold ${
                          isIn ? 'text-emerald-400' : 'text-purple-300'
                        }`}
                      >
                        {isIn ? '+' : '-'}
                        {tx.amount.toFixed(2)}{' '}
                        <span className="text-xs font-normal opacity-80">USDT</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          isIn
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {isIn ? 'เงินเข้า (IN)' : 'เงินออก (OUT)'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
