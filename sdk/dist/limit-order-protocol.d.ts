import { Order, CreateOrderParams, FillOrderParams } from './types/limit-order';
export declare class LimitOrderProtocol {
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
     * Create a new limit order
     */
    createOrder(params: CreateOrderParams): Promise<string>;
    /**
     * Fill a limit order
     */
    fillOrder(params: FillOrderParams): Promise<void>;
    /**
     * Cancel a limit order
     */
    cancelOrder(orderId: string): Promise<void>;
    /**
     * Get order by ID
     */
    getOrder(orderId: string): Promise<Order | null>;
    /**
     * Get orders by maker
     */
    getOrdersByMaker(maker: string): Promise<Order[]>;
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
    /**
     * Generate a random salt
     */
    private generateSalt;
}
//# sourceMappingURL=limit-order-protocol.d.ts.map