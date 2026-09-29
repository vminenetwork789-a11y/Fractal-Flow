import React, { useState, useMemo } from 'react';
import { ActivityLog, MatrixNode } from '../types';
import { History, ArrowDownLeft, ArrowDownRight, Sparkles, Zap, Shield, Target, Layers, ExternalLink, Filter } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { BonusAndVaultHistoryModal } from './BonusAndVaultHistoryModal';

interface ActivityLogsProps {
  logs: ActivityLog[];
  nodes?: MatrixNode[];
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs, nodes = [] }) => {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<'ALL' | 'VAULT' | 'DIRECT' | 'LEVEL' | 'REBIRTH'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterType === 'VAULT') return log.type === 'PAYOUT_LEFT' || log.type === 'UPGRADE_VAULT' || log.type === 'VAULT_DEDUCTION';
      if (filterType === 'DIRECT') return log.type === 'PAYOUT_LEFT' || log.type === 'DIRECT_BONUS';
      if (filterType === 'LEVEL') return log.type === 'PAYOUT_LEFT' || log.type === 'LEVEL_BONUS';
      if (filterType === 'REBIRTH') return log.type === 'REBIRTH_TRIGGER' || log.type === 'REBIRTH_EXECUTED' || log.type === 'BATCH_REBIRTH';
      return true;
    });
  }, [logs, filterType]);

  const getBadge = (type: ActivityLog['type']) => {
    switch (type) {
      case 'PAYOUT_LEFT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
            <ArrowDownLeft className="w-2.5 h-2.5" />
            <span>100% Math (ลูกซ้าย)</span>
          </span>
        );
      case 'VAULT_DEDUCTION':
      case 'RANK_UPGRADE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
            <Shield className="w-2.5 h-2.5" />
            <span>ใช้ Vault อัปเกรด</span>
          </span>
        );
      case 'DIRECT_BONUS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
            <Target className="w-2.5 h-2.5" />
            <span>ค่าแนะนำตรง (30%)</span>
          </span>
        );
      case 'LEVEL_BONUS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1">
            <Layers className="w-2.5 h-2.5" />
            <span>ค่าชั้น 15 ชั้น (30%)</span>
          </span>
        );
      case 'REBIRTH_TRIGGER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
            <ArrowDownRight className="w-2.5 h-2.5" />
            <span>{t('logRebirthTrigger')}</span>
          </span>
        );
      case 'REBIRTH_EXECUTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{t('logRebirthExecuted')}</span>
          </span>
        );
      case 'BATCH_REGISTER':
      case 'BATCH_REBIRTH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1">
            <Zap className="w-2.5 h-2.5" />
            <span>Batch Transaction</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
            {t('logRegister')}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-200 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100">{t('eventLogsTitle')}</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {filteredLogs.length} รายการ
          </span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
        >
          <Shield className="w-3.5 h-3.5 text-amber-300" />
          <span>ดูตารางประวัติ ค่าแนะนำ, ค่าชั้น & 40% Vault ⇲</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
            filterType === 'ALL'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilterType('VAULT')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
            filterType === 'VAULT'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800/80 text-slate-400 hover:text-amber-300'
          }`}
        >
          <span>🔒 40% Vault</span>
        </button>
        <button
          onClick={() => setFilterType('DIRECT')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
            filterType === 'DIRECT'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800/80 text-slate-400 hover:text-emerald-300'
          }`}
        >
          <span>🎯 ค่าแนะนำ (30%)</span>
        </button>
        <button
          onClick={() => setFilterType('LEVEL')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
            filterType === 'LEVEL'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-slate-800/80 text-slate-400 hover:text-indigo-300'
          }`}
        >
          <span>🌐 ค่าชั้น 15 ชั้น (30%)</span>
        </button>
        <button
          onClick={() => setFilterType('REBIRTH')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
            filterType === 'REBIRTH'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-800/80 text-slate-400 hover:text-purple-300'
          }`}
        >
          <span>♻️ Rebirth</span>
        </button>
      </div>

      {/* Logs Scroll List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {filteredLogs.map((log) => {
          const details = log.details || {};
          const isPayoutLeft = log.type === 'PAYOUT_LEFT';

          return (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1.5 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getBadge(log.type)}
                  <span className="font-semibold text-slate-200 truncate max-w-[280px]">{log.title}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">{log.description}</p>

              {/* Quick Math Badges if PAYOUT_LEFT */}
              {isPayoutLeft && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                    🎯 ค่าแนะนำ 30%: +{(log.amount! * 0.3).toFixed(2)} U
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                    🌐 ค่าชั้น 30%: +{(log.amount! * 0.3).toFixed(2)} U
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
                    🔒 Vault 40%: +{(log.amount! * 0.4).toFixed(2)} U
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                <span className="font-mono truncate max-w-[200px]">Tx: {log.txHash}</span>
                {log.amount && (
                  <span className="font-mono text-emerald-400 font-bold">
                    {log.amount.toFixed(2)} USDT
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Integration */}
      <BonusAndVaultHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        logs={logs}
        nodes={nodes}
      />
    </div>
  );
};
