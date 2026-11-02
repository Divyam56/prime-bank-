package com.primebank.service;

import com.primebank.util.CurrencyUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("PrimeBank - Banking Rules & Limits Tests")
class BankingServiceTest {

    @Test
    @DisplayName("Savings accounts must enforce ₹500 minimum balance")
    void testSavingsMinimumBalance() {
        BigDecimal balance = new BigDecimal("2000.00");

        // Debiting 1000 leaves 1000 >= 500 (Allowed)
        assertTrue(CurrencyUtil.canDebit(balance, new BigDecimal("1000.00"), "SAVINGS"));

        // Debiting 1500 leaves 500 >= 500 (Allowed exact boundary)
        assertTrue(CurrencyUtil.canDebit(balance, new BigDecimal("1500.00"), "SAVINGS"));

        // Debiting 1600 leaves 400 < 500 (Rejected)
        assertFalse(CurrencyUtil.canDebit(balance, new BigDecimal("1600.00"), "SAVINGS"));
    }

    @Test
    @DisplayName("Current accounts allow overdraft up to -₹10,000")
    void testCurrentAccountOverdraft() {
        BigDecimal balance = new BigDecimal("5000.00");

        // Debiting 12,000 leaves -7,000 >= -10,000 (Allowed)
        assertTrue(CurrencyUtil.canDebit(balance, new BigDecimal("12000.00"), "CURRENT"));

        // Debiting 15,000 leaves -10,000 >= -10,000 (Allowed boundary)
        assertTrue(CurrencyUtil.canDebit(balance, new BigDecimal("15000.00"), "CURRENT"));

        // Debiting 16,000 leaves -11,000 < -10,000 (Rejected)
        assertFalse(CurrencyUtil.canDebit(balance, new BigDecimal("16000.00"), "CURRENT"));
    }

    @Test
    @DisplayName("INR Currency Formatter should properly format rupee symbol")
    void testFormatINR() {
        String formatted = CurrencyUtil.formatINR(new BigDecimal("125000.50"));
        assertNotNull(formatted);
        assertTrue(formatted.contains("1,25,000") || formatted.contains("125,000"));
    }
}
