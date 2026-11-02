import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStatementSummary } from './statementPdfExport.js';
import { Transaction } from '../types/index.js';

test('calculateStatementSummary accurately totals completed credits and debits', () => {
  const userAccountIds = new Set([101, 102]);

  const txns: Transaction[] = [
    {
      id: 1,
      reference: 'TXN-001',
      fromAccountId: null,
      toAccountId: 101,
      amount: 50000,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      description: 'Salary',
      createdAt: '2026-10-01'
    },
    {
      id: 2,
      reference: 'TXN-002',
      fromAccountId: 101,
      toAccountId: 102,
      amount: 10000,
      type: 'TRANSFER',
      status: 'COMPLETED',
      description: 'Internal transfer',
      createdAt: '2026-10-02'
    },
    {
      id: 3,
      reference: 'TXN-003',
      fromAccountId: 101,
      toAccountId: 999,
      amount: 2500,
      type: 'TRANSFER',
      status: 'COMPLETED',
      description: 'Rent',
      createdAt: '2026-10-03'
    },
    {
      id: 4,
      reference: 'TXN-004',
      fromAccountId: 101,
      toAccountId: 999,
      amount: 1500,
      type: 'TRANSFER',
      status: 'PENDING',
      description: 'Pending transfer',
      createdAt: '2026-10-04'
    },
    {
      id: 5,
      reference: 'TXN-005',
      fromAccountId: 101,
      toAccountId: null,
      amount: 4000,
      type: 'WITHDRAWAL',
      status: 'FAILED',
      description: 'Failed ATM',
      createdAt: '2026-10-05'
    }
  ];

  const summary = calculateStatementSummary(txns, userAccountIds);

  assert.equal(summary.completedCount, 3);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.failedCount, 1);
  assert.equal(summary.totalVolume, 68000);
  // Deposit 50,000 is credit
  assert.equal(summary.totalCredits, 50000);
  // TXN-002 is internal (toAccountId 102 in userAccountIds, fromAccountId 101 in userAccountIds -> isCredit = false, so debit 10,000)
  // TXN-003 is debit 2500
  assert.equal(summary.totalDebits, 12500);
  assert.equal(summary.netFlow, 37500);
});

test('calculateStatementSummary handles empty transaction array', () => {
  const summary = calculateStatementSummary([], new Set([101]));
  assert.equal(summary.completedCount, 0);
  assert.equal(summary.totalCredits, 0);
  assert.equal(summary.totalDebits, 0);
  assert.equal(summary.netFlow, 0);
  assert.equal(summary.totalVolume, 0);
});
