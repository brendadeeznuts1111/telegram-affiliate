/**
 * Cost tracking and optimization
 * Monitors Cloudflare usage and provides cost estimates
 */

export interface CostMetrics {
  requests: number;
  bandwidth: number;
  duration: number;
  kv_reads: number;
  kv_writes: number;
  d1_queries: number;
}

export interface CostEstimate {
  today: number;
  monthly: number;
  breakdown: {
    requests: number;
    bandwidth: number;
    kv: number;
    d1: number;
  };
}

export class CostTracker {
  // Cloudflare pricing (as of 2024)
  private readonly PRICING = {
    requests: 0.15 / 1_000_000,        // $0.15 per million requests
    bandwidth: 0.0,                     // First 10GB free
    kv_reads: 0.50 / 1_000_000,        // $0.50 per million reads
    kv_writes: 1.00 / 1_000_000,       // $1.00 per million writes
    d1_rows_read: 0.001 / 1000,        // $0.001 per 1000 rows
    d1_rows_written: 1.00 / 1_000_000, // $1.00 per million rows
  };

  async getCurrentUsage(): Promise<CostMetrics> {
    // In production, query Cloudflare Analytics API
    // For now, return mock data
    return {
      requests: 150_000,
      bandwidth: 5_000,    // MB
      duration: 45_000,    // ms
      kv_reads: 50_000,
      kv_writes: 5_000,
      d1_queries: 100_000,
    };
  }

  calculateCost(metrics: CostMetrics): CostEstimate {
    const requests = metrics.requests * this.PRICING.requests;
    const bandwidth = 0; // Free tier
    const kv = (
      metrics.kv_reads * this.PRICING.kv_reads +
      metrics.kv_writes * this.PRICING.kv_writes
    );
    const d1 = metrics.d1_queries * this.PRICING.d1_rows_read;

    const today = requests + bandwidth + kv + d1;
    const monthly = today * 30; // Rough estimate

    return {
      today,
      monthly,
      breakdown: {
        requests,
        bandwidth,
        kv,
        d1,
      },
    };
  }

  async getOptimizationSuggestions(estimate: CostEstimate): Promise<string[]> {
    const suggestions: string[] = [];

    if (estimate.breakdown.requests > 1) {
      suggestions.push('💡 Enable aggressive caching to reduce request count');
    }

    if (estimate.breakdown.kv > 0.5) {
      suggestions.push('💡 Batch KV operations to reduce read/write count');
    }

    if (estimate.breakdown.d1 > 0.5) {
      suggestions.push('💡 Add database indexes to reduce query cost');
      suggestions.push('💡 Use connection pooling for D1');
    }

    if (estimate.monthly > 10) {
      suggestions.push('⚠️  Consider upgrading to Workers Paid plan for better rates');
    }

    return suggestions;
  }

  async checkBudgetAlert(monthlyBudget: number): Promise<boolean> {
    const usage = await this.getCurrentUsage();
    const estimate = this.calculateCost(usage);

    return estimate.monthly > monthlyBudget;
  }
}

