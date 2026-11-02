package com.primebank.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * PrimeBank - Cryptographic Password Utilities
 * Provides secure hashing with SHA-256 and salt.
 */
public final class PasswordUtil {

    private PasswordUtil() {}

    /**
     * Generates a cryptographically random salt.
     */
    public static String generateSalt() {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    /**
     * Hashes a password string with a provided salt using SHA-256.
     * Returns format: <salt>$<hash>
     */
    public static String hashPassword(String password, String salt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt.getBytes(StandardCharsets.UTF_8));
            byte[] hashedPassword = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return salt + "$" + Base64.getEncoder().encodeToString(hashedPassword);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Hashes a raw password with a newly generated salt.
     */
    public static String hashPassword(String password) {
        String salt = generateSalt();
        return hashPassword(password, salt);
    }

    /**
     * Verifies whether a candidate raw password matches the stored salted hash.
     */
    public static boolean verifyPassword(String candidatePassword, String storedHash) {
        if (storedHash == null || candidatePassword == null) {
            return false;
        }
        String[] parts = storedHash.split("\\$");
        if (parts.length != 2) {
            // Legacy/fallback un-salted match check for baseline demo data
            return storedHash.equals(candidatePassword);
        }
        String salt = parts[0];
        String expected = hashPassword(candidatePassword, salt);
        return expected.equals(storedHash);
    }
}
