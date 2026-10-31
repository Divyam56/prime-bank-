package com.primebank.dao;

import com.primebank.config.DatabaseConfig;
import com.primebank.model.Transaction;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * PrimeBank - Transaction Data Access Object
 * Handles double-entry ledger auditing and statement queries.
 */
public class TransactionDao {

    public List<Transaction> findByAccountId(Long accountId) throws SQLException {
        List<Transaction> list = new ArrayList<>();
        String sql = "SELECT * FROM transactions WHERE from_account_id = ? OR to_account_id = ? ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, accountId);
            ps.setLong(2, accountId);
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

    public List<Transaction> findAll() throws SQLException {
        List<Transaction> list = new ArrayList<>();
        String sql = "SELECT * FROM transactions ORDER BY created_at DESC";
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

    public Transaction record(Connection conn, Transaction tx) throws SQLException {
        String sql = "INSERT INTO transactions (reference, from_account_id, to_account_id, amount, type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, tx.getReference());
            if (tx.getFromAccountId() != null) {
                ps.setLong(2, tx.getFromAccountId());
            } else {
                ps.setNull(2, Types.BIGINT);
            }
            if (tx.getToAccountId() != null) {
                ps.setLong(3, tx.getToAccountId());
            } else {
                ps.setNull(3, Types.BIGINT);
            }
            ps.setBigDecimal(4, tx.getAmount());
            ps.setString(5, tx.getType());
            ps.setString(6, tx.getStatus());
            ps.setString(7, tx.getDescription());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    tx.setId(keys.getLong(1));
                }
            }
            return tx;
        }
    }

    private Transaction mapRow(ResultSet rs) throws SQLException {
        Transaction t = new Transaction();
        t.setId(rs.getLong("id"));
        t.setReference(rs.getString("reference"));
        long from = rs.getLong("from_account_id");
        t.setFromAccountId(rs.wasNull() ? null : from);
        long to = rs.getLong("to_account_id");
        t.setToAccountId(rs.wasNull() ? null : to);
        t.setAmount(rs.getBigDecimal("amount"));
        t.setType(rs.getString("type"));
        t.setStatus(rs.getString("status"));
        t.setDescription(rs.getString("description"));
        t.setCreatedAt(rs.getTimestamp("created_at"));
        return t;
    }
}
