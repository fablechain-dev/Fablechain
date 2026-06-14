/**
 * Fix: Update AIValidator to handle time-based block timestamps
 * 
 * This patch updates the heuristic validation in AIValidator to properly
 * validate blocks that use the fixed genesis timestamp system.
 */

import { Block, FIXED_GENESIS_TIMESTAMP, BLOCK_INTERVAL_MS } from '../blockchain/Block';

/**
 * Enhanced heuristic validation for blocks with time-based timestamps
 * 
 * The original heuristic was too strict about timestamp gaps because it
 * didn't account for the fixed genesis timestamp system where timestamps
 * are calculated as: FIXED_GENESIS_TIMESTAMP + (height * BLOCK_INTERVAL_MS)
 */
export function improvedHeuristicValidation(
  block: Block,
  previousBlock: Block | null
): {
  valid: boolean;
  warnings: string[];
  reasoning: string;
} {
  const warnings: string[] = [];
  let valid = true;

  // Calculate expected timestamp based on block height
  const expectedTimestamp = FIXED_GENESIS_TIMESTAMP + (block.header.height * BLOCK_INTERVAL_MS);
  const tolerance = BLOCK_INTERVAL_MS * 0.5; // 50% tolerance

  // Validate timestamp is approximately correct for this height
  const timestampDiff = Math.abs(block.header.timestamp - expectedTimestamp);
  if (timestampDiff > tolerance) {
    valid = false;
    warnings.push(
      `Timestamp deviation: expected ${expectedTimestamp}, got ${block.header.timestamp} ` +
      `(diff: ${timestampDiff}ms, tolerance: ${tolerance}ms)`
    );
  }

  if (previousBlock) {
    // Check height sequence
    if (block.header.height !== previousBlock.header.height + 1) {
      valid = false;
      warnings.push(
        `Height sequence invalid: previous height ${previousBlock.header.height}, ` +
        `current height ${block.header.height}`
      );
    }

    // Check parent hash
    if (block.header.parentHash !== previousBlock.header.hash) {
      valid = false;
      warnings.push(
        `Parent hash mismatch: expected ${previousBlock.header.hash}, ` +
        `got ${block.header.parentHash}`
      );
    }

    // Check timestamp is strictly increasing
    if (block.header.timestamp <= previousBlock.header.timestamp) {
      valid = false;
      warnings.push(
        `Timestamp not increasing: previous ${previousBlock.header.timestamp}, ` +
        `current ${block.header.timestamp}`
      );
    }

    // Check timestamp gap is reasonable (should be ~BLOCK_INTERVAL_MS)
    const expectedGap = BLOCK_INTERVAL_MS;
    const actualGap = block.header.timestamp - previousBlock.header.timestamp;
    if (Math.abs(actualGap - expectedGap) > tolerance) {
      warnings.push(
        `Timestamp gap unusual: expected ~${expectedGap}ms, got ${actualGap}ms`
      );
    }
  }

  // Check gas limit
  if (block.header.gasUsed > block.header.gasLimit) {
    valid = false;
    warnings.push('Gas used exceeds gas limit');
  }

  // Check producer
  if (!block.header.producer) {
    valid = false;
    warnings.push('No block producer specified');
  }

  const reasoning = valid
    ? 'Passed improved heuristic validation (time-based timestamps)'
    : `Failed validation: ${warnings.join('; ')}`;

  return { valid, warnings, reasoning };
}

/**
 * Detect and report consensus failures related to block sequences
 */
export function detectConsensusFailure(
  block: Block,
  previousBlock: Block | null
): {
  hasFailure: boolean;
  failureType?: string;
  details?: string;
} {
  if (!previousBlock) {
    return { hasFailure: false };
  }

  // Check for the specific failure pattern: massive timestamp gap
  const timeDiff = block.header.timestamp - previousBlock.header.timestamp;
  const gapDays = timeDiff / (1000 * 60 * 60 * 24);

  if (gapDays > 10) { // More than 10 days is suspicious
    return {
      hasFailure: true,
      failureType: 'MASSIVE_TIMESTAMP_GAP',
      details: `Block height ${block.header.height} has ${gapDays.toFixed(1)} day gap from parent. ` +
               `This indicates the block was created with Date.now() instead of time-based timestamps.`
    };
  }

  // Check for height sequence failure
  if (block.header.height !== previousBlock.header.height + 1) {
    return {
      hasFailure: true,
      failureType: 'INVALID_HEIGHT_SEQUENCE',
      details: `Height ${block.header.height} doesn't follow parent height ${previousBlock.header.height}`
    };
  }

  // Check for parent hash mismatch
  if (block.header.parentHash !== previousBlock.header.hash) {
    return {
      hasFailure: true,
      failureType: 'PARENT_HASH_MISMATCH',
      details: `Parent hash ${block.header.parentHash} doesn't match actual parent ${previousBlock.header.hash}`
    };
  }

  return { hasFailure: false };
}

console.log('[FIX] AIValidator consensus failure fix loaded');
