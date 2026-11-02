package com.primebank.servlet;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.primebank.config.DatabaseConfig;
import com.primebank.dao.AccountDao;
import com.primebank.dao.LoanDao;
import com.primebank.dao.TransactionDao;
import com.primebank.dao.UserDao;
import com.primebank.model.Account;
import com.primebank.model.Loan;
import com.primebank.model.Transaction;
import com.primebank.model.User;
import com.primebank.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PrimeBank - Administration & Compliance Servlet
 * Endpoints:
 *   GET  /api/admin/overview
 *   GET  /api/admin/users
 *   GET  /api/admin/loans
 *   POST /api/admin/loans/action
 */
@WebServlet(urlPatterns = {"/api/admin/*"})
public class AdminServlet extends HttpServlet {

    private final UserDao userDao = new UserDao();
    private final AccountDao accountDao = new AccountDao();
    private final TransactionDao transactionDao = new TransactionDao();
    private final LoanDao loanDao = new LoanDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        try {
            if ("/overview".equals(path) || path == null || "/".equals(path)) {
                List<User> users = userDao.findAll();
                List<Account> accounts = accountDao.findAll();
                List<Transaction> transactions = transactionDao.findAll();
                List<Loan> loans = loanDao.findAll();

                BigDecimal totalVolume = transactions.stream()
                        .map(Transaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                long pendingLoans = loans.stream()
                        .filter(l -> "REQUESTED".equalsIgnoreCase(l.getStatus()))
                        .count();

                Map<String, Object> metrics = new HashMap<>();
                metrics.put("totalCustomers", users.stream().filter(u -> "CUSTOMER".equalsIgnoreCase(u.getRole())).count());
                metrics.put("totalAccounts", accounts.size());
                metrics.put("totalTransactions", transactions.size());
                metrics.put("totalVolume", totalVolume);
                metrics.put("pendingLoans", pendingLoans);

                JsonUtil.sendSuccess(resp, metrics);
            } else if ("/users".equals(path)) {
                List<User> users = userDao.findAll();
                users.forEach(u -> u.setPasswordHash(null));
                JsonUtil.sendSuccess(resp, users);
            } else if ("/loans".equals(path)) {
                List<Loan> loans = loanDao.findAll();
                JsonUtil.sendSuccess(resp, loans);
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        try {
            if ("/loans/action".equals(path)) {
                StringBuilder sb = new StringBuilder();
                try (BufferedReader reader = req.getReader()) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                }
                JsonObject body = JsonParser.parseString(sb.toString()).getAsJsonObject();
                Long loanId = body.get("loanId").getAsLong();
                String action = body.get("action").getAsString(); // 'APPROVE' or 'REJECT'
                String newStatus = "APPROVE".equalsIgnoreCase(action) ? "APPROVED" : "REJECTED";

                try (Connection conn = DatabaseConfig.getConnection()) {
                    loanDao.updateStatus(conn, loanId, newStatus);
                }

                JsonUtil.sendSuccess(resp, Map.of(
                        "loanId", loanId,
                        "status", newStatus,
                        "message", "Loan facility status updated to " + newStatus
                ));
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (Exception e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}
