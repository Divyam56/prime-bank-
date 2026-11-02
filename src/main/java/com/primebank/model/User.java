package com.primebank.model;

import java.sql.Timestamp;

/**
 * PrimeBank - User Domain Model
 * Represents a registered customer or bank administrator.
 */
public class User {
    private Long id;
    private String fullName;
    private String email;
    private String passwordHash;
    private String phone;
    private String role; // 'ADMIN' or 'CUSTOMER'
    private String status; // 'ACTIVE', 'SUSPENDED', etc.
    private Timestamp createdAt;

    public User() {}

    public User(Long id, String fullName, String email, String passwordHash, String phone, String role, String status, Timestamp createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
