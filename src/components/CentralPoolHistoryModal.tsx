import React from 'react';
import { CentralPoolTransaction } from '../types';
import { CentralPoolHistoryView } from './CentralPoolHistoryView';
import { X, History, Coins } from 'lucide-react';

interface CentralPoolHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CentralPoolTransaction[];
  rebirthPoolBalance?: number;
  totalSystemVaultRank1To5?: number;
  totalSystemVaultRank6To45?: number;
  selectedNodeId?: number;
  onSelectNodeId?: (id: number) => void;
}

export const CentralPoolHistoryModal: React.FC<CentralPoolHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  rebirthPoolBalance = 0,
  totalSystemVaultRank1To5 = 0,
  totalSystemVaultRank6To45 = 0,
  selectedNodeId,
  onSelectNodeId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border-2 border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>📜 ประวัตid0(Central Pools History & Ledger)</span>
              </h3>
              <p className="text-xs text-slate-400">
                ประวัติการรับเงินเข้า 100% เม็ดขวา และการจ่ายเงินเพื่อคลอดโคลนนิ่ง / เปิด New Main ID ครบทั้ง 3 กองกลาง
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <CentralPoolHistoryView
            history={history}
            rebirthPoolBalance={rebirthPoolBalance}
            totalSystemVaultRank1To5={totalSystemVaultRank1To5}
            totalSystemVaultRank6To45={totalSystemVaultRank6To45}
            selectedNodeId={selectedNodeId}
            onSelectNodeId={onSelectNodeId}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            ระบบความโปร่งใสแบบเปิด (Audit Ledger): ตรวจสอบได้ทุกธุรกรรม 100%
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
