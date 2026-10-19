package com.primebank.config;

import com.primebank.util.PasswordUtil;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.stream.Collectors;

/**
 * PrimeBank - Database Connection Pool and Schema Initializer
 * Configures HikariCP with H2 in-memory (or PostgreSQL/MySQL via env vars),
 * bootstraps the relational schema, and seeds default records.
 */
public final class DatabaseConfig {

    private static HikariDataSource dataSource;

    private DatabaseConfig() {}

    public static synchronized DataSource getDataSource() {
        if (dataSource == null) {
            initDataSource();
        }
        return dataSource;
    }

    public static Connection getConnection() throws Exception {
        return getDataSource().getConnection();
    }

    private static void initDataSource() {
        HikariConfig config = new HikariConfig();

        String jdbcUrl = System.getenv("JDBC_URL");
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            jdbcUrl = "jdbc:h2:mem:primebank;DB_CLOSE_DELAY=-1;MODE=PostgreSQL";
            config.setDriverClassName("org.h2.Driver");
            config.setUsername("sa");
            config.setPassword("");
        } else {
            config.setUsername(System.getenv().getOrDefault("JDBC_USER", "postgres"));
            config.setPassword(System.getenv().getOrDefault("JDBC_PASSWORD", "postgres"));
        }

        config.setJdbcUrl(jdbcUrl);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(20000);
        config.setPoolName("PrimeBank-HikariPool");

        dataSource = new HikariDataSource(config);

        // Run DDL and initial seeds
        applySchema();
        seedInitialData();
    }

    private static void applySchema() {
        try (InputStream is = DatabaseConfig.class.getResourceAsStream("/schema.sql")) {
            if (is == null) {
                System.err.println("[DatabaseConfig] Warning: /schema.sql not found in classpath.");
                return;
            }
            String sql;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                sql = reader.lines().collect(Collectors.joining("\n"));
            }

            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                for (String statement : sql.split(";")) {
                    String trimmed = statement.trim();
                    if (!trimmed.isEmpty()) {
                        stmt.execute(trimmed);
                    }
                }
                System.out.println("[DatabaseConfig] Database schema successfully applied.");
            }
        } catch (Exception e) {
            System.err.println("[DatabaseConfig] Failed to apply schema: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void seedInitialData() {
        try (Connection conn = dataSource.getConnection()) {
            // Check if users already seeded
            try (Statement checkStmt = conn.createStatement();
                 ResultSet rs = checkStmt.executeQuery("SELECT COUNT(*) FROM users")) {
                if (rs.next() && rs.getInt(1) > 0) {
                    return; // Already populated
                }
            }

            // Seed Admin User
            String adminHash = PasswordUtil.hashPassword("admin123");
            String insertUser = "INSERT INTO users (full_name, email, password_hash, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)";
            long adminId;
            long customerId;

            try (PreparedStatement ps = conn.prepareStatement(insertUser, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, "Senior Bank Officer");
                ps.setString(2, "admin@primebank.com");
                ps.setString(3, adminHash);
                ps.setString(4, "+91 98765 00001");
                ps.setString(5, "ADMIN");
                ps.setString(6, "ACTIVE");
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    adminId = keys.getLong(1);
                }
            }

            // Seed Demo Customer
            String customerHash = PasswordUtil.hashPassword("demo123");
            try (PreparedStatement ps = conn.prepareStatement(insertUser, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, "Rajesh Kumar");
                ps.setString(2, "rajesh@primebank.com");
                ps.setString(3, customerHash);
                ps.setString(4, "+91 98765 43210");
                ps.setString(5, "CUSTOMER");
                ps.setString(6, "ACTIVE");
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    customerId = keys.getLong(1);
                }
            }

            // Seed Accounts for Demo Customer
            String insertAcc = "INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES (?, ?, ?, ?)";
            long savingsAccId;
            try (PreparedStatement ps = conn.prepareStatement(insertAcc, Statement.RETURN_GENERATED_KEYS)) {
                ps.setLong(1, customerId);
                ps.setString(2, "PB9823471029");
                ps.setString(3, "SAVINGS");
                ps.setBigDecimal(4, new java.math.BigDecimal("125000.50"));
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    savingsAccId = keys.getLong(1);
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(insertAcc)) {
                ps.setLong(1, customerId);
                ps.setString(2, "PB1092837461");
                ps.setString(3, "CURRENT");
                ps.setBigDecimal(4, new java.math.BigDecimal("45000.00"));
                ps.executeUpdate();
            }

            // Seed Active Loan for Demo Customer
            String insertLoan = "INSERT INTO loans (user_id, amount, term_months, purpose, status) VALUES (?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(insertLoan)) {
                ps.setLong(1, customerId);
                ps.setBigDecimal(2, new java.math.BigDecimal("50000.00"));
                ps.setInt(3, 12);
                ps.setString(4, "Home Renovation");
                ps.setString(5, "APPROVED");
                ps.executeUpdate();
            }

            // Seed Transaction History
            String insertTx = "INSERT INTO transactions (reference, from_account_id, to_account_id, amount, type, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(insertTx)) {
                ps.setString(1, "TXN-1709284001");
                ps.setNull(2, java.sql.Types.BIGINT);
                ps.setLong(3, savingsAccId);
                ps.setBigDecimal(4, new java.math.BigDecimal("25000.00"));
                ps.setString(5, "DEPOSIT");
                ps.setString(6, "COMPLETED");
                ps.setString(7, "Salary Credit - ACME Corp");
                ps.executeUpdate();
            }

            // Seed System Settings
            String insertSetting = "INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(insertSetting)) {
                ps.setString(1, "SYSTEM_MAINTENANCE");
                ps.setString(2, "false");
                ps.setString(3, "Controls online banking downtime banner");
                ps.executeUpdate();
            }

            System.out.println("[DatabaseConfig] Initial baseline data successfully seeded.");
        } catch (Exception e) {
            System.err.println("[DatabaseConfig] Error during seeding: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static synchronized void shutdown() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            System.out.println("[DatabaseConfig] Connection pool closed.");
        }
    }
}
