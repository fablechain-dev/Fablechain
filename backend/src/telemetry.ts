import * as dotenv from 'dotenv';
dotenv.config();

import * as AnthropicSDK from '@anthropic-ai/sdk';
import {
  Latitude,
  capture as latitudeCapture,
  type ContextOptions,
} from '@latitude-data/telemetry';
import { createAnthropicInstrumentation } from '@latitude-data/telemetry/instrumentations/anthropic';

/**
 * FableChain Latitude Telemetry
 * -----------------------------
 * Initialized once at module scope, before the first LLM call.
 * - Instruments the Anthropic SDK (ByzantineSystem) for full gen_ai spans.
 * - `capture()` wraps raw-fetch Anthropic call sites (open.ts, AgentWorker,
 *   network.ts, debate.ts, AIValidator.ts, Open.ts) so each becomes a trace
 *   with timing, model metadata, and tags.
 * - Flushes buffered spans on graceful shutdown.
 *
 * When LATITUDE_API_KEY / LATITUDE_PROJECT_SLUG are unset, everything
 * degrades to a no-op and the app behaves exactly as before.
 */

const apiKey = process.env.LATITUDE_API_KEY;
const project = process.env.LATITUDE_PROJECT_SLUG;

const enabled = Boolean(apiKey && project);

export const latitude: Latitude | null = enabled
  ? new Latitude({
      apiKey: apiKey!,
      project: project!,
      serviceName: 'fablechain-backend',
      // Pass the class itself (not the CJS namespace function): traceloop's
      // normalizeAnthropic only unwraps { Anthropic } when typeof module ===
      // 'object', and the SDK's CJS export IS the class function.
      instrumentations: [createAnthropicInstrumentation(AnthropicSDK.Anthropic)],
    })
  : null;

/** Resolves when the SDK is ready; safe to await before the first LLM call. */
export const telemetryReady: Promise<void> = enabled
  ? latitude!.ready
  : Promise.resolve();

/** capture() that no-ops when telemetry is disabled. */
export function capture<T>(
  name: string,
  fn: () => T | Promise<T>,
  options?: ContextOptions
): Promise<T> | T {
  if (!latitude) return fn();
  return latitudeCapture(name, fn, options);
}

/**
 * fetch() wrapped in a Latitude capture span. Extracts model/token metadata
 * from the JSON body so raw Anthropic fetch call sites get trace context
 * without per-site options. No-ops (plain fetch) when telemetry is disabled.
 */
export function captureFetch(
  url: string,
  init?: RequestInit,
  options?: ContextOptions
): Promise<Response> {
  const fn = () => fetch(url, init);
  if (!latitude) return fn();

  let metadata: Record<string, unknown> = { url };
  try {
    if (init?.body) {
      const parsed =
        typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
      if (parsed) {
        if (parsed.model) metadata.model = parsed.model;
        if (parsed.max_tokens) metadata.maxTokens = parsed.max_tokens;
      }
    }
  } catch {
    // non-JSON body; metadata stays minimal
  }

  return latitudeCapture('fablechain.llm.request', fn, {
    tags: ['llm', 'anthropic'],
    metadata,
    ...options,
  }) as Promise<Response>;
}

/** Flush buffered spans (call before process exit in short-lived jobs). */
export async function flushTelemetry(): Promise<void> {
  if (latitude) await latitude.flush();
}

// Graceful shutdown: flush buffered spans so they are not dropped.
async function handleShutdown(): Promise<void> {
  await flushTelemetry();
  process.exit(0);
}
process.once('SIGINT', () => {
  void handleShutdown();
});
process.once('SIGTERM', () => {
  void handleShutdown();
});
process.once('beforeExit', () => {
  void flushTelemetry();
});
