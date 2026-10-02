import React, { useState } from 'react';
import {
  Calculator,
  Shield,
  Coins,
  Check,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  RefreshCw,
  Crown,
  Zap,
} from 'lucide-react';
import { MAX_RANK, RANKS } from '../lib/matrixSimulator';

export const MathExplainer: React.FC = () => {
  const [customFee, setCustomFee] = useState<number>(5.0);

  const directCalc = (customFee * 30) / 100;
  const levelTotalCalc = (customFee * 30) / 100;
  const perLevelCalc = (customFee * 2) / 100;
  const upgradeVaultCalc = (customFee * 40) / 100;
  const sumCheck = directCalc + levelTotalCalc + upgradeVaultCalc;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              คณิตศาสตร์ 100% ของระบบ (100% Mathematics Proof)
            </h2>
            <p className="text-xs text-slate-400">
              ผังไบนารี่ 1 แตก 2: ขาซ้ายกระจายรายได้ 100% Math (30% Direct, 30% Level, 40% Vault) และขาขวา 100% สู่กองกลาง Rebirth สำหรับคลอดรหัสโคลนใหม่
            </p>
          </div>
        </div>
      </div>

      {/* Comparison: Left Child (100% Math) vs Right Child (100% Rebirth) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Child: Downline #1 */}
        <div className="bg-slate-900 border border-emerald-800/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              <h3 className="font-bold text-slate-100 text-sm">
                เม็ดที่ 1: ดาวน์ไลน์ฝั่งซ้าย (Left Child)
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
              จัดสรร 100% (5.0 เหรียญ)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* 30% First Sponsor */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-100">30% ค่าแนะนำตรง:</span>
                  <span className="text-emerald-400 font-bold">1.50 USDT</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  โอนเข้ากระเป๋าผู้แนะนำตรงทันที (หากผู้แนะนำตรงคือ ID 1 ยอดนี้จะโอนเข้ากองกลาง Rebirth Pool 100%)
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-300">30%</span>
            </div>

            {/* 30% 15 Levels Starting from Level 0 */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-100">30% โบนัส 15 ชั้น (เริ่มจ่ายตั้งแต่ชั้นที่ 0):</span>
                  <span className="text-indigo-400 font-bold">1.50 USDT</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  เริ่มจ่ายตั้งแต่ชั้นที่ 0 (รหัสแม่) และไล่ขึ้นสายงานรวม 15 ชั้น ชั้นละ 2% (0.10 USDT) โดยส่วนของชั้น ID 1 จะโอนเข้ากองกลาง Rebirth
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-indigo-300">15 x 0.10</span>
            </div>

            {/* 40% Upgrade Vault */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-100">40% เข้า Upgrade Vault:</span>
                  <span className="text-amber-400 font-bold">2.00 USDT</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  เก็บสะสมใน <code>upgradeVault</code> ของรหัสแม่เพื่อใช้ซื้อผังหรือสะสมอัปเกรดอัตโนมัติขึ้นสู่ Rank สูงขึ้น
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-amber-300">40%</span>
            </div>
          </div>

          {/* Sum Verification */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs flex justify-between items-center text-emerald-300 font-semibold">
            <span className="flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>ผลรวมคณิตศาสตร์: 1.50 + 1.50 + 2.00</span>
            </span>
            <span className="font-mono text-sm font-bold">= 5.00 USDT (100.00%)</span>
          </div>
        </div>

        {/* Right Child: Downline #2 (Rebirth) */}
        <div className="bg-slate-900 border border-purple-800/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-purple-400 inline-block" />
              <h3 className="font-bold text-slate-100 text-sm">
                เม็ดที่ 2: ดาวน์ไลน์ฝั่งขวา (Rebirth)
              </h3>
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2.5 py-1 rounded-full">
              กองกลาง Rebirth (5.0 เหรียญ)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* 100% Rebirth Pool */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">100% (5.00 USDT) จุดชนวนการโคลนนิ่ง:</span>
                <span className="font-mono font-bold text-purple-300">5.00 USDT</span>
              </div>
              <p className="text-[11px] text-slate-400">
                ค่าสมัคร 100% ของเม็ดขวาจะถูกส่งเข้า <code>rebirthPool</code> สำหรับใช้คลอดรหัสโคลนใหม่ให้อัตโนมัติ
              </p>
            </div>

            {/* Status Change */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">อัปเดตสิทธิ์โคลนนิ่งรหัสแม่:</span>
                <span className="font-mono font-bold text-amber-400">rebirthCount + 1 / pendingRebirths + 1</span>
              </div>
              <p className="text-[11px] text-slate-400">
                รหัสแม่ได้รับสิทธิ์เกิดใหม่สะสม และบอทจะนำรหัสโคลนไปจัดวางลงผังอัตโนมัติ (วนลูป 2 รอบ: สายงาน ➔ ชุมชน)
              </p>
            </div>

            {/* Explaining Placement Loop */}
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-1.5">
              <span className="font-bold text-indigo-300 block">🔄 วงจรรอบการจัดวาง 2 รอบ (2-Round Loop):</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                • <strong>รอบที่ 1 (ช่วยสายงาน):</strong> วางติดตัวผู้แนะนำตรง หรือส่งต่อใต้รหัสโคลนของผู้แนะนำ<br/>
                • <strong>รอบที่ 2 (ช่วยชุมชน):</strong> บอทสแกนเนอร์ (BFS) วางช่วยสมาชิกในระบบจากบนลงล่าง ซ้ายไปขวา
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs flex justify-between items-center text-purple-300 font-semibold">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>การโคลนนิ่งสร้างรหัสใหม่ให้กระเป๋าเดิม</span>
            </span>
            <span className="font-mono text-xs font-bold">1 กระเป๋าได้ไม่จำกัดรหัส</span>
          </div>
        </div>
      </div>

      {/* Interactive Fee Breakdown Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-2">
            <Percent className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">
              เครื่องคำนวณและทดสอบสัดส่วน (Simulation Calculator)
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">ค่าสมัครทดสอบ:</span>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={customFee}
              onChange={(e) => setCustomFee(Number(e.target.value) || 5)}
              className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-400">USDT</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">30% Direct Sponsor</span>
            <span className="font-mono text-base font-bold text-emerald-400 mt-1 block">
              {directCalc.toFixed(2)} USDT
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">30% 15 ชั้นรวมกัน</span>
            <span className="font-mono text-base font-bold text-indigo-400 mt-1 block">
              {levelTotalCalc.toFixed(2)} USDT
            </span>
            <span className="text-[10px] text-slate-500">(ชั้นละ {perLevelCalc.toFixed(2)} USDT)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">40% Upgrade Vault</span>
            <span className="font-mono text-base font-bold text-amber-400 mt-1 block">
              {upgradeVaultCalc.toFixed(2)} USDT
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">100% ตรวจสอบผลรวม</span>
            <span className="font-mono text-base font-bold text-emerald-300 mt-1 block">
              {sumCheck.toFixed(2)} USDT
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">ถูกต้อง 100% เต็ม</span>
          </div>
        </div>
      </div>

      {/* ระบบ 3 กองกลาง (The 3 Central Pools System) */}
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 flex-wrap">
              <span>🏛️ ระบบแยก 3 กองกลาง (The 3 Central Pools Architecture)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                3 Central Pools
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              รายละเอียดสูตรคณิตศาสตร์และวัตถุประสงค์การแยก 3 กองกลางสร้างรหัสใหม่ในระบบ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* กองที่ 1 */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/40 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-purple-900/50">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px]">
                🟣 กองที่ 1
              </span>
              <span className="text-[10px] text-purple-400 font-mono">100% เม็ดขวา</span>
            </div>
            <strong className="text-sm font-bold text-white block">
              Rebirth Pool สำหรับโคลนนิ่ง
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • <strong>ที่มา:</strong> ค่าสมัคร 100% (5.00 USDT) ของดาวน์ไลน์ขาขวา (Downline #2)<br />
              • <strong>วัตถุประสงค์:</strong> สำหรับคลอดรหัสโคลนนิ่ง (Rebirth Node)<br />
              • <strong>การจัดวาง:</strong> สลับวัฏจักร 2 รอบ (รอบ 1 วางติดตัวผู้แนะนำตรง / ต่อใต้โคลนผู้แนะนำ ➔ รอบ 2 บอทสแกนเนอร์ BFS กระจายช่วยชุมชนทั้งระบบ)<br />
              • <strong>ผลลัพธ์:</strong> เมื่อมีลูกขวาครบ สิทธิ์เกิดใหม่จะคลอดรหัสใหม่อัตโนมัติ
            </p>
          </div>

          {/* กองที่ 2 */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/40 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-indigo-900/50">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                🔵 กองที่ 2
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">ผัง 1 ถึง 5</span>
            </div>
            <strong className="text-sm font-bold text-white block">
              สร้างจากส่วนเกิน 40% Vault (ผัง 1 ถึง 5)
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • <strong>ที่มา:</strong> ส่วนเกิน 40% Upgrade Vault จากดาวน์ไลน์ขาซ้าย (ผัง 1-5)<br />
              • <strong>สูตร:</strong> <code>(40% Vault ผัง 1-5) − (40% Vault สำรองย้อนหลัง 5 ผัง)</code> (ผัง 10 ขึ้นไปปลดล็อก 100%)<br />
              • <strong>วัตถุประสงค์:</strong> นำยอดส่วนเกินที่สะสมครบ 5.00 USDT มา<strong>สมัครเปิดเป็น New Main ID ในผัง 1</strong> [เป็นไอดีหลักใหม่]<br />
              • <strong>ผลลัพธ์:</strong> ได้รับไอดีหลักใหม่เพื่อสร้างสายงานและ Auto-Upgrade ไต่ผังต่อได้
            </p>
          </div>

          {/* กองที่ 3 */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-900/50">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                🟢 กองที่ 3
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">ผัง 6 ถึง 45</span>
            </div>
            <strong className="text-sm font-bold text-white block">
              สร้างจากส่วนเกิน 40% Vault (ผัง 6 ถึง 45)
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • <strong>ที่มา:</strong> ส่วนเกิน 40% Upgrade Vault ในผัง 6 ถึง 45<br />
              • <strong>สูตร:</strong> <code>(40% Vault ผัง 6-45) − (40% Vault สำรองย้อนหลัง 5 ผัง)</code><br />
              • <strong>วัตถุประสงค์:</strong> ระบบสแกนส่วนเกินจากผัง 45 ลงมาถึงผัง 2 เมื่อยอดส่วนเกินครบตามราคาผังใด จะ<strong>เปิดรหัส New Member ในผังนั้นทันที (&quot;ไปต่อตัวเอง&quot;)</strong><br />
              • <strong>ผลลัพธ์:</strong> สิทธิประโยชน์ Direct 30%, Level 30%, และ Vault 40% ส่งกลับให้ไอดีผู้สร้าง 100%
            </p>
          </div>
        </div>
      </div>

      {/* Rank 1-45 Progression */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              คณิตศาสตร์ Rank 1-{MAX_RANK} (ราคา 5 USDT ถึง {RANKS[MAX_RANK - 1]?.price.toLocaleString()} USDT & Auto-Upgrade จาก Vault)
            </h3>
            <p className="text-xs text-slate-400">
              ราคาตามลำดับ 45 ผัง (5 USDT ถึง 1,000,000 USDT) • ยอดสะสม 40% Upgrade Vault ย้อนหลัง 5 ผังจะช่วยปลดล็อกการเลื่อนขั้นขึ้นสู่ Rank สูงขึ้นอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs max-h-96 overflow-y-auto pr-1">
          {RANKS.map((item) => (
            <div
              key={item.rank}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{item.badge.split(' ')[0]} {item.name}</span>
                <span className="font-mono font-bold text-amber-400">{item.price >= 1000 ? item.price.toLocaleString() : item.price} U</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate" title={item.title}>
                {item.title}
              </p>
              <p className="text-[9px] text-indigo-400 mt-0.5">
                {item.rank === 1 ? 'รหัสเริ่มต้น' : `เป้าหมาย ${item.price.toLocaleString()} U`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
