"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelockStage = exports.EscrowStatus = void 0;
var EscrowStatus;
(function (EscrowStatus) {
    EscrowStatus["Created"] = "Created";
    EscrowStatus["Funded"] = "Funded";
    EscrowStatus["Withdrawn"] = "Withdrawn";
    EscrowStatus["Cancelled"] = "Cancelled";
})(EscrowStatus || (exports.EscrowStatus = EscrowStatus = {}));
var TimelockStage;
(function (TimelockStage) {
    TimelockStage["Finality"] = "Finality";
    TimelockStage["WaitingForWithdrawal"] = "WaitingForWithdrawal";
    TimelockStage["PrivateWithdrawal"] = "PrivateWithdrawal";
    TimelockStage["PublicWithdrawal"] = "PublicWithdrawal";
    TimelockStage["PrivateCancellation"] = "PrivateCancellation";
    TimelockStage["PublicCancellation"] = "PublicCancellation";
})(TimelockStage || (exports.TimelockStage = TimelockStage = {}));
//# sourceMappingURL=cross-chain.js.map