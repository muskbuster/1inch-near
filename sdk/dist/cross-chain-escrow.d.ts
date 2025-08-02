import { Escrow, CreateEscrowParams, DepositParams, WithdrawParams } from './types/cross-chain';
export declare class CrossChainEscrow {
    private contractId;
    private contract;
    private walletConnection;
    private accountId;
    constructor(contractId: string);
    /**
     * Initialize connection to NEAR
     */
    initialize(network?: 'testnet' | 'mainnet'): Promise<void>;
    /**
     * Create a new cross-chain escrow
     */
    createEscrow(params: CreateEscrowParams): Promise<string>;
    /**
     * Deposit funds into escrow
     */
    depositIntoEscrow(params: DepositParams): Promise<void>;
    /**
     * Withdraw from escrow
     */
    withdrawFromEscrow(params: WithdrawParams): Promise<void>;
    /**
     * Cancel escrow
     */
    cancelEscrow(escrowId: string): Promise<void>;
    /**
     * Get escrow by ID
     */
    getEscrow(escrowId: string): Promise<Escrow | null>;
    /**
     * Get current account ID
     */
    getAccountId(): string | null;
    /**
     * Check if user is signed in
     */
    isSignedIn(): boolean;
    /**
     * Sign in to NEAR wallet
     */
    requestSignIn(): void;
    /**
     * Sign out from NEAR wallet
     */
    signOut(): void;
}
//# sourceMappingURL=cross-chain-escrow.d.ts.map