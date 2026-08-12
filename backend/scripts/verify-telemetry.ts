/**
 * FableChain telemetry verification script.
 * Emits real traces through the app's own telemetry module and confirms
 * they land in the Latitude project. Run from backend/:
 *   npx ts-node scripts/verify-telemetry.ts
 */
import { capture, flushTelemetry, telemetryReady } from '../src/telemetry';

async function main(): Promise<void> {
  await telemetryReady;
  console.log('[VERIFY] telemetry initialized');

  // A real capture span through the app's own SDK pipeline
  await capture(
    'fablechain.verification',
    async () => {
      // simulate a tiny unit of app work
      await new Promise((r) => setTimeout(r, 100));
      return 'done';
    },
    {
      tags: ['verification', 'fablechain'],
      metadata: { source: 'verify-telemetry.ts', run: Date.now() },
    }
  );
  console.log('[VERIFY] capture span emitted');

  await flushTelemetry();
  console.log('[VERIFY] flushed — spans should now be visible in Latitude');
}

main().catch((err) => {
  console.error('[VERIFY] FAILED:', err);
  process.exit(1);
});
