package com.primebank.servlet;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.primebank.model.Transaction;
import com.primebank.service.BankingService;
import com.primebank.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;

/**
 * PrimeBank - Fund Transfer Servlet
 * Endpoint: POST /api/transfer
 */
@WebServlet(urlPatterns = {"/api/transfer"})
public class TransferServlet extends HttpServlet {

    private final BankingService bankingService = new BankingService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = req.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            JsonObject body = JsonParser.parseString(sb.toString()).getAsJsonObject();

            Long fromAccountId = body.get("fromAccountId").getAsLong();
            String toAccountNumber = body.get("toAccountNumber").getAsString().trim();
            BigDecimal amount = new BigDecimal(body.get("amount").getAsString());
            String description = body.has("description") ? body.get("description").getAsString() : "Funds Transfer";

            Transaction tx = bankingService.transferFunds(fromAccountId, toAccountNumber, amount, description);
            JsonUtil.sendSuccess(resp, tx);
        } catch (IllegalArgumentException | IllegalStateException e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Transfer failed: " + e.getMessage());
        }
    }
}
