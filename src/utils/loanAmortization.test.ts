import test from 'node:test';
import assert from 'node:assert/strict';
import { getLoanAmortizationDetails } from './loanAmortization.js';
import { Loan } from '../types/index.js';

test('getLoanAmortizationDetails calculates correct schedule for flat 9% loan', () => {
  const sampleLoan: Loan = {
    id: 101,
    userId: 2,
    amount: 24000,
    termMonths: 12,
    purpose: 'Test loan',
    status: 'APPROVED',
    createdAt: '2026-10-01'
  };

  const details = getLoanAmortizationDetails(sampleLoan, 9.0, 'FLAT');
  assert.equal(details.principal, 24000);
  assert.equal(details.termMonths, 12);
  assert.equal(details.annualInterestRate, 9.0);
  // Interest = 24000 * 0.09 * (12/12) = 2160
  assert.equal(details.totalInterest, 2160);
  assert.equal(details.totalPayable, 26160);
  assert.equal(details.monthlyPayment, 2180);
  assert.equal(details.schedule.length, 12);

  // Month 1 assertions
  const m1 = details.schedule[0];
  assert.equal(m1.month, 1);
  assert.equal(m1.openingBalance, 24000);
  assert.equal(m1.interestPaid, 180);
  assert.equal(m1.cumulativeInterest, 180);

  // Final month assertions
  const m12 = details.schedule[11];
  assert.equal(m12.month, 12);
  assert.equal(m12.closingBalance, 0);
  assert.equal(m12.repaidPercent, 100);
  assert.equal(m12.cumulativeInterest, 2160);
});

test('getLoanAmortizationDetails calculates correct schedule for reducing balance loan', () => {
  const sampleLoan: Loan = {
    id: 102,
    userId: 2,
    amount: 100000,
    termMonths: 24,
    purpose: 'Business equipment',
    status: 'REQUESTED',
    createdAt: '2026-10-05'
  };

  const details = getLoanAmortizationDetails(sampleLoan, 9.0, 'REDUCING');
  assert.equal(details.principal, 100000);
  assert.equal(details.schedule.length, 24);
  assert.ok(details.totalPayable > 100000);
  assert.equal(details.schedule[23].closingBalance, 0);
  assert.equal(details.schedule[23].repaidPercent, 100);
});
