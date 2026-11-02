import { Loan } from '../types';
import { calculateEMI, EMICalculationMethod } from './emiCalculator';

export interface DetailedAmortizationRow {
  month: number;
  openingBalance: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  cumulativeInterest: number;
  closingBalance: number;
  repaidPercent: number;
  principalSharePercent: number;
  interestSharePercent: number;
}

export interface LoanAmortizationDetails {
  loan: Loan;
  principal: number;
  termMonths: number;
  annualInterestRate: number;
  method: EMICalculationMethod;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  principalSharePercent: number;
  interestSharePercent: number;
  schedule: DetailedAmortizationRow[];
}

/**
 * Generates a complete monthly amortization schedule and financial summary
 * for any given loan application.
 * 
 * Default rate for PrimeBank retail loans is 9.0% p.a.
 */
export function getLoanAmortizationDetails(
  loan: Loan,
  annualInterestRate: number = 9.0,
  method: EMICalculationMethod = 'FLAT'
): LoanAmortizationDetails {
  const p = Math.max(0, loan.amount || 0);
  const n = Math.max(1, Math.round(loan.termMonths || 1));
  const r = Math.max(0, annualInterestRate);

  const emiBreakdown = calculateEMI(p, r, n, method);

  let runningInterest = 0;
  const schedule: DetailedAmortizationRow[] = emiBreakdown.amortizationSchedule.map(row => {
    runningInterest = Math.round((runningInterest + row.interestPaid) * 100) / 100;
    const repaidPercent = p > 0 
      ? Math.min(100, Math.max(0, Math.round(((p - row.closingBalance) / p) * 1000) / 10))
      : 100;
    const principalShare = row.emi > 0 ? Math.round((row.principalPaid / row.emi) * 100) : 0;
    const interestShare = Math.max(0, 100 - principalShare);

    return {
      month: row.month,
      openingBalance: row.openingBalance,
      payment: row.emi,
      principalPaid: row.principalPaid,
      interestPaid: row.interestPaid,
      cumulativeInterest: runningInterest,
      closingBalance: row.closingBalance,
      repaidPercent,
      principalSharePercent: principalShare,
      interestSharePercent: interestShare
    };
  });

  return {
    loan,
    principal: p,
    termMonths: n,
    annualInterestRate: r,
    method,
    monthlyPayment: emiBreakdown.monthlyEMI,
    totalInterest: emiBreakdown.totalInterest,
    totalPayable: emiBreakdown.totalPayable,
    principalSharePercent: emiBreakdown.principalSharePercent,
    interestSharePercent: emiBreakdown.interestSharePercent,
    schedule
  };
}
