/**
 * PrimeBank - Loan EMI Calculation Utilities
 * 
 * Supports both standard Equated Monthly Installment (Reducing Balance formula)
 * and Flat Rate calculation methods with amortization breakdown.
 */

export type EMICalculationMethod = 'REDUCING' | 'FLAT';

export interface EMIBreakdown {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  method: EMICalculationMethod;
  monthlyEMI: number;
  totalInterest: number;
  totalPayable: number;
  principalSharePercent: number;
  interestSharePercent: number;
  amortizationSchedule: AmortizationRow[];
}

export interface AmortizationRow {
  month: number;
  openingBalance: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

/**
 * Calculates standard Equated Monthly Installment (EMI).
 * 
 * Reducing Balance Formula:
 * EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
 * where P = Principal, R = Monthly interest rate (Annual % / 12 / 100), N = Months
 * 
 * Flat Rate Formula:
 * Total Interest = P x (Annual % / 100) x (N / 12)
 * EMI = (P + Total Interest) / N
 */
export function calculateEMI(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  method: EMICalculationMethod = 'REDUCING'
): EMIBreakdown {
  const p = Math.max(0, principal || 0);
  const rYear = Math.max(0, annualInterestRate || 0);
  const n = Math.max(1, Math.round(tenureMonths || 1));

  if (p === 0) {
    return {
      principal: 0,
      annualInterestRate: rYear,
      tenureMonths: n,
      method,
      monthlyEMI: 0,
      totalInterest: 0,
      totalPayable: 0,
      principalSharePercent: 100,
      interestSharePercent: 0,
      amortizationSchedule: []
    };
  }

  let monthlyEMI = 0;
  let totalInterest = 0;
  let totalPayable = 0;
  const schedule: AmortizationRow[] = [];

  if (method === 'FLAT' || rYear === 0) {
    totalInterest = Math.round((p * (rYear / 100) * (n / 12)) * 100) / 100;
    totalPayable = Math.round((p + totalInterest) * 100) / 100;
    monthlyEMI = Math.round((totalPayable / n) * 100) / 100;

    const monthlyPrincipal = Math.round((p / n) * 100) / 100;
    const monthlyInterest = Math.round((totalInterest / n) * 100) / 100;
    let balance = p;

    for (let m = 1; m <= n; m++) {
      const pPaid = m === n ? balance : Math.min(balance, monthlyPrincipal);
      const cBalance = Math.max(0, Math.round((balance - pPaid) * 100) / 100);
      schedule.push({
        month: m,
        openingBalance: balance,
        emi: monthlyEMI,
        principalPaid: pPaid,
        interestPaid: monthlyInterest,
        closingBalance: cBalance
      });
      balance = cBalance;
    }
  } else {
    // Reducing balance
    const monthlyRate = rYear / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, n);
    monthlyEMI = Math.round((p * monthlyRate * factor / (factor - 1)) * 100) / 100;
    totalPayable = Math.round((monthlyEMI * n) * 100) / 100;
    totalInterest = Math.round((totalPayable - p) * 100) / 100;

    let balance = p;
    for (let m = 1; m <= n; m++) {
      const interestForMonth = Math.round(balance * monthlyRate * 100) / 100;
      let principalForMonth = Math.round((monthlyEMI - interestForMonth) * 100) / 100;
      if (m === n || principalForMonth > balance) {
        principalForMonth = balance;
      }
      const cBalance = Math.max(0, Math.round((balance - principalForMonth) * 100) / 100);
      schedule.push({
        month: m,
        openingBalance: balance,
        emi: monthlyEMI,
        principalPaid: principalForMonth,
        interestPaid: interestForMonth,
        closingBalance: cBalance
      });
      balance = cBalance;
    }
  }

  const principalSharePercent = totalPayable > 0 
    ? Math.round((p / totalPayable) * 1000) / 10 
    : 100;
  const interestSharePercent = Math.max(0, Math.round((100 - principalSharePercent) * 10) / 10);

  return {
    principal: p,
    annualInterestRate: rYear,
    tenureMonths: n,
    method,
    monthlyEMI,
    totalInterest,
    totalPayable,
    principalSharePercent,
    interestSharePercent,
    amortizationSchedule: schedule
  };
}

/**
 * Common banking loan presets for quick user selection.
 */
export interface LoanPreset {
  id: string;
  name: string;
  defaultPrincipal: number;
  defaultTenure: number;
  defaultRate: number;
  iconType: 'personal' | 'home' | 'vehicle' | 'education' | 'business';
  description: string;
}

export const LOAN_PRESETS: LoanPreset[] = [
  {
    id: 'personal',
    name: 'Personal Loan',
    defaultPrincipal: 200000,
    defaultTenure: 36,
    defaultRate: 10.5,
    iconType: 'personal',
    description: 'Instant liquidity for lifestyle, travel, or medical needs'
  },
  {
    id: 'retail',
    name: 'PrimeBank Retail Loan',
    defaultPrincipal: 50000,
    defaultTenure: 12,
    defaultRate: 9.0,
    iconType: 'business',
    description: 'Special fixed 9.0% rate for PrimeBank account holders'
  },
  {
    id: 'home',
    name: 'Home Renovation',
    defaultPrincipal: 500000,
    defaultTenure: 48,
    defaultRate: 8.5,
    iconType: 'home',
    description: 'Upgrade your living space with minimal documentation'
  },
  {
    id: 'vehicle',
    name: 'Auto / Vehicle Loan',
    defaultPrincipal: 350000,
    defaultTenure: 36,
    defaultRate: 8.75,
    iconType: 'vehicle',
    description: 'Finance your two-wheeler or four-wheeler purchase'
  },
  {
    id: 'education',
    name: 'Higher Education',
    defaultPrincipal: 400000,
    defaultTenure: 60,
    defaultRate: 9.25,
    iconType: 'education',
    description: 'Tuition and living expense financing with low rates'
  }
];
