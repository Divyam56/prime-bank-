package com.primebank.servlet;

import com.primebank.config.DatabaseConfig;
import com.primebank.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.util.Map;

/**
 * PrimeBank - Health & Readiness Servlet
 * Validates connection pool and application status.
 */
@WebServlet("/api/health")
public class HealthServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try (Connection conn = DatabaseConfig.getConnection()) {
            boolean valid = conn.isValid(2);
            JsonUtil.sendSuccess(resp, Map.of(
                    "status", "UP",
                    "database", valid ? "CONNECTED" : "UNHEALTHY",
                    "system", "PrimeBank Online Banking Engine",
                    "version", "1.0.0"
            ));
        } catch (Exception e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Database unavailable: " + e.getMessage());
        }
    }
}
