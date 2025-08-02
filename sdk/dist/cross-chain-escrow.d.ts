import { Escrow, CreateEscrowParams, DepositEscrowParams, WithdrawEscrowParams } from './types/cross-chain';
export declare class CrossChainEscrow {
    private contractId;
    constructor(contractId: string);
    /**
     * Create a new cross-chain escrow
     */
    createEscrow(params: CreateEscrowParams): Promise<string>;
    /**
     * Deposit funds into escrow
     */
    depositEscrow(params: DepositEscrowParams): Promise<void>;
    /**
     * Withdraw funds from escrow using secret
     */
    withdrawEscrow(params: WithdrawEscrowParams): Promise<void>;
    /**
     * Cancel escrow (after timelock period)
     */
    cancelEscrow(escrowId: string): Promise<void>;
    /**
     * Get escrow by ID
     */
    getEscrow(escrowId: string): Promise<Escrow | null>;
    /**
     * Get escrows by maker
     */
    getEscrowsByMaker(maker: string): Promise<Escrow[]>;
    /**
     * Get escrows by taker
     */
    getEscrowsByTaker(taker: string): Promise<Escrow[]>;
}
//# sourceMappingURL=cross-chain-escrow.d.ts.map