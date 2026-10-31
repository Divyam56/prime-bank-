package com.primebank.dao;

import com.primebank.config.DatabaseConfig;
import com.primebank.model.Loan;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * PrimeBank - Loan Data Access Object
 * Handles credit facility applications, approvals, and repayments.
 */
public class LoanDao {

    public Optional<Loan> findById(Long id) throws SQLException {
        String sql = "SELECT * FROM loans WHERE id = ?";
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

    public List<Loan> findByUserId(Long userId) throws SQLException {
        List<Loan> list = new ArrayList<>();
        String sql = "SELECT * FROM loans WHERE user_id = ? ORDER BY id DESC";
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

    public List<Loan> findAll() throws SQLException {
        List<Loan> list = new ArrayList<>();
        String sql = "SELECT * FROM loans ORDER BY id DESC";
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

    public Loan create(Loan loan) throws SQLException {
        String sql = "INSERT INTO loans (user_id, amount, term_months, purpose, status) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, loan.getUserId());
            ps.setBigDecimal(2, loan.getAmount());
            ps.setInt(3, loan.getTermMonths());
            ps.setString(4, loan.getPurpose());
            ps.setString(5, loan.getStatus() != null ? loan.getStatus() : "REQUESTED");
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    loan.setId(keys.getLong(1));
                }
            }
            return loan;
        } catch (Exception e) {
            throw new SQLException(e);
        }
    }

    public void updateStatus(Connection conn, Long loanId, String newStatus) throws SQLException {
        String sql = "UPDATE loans SET status = ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newStatus);
            ps.setLong(2, loanId);
            ps.executeUpdate();
        }
    }

    private Loan mapRow(ResultSet rs) throws SQLException {
        Loan l = new Loan();
        l.setId(rs.getLong("id"));
        l.setUserId(rs.getLong("user_id"));
        l.setAmount(rs.getBigDecimal("amount"));
        l.setTermMonths(rs.getInt("term_months"));
        l.setPurpose(rs.getString("purpose"));
        l.setStatus(rs.getString("status"));
        l.setCreatedAt(rs.getTimestamp("created_at"));
        return l;
    }
}
