package com.primebank.app;

import com.primebank.config.DatabaseConfig;
import com.primebank.servlet.*;
import org.apache.catalina.Context;
import org.apache.catalina.LifecycleException;
import org.apache.catalina.startup.Tomcat;

import java.io.File;

/**
 * PrimeBank - Application Entry Point
 * Bootstraps Embedded Apache Tomcat 10.1 (Jakarta Servlet 6.0), mounts API servlets,
 * and initializes the database pool.
 */
public class Application {

    public static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) throws LifecycleException {
        int port = DEFAULT_PORT;
        String portEnv = System.getenv("PORT");
        if (portEnv != null && !portEnv.isBlank()) {
            try {
                port = Integer.parseInt(portEnv);
            } catch (NumberFormatException ignored) {}
        }

        printBanner(port);

        // Warm up and verify database connection pool
        DatabaseConfig.getDataSource();

        Tomcat tomcat = new Tomcat();
        tomcat.setPort(port);
        tomcat.getConnector(); // triggers connector creation

        // Setup base directory and empty doc base
        String baseDir = new File(System.getProperty("java.io.tmpdir"), "tomcat." + port).getAbsolutePath();
        tomcat.setBaseDir(baseDir);

        Context ctx = tomcat.addContext("", new File(".").getAbsolutePath());

        // Register Servlets
        registerServlet(tomcat, ctx, "HealthServlet", new HealthServlet(), "/api/health");
        registerServlet(tomcat, ctx, "AuthServlet", new AuthServlet(), "/api/auth/*");
        registerServlet(tomcat, ctx, "AccountServlet", new AccountServlet(), "/api/accounts", "/api/accounts/*");
        registerServlet(tomcat, ctx, "TransferServlet", new TransferServlet(), "/api/transfer");
        registerServlet(tomcat, ctx, "LoanServlet", new LoanServlet(), "/api/loans", "/api/loans/*");
        registerServlet(tomcat, ctx, "AdminServlet", new AdminServlet(), "/api/admin/*");

        // Graceful shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("[PrimeBank] Gracefully stopping Tomcat server and closing pools...");
            try {
                tomcat.stop();
                tomcat.destroy();
            } catch (Exception ignored) {}
            DatabaseConfig.shutdown();
        }));

        tomcat.start();
        System.out.println("[PrimeBank] Server is actively accepting connections on port " + port);
        tomcat.getServer().await();
    }

    private static void registerServlet(Tomcat tomcat, Context ctx, String name, jakarta.servlet.Servlet servlet, String... urlPatterns) {
        Tomcat.addServlet(ctx, name, servlet);
        for (String pattern : urlPatterns) {
            ctx.addServletMappingDecoded(pattern, name);
        }
    }

    private static void printBanner(int port) {
        System.out.println("==================================================================");
        System.out.println("  ____       _                 ____              _     ");
        System.out.println(" |  _ \\ _ __(_)_ __ ___   ___ | __ )  __ _ _ __ | | __ ");
        System.out.println(" | |_) | '__| | '_ ` _ \\ / _ \\|  _ \\ / _` | '_ \\| |/ / ");
        System.out.println(" |  __/| |  | | | | | | |  __/| |_) | (_| | | | |   <  ");
        System.out.println(" |_|   |_|  |_|_| |_| |_|\\___||____/ \\__,_|_| |_|_|\\_\\ ");
        System.out.println("   Online Banking System - Java 21 & Jakarta Servlets     ");
        System.out.println("==================================================================");
        System.out.println(" [!] Embedded Tomcat HTTP Server Initializing on Port: " + port);
        System.out.println(" [!] Endpoints: /api/health, /api/auth, /api/accounts, /api/loans, /api/transfer");
        System.out.println("==================================================================");
    }
}
