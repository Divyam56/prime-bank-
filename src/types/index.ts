/**
 * PrimeBank - Domain Models and Type Definitions
 * 
 * Provides type contracts for banking entities including Accounts, Users,
 * Transactions, Loans, Investments, and Global System Configuration.
 */

export type UserRole = 'ADMIN' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type AccountType = 'SAVINGS' | 'CURRENT';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';
export type LoanStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REPAID';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Account {
  id: number;
  userId: number;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: number;
  reference: string;
  fromAccountId: number | null;
  toAccountId: number | null;
  fromAccountNumber?: string;
  toAccountNumber?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: string;
}

export interface Loan {
  id: number;
  userId: number;
  userName?: string;
  amount: number;
  termMonths: number;
  purpose: string;
  status: LoanStatus;
  createdAt: string;
}

export interface Investment {
  id: number;
  userId: number;
  planName: string;
  amount: number;
  createdAt: string;
}

export interface SystemSettings {
  transfer_fee_percent: number;
  min_transfer_amount: number;
  maintenance_mode: boolean;
  support_phone: string;
}

export interface FlashNotification {
  type: 'success' | 'error';
  message: string;
}
