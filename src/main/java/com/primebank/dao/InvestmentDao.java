package com.primebank.dao;

import com.primebank.config.DatabaseConfig;
import com.primebank.model.Investment;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * PrimeBank - Investment Data Access Object
 * Handles portfolio and fixed deposit record keeping.
 */
public class InvestmentDao {

    public List<Investment> findByUserId(Long userId) throws SQLException {
        List<Investment> list = new ArrayList<>();
        String sql = "SELECT * FROM investments WHERE user_id = ? ORDER BY id DESC";
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

    public Investment create(Investment inv) throws SQLException {
        String sql = "INSERT INTO investments (user_id, plan_name, amount) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, inv.getUserId());
            ps.setString(2, inv.getPlanName());
            ps.setBigDecimal(3, inv.getAmount());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    inv.setId(keys.getLong(1));
                }
            }
            return inv;
        } catch (Exception e) {
            throw new SQLException(e);
        }
    }

    private Investment mapRow(ResultSet rs) throws SQLException {
        Investment i = new Investment();
        i.setId(rs.getLong("id"));
        i.setUserId(rs.getLong("user_id"));
        i.setPlanName(rs.getString("plan_name"));
        i.setAmount(rs.getBigDecimal("amount"));
        i.setCreatedAt(rs.getTimestamp("created_at"));
        return i;
    }
}
