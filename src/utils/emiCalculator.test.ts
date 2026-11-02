import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEMI, LOAN_PRESETS } from './emiCalculator.js';

test('calculateEMI returns zero breakdown for zero principal', () => {
  const result = calculateEMI(0, 10, 12, 'REDUCING');
  assert.equal(result.monthlyEMI, 0);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.totalPayable, 0);
  assert.equal(result.amortizationSchedule.length, 0);
});

test('calculateEMI accurately computes standard Reducing Balance EMI', () => {
  // ₹1,00,000 at 12% annual rate for 12 months
  // Monthly rate = 0.01
  // EMI = 100000 * 0.01 * (1.01^12) / (1.01^12 - 1) = ~8,884.88
  const res = calculateEMI(100000, 12, 12, 'REDUCING');
  assert.ok(res.monthlyEMI >= 8880 && res.monthlyEMI <= 8890, `EMI should be around 8884.88, got ${res.monthlyEMI}`);
  assert.ok(res.totalPayable > 100000);
  assert.equal(res.totalPayable, Math.round((100000 + res.totalInterest) * 100) / 100);
  assert.equal(res.amortizationSchedule.length, 12);
  // Final closing balance should be 0
  const finalMonth = res.amortizationSchedule[res.amortizationSchedule.length - 1];
  assert.equal(finalMonth.closingBalance, 0);
});

test('calculateEMI accurately computes Flat Rate calculation', () => {
  // ₹50,000 at 9% flat rate for 12 months
  // Interest = 50,000 * 0.09 * (12/12) = 4,500
  // Total = 54,500
  // Monthly EMI = 54,500 / 12 = 4,541.67
  const res = calculateEMI(50000, 9, 12, 'FLAT');
  assert.equal(res.totalInterest, 4500);
  assert.equal(res.totalPayable, 54500);
  assert.equal(res.monthlyEMI, 4541.67);
  assert.equal(res.amortizationSchedule.length, 12);
  const finalMonth = res.amortizationSchedule[res.amortizationSchedule.length - 1];
  assert.equal(finalMonth.closingBalance, 0);
});

test('calculateEMI calculates percentage shares summing to 100', () => {
  const res = calculateEMI(200000, 10.5, 36, 'REDUCING');
  assert.ok(res.principalSharePercent > 0);
  assert.ok(res.interestSharePercent > 0);
  assert.ok(Math.abs(res.principalSharePercent + res.interestSharePercent - 100) <= 0.2);
});

test('LOAN_PRESETS contains valid banking products with positive terms', () => {
  assert.ok(LOAN_PRESETS.length >= 4);
  for (const preset of LOAN_PRESETS) {
    assert.ok(preset.defaultPrincipal >= 10000);
    assert.ok(preset.defaultTenure >= 6);
    assert.ok(preset.defaultRate >= 5);
  }
});
