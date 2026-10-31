package com.primebank.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/**
 * PrimeBank - Loan Domain Model
 * Represents an active, requested, or repaid credit facility.
 */
public class Loan {
    private Long id;
    private Long userId;
    private BigDecimal amount;
    private Integer termMonths;
    private String purpose;
    private String status; // 'REQUESTED', 'APPROVED', 'REJECTED', 'REPAID'
    private Timestamp createdAt;

    public Loan() {}

    public Loan(Long id, Long userId, BigDecimal amount, Integer termMonths, String purpose, String status, Timestamp createdAt) {
        this.id = id;
        this.userId = userId;
        this.amount = amount;
        this.termMonths = termMonths;
        this.purpose = purpose;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Integer getTermMonths() { return termMonths; }
    public void setTermMonths(Integer termMonths) { this.termMonths = termMonths; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
