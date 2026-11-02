package com.primebank.service;

import com.primebank.model.LoanBreakdown;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("PrimeBank - Loan Service Tests")
class LoanServiceTest {

    private LoanService loanService;

    @BeforeEach
    void setUp() {
        loanService = new LoanService();
    }

    @Test
    @DisplayName("Should accurately calculate 9% annual interest breakdown for 12 months")
    void testCalculateLoanBreakdown12Months() {
        BigDecimal principal = new BigDecimal("50000.00");
        int termMonths = 12;

        LoanBreakdown breakdown = loanService.calculateLoanBreakdown(principal, termMonths);

        assertNotNull(breakdown);
        assertEquals(0, new BigDecimal("50000.00").compareTo(breakdown.getPrincipal()));
        // 50,000 * 0.09 * (12/12) = 4,500.00
        assertEquals(0, new BigDecimal("4500.00").compareTo(breakdown.getTotalInterest()));
        // Total payoff = 54,500.00
        assertEquals(0, new BigDecimal("54500.00").compareTo(breakdown.getTotalPayoff()));
        // Monthly EMI = 54,500 / 12 = 4,541.67
        assertEquals(0, new BigDecimal("4541.67").compareTo(breakdown.getMonthlyEmi()));
    }

    @Test
    @DisplayName("Should accurately calculate interest breakdown for 24 months")
    void testCalculateLoanBreakdown24Months() {
        BigDecimal principal = new BigDecimal("100000.00");
        int termMonths = 24;

        LoanBreakdown breakdown = loanService.calculateLoanBreakdown(principal, termMonths);

        assertNotNull(breakdown);
        // 100,000 * 0.09 * (24/12 = 2.0) = 18,000.00
        assertEquals(0, new BigDecimal("18000.00").compareTo(breakdown.getTotalInterest()));
        assertEquals(0, new BigDecimal("118000.00").compareTo(breakdown.getTotalPayoff()));
    }

    @Test
    @DisplayName("Should reject invalid or negative loan principal")
    void testInvalidLoanPrincipal() {
        assertThrows(IllegalArgumentException.class, () -> {
            loanService.calculateLoanBreakdown(new BigDecimal("-1000"), 12);
        });

        assertThrows(IllegalArgumentException.class, () -> {
            loanService.calculateLoanBreakdown(BigDecimal.ZERO, 12);
        });
    }

    @Test
    @DisplayName("Should reject invalid loan duration")
    void testInvalidDuration() {
        assertThrows(IllegalArgumentException.class, () -> {
            loanService.calculateLoanBreakdown(new BigDecimal("50000"), 0);
        });
    }
}
