import test from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, maskAccountNumber, formatDate } from './formatters.ts';

test('formatINR formats currency with rupee symbol and two decimals', () => {
  const result = formatINR(25000);
  assert.ok(result.includes('25,000.00'), `Expected 25,000.00 in ${result}`);
});

test('formatINR handles 0 and invalid values gracefully', () => {
  assert.ok(formatINR(0).includes('0.00'));
  assert.equal(formatINR(NaN), '₹0.00');
});

test('maskAccountNumber masks middle characters for privacy', () => {
  assert.equal(maskAccountNumber('SB100001'), 'SB••0001');
  assert.equal(maskAccountNumber('CA100002'), 'CA••0002');
  assert.equal(maskAccountNumber('123'), '123'); // short strings unchanged
});

test('formatDate parses valid date string', () => {
  const formatted = formatDate('2026-10-06');
  assert.ok(formatted.includes('2026'));
  assert.ok(formatted.includes('Oct') || formatted.includes('10'));
});
