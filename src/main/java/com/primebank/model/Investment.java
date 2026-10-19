package com.primebank.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/**
 * PrimeBank - Investment Domain Model
 * Represents a fixed deposit or mutual portfolio holding.
 */
public class Investment {
    private Long id;
    private Long userId;
    private String planName;
    private BigDecimal amount;
    private Timestamp createdAt;

    public Investment() {}

    public Investment(Long id, Long userId, String planName, BigDecimal amount, Timestamp createdAt) {
        this.id = id;
        this.userId = userId;
        this.planName = planName;
        this.amount = amount;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
