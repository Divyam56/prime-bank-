/**
 * PrimeBank - Initial Seed Data
 * 
 * Provides mock baseline state matching the database schema for customers,
 * administrators, deposit accounts, transactions, and active loan facilities.
 */

import { User, Account, Transaction, Loan, Investment, SystemSettings } from '../types';

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  transfer_fee_percent: 0.5,
  min_transfer_amount: 100,
  maintenance_mode: false,
  support_phone: '+91 1800 100 200'
};

export const INITIAL_USERS: User[] = [
  { 
    id: 1, 
    fullName: 'Priya Admin', 
    email: 'admin@primebank.test', 
    phone: '+91 98765 00001', 
    role: 'ADMIN', 
    status: 'ACTIVE', 
    createdAt: '2026-10-01 10:00' 
  },
  { 
    id: 2, 
    fullName: 'Anita Sharma', 
    email: 'anita@primebank.test', 
    phone: '+91 98765 11111', 
    role: 'CUSTOMER', 
    status: 'ACTIVE', 
    createdAt: '2026-10-01 10:05' 
  },
  { 
    id: 3, 
    fullName: 'Rahul Verma', 
    email: 'rahul@primebank.test', 
    phone: '+91 98765 22222', 
    role: 'CUSTOMER', 
    status: 'ACTIVE', 
    createdAt: '2026-10-01 10:10' 
  },
  { 
    id: 4, 
    fullName: 'Meera Iyer', 
    email: 'meera@primebank.test', 
    phone: '+91 98765 33333', 
    role: 'CUSTOMER', 
    status: 'ACTIVE', 
    createdAt: '2026-10-01 10:15' 
  }
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 101, userId: 2, accountNumber: 'SB100001', accountType: 'SAVINGS', balance: 42500.00, createdAt: '2026-10-01' },
  { id: 102, userId: 2, accountNumber: 'CA100002', accountType: 'CURRENT', balance: 118200.50, createdAt: '2026-10-01' },
  { id: 103, userId: 3, accountNumber: 'SB100003', accountType: 'SAVINGS', balance: 9300.00, createdAt: '2026-10-01' },
  { id: 104, userId: 4, accountNumber: 'SB100004', accountType: 'SAVINGS', balance: 250750.75, createdAt: '2026-10-01' }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1001, reference: 'TXN-1001', fromAccountId: null, toAccountId: 101, amount: 50000.00, type: 'DEPOSIT', status: 'COMPLETED', description: 'Salary credit - October 2026', createdAt: '2026-10-01 09:30' },
  { id: 1002, reference: 'TXN-1002', fromAccountId: 101, toAccountId: 102, amount: 25000.00, type: 'TRANSFER', status: 'COMPLETED', description: 'Savings to current sweep', createdAt: '2026-10-02 11:15' },
  { id: 1003, reference: 'TXN-1003', fromAccountId: 101, toAccountId: 103, amount: 1500.00, type: 'TRANSFER', status: 'COMPLETED', description: 'Rent split with Rahul', createdAt: '2026-10-03 14:20' },
  { id: 1004, reference: 'TXN-1004', fromAccountId: 104, toAccountId: 101, amount: 750.00, type: 'TRANSFER', status: 'COMPLETED', description: 'Dinner settlement', createdAt: '2026-10-04 20:45' },
  { id: 1005, reference: 'TXN-1005', fromAccountId: 101, toAccountId: null, amount: 2000.00, type: 'WITHDRAWAL', status: 'COMPLETED', description: 'ATM withdrawal - MG Road', createdAt: '2026-10-05 16:10' },
  { id: 1006, reference: 'TXN-1006', fromAccountId: null, toAccountId: 104, amount: 120000.00, type: 'DEPOSIT', status: 'COMPLETED', description: 'Fixed maturity payout', createdAt: '2026-10-06 10:00' }
];

export const INITIAL_LOANS: Loan[] = [
  { id: 1, userId: 2, userName: 'Anita Sharma', amount: 25000.00, termMonths: 12, purpose: 'Personal credit facility', status: 'APPROVED', createdAt: '2026-10-06' },
  { id: 2, userId: 2, userName: 'Anita Sharma', amount: 250000.00, termMonths: 24, purpose: 'Home renovation', status: 'REQUESTED', createdAt: '2026-10-07' },
  { id: 3, userId: 4, userName: 'Meera Iyer', amount: 80000.00, termMonths: 12, purpose: 'Vehicle loan', status: 'APPROVED', createdAt: '2026-10-08' }
];

export const INITIAL_INVESTMENTS: Investment[] = [
  { id: 1, userId: 2, planName: 'Fixed Deposit · 12 months', amount: 100000.00, createdAt: '2026-10-02' },
  { id: 2, userId: 4, planName: 'Recurring Deposit · 24 months', amount: 5000.00, createdAt: '2026-10-05' }
];
