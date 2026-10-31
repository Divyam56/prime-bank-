package com.primebank.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/**
 * PrimeBank - Transaction Domain Model
 * Represents an audited financial entry on the double-entry ledger.
 */
public class Transaction {
    private Long id;
    private String reference;
    private Long fromAccountId;
    private Long toAccountId;
    private BigDecimal amount;
    private String type; // 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'LOAN_REPAYMENT'
    private String status; // 'COMPLETED', 'FAILED', 'PENDING'
    private String description;
    private Timestamp createdAt;

    public Transaction() {}

    public Transaction(Long id, String reference, Long fromAccountId, Long toAccountId, BigDecimal amount, String type, String status, String description, Timestamp createdAt) {
        this.id = id;
        this.reference = reference;
        this.fromAccountId = fromAccountId;
        this.toAccountId = toAccountId;
        this.amount = amount;
        this.type = type;
        this.status = status;
        this.description = description;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public Long getFromAccountId() { return fromAccountId; }
    public void setFromAccountId(Long fromAccountId) { this.fromAccountId = fromAccountId; }

    public Long getToAccountId() { return toAccountId; }
    public void setToAccountId(Long toAccountId) { this.toAccountId = toAccountId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
