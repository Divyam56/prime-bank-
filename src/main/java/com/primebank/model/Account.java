package com.primebank.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/**
 * PrimeBank - Account Domain Model
 * Represents a customer deposit account (Savings or Current).
 */
public class Account {
    private Long id;
    private Long userId;
    private String accountNumber;
    private String accountType; // 'SAVINGS' or 'CURRENT'
    private BigDecimal balance;
    private Timestamp createdAt;

    public Account() {}

    public Account(Long id, Long userId, String accountNumber, String accountType, BigDecimal balance, Timestamp createdAt) {
        this.id = id;
        this.userId = userId;
        this.accountNumber = accountNumber;
        this.accountType = accountType;
        this.balance = balance;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
