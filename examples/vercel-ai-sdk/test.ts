/**
 * Minimal integration test for NotaryOS + Vercel AI SDK pattern.
 *
 * Tests issue → verify round-trip without any test framework dependency.
 * Run: npx tsx test.ts
 */

import { issueReceipt, verifyReceipt } from './index';

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Issue a receipt
  try {
    const receipt = await issueReceipt('test.vercel_integration', {
      framework: 'vercel-ai-sdk',
      timestamp: Date.now(),
    });
    if (receipt.receipt_id && receipt.signature && receipt.receipt_hash) {
      passed++;
      console.log('  PASS  Issue receipt');
    } else {
      failed++;
      console.log('  FAIL  Issue receipt: missing fields');
    }

    // Test 2: Verify the receipt
    const result = await verifyReceipt(receipt);
    if (result.valid) {
      passed++;
      console.log('  PASS  Verify receipt');
    } else {
      failed++;
      console.log('  FAIL  Verify receipt: not valid');
    }
  } catch (err) {
    failed += 2;
    console.log(`  FAIL  ${err}`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
