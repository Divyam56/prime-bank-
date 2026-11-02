import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBalanceThresholdAlert } from './balanceAlert.js';
import { Account } from '../types/index.js';

test('checkBalanceThresholdAlert triggers warning when balance is below threshold', () => {
  const accounts: Account[] = [
    {
      id: 101,
      userId: 2,
      accountNumber: 'SB100001',
      accountType: 'SAVINGS',
      balance: 4500,
      createdAt: '2026-10-01'
    },
    {
      id: 102,
      userId: 2,
      accountNumber: 'CA100002',
      accountType: 'CURRENT',
      balance: 15000,
      createdAt: '2026-10-01'
    }
  ];

  // Set alert threshold at ₹5,000. Account 101 is at ₹4,500 (< 5,000)
  const result = checkBalanceThresholdAlert(accounts, 5000);

  assert.equal(result.hasTriggered, true);
  assert.equal(result.affectedAccount?.accountNumber, 'SB100001');
  assert.equal(result.currentBalance, 4500);
  assert.equal(result.threshold, 5000);
  assert.match(result.warningMessage || '', /Low Balance Warning/);
  assert.match(result.warningMessage || '', /SB100001/);
  assert.match(result.warningMessage || '', /4,500/);
});

test('checkBalanceThresholdAlert does not trigger when all balances meet or exceed threshold', () => {
  const accounts: Account[] = [
    {
      id: 101,
      userId: 2,
      accountNumber: 'SB100001',
      accountType: 'SAVINGS',
      balance: 10000,
      createdAt: '2026-10-01'
    }
  ];

  const result = checkBalanceThresholdAlert(accounts, 5000);
  assert.equal(result.hasTriggered, false);
  assert.equal(result.affectedAccount, null);
  assert.equal(result.warningMessage, null);
});

test('checkBalanceThresholdAlert does not trigger when threshold is null, 0, or negative', () => {
  const accounts: Account[] = [
    {
      id: 101,
      userId: 2,
      accountNumber: 'SB100001',
      accountType: 'SAVINGS',
      balance: 500,
      createdAt: '2026-10-01'
    }
  ];

  assert.equal(checkBalanceThresholdAlert(accounts, null).hasTriggered, false);
  assert.equal(checkBalanceThresholdAlert(accounts, 0).hasTriggered, false);
  assert.equal(checkBalanceThresholdAlert(accounts, -100).hasTriggered, false);
  assert.equal(checkBalanceThresholdAlert([], 1000).hasTriggered, false);
});
