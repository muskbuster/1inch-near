export type AccountId = string;
export interface Escrow {
    maker_asset: AccountId;
    taker_asset: AccountId;
    making_amount: string;
    taking_amount: string;
    maker: AccountId;
    taker: AccountId;
    source_chain: string;
    destination_chain: string;
    timelocks: Timelocks;
    safety_deposit: string;
    secret_hash?: string;
    secret?: string;
    status: EscrowStatus;
    created_at: number;
}
export interface EscrowInfo {
    escrow_id: string;
    escrow: Escrow;
    status: EscrowStatus;
}
export declare enum EscrowStatus {
    Created = "Created",
    Funded = "Funded",
    Withdrawn = "Withdrawn",
    Cancelled = "Cancelled"
}
export interface Timelocks {
    finality: number;
    withdrawal: number;
    public_withdrawal: number;
    cancellation: number;
    public_cancellation: number;
}
export declare enum TimelockStage {
    Finality = "Finality",
    WaitingForWithdrawal = "WaitingForWithdrawal",
    PrivateWithdrawal = "PrivateWithdrawal",
    PublicWithdrawal = "PublicWithdrawal",
    PrivateCancellation = "PrivateCancellation",
    PublicCancellation = "PublicCancellation"
}
export interface CreateEscrowParams {
    maker_asset: AccountId;
    taker_asset: AccountId;
    making_amount: string;
    taking_amount: string;
    maker: AccountId;
    taker: AccountId;
    source_chain: string;
    destination_chain: string;
    timelocks: Timelocks;
    safety_deposit: string;
}
export interface DepositEscrowParams {
    escrow_id: string;
    secret_hash: string;
}
export interface WithdrawEscrowParams {
    escrow_id: string;
    secret: string;
    receiver?: AccountId;
}
//# sourceMappingURL=cross-chain.d.ts.map