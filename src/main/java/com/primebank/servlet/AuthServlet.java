package com.primebank.servlet;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.primebank.model.User;
import com.primebank.service.AuthService;
import com.primebank.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.Optional;

/**
 * PrimeBank - Authentication Servlet
 * Endpoints: /api/auth/login, /api/auth/register, /api/auth/me, /api/auth/logout
 */
@WebServlet(urlPatterns = {"/api/auth/*"})
public class AuthServlet extends HttpServlet {

    private final AuthService authService = new AuthService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if ("/me".equals(path)) {
            HttpSession session = req.getSession(false);
            if (session != null && session.getAttribute("currentUser") != null) {
                User user = (User) session.getAttribute("currentUser");
                // Clear password hash before returning
                user.setPasswordHash(null);
                JsonUtil.sendSuccess(resp, user);
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            }
        } else {
            JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if ("/login".equals(path)) {
            handleLogin(req, resp);
        } else if ("/register".equals(path)) {
            handleRegister(req, resp);
        } else if ("/logout".equals(path)) {
            handleLogout(req, resp);
        } else {
            JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        }
    }

    private void handleLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonObject body = parseBody(req);
            String email = body.has("email") ? body.get("email").getAsString() : "";
            String password = body.has("password") ? body.get("password").getAsString() : "";

            Optional<User> userOpt = authService.authenticate(email, password);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                HttpSession session = req.getSession(true);
                session.setAttribute("currentUser", user);
                user.setPasswordHash(null);
                JsonUtil.sendSuccess(resp, user);
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Invalid email or password.");
            }
        } catch (Exception e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        }
    }

    private void handleRegister(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonObject body = parseBody(req);
            String fullName = body.get("fullName").getAsString();
            String email = body.get("email").getAsString();
            String password = body.get("password").getAsString();
            String phone = body.get("phone").getAsString();

            User created = authService.register(fullName, email, password, phone);
            HttpSession session = req.getSession(true);
            session.setAttribute("currentUser", created);
            created.setPasswordHash(null);
            JsonUtil.sendSuccess(resp, created);
        } catch (Exception e) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        }
    }

    private void handleLogout(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        JsonUtil.sendSuccess(resp, "Logged out successfully");
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
