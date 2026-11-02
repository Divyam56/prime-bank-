package com.primebank.model;

import java.math.BigDecimal;

/**
 * PrimeBank - Loan Payoff Breakdown Value Object
 * Holds calculated financial figures for loan payoff, separating principal and interest.
 */
public class LoanBreakdown {
    private BigDecimal principal;
    private BigDecimal annualRate;
    private int termMonths;
    private BigDecimal totalInterest;
    private BigDecimal totalPayoff;
    private BigDecimal monthlyEmi;

    public LoanBreakdown() {}

    public LoanBreakdown(BigDecimal principal, BigDecimal annualRate, int termMonths, BigDecimal totalInterest, BigDecimal totalPayoff, BigDecimal monthlyEmi) {
        this.principal = principal;
        this.annualRate = annualRate;
        this.termMonths = termMonths;
        this.totalInterest = totalInterest;
        this.totalPayoff = totalPayoff;
        this.monthlyEmi = monthlyEmi;
    }

    public BigDecimal getPrincipal() { return principal; }
    public void setPrincipal(BigDecimal principal) { this.principal = principal; }

    public BigDecimal getAnnualRate() { return annualRate; }
    public void setAnnualRate(BigDecimal annualRate) { this.annualRate = annualRate; }

    public int getTermMonths() { return termMonths; }
    public void setTermMonths(int termMonths) { this.termMonths = termMonths; }

    public BigDecimal getTotalInterest() { return totalInterest; }
    public void setTotalInterest(BigDecimal totalInterest) { this.totalInterest = totalInterest; }

    public BigDecimal getTotalPayoff() { return totalPayoff; }
    public void setTotalPayoff(BigDecimal totalPayoff) { this.totalPayoff = totalPayoff; }

    public BigDecimal getMonthlyEmi() { return monthlyEmi; }
    public void setMonthlyEmi(BigDecimal monthlyEmi) { this.monthlyEmi = monthlyEmi; }
}
