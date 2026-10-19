import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLoanBreakdown,
  calculateLoanPayoff,
  getMinimumBalance,
  canRepayLoan,
  processLoanRepayment
} from './loanRepayment.ts';

test('calculateLoanBreakdown accurately separates principal and interest for 12 months', () => {
  // Principal 25,000, 12 months at 9% flat:
  // Interest = 25,000 * 0.09 * (12/12) = 2,250
  // Total = 27,250
  const breakdown = calculateLoanBreakdown(25000, 12);
  assert.equal(breakdown.principal, 25000);
  assert.equal(breakdown.interestAmount, 2250);
  assert.equal(breakdown.yearlyInterestRate, 9.0);
  assert.equal(breakdown.termMonths, 12);
  assert.equal(breakdown.totalPayoff, 27250);
});

test('calculateLoanBreakdown accurately separates principal and interest for 24 months', () => {
  // Principal 80,000, 24 months at 9% flat:
  // Interest = 80,000 * 0.09 * (24/12) = 14,400
  // Total = 94,400
  const breakdown = calculateLoanBreakdown(80000, 24);
  assert.equal(breakdown.principal, 80000);
  assert.equal(breakdown.interestAmount, 14400);
  assert.equal(breakdown.totalPayoff, 94400);
});

test('calculateLoanPayoff calculates 9% flat rate correctly for 12 months', () => {
  const payoff = calculateLoanPayoff(25000, 12);
  assert.equal(payoff, 27250);
});

test('getMinimumBalance returns ₹500 for Savings and -₹10,000 for Current', () => {
  assert.equal(getMinimumBalance('SAVINGS'), 500);
  assert.equal(getMinimumBalance('CURRENT'), -10000);
});

test('canRepayLoan verifies sufficient funds against minimum balance', () => {
  const savingsAcc = {
    id: 101,
    accountNumber: 'SB100001',
    accountType: 'SAVINGS' as const,
    balance: 42500
  };

  const checkPass = canRepayLoan(savingsAcc, 27250);
  assert.equal(checkPass.canRepay, true);
  assert.equal(checkPass.remainingBalance, 15250);

  const checkFail = canRepayLoan(savingsAcc, 42200);
  assert.equal(checkFail.canRepay, false);
  assert.equal(checkFail.remainingBalance, 300);
});

test('processLoanRepayment deducts balance and transitions loan to REPAID', () => {
  const savingsAcc = {
    id: 101,
    accountNumber: 'SB100001',
    accountType: 'SAVINGS' as const,
    balance: 42500
  };

  const activeLoan = {
    id: 1,
    amount: 25000,
    termMonths: 12,
    purpose: 'Personal credit facility',
    status: 'APPROVED' as const
  };

  const result = processLoanRepayment(savingsAcc, activeLoan);
  assert.equal(result.payoffAmount, 27250);
  assert.equal(result.breakdown.principal, 25000);
  assert.equal(result.breakdown.interestAmount, 2250);
  assert.equal(result.updatedAccount.balance, 15250);
  assert.equal(result.updatedLoan.status, 'REPAID');
});

test('processLoanRepayment throws error when loan is not in APPROVED status', () => {
  const savingsAcc = {
    id: 101,
    accountNumber: 'SB100001',
    accountType: 'SAVINGS' as const,
    balance: 42500
  };

  const requestedLoan = {
    id: 2,
    amount: 50000,
    termMonths: 12,
    purpose: 'Home renovation',
    status: 'REQUESTED' as const
  };

  assert.throws(() => {
    processLoanRepayment(savingsAcc, requestedLoan);
  }, /Only active APPROVED loans can be repaid/);
});

test('processLoanRepayment throws error when funds are insufficient', () => {
  const savingsAcc = {
    id: 103,
    accountNumber: 'SB100003',
    accountType: 'SAVINGS' as const,
    balance: 9300
  };

  const largeLoan = {
    id: 5,
    amount: 80000,
    termMonths: 12,
    purpose: 'Car loan',
    status: 'APPROVED' as const
  };

  assert.throws(() => {
    processLoanRepayment(savingsAcc, largeLoan);
  }, /Insufficient balance/);
});
