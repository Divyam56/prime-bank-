export interface AccountBalance {
  id: number;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CURRENT';
  balance: number;
}

export interface LoanItem {
  id: number;
  amount: number;
  termMonths: number;
  purpose: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REPAID';
}

export interface LoanPayoffBreakdown {
  principal: number;
  yearlyInterestRate: number;
  termMonths: number;
  interestAmount: number;
  totalPayoff: number;
}

/**
 * Calculates detailed breakdown of principal and accrued flat 9% interest.
 */
export function calculateLoanBreakdown(amount: number, termMonths: number): LoanPayoffBreakdown {
  if (amount <= 0 || termMonths <= 0) {
    return {
      principal: 0,
      yearlyInterestRate: 9.0,
      termMonths: 0,
      interestAmount: 0,
      totalPayoff: 0
    };
  }
  const interest = Math.round(amount * (0.09 * termMonths / 12) * 100) / 100;
  const total = Math.round((amount + interest) * 100) / 100;
  return {
    principal: amount,
    yearlyInterestRate: 9.0,
    termMonths,
    interestAmount: interest,
    totalPayoff: total
  };
}

/**
 * Calculates the total loan payoff amount with 9% yearly flat interest.
 * estPayable = amount * (1 + 0.09 * termMonths / 12)
 */
export function calculateLoanPayoff(amount: number, termMonths: number): number {
  return calculateLoanBreakdown(amount, termMonths).totalPayoff;
}

/**
 * Gets the minimum allowable balance for an account type.
 * Savings: ₹500, Current: -₹10,000 (overdraft)
 */
export function getMinimumBalance(accountType: 'SAVINGS' | 'CURRENT'): number {
  return accountType === 'SAVINGS' ? 500 : -10000;
}

/**
 * Checks whether an account has sufficient balance to repay a given payoff amount.
 */
export function canRepayLoan(
  account: AccountBalance,
  payoffAmount: number
): { canRepay: boolean; remainingBalance: number; requiredAmount: number } {
  const minBal = getMinimumBalance(account.accountType);
  const remaining = Math.round((account.balance - payoffAmount) * 100) / 100;
  return {
    canRepay: remaining >= minBal,
    remainingBalance: remaining,
    requiredAmount: payoffAmount
  };
}

/**
 * Executes a loan repayment, returning updated account balance and loan status.
 */
export function processLoanRepayment(
  account: AccountBalance,
  loan: LoanItem
): { updatedAccount: AccountBalance; updatedLoan: LoanItem; payoffAmount: number; breakdown: LoanPayoffBreakdown } {
  if (loan.status !== 'APPROVED') {
    throw new Error(`Cannot repay loan with status ${loan.status}. Only active APPROVED loans can be repaid.`);
  }

  const breakdown = calculateLoanBreakdown(loan.amount, loan.termMonths);
  const check = canRepayLoan(account, breakdown.totalPayoff);

  if (!check.canRepay) {
    throw new Error(
      `Insufficient balance in ${account.accountNumber}: Balance is ₹${account.balance}, required ₹${breakdown.totalPayoff}.`
    );
  }

  return {
    updatedAccount: {
      ...account,
      balance: check.remainingBalance
    },
    updatedLoan: {
      ...loan,
      status: 'REPAID'
    },
    payoffAmount: breakdown.totalPayoff,
    breakdown
  };
}
