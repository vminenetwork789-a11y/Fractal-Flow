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
  const [selectedPoolFilter, setSelectedPoolFilter] = useState<'ALL' | CentralPoolType>('ALL');
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

  // KPIs calculation
  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let pool1Count = 0;
    let pool2Count = 0;
    let pool3Count = 0;

    history.forEach((tx) => {
      if (tx.direction === 'IN') totalInflow += tx.amount;
      if (tx.direction === 'OUT') totalOutflow += tx.amount;
      if (tx.poolType === 'POOL_1_REBIRTH') pool1Count++;
      if (tx.poolType === 'POOL_2_EXCESS_VAULT_1_5') pool2Count++;
      if (tx.poolType === 'POOL_3_EXCESS_VAULT_6_45') pool3Count++;
    });

    return {
      totalInflow: Math.round(totalInflow * 100) / 100,
      totalOutflow: Math.round(totalOutflow * 100) / 100,
      totalCount: history.length,
      pool1Count,
      pool2Count,
      pool3Count,
    };
  }, [history]);

  // Filtered List
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Pool filter
      if (selectedPoolFilter !== 'ALL' && item.poolType !== selectedPoolFilter) {
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
        const matchesMain = item.mainId && String(item.mainId).includes(q);
        const matchesRank = `ผัง ${item.rank}`.toLowerCase().includes(q) || `rank ${item.rank}`.toLowerCase().includes(q);
        if (!matchesDesc && !matchesTx && !matchesSource && !matchesBeneficiary && !matchesMain && !matchesRank) {
          return false;
        }
      }
      return true;
    });
  }, [history, selectedPoolFilter, selectedDirection, selectedRank, searchQuery]);

  const getPoolBadge = (type: CentralPoolType) => {
    switch (type) {
      case 'POOL_1_REBIRTH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            <span>กองที่ 1 (Rebirth โคลนนิ่ง)</span>
          </span>
        );
      case 'POOL_2_EXCESS_VAULT_1_5':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Shield className="w-2.5 h-2.5 text-indigo-400" />
            <span>กองที่ 2 (ผัง 1-5 ➔ New Main ID)</span>
          </span>
        );
      case 'POOL_3_EXCESS_VAULT_6_45':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <Coins className="w-2.5 h-2.5 text-emerald-400" />
            <span>กองที่ 3 (ผัง 6-45 ➔ New Member)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700 text-slate-300">
            <span>กองกลาง</span>
          </span>
        );
    }
  };

  const getActionBadge = (actionType: CentralPoolTransaction['actionType'], direction: 'IN' | 'OUT') => {
    if (direction === 'IN') {
      if (actionType === 'DIRECT_BONUS_INFLOW') {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <TrendingDown className="w-2.5 h-2.5 rotate-45 text-amber-400" />
            <span>🎯 ผู้แนะนำตรง ID 1 ➔ กองกลาง (30%)</span>
          </span>
        );
      }
      if (actionType === 'LEVEL_BONUS_INFLOW') {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <TrendingDown className="w-2.5 h-2.5 rotate-45 text-indigo-400" />
            <span>🌐 ชั้น ID 1 ➔ กองกลาง (30%)</span>
          </span>
        );
      }
      if (actionType === 'TREASURY_RESIDUAL_INFLOW') {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <TrendingDown className="w-2.5 h-2.5 rotate-45 text-sky-400" />
            <span>🏛️ ค่าชั้นส่วนที่เหลือ ➔ กองกลาง</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <TrendingDown className="w-2.5 h-2.5 rotate-45 text-emerald-400" />
          <span>ลูกขวา 100% เข้ากองกลาง</span>
        </span>
      );
    }
    switch (actionType) {
      case 'REBIRTH_SPAWNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <TrendingUp className="w-2.5 h-2.5 text-purple-400" />
            <span>คลอดรหัสโคลนนิ่ง</span>
          </span>
        );
      case 'NEW_MAIN_ID_CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <TrendingUp className="w-2.5 h-2.5 text-indigo-400" />
            <span>เปิด New Main ID ผัง 1</span>
          </span>
        );
      case 'NEW_MEMBER_CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            <span>ไปต่อตัวเอง New Member</span>
          </span>
        );
      case 'ADMIN_SWEEP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <Shield className="w-2.5 h-2.5 text-rose-400" />
            <span>แอดมินกวาดกองกลาง</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-700 text-slate-300">
            <span>ทำรายการ</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400 rotate-45" />
              <span>เงินเข้ากองกลาง</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">INFLOW</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-400">
            +{stats.totalInflow.toFixed(2)} <span className="text-[10px] text-emerald-300/80 font-normal">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">จาก 100% เม็ดขวา & Vault</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>เงินออกจากกองกลาง</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">OUTFLOW</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-extrabold text-purple-300">
            -{stats.totalOutflow.toFixed(2)} <span className="text-[10px] text-purple-400/80 font-normal">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">จ่ายค่าโคลนนิ่ง & เปิดรหัส</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-indigo-400" />
              <span>กองกลางคงเหลือ (ผัง 1)</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">POOL 1</span>
          </div>
          <div className="text-base sm:text-lg font-mono font-extrabold text-indigo-300">
            {rebirthPoolBalance.toFixed(2)} <span className="text-[10px] text-indigo-400/80 font-normal">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">พร้อมใช้โคลนนิ่ง 5.0 U</p>
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
            ก.1: {stats.pool1Count} | ก.2: {stats.pool2Count} | ก.3: {stats.pool3Count}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Pool Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedPoolFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedPoolFilter === 'ALL'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              ครบ 3 กอง ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedPoolFilter('POOL_1_REBIRTH')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedPoolFilter === 'POOL_1_REBIRTH'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:bg-purple-950/40 bg-slate-900 border border-slate-800'
              }`}
            >
              <span>🟣 กอง 1 (โคลนนิ่ง)</span>
              <span className="text-[10px] opacity-75 font-mono">({stats.pool1Count})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPoolFilter('POOL_2_EXCESS_VAULT_1_5')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedPoolFilter === 'POOL_2_EXCESS_VAULT_1_5'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-300 hover:bg-indigo-950/40 bg-slate-900 border border-slate-800'
              }`}
            >
              <span>🔵 กอง 2 (New Main ID)</span>
              <span className="text-[10px] opacity-75 font-mono">({stats.pool2Count})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPoolFilter('POOL_3_EXCESS_VAULT_6_45')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                selectedPoolFilter === 'POOL_3_EXCESS_VAULT_6_45'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300 hover:bg-emerald-950/40 bg-slate-900 border border-slate-800'
              }`}
            >
              <span>🟢 กอง 3 (New Member)</span>
              <span className="text-[10px] opacity-75 font-mono">({stats.pool3Count})</span>
            </button>
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
                selectedDirection === 'OUT' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:bg-purple-950/30'
              }`}
            >
              <span>🔴 เงินออก (OUT)</span>
            </button>
          </div>
        </div>

        {/* Search Input & Rank Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วย Node ID, Main ID, คำอธิบาย หรือ Tx Hash..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-xs">
            <span className="text-slate-400 font-medium">ผัง (Rank):</span>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">ทุกผัง (1 - 45)</option>
              {Array.from({ length: 45 }, (_, i) => i + 1).map((r) => (
                <option key={`history-rank-filter-${r}`} value={String(r)}>
                  ผัง {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-200">สมุดบัญชีกองกลาง (Central Pools Ledger)</span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {filteredHistory.length} รายการ
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            เรียงตามลำดับเวลาล่าสุด (Real-time Audit Log)
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">ยังไม่พบรายการตามตัวกรองที่เลือก</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              เมื่อมีสมาชิกติดตัวลูกขวา 100% เงินจะเข้ากองกลาง Rebirth หรือเมื่อมีการสั่งคลอดโคลนนิ่ง ระบบจะบันทึกประวัติให้ทันที
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {filteredHistory.map((item) => {
              const isIncome = item.direction === 'IN';
              const dateStr = new Date(item.timestamp).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="p-3 sm:p-4 hover:bg-slate-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left Column: Badges & Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getPoolBadge(item.poolType)}
                      {getActionBadge(item.actionType, item.direction)}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        ผัง {item.rank}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>

                    <p className="text-slate-200 text-xs leading-relaxed font-medium">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      {typeof item.sourceNodeId === 'number' && (
                        <span>
                          รหัสต้นทาง: <strong className="text-slate-200 font-mono">#{item.sourceNodeId}</strong>
                        </span>
                      )}
                      {typeof item.beneficiaryNodeId === 'number' && (
                        <span>
                          รหัสเป้าหมาย: <strong className="text-emerald-400 font-mono">#{item.beneficiaryNodeId}</strong>
                        </span>
                      )}
                      {typeof item.mainId === 'number' && (
                        <span>
                          ตระกูลไอดีหลัก: <strong className="text-indigo-300 font-mono">#{item.mainId}</strong>
                        </span>
                      )}
                      {item.txHash && (
                        <button
                          type="button"
                          onClick={() => handleCopy(item.txHash)}
                          className="font-mono text-[10px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 transition-colors"
                          title="คลิกเพื่อคัดลอก Tx Hash"
                        >
                          {copiedTx === item.txHash ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="text-emerald-400">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>{item.txHash.slice(0, 14)}...</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Amount & Direction */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-1 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/60 w-full md:w-auto">
                    <div
                      className={`text-sm sm:text-base font-mono font-extrabold flex items-center gap-1 ${
                        isIncome ? 'text-emerald-400' : 'text-purple-300'
                      }`}
                    >
                      {isIncome ? (
                        <>
                          <TrendingDown className="w-4 h-4 rotate-45" />
                          <span>+{item.amount.toFixed(2)} USDT</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          <span>-{item.amount.toFixed(2)} USDT</span>
                        </>
                      )}
                    </div>
                    {item.balanceAfter !== undefined && (
                      <span className="text-[10px] font-mono text-slate-400">
                        คงเหลือหลังทำรายการ: <strong className="text-slate-300">{item.balanceAfter.toFixed(2)} U</strong>
                      </span>
                    )}
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
