package com.primebank.servlet;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.primebank.model.Loan;
import com.primebank.model.LoanBreakdown;
import com.primebank.model.Transaction;
import com.primebank.model.User;
import com.primebank.service.LoanService;
import com.primebank.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

/**
 * PrimeBank - Loan Operations Servlet
 * Endpoints:
 *   GET  /api/loans
 *   GET  /api/loans/breakdown?amount=...&termMonths=...
 *   POST /api/loans/apply
 *   POST /api/loans/repay
 */
@WebServlet(urlPatterns = {"/api/loans", "/api/loans/*"})
public class LoanServlet extends HttpServlet {

    private final LoanService loanService = new LoanService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String path = req.getPathInfo();
            if ("/breakdown".equals(path)) {
                BigDecimal amount = new BigDecimal(req.getParameter("amount"));
                int termMonths = Integer.parseInt(req.getParameter("termMonths"));
                LoanBreakdown breakdown = loanService.calculateLoanBreakdown(amount, termMonths);
                JsonUtil.sendSuccess(resp, breakdown);
            } else {
                Long userId = getTargetUserId(req);
                List<Loan> loans = loanService.getLoansForUser(userId);
                JsonUtil.sendSuccess(resp, loans);
            }
        } catch (Exception e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String path = req.getPathInfo();
            JsonObject body = parseBody(req);

            if ("/repay".equals(path)) {
                Long loanId = body.get("loanId").getAsLong();
                Long accountId = body.get("accountId").getAsLong();
                Transaction tx = loanService.repayLoan(loanId, accountId);
                JsonUtil.sendSuccess(resp, tx);
            } else if ("/apply".equals(path) || path == null || "/".equals(path)) {
                Long userId = body.has("userId") ? body.get("userId").getAsLong() : getTargetUserId(req);
                BigDecimal amount = new BigDecimal(body.get("amount").getAsString());
                int termMonths = body.get("termMonths").getAsInt();
                String purpose = body.get("purpose").getAsString();

                Loan loan = loanService.applyForLoan(userId, amount, termMonths, purpose);
                JsonUtil.sendSuccess(resp, loan);
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
            }
        } catch (IllegalArgumentException | IllegalStateException e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
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
        return 2L; // Rajesh Kumar fallback
    }

    private JsonObject parseBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return JsonParser.parseString(sb.toString()).getAsJsonObject();
    }
}
