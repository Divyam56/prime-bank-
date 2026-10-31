package com.primebank.service;

import com.primebank.config.DatabaseConfig;
import com.primebank.dao.AccountDao;
import com.primebank.dao.TransactionDao;
import com.primebank.model.Account;
import com.primebank.model.Transaction;
import com.primebank.util.CurrencyUtil;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

/**
 * PrimeBank - Banking Core Service
 * Handles ACID fund transfers, balance ledger integrity, and statement lookups.
 */
public class BankingService {

    private final AccountDao accountDao;
    private final TransactionDao transactionDao;

    public BankingService() {
        this.accountDao = new AccountDao();
        this.transactionDao = new TransactionDao();
    }

    public BankingService(AccountDao accountDao, TransactionDao transactionDao) {
        this.accountDao = accountDao;
        this.transactionDao = transactionDao;
    }

    /**
     * Executes an atomic funds transfer between two accounts.
     * Enforces minimum balance requirements: ₹500 for Savings, -₹10,000 for Current.
     */
    public Transaction transferFunds(Long fromAccountId, String toAccountNumber, BigDecimal amount, String description) throws Exception {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero.");
        }

        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                Account fromAccount = accountDao.findById(fromAccountId)
                        .orElseThrow(() -> new IllegalArgumentException("Debit account not found: " + fromAccountId));

                Account toAccount = accountDao.findByAccountNumber(toAccountNumber)
                        .orElseThrow(() -> new IllegalArgumentException("Beneficiary account number not found: " + toAccountNumber));

                if (fromAccount.getId().equals(toAccount.getId())) {
                    throw new IllegalArgumentException("Cannot transfer funds to the same account.");
                }

                // Check minimum balance requirement
                if (!CurrencyUtil.canDebit(fromAccount.getBalance(), amount, fromAccount.getAccountType())) {
                    BigDecimal minRequired = CurrencyUtil.getMinimumBalance(fromAccount.getAccountType());
                    throw new IllegalStateException("Insufficient funds. Maintaining minimum balance of " 
                            + CurrencyUtil.formatINR(minRequired) + " is required.");
                }

                // Apply balance updates
                BigDecimal newFromBalance = fromAccount.getBalance().subtract(amount);
                BigDecimal newToBalance = toAccount.getBalance().add(amount);

                accountDao.updateBalance(conn, fromAccount.getId(), newFromBalance);
                accountDao.updateBalance(conn, toAccount.getId(), newToBalance);

                // Record transaction
                String reference = "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                Transaction tx = new Transaction();
                tx.setReference(reference);
                tx.setFromAccountId(fromAccount.getId());
                tx.setToAccountId(toAccount.getId());
                tx.setAmount(amount);
                tx.setType("TRANSFER");
                tx.setStatus("COMPLETED");
                tx.setDescription(description != null && !description.isBlank() ? description : "Funds Transfer to " + toAccountNumber);

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

    public List<Transaction> getStatement(Long accountId) throws SQLException {
        return transactionDao.findByAccountId(accountId);
    }
}
