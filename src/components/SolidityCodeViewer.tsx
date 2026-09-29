import React, { useState } from 'react';
import { SOLIDITY_CONTRACT_CODE, CONTRACT_ABI } from '../contracts/contractSource';
import {
  Code2,
  Copy,
  Check,
  Download,
  Shield,
  FileCode,
  Flame,
  Layers,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export const SolidityCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [copiedAbi, setCopiedAbi] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'solidity' | 'abi' | 'ethersjs'>('solidity');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SOLIDITY_CONTRACT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAbi = () => {
    navigator.clipboard.writeText(JSON.stringify(CONTRACT_ABI, null, 2));
    setCopiedAbi(true);
    setTimeout(() => setCopiedAbi(false), 2000);
  };

  const handleDownloadSol = () => {
    const blob = new Blob([SOLIDITY_CONTRACT_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BinaryRebirthMatrix.sol';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const ethersSnippet = `// ⚡ ตัวอย่างการเชื่อมต่อ Smart Contract ด้วย Ethers.js v6
import { ethers } from "ethers";

// 1. เชื่อมต่อ Browser Provider (MetaMask)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
const CONTRACT_ABI = [
  "function register(uint256 parentId, bool isLeft) external returns (uint256)",
  "function batchRegister(uint256[] calldata parentIds, bool[] calldata isLefts) external returns (uint256[])",
  "function executeRebirth(uint256 nodeId, uint256 targetParentId, bool isLeft) external returns (uint256)",
  "function batchExecuteRebirth(uint256[] calldata nodeIds, uint256[] calldata targetParentIds, bool[] calldata isLefts) external returns (uint256[])",
  "function getNode(uint256 nodeId) external view returns (tuple(...))",
  "function upgradeVault(uint256 nodeId) external view returns (uint256)",
  "function rebirthPool() external view returns (uint256)"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// 2. เรียกใช้งานฟังก์ชันลงทะเบียนรหัสใหม่ (1 กระเป๋าได้ไม่จำกัดรหัส)
const tx = await contract.register(1, true); // ต่อใต้รหัส 1 ฝั่งซ้าย
await tx.wait();
console.log("Registered successfully!");

// 3. บอทภายนอกสแกนหาตำแหน่งว่าง แล้วส่งคำสั่ง executeRebirth()
const rebirthTx = await contract.executeRebirth(nodeId, targetParentId, isLeft);
await rebirthTx.wait();
`;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header with Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                BinaryRebirthMatrix.sol (Solidity v0.8.20)
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                เขียนตามมาตรฐานความปลอดภัยระดับ Production-ready พร้อมป้องกัน Reentrancy และประหยัด Gas
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyCode}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก .sol'}</span>
          </button>
          <button
            onClick={handleDownloadSol}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด (.sol)</span>
          </button>
        </div>
      </div>

      {/* Code Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between bg-slate-950 px-3 sm:px-4 py-2 border-b border-slate-800">
          <div className="flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap py-0.5 no-scrollbar max-w-full">
            <button
              onClick={() => setActiveCodeTab('solidity')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all shrink-0 ${
                activeCodeTab === 'solidity'
                  ? 'bg-slate-800 text-indigo-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              BinaryRebirthMatrix.sol
            </button>
            <button
              onClick={() => setActiveCodeTab('ethersjs')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all shrink-0 ${
                activeCodeTab === 'ethersjs'
                  ? 'bg-slate-800 text-indigo-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ethers.js v6
            </button>
            <button
              onClick={() => setActiveCodeTab('abi')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all shrink-0 ${
                activeCodeTab === 'abi'
                  ? 'bg-slate-800 text-indigo-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Contract ABI
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden md:block shrink-0 ml-2">
            Solidity ^0.8.20 | EVM Compatible
          </div>
        </div>

        {/* Code Content Box */}
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[560px] text-xs font-mono leading-relaxed">
          {activeCodeTab === 'solidity' && (
            <pre className="text-slate-300">
              <code>{SOLIDITY_CONTRACT_CODE}</code>
            </pre>
          )}

          {activeCodeTab === 'ethersjs' && (
            <pre className="text-indigo-200">
              <code>{ethersSnippet}</code>
            </pre>
          )}

          {activeCodeTab === 'abi' && (
            <div>
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleCopyAbi}
                  className="px-2 py-1 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1"
                >
                  {copiedAbi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAbi ? 'Copied' : 'Copy ABI'}</span>
                </button>
              </div>
              <pre className="text-emerald-300">
                <code>{JSON.stringify(CONTRACT_ABI, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Security & Gas Optimization Architecture Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Shield className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">การวิเคราะห์ความปลอดภัย (Security Audit)</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Reentrancy Protection:</strong> ครอบฟังก์ชันชำระเงินด้วย <code>nonReentrant</code> mutex และยึดตามรูปแบบ Checks-Effects-Interactions (CEI) อย่างสมบูรณ์แบบ
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Safe ERC20 Low-level Call:</strong> ฟังก์ชัน <code>_safeTransfer</code> และ <code>_safeTransferFrom</code> ตรวจสอบ return data เพื่อรองรับทั้ง USDT (ที่ไม่มี standard bool return) และ ERC20 ทั่วไป
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Loop Bounds & Safe Lineage:</strong> วนลูปอัพไลน์จำกัดสูงสุดที่ 15 ชั้น (<code>MAX_LEVELS = 15</code>) เพื่อป้องกัน Out-of-gas attack และโอนเงินส่วนเหลือไปยัง treasury เมื่อสายงานไม่ครบ 15 ชั้น
              </span>
            </li>
          </ul>
        </div>

        {/* Gas Optimization Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-purple-400">
            <Flame className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-100">การประหยัดค่าแก๊ส (Gas Optimization)</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>Custom Errors:</strong> แทนที่ string require() ด้วย <code>error SlotAlreadyOccupied()</code>, <code>error NoPendingRebirth()</code> ช่วยประหยัดค่า Deploy และ Run Gas
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>Batch Processing:</strong> รองรับ <code>batchRegister</code> และ <code>batchExecuteRebirth</code> ยุบการโอนเงินและสร้างหลายรหัสในธุรกรรมเดียว
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>Off-Chain BFS Keeper:</strong> การสแกนตำแหน่งว่างทำนอกบล็อกเชน (Off-chain) ส่งเฉพาะ ID เป้าหมายมาประมวลผล ไม่เปลืองแก๊สสแกนต้นไม้บนบล็อกเชน
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
