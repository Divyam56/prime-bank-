package com.primebank.service;

import com.primebank.dao.AccountDao;
import com.primebank.dao.UserDao;
import com.primebank.model.Account;
import com.primebank.model.User;
import com.primebank.util.PasswordUtil;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.Optional;
import java.util.Random;

/**
 * PrimeBank - Authentication & Identity Service
 * Handles user login verification, registration, and initial account provisioning.
 */
public class AuthService {

    private final UserDao userDao;
    private final AccountDao accountDao;

    public AuthService() {
        this.userDao = new UserDao();
        this.accountDao = new AccountDao();
    }

    public AuthService(UserDao userDao, AccountDao accountDao) {
        this.userDao = userDao;
        this.accountDao = accountDao;
    }

    public Optional<User> authenticate(String email, String rawPassword) throws SQLException {
        Optional<User> userOpt = userDao.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (PasswordUtil.verifyPassword(rawPassword, user.getPasswordHash())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }

    public User register(String fullName, String email, String rawPassword, String phone) throws SQLException {
        if (userDao.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("An account with email " + email + " already exists.");
        }

        String hashedPassword = PasswordUtil.hashPassword(rawPassword);
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPasswordHash(hashedPassword);
        user.setPhone(phone);
        user.setRole("CUSTOMER");
        user.setStatus("ACTIVE");

        User created = userDao.create(user);

        // Provision initial savings account with welcome deposit
        String generatedAccNumber = "PB" + (1000000000L + (long)(new Random().nextDouble() * 8999999999L));
        Account acc = new Account();
        acc.setUserId(created.getId());
        acc.setAccountNumber(generatedAccNumber);
        acc.setAccountType("SAVINGS");
        acc.setBalance(new BigDecimal("10000.00"));

        accountDao.create(acc);
        return created;
    }
}
