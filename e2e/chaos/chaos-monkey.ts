/**
 * Chaos Monkey for resilience testing
 * Injects faults to test system resilience
 */

export class ChaosMonkey {
  private faults: Map<string, boolean> = new Map();

  /**
   * Inject random failures
   */
  async injectFault(type: string, probability: number): Promise<void> {
    this.faults.set(type, Math.random() < probability);
    console.log(`🐵 Chaos: Injecting ${type} (${probability * 100}% chance)`);
  }

  /**
   * Inject latency
   */
  async injectLatency(ms: number, probability: number): Promise<void> {
    if (Math.random() < probability) {
      console.log(`🐵 Chaos: Adding ${ms}ms latency`);
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  /**
   * Clear all injected faults
   */
  reset(): void {
    this.faults.clear();
  }

  /**
   * Check if fault is active
   */
  hasFault(type: string): boolean {
    return this.faults.get(type) || false;
  }
}

/**
 * Chaos middleware for API testing
 */
export class ChaosMiddleware {
  constructor(private monkey: ChaosMonkey) {}

  async intercept(request: Request): Promise<Response | null> {
    // Random 500s
    if (this.monkey.hasFault('random_500')) {
      return new Response('Internal Server Error', { status: 500 });
    }

    // Random timeouts
    if (this.monkey.hasFault('timeout')) {
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    // Random network errors
    if (this.monkey.hasFault('network_error')) {
      throw new Error('Network connection failed');
    }

    return null;
  }
}

