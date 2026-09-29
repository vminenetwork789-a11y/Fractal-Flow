export const SOLIDITY_CONTRACT_CODE_EXPORT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BinaryRebirthMatrix
 * @dev Senior-grade Web3 1-to-2 Binary Auto-Matrix with Rebirth, 15-Level Lineage & 15-Rank System.
 * 
 * CORE RULES IMPLEMENTED:
 * 1. 1 Wallet = Multiple IDs: uint256 nextNodeId increments (1, 2, 3...) mapped to owner address.
 * 2. Rank System (Rank 1 to 45):
 *    - Rank 1: 5 tokens (entry)
 *    - Next ranks increase according to the rank pricing schedule (up to Rank 45)
 *    - Auto-Upgrade: When upgradeVault reaches next rank price, contract auto-promotes the rank!
 *    - Manual & Top-up Upgrade: Also available for users who want to fast-track promotion.
 * 3. 100% Math for Downline #1 (Left Child):
 *    - 30% (1.5 tokens) -> Direct upline parent immediately
 *    - 30% (1.5 tokens) -> 15 Uplines loop (2% = 0.1 tokens each). Remainder to treasury if <15 levels.
 *    - 40% (2.0 tokens) -> Stored in parent's upgradeVault for rank upgrades
 * 4. Downline #2 (Right Child - Rebirth):
 *    - 100% (5.0 tokens) -> Held in rebirthPool
 *    - Parent status set to pending rebirth (rebirthCount += 1, pendingRebirths += 1)
 *    - Off-chain Keeper / Bot scans available slots (Round 1: under self, Round 2: spillover)
 *      and triggers executeRebirth() or batchExecuteRebirth() without on-chain O(N) tree scan gas exhaustion.
 * 5. Rank 1-to-2 Queue Matrix:
 *    - จ่ายแบบคิวในแต่ละ Rank 1 ถึง 15
 *    - id ที่ 1 ขึ้นมาก่อนได้เป็นคิวที่ 1
 *    - id ที่ 2 อัพ rank ขึ้นมา เป็นคิวที่ 2 และไปอยู่ใต้ id ที่ 1 (ลูกซ้าย -> จ่าย 30% Unit, 30% Level, 40% Vault)
 *    - id ที่ 3 อัพ rank ขึ้นมา เป็นคิวที่ 3 และไปอยู่ใต้ id ที่ 1 (ลูกขวา -> Rebirth เข้ากองกลาง 100%)
 * 6. Security & Gas:
 *    - ReentrancyGuard, CEI (Checks-Effects-Interactions)
 *    - Custom errors for gas minimization
 *    - Batch processing functions for register, rebirth, and rank upgrades
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract BinaryRebirthMatrix {
    // --- CUSTOM ERRORS (Gas Optimized) ---
    error ZeroAddress();
    error NodeNotFound(uint256 nodeId);
    error SlotAlreadyOccupied(uint256 parentId, bool isLeft);
    error InvalidPlacement(uint256 parentId);
    error InsufficientPayment();
    error NoPendingRebirth(uint256 nodeId);
    error ArrayLengthMismatch();
    error ReentrancyGuardTriggered();
    error Unauthorized();
    error TransferFailed();
    error InvalidRank(uint8 rank);
    error AlreadyMaxRank(uint256 nodeId);
    error InsufficientVaultBalance(uint256 nodeId, uint256 required, uint256 available);
    error OnlyMainIdEligibleForRankUpgrade(uint256 nodeId);

    // --- REENTRANCY GUARD ---
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancyStatus;

    modifier nonReentrant() {
        if (_reentrancyStatus == _ENTERED) revert ReentrancyGuardTriggered();
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    // --- STRUCTS ---
    struct Node {
        uint256 id;
        address owner;
        uint256 parentId;
        uint256 leftChild;    // ID of downline 1 (Trigger 100% math)
        uint256 rightChild;   // ID of downline 2 (Trigger Rebirth)
        uint256 depth;
        uint256 createdAt;
        uint8 rank;           // Rank 1 to 15 (starts at 1)
        uint256 rebirthCount;
        uint256 pendingRebirths;
        uint256 totalDirectEarned;
        uint256 totalLevelEarned;
        uint256 originalAncestorId; // Used for Round 1: rebirth under itself
    }

    // --- STATE VARIABLES ---
    address public owner;
    address public treasury;
    IERC20 public immutable paymentToken;
    uint256 public immutable registrationFee; // e.g. 5 * 10**decimals

    // Math Constants for 5 Token distribution (Fixed 100%)
    // 30% Direct Upline = 1.5 tokens
    // 30% Level Bonus   = 1.5 tokens (15 levels * 2% = 0.1 tokens each)
    // 40% Upgrade Vault = 2.0 tokens
    uint256 public immutable directBonus;  // 30% (1.5)
    uint256 public immutable levelBonus;   // 2% per level (0.1)
    uint256 public immutable upgradeShare; // 40% (2.0)
    uint8 public constant MAX_LEVELS = 15;
    uint8 public constant MAX_RANK = 45;

    uint256 public nextNodeId;
    uint256 public rebirthPool; // Total funds waiting to be consumed by rebirth executions

    // Node storage
    mapping(uint256 => Node) public nodes;
    // 1 Wallet can own multiple Node IDs
    mapping(address => uint256[]) public ownerNodeIds;
    // Upgrade vault for each node
    mapping(uint256 => uint256) public upgradeVault;
    // Accumulated earnings per wallet address
    mapping(address => uint256) public totalWalletEarnings;
    // Direct sponsor on first registration
    mapping(address => address) public firstSponsor;

    // Authorized keeper/bot addresses for automated rebirth processing
    mapping(address => bool) public isKeeper;

    // --- RANK 1-TO-2 QUEUE MATRIX STORAGE ---
    // User condition:
    // "เงื่อนไขของ rank เป็นการจ่ายเเบบคิว. idที่1 ขึ้นมาก่อนได้เป็นคิวที่1 ต่อมา idที่2 อัพ rankขึ้นมา เป็นคิวที่2 เเละไปอยู่ใต้ idที่1 ต่อมา idที่3 อัพ rankขึ้นมา เป็นคิวที่3 เเละไปอยู่ใต้ idที่1"
    struct RankQueueItem {
        uint256 queueNumber;        // ลำดับคิวใน Rank นี้ (1, 2, 3...)
        uint256 nodeId;             // ID ของรหัสสมาชิก
        address owner;              // ที่อยู่กระเป๋าเจ้าของ
        uint8 rank;                 // ระดับ Rank 1 - 15
        uint256 parentQueueNumber;  // queueNumber / 2
        bool isLeft;                // queueNumber % 2 == 0 (true = ลูกซ้าย, false = ลูกขวา)
        uint256 upgradeVault;       // ยอดสะสม 40% ใน Rank นี้
        uint256 rebirthCount;       // จำนวน Rebirth เมื่อมีลูกขวา
        uint256 pendingRebirths;    // รอเกิดใหม่
        uint256 enteredAt;          // เวลาที่เข้าคิว
    }

    mapping(uint8 => uint256) public rankQueueLength; // rank => total in queue
    mapping(uint8 => mapping(uint256 => RankQueueItem)) public rankQueues; // rank => queueNumber => item
    mapping(uint8 => uint256) public rankRebirthPool; // rank => rebirth pool

    // --- EVENTS ---
    event RankQueueEntered(
        uint8 indexed rank,
        uint256 indexed queueNumber,
        uint256 indexed nodeId,
        address owner,
        uint256 parentQueueNumber,
        bool isLeft
    );
    event NodeRegistered(
        uint256 indexed nodeId,
        address indexed owner,
        uint256 indexed parentId,
        bool isLeft,
        bool isRebirth
    );
    event LeftChildPayout(
        uint256 indexed childId,
        uint256 indexed parentId,
        address directRecipient,
        uint256 directAmount,
        uint256 upgradeVaultAmount
    );
    event LevelBonusPaid(
        uint256 indexed fromChildId,
        uint256 indexed uplineNodeId,
        address uplineOwner,
        uint8 level,
        uint256 amount
    );
    event RightChildRebirthQueued(
        uint256 indexed parentId,
        address indexed owner,
        uint256 rebirthCount,
        uint256 pendingRebirths
    );
    event RebirthExecuted(
        uint256 indexed oldNodeId,
        uint256 indexed newNodeId,
        uint256 indexed targetParentId,
        bool isLeft
    );
    event NodeRankUpgraded(
        uint256 indexed nodeId,
        address indexed owner,
        uint8 oldRank,
        uint8 newRank,
        uint256 cost,
        bool isAuto
    );
    event UpgradeVaultUsed(uint256 indexed nodeId, uint256 amount, string reason);
    event KeeperUpdated(address indexed keeper, bool status);
    event EmergencyERC20Withdrawn(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(
        address _paymentToken,
        address _treasury,
        uint256 _fee
    ) {
        if (_treasury == address(0)) revert ZeroAddress();
        owner = msg.sender;
        treasury = _treasury;
        paymentToken = IERC20(_paymentToken);
        
        registrationFee = _fee; // 5 units (e.g. 5 ether or 5 * 10**6 for USDT)
        directBonus = (_fee * 30) / 100;    // 1.5 units (30%)
        levelBonus  = (_fee * 2) / 100;     // 0.1 units (2% * 15 = 30%)
        upgradeShare = (_fee * 40) / 100;   // 2.0 units (40%)

        _reentrancyStatus = _NOT_ENTERED;

        // Genesis Node #1 initialized to root/treasury
        nextNodeId = 1;
        _createNode(1, treasury, 0, 0, 1, 1);
        nextNodeId = 2; // Next registered node will be #2
    }

    // --- CORE REGISTRATION (1 Wallet = Multiple IDs) ---
    /**
     * @notice Register a new Node ID. Can be called unlimited times by any wallet.
     * @param parentId Target parent node ID where the user wants to attach
     * @param isLeft True for Left Child (Downline #1), False for Right Child (Downline #2)
     */
    function register(uint256 parentId, bool isLeft) external nonReentrant returns (uint256) {
        _safeTransferFrom(paymentToken, msg.sender, address(this), registrationFee);
        return _processRegistration(msg.sender, parentId, isLeft, false, 0, 1);
    }

    /**
     * @notice Batch registration for saving gas on mass node placements.
     */
    function batchRegister(
        uint256[] calldata parentIds,
        bool[] calldata isLefts
    ) external nonReentrant returns (uint256[] memory newIds) {
        uint256 count = parentIds.length;
        if (count == 0 || count != isLefts.length) revert ArrayLengthMismatch();

        uint256 totalFee = registrationFee * count;
        _safeTransferFrom(paymentToken, msg.sender, address(this), totalFee);

        newIds = new uint256[](count);
        for (uint256 i = 0; i < count; ) {
            newIds[i] = _processRegistration(msg.sender, parentIds[i], isLefts[i], false, 0, 1);
            unchecked { ++i; }
        }
    }

    // --- REBIRTH EXECUTION (Off-chain Scanner -> On-chain Execution) ---
    /**
     * @notice Executes rebirth for a node that completed its 2 downlines.
     * Rebirths for Rank 2-45 automatically rebirth into that specific rank, funded by rankRebirthPool.
     * @param nodeId Node that has pendingRebirths >= 1
     * @param targetParentId Valid empty slot found by scanner
     * @param isLeft Slot direction
     */
    function executeRebirth(
        uint256 nodeId,
        uint256 targetParentId,
        bool isLeft
    ) public nonReentrant returns (uint256 newNodeId) {
        Node storage n = nodes[nodeId];
        if (n.pendingRebirths == 0) revert NoPendingRebirth(nodeId);

        uint8 nodeRank = n.rank == 0 ? 1 : n.rank;
        uint256 cost = getRankPrice(nodeRank);

        if (nodeRank > 1) {
            if (rankRebirthPool[nodeRank] < cost && rebirthPool < cost) revert InsufficientPayment();
            if (rankRebirthPool[nodeRank] >= cost) {
                rankRebirthPool[nodeRank] -= cost;
            } else {
                rebirthPool -= cost;
            }
        } else {
            if (rebirthPool < registrationFee) revert InsufficientPayment();
            rebirthPool -= registrationFee;
        }

        // Decrement pending rebirths
        n.pendingRebirths -= 1;

        // Origin tracking for Round 1 (under itself) / Round 2 (external)
        uint256 ancestorId = n.originalAncestorId == 0 ? nodeId : n.originalAncestorId;

        // Mint new node for the SAME owner with the SAME rank
        newNodeId = _processRegistration(n.owner, targetParentId, isLeft, true, ancestorId, nodeRank);

        // For Rank 2-45, automatically join the Rank Queue for that rank!
        if (nodeRank > 1) {
            _enterRankQueue(nodeRank, newNodeId, n.owner);
        }

        emit RebirthExecuted(nodeId, newNodeId, targetParentId, isLeft);
    }

    /**
     * @notice Execute rebirth specifically for Rank 2-45 to ensure rebirth in that exact rank.
     */
    function executeRankRebirth(
        uint8 rank,
        uint256 nodeId,
        uint256 targetParentId,
        bool isLeft
    ) external nonReentrant returns (uint256 newNodeId) {
        if (rank == 0 || rank > MAX_RANK) revert InvalidRank(rank);
        Node storage n = nodes[nodeId];
        if (n.pendingRebirths == 0) revert NoPendingRebirth(nodeId);

        uint256 cost = getRankPrice(rank);
        if (rank > 1) {
            if (rankRebirthPool[rank] < cost && rebirthPool < cost) revert InsufficientPayment();
            if (rankRebirthPool[rank] >= cost) {
                rankRebirthPool[rank] -= cost;
            } else {
                rebirthPool -= cost;
            }
        } else {
            if (rebirthPool < registrationFee) revert InsufficientPayment();
            rebirthPool -= registrationFee;
        }

        n.pendingRebirths -= 1;
        uint256 ancestorId = n.originalAncestorId == 0 ? nodeId : n.originalAncestorId;
        newNodeId = _processRegistration(n.owner, targetParentId, isLeft, true, ancestorId, rank);

        if (rank > 1) {
            _enterRankQueue(rank, newNodeId, n.owner);
        }

        emit RebirthExecuted(nodeId, newNodeId, targetParentId, isLeft);
    }

    function batchExecuteRebirth(
        uint256[] calldata nodeIds,
        uint256[] calldata targetParentIds,
        bool[] calldata isLefts
    ) external nonReentrant returns (uint256[] memory newIds) {
        uint256 count = nodeIds.length;
        if (count == 0 || count != targetParentIds.length || count != isLefts.length) {
            revert ArrayLengthMismatch();
        }

        newIds = new uint256[](count);
        for (uint256 i = 0; i < count; ) {
            uint256 nId = nodeIds[i];
            Node storage n = nodes[nId];
            if (n.pendingRebirths == 0) revert NoPendingRebirth(nId);

            uint8 nodeRank = n.rank == 0 ? 1 : n.rank;
            uint256 cost = getRankPrice(nodeRank);

            if (nodeRank > 1) {
                if (rankRebirthPool[nodeRank] < cost && rebirthPool < cost) revert InsufficientPayment();
                if (rankRebirthPool[nodeRank] >= cost) {
                    rankRebirthPool[nodeRank] -= cost;
                } else {
                    rebirthPool -= cost;
                }
            } else {
                if (rebirthPool < registrationFee) revert InsufficientPayment();
                rebirthPool -= registrationFee;
            }

            n.pendingRebirths -= 1;
            uint256 ancestorId = n.originalAncestorId == 0 ? nId : n.originalAncestorId;
            newIds[i] = _processRegistration(n.owner, targetParentIds[i], isLefts[i], true, ancestorId, nodeRank);

            if (nodeRank > 1) {
                _enterRankQueue(nodeRank, newIds[i], n.owner);
            }

            emit RebirthExecuted(nId, newIds[i], targetParentIds[i], isLefts[i]);
            unchecked { ++i; }
        }
    }

    // --- INTERNAL REGISTRATION LOGIC ---
    function _processRegistration(
        address nodeOwner,
        uint256 parentId,
        bool isLeft,
        bool isRebirth,
        uint256 originalAncestorId,
        uint8 rank
    ) internal returns (uint256) {
        if (parentId == 0 || parentId >= nextNodeId) revert NodeNotFound(parentId);
        Node storage parent = nodes[parentId];

        // Strict Rank Isolation: Parent must be in the exact same rank ("ผังใครผังมัน")
        if (parent.rank != rank) revert InvalidPlacement(parentId);

        if (isLeft) {
            if (parent.leftChild != 0) revert SlotAlreadyOccupied(parentId, true);
        } else {
            if (parent.rightChild != 0) revert SlotAlreadyOccupied(parentId, false);
        }

        uint256 currentId = nextNodeId;
        nextNodeId++;

        if (isLeft) {
            parent.leftChild = currentId;
        } else {
            parent.rightChild = currentId;
        }

        _createNode(currentId, nodeOwner, parentId, parent.depth + 1, originalAncestorId, rank);

        if (isLeft) {
            _handleLeftChildPayout(currentId, parentId, nodeOwner);
        } else {
            _handleRightChildRebirth(parentId);
        }

        emit NodeRegistered(currentId, nodeOwner, parentId, isLeft, isRebirth);
        return currentId;
    }

    function _createNode(
        uint256 id,
        address nodeOwner,
        uint256 parentId,
        uint256 depth,
        uint256 originalAncestorId,
        uint8 rank
    ) internal {
        nodes[id] = Node({
            id: id,
            owner: nodeOwner,
            parentId: parentId,
            leftChild: 0,
            rightChild: 0,
            depth: depth,
            createdAt: block.timestamp,
            rank: rank == 0 ? 1 : rank,
            rebirthCount: 0,
            pendingRebirths: 0,
            totalDirectEarned: 0,
            totalLevelEarned: 0,
            originalAncestorId: originalAncestorId
        });
        ownerNodeIds[nodeOwner].push(id);
    }

    function _handleLeftChildPayout(uint256 childId, uint256 parentId, address childOwner) internal {
        Node storage parent = nodes[parentId];
        address uplineOwner = parent.owner;

        // Register firstSponsor if not yet registered
        if (firstSponsor[childOwner] == address(0)) {
            firstSponsor[childOwner] = uplineOwner;
        }
        address directRecipient = firstSponsor[childOwner];

        // 1. 30% (1.5 tokens) เข้ากระเป๋าผู้แนะนำเราครั้งแรก
        parent.totalDirectEarned += directBonus;
        totalWalletEarnings[directRecipient] += directBonus;
        _safeTransfer(paymentToken, directRecipient, directBonus);

        // 2. 40% (2.0 tokens) เข้า Upgrade Vault
        upgradeVault[parentId] += upgradeShare;

        // 3. 30% (1.5 tokens) โบนัส 15 ชั้น เริ่มจ่ายตั้งแต่ชั้นที่ 0 เลย (รหัสแม่ parentId)
        uint256 currentUplineId = parentId; // ชั้นที่ 0 คือ parentId ทันที
        uint256 distributedLevelCount = 0;

        for (uint8 lvl = 0; lvl < MAX_LEVELS; ) {
            if (currentUplineId == 0) break;
            Node storage currentUpline = nodes[currentUplineId];
            address recipient = currentUpline.owner;

            currentUpline.totalLevelEarned += levelBonus;
            totalWalletEarnings[recipient] += levelBonus;
            _safeTransfer(paymentToken, recipient, levelBonus);

            emit LevelBonusPaid(childId, currentUplineId, recipient, lvl, levelBonus);

            currentUplineId = currentUpline.parentId;
            distributedLevelCount++;
            unchecked { ++lvl; }
        }

        if (distributedLevelCount < MAX_LEVELS) {
            uint256 remainder = (MAX_LEVELS - distributedLevelCount) * levelBonus;
            if (remainder > 0) {
                _safeTransfer(paymentToken, treasury, remainder);
            }
        }

        emit LeftChildPayout(childId, parentId, directRecipient, directBonus, upgradeShare);
        _checkAndAutoUpgradeRank(parentId);
    }

    /**
     * @notice Checks and automatically promotes rank if upgradeVault has enough funds.
     * เงื่อนไข: Rank 2 - 45 เฉพาะไอดีหลักเท่านั้น ถึงจะมีสิทธิ์อัพได้
     */
    function _checkAndAutoUpgradeRank(uint256 nodeId) internal {
        Node storage n = nodes[nodeId];
        // หากเป็นไอดีเกิดใหม่ ไม่ให้อัพเกรด แต่ให้ตรวจสอบและส่งเสริมไอดีหลัก (originalAncestorId) แทน
        if (n.originalAncestorId > 0 && n.originalAncestorId != nodeId) {
            _checkAndAutoUpgradeRank(n.originalAncestorId);
            return;
        }

        while (n.rank < MAX_RANK) {
            uint8 nextRank = n.rank + 1;
            uint256 nextCost = getRankPrice(nextRank);

            if (upgradeVault[nodeId] >= nextCost) {
                upgradeVault[nodeId] -= nextCost;
                uint8 oldRank = n.rank;
                n.rank = nextRank;
                emit NodeRankUpgraded(nodeId, n.owner, oldRank, nextRank, nextCost, true);
                _enterRankQueue(nextRank, nodeId, n.owner);
            } else {
                break;
            }
        }
    }

    uint256[45] private rankPrices = [
        5, 10, 20, 30, 40, 50, 60, 80, 100, 200,
        300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000,
        4000, 5000, 6000, 7000, 8000, 9000, 10000, 20000, 30000, 40000,
        50000, 60000, 70000, 80000, 90000, 100000, 200000, 300000, 400000, 500000,
        600000, 700000, 800000, 900000, 1000000
    ];

    function getRankPrice(uint8 rank) public view returns (uint256) {
        if (rank < 1 || rank > MAX_RANK) revert InvalidRank(rank);
        return rankPrices[rank - 1] * (registrationFee / 5);
    }

    /**
     * @notice Manually trigger Rank Upgrade using Upgrade Vault balance.
     * เงื่อนไข: Rank 2 - 45 เฉพาะไอดีหลักเท่านั้น ถึงจะมีสิทธิ์อัพได้
     */
    function upgradeNodeRank(uint256 nodeId) external nonReentrant returns (uint8 newRank) {
        if (nodeId == 0 || nodeId >= nextNodeId) revert NodeNotFound(nodeId);
        Node storage n = nodes[nodeId];
        if (n.originalAncestorId > 0 && n.originalAncestorId != nodeId) {
            revert OnlyMainIdEligibleForRankUpgrade(nodeId);
        }
        if (n.rank >= MAX_RANK) revert AlreadyMaxRank(nodeId);

        uint8 nextRank = n.rank + 1;
        uint256 cost = getRankPrice(nextRank);
        if (upgradeVault[nodeId] < cost) {
            revert InsufficientVaultBalance(nodeId, cost, upgradeVault[nodeId]);
        }

        upgradeVault[nodeId] -= cost;
        uint8 oldRank = n.rank;
        n.rank = nextRank;

        emit NodeRankUpgraded(nodeId, n.owner, oldRank, nextRank, cost, false);
        _enterRankQueue(nextRank, nodeId, n.owner);
        return nextRank;
    }

    /**
     * @notice Fast-track upgrade by paying remaining deficit from sender wallet.
     * เงื่อนไข: Rank 2 - 45 เฉพาะไอดีหลักเท่านั้น ถึงจะมีสิทธิ์อัพได้
     */
    function upgradeNodeRankWithTopup(uint256 nodeId) external nonReentrant returns (uint8 newRank) {
        if (nodeId == 0 || nodeId >= nextNodeId) revert NodeNotFound(nodeId);
        Node storage n = nodes[nodeId];
        if (n.originalAncestorId > 0 && n.originalAncestorId != nodeId) {
            revert OnlyMainIdEligibleForRankUpgrade(nodeId);
        }
        if (n.rank >= MAX_RANK) revert AlreadyMaxRank(nodeId);

        uint8 nextRank = n.rank + 1;
        uint256 cost = getRankPrice(nextRank);
        uint256 vaultUsed = upgradeVault[nodeId] > cost ? cost : upgradeVault[nodeId];
        uint256 deficit = cost - vaultUsed;

        if (deficit > 0) {
            _safeTransferFrom(paymentToken, msg.sender, address(this), deficit);
        }
        upgradeVault[nodeId] -= vaultUsed;
        uint8 oldRank = n.rank;
        n.rank = nextRank;

        emit NodeRankUpgraded(nodeId, n.owner, oldRank, nextRank, cost, false);
        _enterRankQueue(nextRank, nodeId, n.owner);
        return nextRank;
    }

    /**
     * @notice Batch upgrade multiple nodes to save gas.
     * เงื่อนไข: Rank 2 - 45 เฉพาะไอดีหลักเท่านั้น ถึงจะมีสิทธิ์อัพได้
     */
    function batchUpgradeRanks(uint256[] calldata nodeIds) external nonReentrant returns (uint8[] memory newRanks) {
        uint256 count = nodeIds.length;
        if (count == 0) revert ArrayLengthMismatch();
        newRanks = new uint8[](count);

        for (uint256 i = 0; i < count; ) {
            uint256 nId = nodeIds[i];
            if (nId > 0 && nId < nextNodeId) {
                Node storage n = nodes[nId];
                bool isRebirth = (n.originalAncestorId > 0 && n.originalAncestorId != nId);
                if (!isRebirth && n.rank < MAX_RANK) {
                    uint8 nextRank = n.rank + 1;
                    uint256 cost = getRankPrice(nextRank);
                    if (upgradeVault[nId] >= cost) {
                        upgradeVault[nId] -= cost;
                        uint8 oldRank = n.rank;
                        n.rank = nextRank;
                        emit NodeRankUpgraded(nId, n.owner, oldRank, nextRank, cost, false);
                        _enterRankQueue(nextRank, nId, n.owner);
                    }
                }
                newRanks[i] = n.rank;
            }
            unchecked { ++i; }
        }
    }

    function _enterRankQueue(uint8 rank, uint256 nodeId, address nodeOwner) internal {
        if (rank < 1 || rank > MAX_RANK) return;
        uint256 qNum = ++rankQueueLength[rank];
        uint256 rankPrice = getRankPrice(rank);

        uint256 parentQ = 0;
        bool isLeft = false;

        if (qNum > 1) {
            parentQ = qNum / 2;
            isLeft = (qNum % 2 == 0);
        }

        rankQueues[rank][qNum] = RankQueueItem({
            queueNumber: qNum,
            nodeId: nodeId,
            owner: nodeOwner,
            rank: rank,
            parentQueueNumber: parentQ,
            isLeft: isLeft,
            upgradeVault: 0,
            rebirthCount: 0,
            pendingRebirths: 0,
            enteredAt: block.timestamp
        });

        emit RankQueueEntered(rank, qNum, nodeId, nodeOwner, parentQ, isLeft);

        if (qNum == 1) return;

        RankQueueItem storage parentItem = rankQueues[rank][parentQ];

        if (isLeft) {
            uint256 directAmt = (rankPrice * 30) / 100;
            uint256 vaultAmt = (rankPrice * 40) / 100;
            uint256 perLevelAmt = ((rankPrice * 30) / 100) / MAX_LEVELS;

            totalWalletEarnings[parentItem.owner] += directAmt;
            _safeTransfer(paymentToken, parentItem.owner, directAmt);

            parentItem.upgradeVault += vaultAmt;
            upgradeVault[parentItem.nodeId] += vaultAmt;

            uint256 curQ = parentQ;
            uint256 levelsDistributed = 0;
            for (uint8 lvl = 1; lvl <= MAX_LEVELS; ) {
                if (curQ <= 1) break;
                curQ = curQ / 2;
                RankQueueItem storage upline = rankQueues[rank][curQ];
                if (upline.owner == address(0)) break;

                totalWalletEarnings[upline.owner] += perLevelAmt;
                _safeTransfer(paymentToken, upline.owner, perLevelAmt);
                levelsDistributed++;
                unchecked { ++lvl; }
            }

            if (levelsDistributed < MAX_LEVELS) {
                uint256 rem = (MAX_LEVELS - levelsDistributed) * perLevelAmt;
                if (rem > 0) {
                    _safeTransfer(paymentToken, treasury, rem);
                }
            }

            if (rank < MAX_RANK) {
                uint256 nextCost = getRankPrice(rank + 1);
                Node storage parentNode = nodes[parentItem.nodeId];
                bool isParentRebirth = (parentNode.originalAncestorId > 0 && parentNode.originalAncestorId != parentItem.nodeId);
                if (parentItem.upgradeVault >= nextCost && !isParentRebirth) {
                    parentItem.upgradeVault -= nextCost;
                    if (upgradeVault[parentItem.nodeId] >= nextCost) {
                        upgradeVault[parentItem.nodeId] -= nextCost;
                    }
                    if (parentNode.rank <= rank) {
                        parentNode.rank = rank + 1;
                    }
                    emit NodeRankUpgraded(parentItem.nodeId, parentItem.owner, rank, rank + 1, nextCost, true);
                    _enterRankQueue(rank + 1, parentItem.nodeId, parentItem.owner);
                }
            }
        } else {
            rankRebirthPool[rank] += rankPrice;
            parentItem.rebirthCount += 1;
            parentItem.pendingRebirths += 1;
            nodes[parentItem.nodeId].rebirthCount += 1;
            nodes[parentItem.nodeId].pendingRebirths += 1;

            emit RightChildRebirthQueued(parentItem.nodeId, parentItem.owner, parentItem.rebirthCount, parentItem.pendingRebirths);
        }
    }

    function getRankQueueLength(uint8 rank) external view returns (uint256) {
        return rankQueueLength[rank];
    }

    function getRankQueueItem(uint8 rank, uint256 queueNumber) external view returns (RankQueueItem memory) {
        return rankQueues[rank][queueNumber];
    }

    function _handleRightChildRebirth(uint256 parentId) internal {
        rebirthPool += registrationFee;
        Node storage parent = nodes[parentId];
        parent.rebirthCount += 1;
        parent.pendingRebirths += 1;

        emit RightChildRebirthQueued(parentId, parent.owner, parent.rebirthCount, parent.pendingRebirths);
    }

    function useUpgradeVault(uint256 nodeId, uint256 amount, string calldata reason) external nonReentrant {
        Node storage n = nodes[nodeId];
        if (msg.sender != n.owner && msg.sender != owner) revert Unauthorized();
        if (upgradeVault[nodeId] < amount) revert InsufficientPayment();

        upgradeVault[nodeId] -= amount;
        emit UpgradeVaultUsed(nodeId, amount, reason);
    }

    function getNode(uint256 nodeId) external view returns (Node memory) {
        return nodes[nodeId];
    }

    function getOwnerNodes(address user) external view returns (uint256[] memory) {
        return ownerNodeIds[user];
    }

    /**
     * @notice ดึงยอดสะสม Upgrade Vault 40% เม็ดซ้าย รวมทั้งหมดที่เป็นกระเป๋าเดียวกัน
     * @param user ที่อยู่กระเป๋า (Wallet Address)
     * @return totalVault ยอดรวม 40% Upgrade Vault ของทุกรหัสที่กระเป๋านี้เป็นเจ้าของ
     */
    function getWalletUpgradeVault(address user) external view returns (uint256 totalVault) {
        uint256[] memory myNodes = ownerNodeIds[user];
        for (uint256 i = 0; i < myNodes.length; i++) {
            totalVault += upgradeVault[myNodes[i]];
        }
    }

    /**
     * @notice ดึงยอดสะสม Upgrade Vault 40% เม็ดซ้าย รวมทั้งหมดที่เป็น iD เดียวกัน รวมถึงไอดีเกิดใหม่
     * @param nodeId รหัสที่ต้องการตรวจสอบ (เป็นรหัสหลัก หรือรหัสเกิดใหม่ก็ได้)
     * @return totalVault ยอดรวม 40% Upgrade Vault ของรหัสหลักและไอดีเกิดใหม่ทุกรหัส
     */
    function getIdFamilyUpgradeVault(uint256 nodeId) external view returns (uint256 totalVault) {
        if (nodeId == 0 || nodeId >= nextNodeId) return 0;
        uint256 rootId = nodes[nodeId].originalAncestorId == 0 ? nodeId : nodes[nodeId].originalAncestorId;
        for (uint256 i = 1; i < nextNodeId; i++) {
            uint256 anc = nodes[i].originalAncestorId == 0 ? i : nodes[i].originalAncestorId;
            if (i == rootId || anc == rootId) {
                totalVault += upgradeVault[i];
            }
        }
    }

    function isSlotAvailable(uint256 parentId, bool isLeft) external view returns (bool) {
        if (parentId == 0 || parentId >= nextNodeId) return false;
        return isLeft ? nodes[parentId].leftChild == 0 : nodes[parentId].rightChild == 0;
    }

    function setKeeper(address keeper, bool status) external onlyOwner {
        isKeeper[keeper] = status;
        emit KeeperUpdated(keeper, status);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
    }

    /**
     * @notice Emergency withdrawal of ERC-20 tokens held by this contract
     * @dev Only callable by contract owner in emergency situations or to recover accidentally trapped tokens.
     * @param token Address of the ERC-20 token contract to withdraw (e.g. USDT)
     * @param to Destination address that receives the withdrawn tokens
     * @param amount Amount to withdraw (pass 0 or amount >= balance to withdraw entire available contract balance)
     */
    function emergencyWithdrawERC20(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(0) || to == address(0)) revert ZeroAddress();

        IERC20 erc20 = IERC20(token);
        uint256 contractBalance = erc20.balanceOf(address(this));
        uint256 withdrawAmount = (amount == 0 || amount > contractBalance) ? contractBalance : amount;
        if (withdrawAmount == 0) revert InsufficientPayment();

        _safeTransfer(erc20, to, withdrawAmount);
        emit EmergencyERC20Withdrawn(token, to, withdrawAmount);
    }

    function _safeTransfer(IERC20 token, address to, uint256 value) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }
    }

    function _safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }
    }
}
`;
