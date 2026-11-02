import { Account } from '../types';

export interface BalanceAlertCheckResult {
  hasTriggered: boolean;
  affectedAccount: Account | null;
  currentBalance: number;
  threshold: number;
  warningMessage: string | null;
}

/**
 * Checks if any of the given accounts have a balance strictly less than the user's configured alert threshold.
 * 
 * @param accounts - List of accounts belonging to the user
 * @param threshold - The minimum balance threshold in INR. If null, undefined, or <= 0, no alert is triggered.
 * @returns Result object with status, affected account details, and formatted warning message.
 */
export function checkBalanceThresholdAlert(
  accounts: Account[],
  threshold: number | null | undefined
): BalanceAlertCheckResult {
  if (threshold == null || isNaN(threshold) || threshold <= 0 || !accounts || accounts.length === 0) {
    return {
      hasTriggered: false,
      affectedAccount: null,
      currentBalance: 0,
      threshold: threshold || 0,
      warningMessage: null
    };
  }

  // Find any account whose balance has fallen below the user's defined minimum balance threshold
  const breachingAccount = accounts.find(a => a.balance < threshold);

  if (!breachingAccount) {
    return {
      hasTriggered: false,
      affectedAccount: null,
      currentBalance: 0,
      threshold,
      warningMessage: null
    };
  }

  const formattedBal = breachingAccount.balance.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const formattedThreshold = threshold.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const warningMessage = `Low Balance Warning: Your ${breachingAccount.accountType.toLowerCase()} account (${breachingAccount.accountNumber}) balance of ₹${formattedBal} has fallen below your configured alert threshold of ₹${formattedThreshold}.`;

  return {
    hasTriggered: true,
    affectedAccount: breachingAccount,
    currentBalance: breachingAccount.balance,
    threshold,
    warningMessage
  };
}
