import { Order, CreateOrderParams, FillOrderParams } from './types/limit-order';
export declare class LimitOrderProtocol {
    private contractId;
    constructor(contractId: string);
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
     * Generate a random salt
     */
    private generateSalt;
}
//# sourceMappingURL=limit-order-protocol.d.ts.map