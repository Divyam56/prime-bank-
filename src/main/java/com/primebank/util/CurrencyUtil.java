package com.primebank.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * PrimeBank - Currency & Financial Arithmetic Utilities
 * Enforces uniform rounding, minimum balances, and INR formatting.
 */
public final class CurrencyUtil {

    private static final Locale INDIA_LOCALE = new Locale("en", "IN");

    // PrimeBank minimum balances
    public static final BigDecimal MIN_SAVINGS_BALANCE = new BigDecimal("500.00");
    public static final BigDecimal MIN_CURRENT_BALANCE = new BigDecimal("-10000.00"); // Allowed overdraft up to ₹10,000

    private CurrencyUtil() {}

    /**
     * Formats an amount as Indian Rupee (INR).
     */
    public static String formatINR(BigDecimal amount) {
        if (amount == null) return "₹0.00";
        NumberFormat formatter = NumberFormat.getCurrencyInstance(INDIA_LOCALE);
        return formatter.format(amount.setScale(2, RoundingMode.HALF_UP));
    }

    /**
     * Returns the required minimum threshold based on account type.
     */
    public static BigDecimal getMinimumBalance(String accountType) {
        if ("CURRENT".equalsIgnoreCase(accountType)) {
            return MIN_CURRENT_BALANCE;
        }
        return MIN_SAVINGS_BALANCE;
    }

    /**
     * Checks if a debit is legally allowable given account type and minimum balance.
     */
    public static boolean canDebit(BigDecimal currentBalance, BigDecimal debitAmount, String accountType) {
        if (currentBalance == null || debitAmount == null || debitAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        BigDecimal minRequired = getMinimumBalance(accountType);
        BigDecimal projected = currentBalance.subtract(debitAmount);
        return projected.compareTo(minRequired) >= 0;
    }
}
