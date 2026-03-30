/**
 * Centralized synchronization manager for voice-UI communication
 * Adapted from buy.ai project for robust shopping voice commands
 * Eliminates race conditions and provides reliable state synchronization
 */

interface ProductData {
  id: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  category: string;
  originalItem?: string;
}

export type ShoppingSyncEvent = 
  | { type: 'ITEM_REMOVED'; itemName: string; success: boolean; product?: ProductData }
  | { type: 'ITEM_ADDED'; itemName: string; success: boolean; product?: ProductData }
  | { type: 'ITEM_CHANGED'; oldItem: string; newItem: string; success: boolean; product?: ProductData }
  | { type: 'ALTERNATIVES_SHOWN'; itemName: string; success: boolean; product?: ProductData }
  | { type: 'ALTERNATIVE_SELECTED'; itemName: string; alternativeName: string; success: boolean; product?: ProductData }
  | { type: 'PURCHASE_CONFIRMED'; success: boolean }
  | { type: 'VOICE_ACTION_STARTED'; action: string; context?: any }
  | { type: 'VOICE_ACTION_COMPLETED'; action: string; success: boolean; message?: string }
  | { type: 'VOICE_ACTION_FAILED'; action: string; error: string };

export type SyncEventHandler = (event: ShoppingSyncEvent) => void;

/**
 * Centralized synchronization manager for shopping voice-UI communication
 * Ensures voice commands only confirm when UI has actually updated
 */
class ShoppingVoiceUISync {
  private handlers: Set<SyncEventHandler> = new Set();
  private pendingActions: Map<string, { 
    resolve: (value: any) => void; 
    reject: (error: any) => void; 
    timeout: NodeJS.Timeout;
    retries: number;
  }> = new Map();

  private currentState: {
    products: ProductData[];
    isProcessing: boolean;
    lastAction: string | null;
  } = {
    products: [],
    isProcessing: false,
    lastAction: null
  };

  /**
   * Subscribe to sync events
   */
  subscribe(handler: SyncEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Emit a sync event to all subscribers
   */
  emit(event: ShoppingSyncEvent): void {
    console.log('[ShoppingVoiceUISync] Emitting event:', event.type, event);
    
    // Update internal state
    this.updateInternalState(event);
    
    // Notify all handlers
    this.handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('[ShoppingVoiceUISync] Error in event handler:', error);
      }
    });
  }

  /**
   * Get current synchronized state
   */
  getState() {
    return { ...this.currentState };
  }

  /**
   * Execute a voice command with timeout, retry logic, and confirmation
   * Only resolves when UI has actually updated
   */
  async executeVoiceCommand<T>(
    actionId: string,
    command: () => Promise<T> | T,
    timeoutMs: number = 3000,
    maxRetries: number = 2
  ): Promise<T> {
    const fullActionId = `${actionId}-${Date.now()}`;
    
    // Emit action started
    this.emit({ type: 'VOICE_ACTION_STARTED', action: actionId });
    
    // Try with retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeAction(fullActionId, command, timeoutMs);
        
        // Emit success
        this.emit({ 
          type: 'VOICE_ACTION_COMPLETED', 
          action: actionId, 
          success: true,
          message: typeof result === 'object' && result !== null && 'message' in result 
            ? (result as any).message 
            : 'Done'
        });
        
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          // Final failure
          const errorMsg = error instanceof Error ? error.message : 'Failed';
          console.error(`[ShoppingVoiceUISync] Command ${actionId} failed after ${maxRetries + 1} attempts:`, errorMsg);
          
          this.emit({ 
            type: 'VOICE_ACTION_FAILED', 
            action: actionId, 
            error: errorMsg 
          });
          
          throw error;
        }
        
        // Retry with exponential backoff
        const backoffMs = 500 * Math.pow(2, attempt);
        console.log(`[ShoppingVoiceUISync] Retrying ${actionId}, attempt ${attempt + 2}/${maxRetries + 1} after ${backoffMs}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    
    throw new Error(`Command ${actionId} failed after all retries`);
  }

  /**
   * Execute an action with timeout
   */
  private async executeAction<T>(
    actionId: string, 
    action: () => Promise<T> | T, 
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingActions.delete(actionId);
        reject(new Error(`Action ${actionId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingActions.set(actionId, { resolve, reject, timeout, retries: 0 });

      Promise.resolve(action())
        .then(result => {
          const pending = this.pendingActions.get(actionId);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingActions.delete(actionId);
            resolve(result);
          }
        })
        .catch(error => {
          const pending = this.pendingActions.get(actionId);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingActions.delete(actionId);
            reject(error);
          }
        });
    });
  }

  /**
   * Update internal state based on events
   */
  private updateInternalState(event: ShoppingSyncEvent): void {
    switch (event.type) {
      case 'VOICE_ACTION_STARTED':
        this.currentState.isProcessing = true;
        this.currentState.lastAction = event.action;
        break;
      case 'VOICE_ACTION_COMPLETED':
      case 'VOICE_ACTION_FAILED':
        this.currentState.isProcessing = false;
        this.currentState.lastAction = null;
        break;
    }
  }

  /**
   * Update products list (called by UI when products change)
   */
  updateProducts(products: ProductData[]): void {
    this.currentState.products = products;
  }

  /**
   * Clean up all pending actions and handlers
   */
  destroy(): void {
    // Clear all pending actions
    this.pendingActions.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingActions.clear();
    
    // Clear all handlers
    this.handlers.clear();
    
    // Reset state
    this.currentState = {
      products: [],
      isProcessing: false,
      lastAction: null
    };
  }
}

// Create singleton instance
export const shoppingVoiceSync = new ShoppingVoiceUISync();

// Export types
export type { ProductData };

