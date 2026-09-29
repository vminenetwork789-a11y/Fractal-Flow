// Auto-synchronized Solidity Contract source and ABI for Frontend and Ethers.js
import { SOLIDITY_CONTRACT_CODE_EXPORT } from "./solidityCode";

export const SOLIDITY_CONTRACT_CODE = SOLIDITY_CONTRACT_CODE_EXPORT;

export const CONTRACT_ABI = [
  "function register(uint256 parentId, bool isLeft) external returns (uint256)",
  "function batchRegister(uint256[] calldata parentIds, bool[] calldata isLefts) external returns (uint256[] memory)",
  "function executeRebirth(uint256 nodeId, uint256 targetParentId, bool isLeft) external returns (uint256)",
  "function batchExecuteRebirth(uint256[] calldata nodeIds, uint256[] calldata targetParentIds, bool[] calldata isLefts) external returns (uint256[] memory)",
  "function upgradeNodeRank(uint256 nodeId) external returns (uint8 newRank)",
  "function upgradeNodeRankWithTopup(uint256 nodeId) external returns (uint8 newRank)",
  "function batchUpgradeRanks(uint256[] calldata nodeIds) external returns (uint8[] memory newRanks)",
  "function getRankPrice(uint8 rank) public view returns (uint256)",
  "function getRankQueueLength(uint8 rank) external view returns (uint256)",
  "function getRankQueueItem(uint8 rank, uint256 queueNumber) external view returns (tuple(uint256 queueNumber, uint256 nodeId, address owner, uint8 rank, uint256 parentQueueNumber, bool isLeft, uint256 upgradeVault, uint256 rebirthCount, uint256 pendingRebirths, uint256 enteredAt))",
  "function getNode(uint256 nodeId) external view returns (tuple(uint256 id, address owner, uint256 parentId, uint256 leftChild, uint256 rightChild, uint256 depth, uint256 createdAt, uint8 rank, uint256 rebirthCount, uint256 pendingRebirths, uint256 totalDirectEarned, uint256 totalLevelEarned, uint256 originalAncestorId))",
  "function getOwnerNodes(address user) external view returns (uint256[] memory)",
  "function isSlotAvailable(uint256 parentId, bool isLeft) external view returns (bool)",
  "function upgradeVault(uint256 nodeId) external view returns (uint256)",
  "function rebirthPool() external view returns (uint256)",
  "function nextNodeId() external view returns (uint256)",
  "function registrationFee() external view returns (uint256)",
  "function emergencyWithdrawERC20(address token, address to, uint256 amount) external",
  "event RankQueueEntered(uint8 indexed rank, uint256 indexed queueNumber, uint256 indexed nodeId, address owner, uint256 parentQueueNumber, bool isLeft)",
  "event NodeRegistered(uint256 indexed nodeId, address indexed owner, uint256 indexed parentId, bool isLeft, bool isRebirth)",
  "event LeftChildPayout(uint256 indexed childId, uint256 indexed parentId, address directRecipient, uint256 directAmount, uint256 upgradeVaultAmount)",
  "event LevelBonusPaid(uint256 indexed fromChildId, uint256 indexed uplineNodeId, address uplineOwner, uint8 level, uint256 amount)",
  "event RightChildRebirthQueued(uint256 indexed parentId, address indexed owner, uint256 rebirthCount, uint256 pendingRebirths)",
  "event RebirthExecuted(uint256 indexed oldNodeId, uint256 indexed newNodeId, uint256 indexed targetParentId, bool isLeft)",
  "event NodeRankUpgraded(uint256 indexed nodeId, address indexed owner, uint8 oldRank, uint8 newRank, uint256 cost, bool isAuto)",
  "event UpgradeVaultUsed(uint256 indexed nodeId, uint256 amount, string reason)",
  "event EmergencyERC20Withdrawn(address indexed token, address indexed to, uint256 amount)"
];
