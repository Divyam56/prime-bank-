import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAccountNumberFromQR } from './qrParser.js';

test('extractAccountNumberFromQR extracts plain account number', () => {
  assert.equal(extractAccountNumberFromQR('SB100003'), 'SB100003');
  assert.equal(extractAccountNumberFromQR('ca100002'), 'CA100002');
  assert.equal(extractAccountNumberFromQR('  SB100004  '), 'SB100004');
});

test('extractAccountNumberFromQR extracts from UPI URI', () => {
  const upiUrl = 'upi://pay?pa=SB100003@primebank&pn=Rahul%20Verma&mc=0000&mode=02';
  assert.equal(extractAccountNumberFromQR(upiUrl), 'SB100003');
});

test('extractAccountNumberFromQR extracts from JSON payload', () => {
  const json = JSON.stringify({ accountNumber: 'SB100004', name: 'Meera Iyer' });
  assert.equal(extractAccountNumberFromQR(json), 'SB100004');
});

test('extractAccountNumberFromQR extracts from URL path', () => {
  const url = 'https://primebank.example/pay/SB100003';
  assert.equal(extractAccountNumberFromQR(url), 'SB100003');
});

test('extractAccountNumberFromQR extracts from key-value string', () => {
  assert.equal(extractAccountNumberFromQR('account: SB100003'), 'SB100003');
  assert.equal(extractAccountNumberFromQR('acc=CA100002'), 'CA100002');
});

test('extractAccountNumberFromQR returns null for invalid payload', () => {
  assert.equal(extractAccountNumberFromQR(''), null);
  assert.equal(extractAccountNumberFromQR('   '), null);
  assert.equal(extractAccountNumberFromQR(null as any), null);
});
