package com.primebank.servlet;

import com.primebank.dao.AccountDao;
import com.primebank.dao.TransactionDao;
import com.primebank.model.Account;
import com.primebank.model.Transaction;
import com.primebank.model.User;
import com.primebank.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;

/**
 * PrimeBank - Accounts Servlet
 * Endpoints: /api/accounts, /api/accounts/{id}/statement
 */
@WebServlet(urlPatterns = {"/api/accounts", "/api/accounts/*"})
public class AccountServlet extends HttpServlet {

    private final AccountDao accountDao = new AccountDao();
    private final TransactionDao transactionDao = new TransactionDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String path = req.getPathInfo();
            if (path == null || "/".equals(path) || path.isEmpty()) {
                // List accounts for current user
                Long userId = getTargetUserId(req);
                if (userId == null) {
                    JsonUtil.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "User session required or userId parameter.");
                    return;
                }
                List<Account> accounts = accountDao.findByUserId(userId);
                JsonUtil.sendSuccess(resp, accounts);
            } else if (path.endsWith("/statement")) {
                String[] parts = path.split("/");
                Long accountId = Long.parseLong(parts[1]);
                List<Transaction> transactions = transactionDao.findByAccountId(accountId);
                JsonUtil.sendSuccess(resp, transactions);
            } else {
                Long accountId = Long.parseLong(path.replace("/", ""));
                accountDao.findById(accountId).ifPresentOrElse(
                        acc -> {
                            try { JsonUtil.sendSuccess(resp, acc); } catch (Exception e) {}
                        },
                        () -> {
                            try { JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Account not found"); } catch (Exception e) {}
                        }
                );
            }
        } catch (Exception e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    private Long getTargetUserId(HttpServletRequest req) {
        String param = req.getParameter("userId");
        if (param != null && !param.isBlank()) {
            return Long.parseLong(param);
        }
        HttpSession session = req.getSession(false);
        if (session != null && session.getAttribute("currentUser") != null) {
            return ((User) session.getAttribute("currentUser")).getId();
        }
        return 2L; // Default fallback to Rajesh Kumar demo customer for testing
    }
}
