import type { ScoringEngine, ScoringConfig } from "./types";
import { SimpleLLMScorer } from "./simple-llm-scorer";
import { EnhancedLLMScorer } from "./v2-enhanced-llm-scorer";

// EXTENSION POINT: Import future scorers here
// import { HybridScorer } from "./hybrid-scorer";
// import { DeterministicScorer } from "./deterministic-scorer";

/**
 * Factory to create the appropriate scoring engine
 * This is where you switch between different implementations
 *
 * Extension point: Add new cases for v2, v3, etc.
 */
export function createScoringEngine(config?: ScoringConfig): ScoringEngine {
  const version = config?.version || "v1-simple-llm";

  switch (version) {
    case "v1-simple-llm":
      return new SimpleLLMScorer();

    case "v2-enhanced-llm":
      return new EnhancedLLMScorer();

    // EXTENSION POINT: Add future versions here
    // case "v2-hybrid":
    //   return new HybridScorer(config);
    // case "v3-deterministic":
    //   return new DeterministicScorer(config);

    default:
      console.warn(`Unknown scoring version: ${version}, falling back to v1`);
      return new SimpleLLMScorer();
  }
}

// Export types and classes for external use
export type { ScoringEngine, ScoringConfig } from "./types";
export { SimpleLLMScorer } from "./simple-llm-scorer";
