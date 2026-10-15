package com.primebank.service;

import com.primebank.config.DatabaseConfig;
import com.primebank.dao.AccountDao;
import com.primebank.dao.LoanDao;
import com.primebank.dao.TransactionDao;
import com.primebank.model.Account;
import com.primebank.model.Loan;
import com.primebank.model.LoanBreakdown;
import com.primebank.model.Transaction;
import com.primebank.util.CurrencyUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

/**
 * PrimeBank - Loan Lifecycle & Repayment Service
 * Implements 9% annual interest rate, pre-debit interest breakdown calculation,
 * and atomic loan payoff execution.
 */
public class LoanService {

    public static final BigDecimal ANNUAL_INTEREST_RATE = new BigDecimal("0.09"); // 9% flat annual rate

    private final LoanDao loanDao;
    private final AccountDao accountDao;
    private final TransactionDao transactionDao;

    public LoanService() {
        this.loanDao = new LoanDao();
        this.accountDao = new AccountDao();
        this.transactionDao = new TransactionDao();
    }

    public LoanService(LoanDao loanDao, AccountDao accountDao, TransactionDao transactionDao) {
        this.loanDao = loanDao;
        this.accountDao = accountDao;
        this.transactionDao = transactionDao;
    }

    /**
     * Calculates the payoff breakdown for a given principal and duration.
     * Formula: Total Interest = Principal * AnnualRate * (TermMonths / 12)
     */
    public LoanBreakdown calculateLoanBreakdown(BigDecimal principal, int termMonths) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Principal must be positive.");
        }
        if (termMonths <= 0) {
            throw new IllegalArgumentException("Term months must be greater than zero.");
        }

        BigDecimal years = BigDecimal.valueOf(termMonths).divide(BigDecimal.valueOf(12), 4, RoundingMode.HALF_UP);
        BigDecimal totalInterest = principal.multiply(ANNUAL_INTEREST_RATE).multiply(years).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPayoff = principal.add(totalInterest).setScale(2, RoundingMode.HALF_UP);
        BigDecimal monthlyEmi = totalPayoff.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);

        return new LoanBreakdown(principal, ANNUAL_INTEREST_RATE, termMonths, totalInterest, totalPayoff, monthlyEmi);
    }

    /**
     * Executes atomic repayment of an active loan facility.
     */
    public Transaction repayLoan(Long loanId, Long accountId) throws Exception {
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Loan loan = loanDao.findById(loanId)
                        .orElseThrow(() -> new IllegalArgumentException("Loan facility not found: " + loanId));

                if (!"APPROVED".equalsIgnoreCase(loan.getStatus())) {
                    throw new IllegalStateException("Only active APPROVED loans can be repaid. Current status: " + loan.getStatus());
                }

                Account account = accountDao.findById(accountId)
                        .orElseThrow(() -> new IllegalArgumentException("Repayment account not found: " + accountId));

                LoanBreakdown breakdown = calculateLoanBreakdown(loan.getAmount(), loan.getTermMonths());
                BigDecimal totalDue = breakdown.getTotalPayoff();

                // Validate sufficient balance including minimum balance threshold
                if (!CurrencyUtil.canDebit(account.getBalance(), totalDue, account.getAccountType())) {
                    BigDecimal minRequired = CurrencyUtil.getMinimumBalance(account.getAccountType());
                    throw new IllegalStateException("Insufficient funds for loan payoff. Amount required: " 
                            + CurrencyUtil.formatINR(totalDue) + " while maintaining minimum balance of " 
                            + CurrencyUtil.formatINR(minRequired));
                }

                // Deduct account balance
                BigDecimal newBalance = account.getBalance().subtract(totalDue);
                accountDao.updateBalance(conn, account.getId(), newBalance);

                // Mark loan as REPAID
                loanDao.updateStatus(conn, loan.getId(), "REPAID");

                // Record transaction
                String reference = "PAYOFF-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                Transaction tx = new Transaction();
                tx.setReference(reference);
                tx.setFromAccountId(account.getId());
                tx.setToAccountId(null);
                tx.setAmount(totalDue);
                tx.setType("LOAN_REPAYMENT");
                tx.setStatus("COMPLETED");
                tx.setDescription("Full Loan Payoff for Loan #" + loan.getId() + " (" + loan.getPurpose() + ")");

                transactionDao.record(conn, tx);

                conn.commit();
                return tx;
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    public Loan applyForLoan(Long userId, BigDecimal amount, int termMonths, String purpose) throws SQLException {
        Loan loan = new Loan();
        loan.setUserId(userId);
        loan.setAmount(amount);
        loan.setTermMonths(termMonths);
        loan.setPurpose(purpose);
        loan.setStatus("REQUESTED");
        return loanDao.create(loan);
    }

    public List<Loan> getLoansForUser(Long userId) throws SQLException {
        return loanDao.findByUserId(userId);
    }

    public List<Loan> getAllLoans() throws SQLException {
        return loanDao.findAll();
    }
}
