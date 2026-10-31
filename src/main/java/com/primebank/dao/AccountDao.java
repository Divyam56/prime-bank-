package com.primebank.dao;

import com.primebank.config.DatabaseConfig;
import com.primebank.model.Account;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * PrimeBank - Account Data Access Object
 * Handles deposit account persistence and balance operations.
 */
public class AccountDao {

    public Optional<Account> findById(Long id) throws SQLException {
        String sql = "SELECT * FROM accounts WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (Exception e) {
            throw new SQLException(e);
        }
        return Optional.empty();
    }

    public Optional<Account> findByAccountNumber(String accountNumber) throws SQLException {
        String sql = "SELECT * FROM accounts WHERE account_number = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, accountNumber);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (Exception e) {
            throw new SQLException(e);
        }
        return Optional.empty();
    }

    public List<Account> findByUserId(Long userId) throws SQLException {
        List<Account> list = new ArrayList<>();
        String sql = "SELECT * FROM accounts WHERE user_id = ? ORDER BY id ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (Exception e) {
            throw new SQLException(e);
        }
        return list;
    }

    public List<Account> findAll() throws SQLException {
        List<Account> list = new ArrayList<>();
        String sql = "SELECT * FROM accounts ORDER BY id ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (Exception e) {
            throw new SQLException(e);
        }
        return list;
    }

    public Account create(Account account) throws SQLException {
        String sql = "INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES (?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, account.getUserId());
            ps.setString(2, account.getAccountNumber());
            ps.setString(3, account.getAccountType());
            ps.setBigDecimal(4, account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    account.setId(keys.getLong(1));
                }
            }
            return account;
        } catch (Exception e) {
            throw new SQLException(e);
        }
    }

    public void updateBalance(Connection conn, Long accountId, BigDecimal newBalance) throws SQLException {
        String sql = "UPDATE accounts SET balance = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBigDecimal(1, newBalance);
            ps.setLong(2, accountId);
            ps.executeUpdate();
        }
    }

    private Account mapRow(ResultSet rs) throws SQLException {
        Account a = new Account();
        a.setId(rs.getLong("id"));
        a.setUserId(rs.getLong("user_id"));
        a.setAccountNumber(rs.getString("account_number"));
        a.setAccountType(rs.getString("account_type"));
        a.setBalance(rs.getBigDecimal("balance"));
        a.setCreatedAt(rs.getTimestamp("created_at"));
        return a;
    }
}
