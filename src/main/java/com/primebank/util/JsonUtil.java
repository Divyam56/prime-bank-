package com.primebank.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/**
 * PrimeBank - JSON Serialization & HTTP Response Utility
 * Centralizes JSON serialization, deserialization, and HTTP error rendering.
 */
public final class JsonUtil {

    private static final Gson GSON = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd HH:mm:ss")
            .serializeNulls()
            .create();

    private JsonUtil() {}

    public static Gson getGson() {
        return GSON;
    }

    public static String toJson(Object obj) {
        return GSON.toJson(obj);
    }

    public static <T> T fromJson(String json, Class<T> classOfT) {
        return GSON.fromJson(json, classOfT);
    }

    /**
     * Sends a successful JSON response with HTTP 200.
     */
    public static void sendSuccess(HttpServletResponse response, Object data) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_OK);
        try (PrintWriter writer = response.getWriter()) {
            writer.write(GSON.toJson(Map.of(
                    "success", true,
                    "data", data
            )));
        }
    }

    /**
     * Sends an error JSON response with custom HTTP status code and error message.
     */
    public static void sendError(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(statusCode);
        try (PrintWriter writer = response.getWriter()) {
            writer.write(GSON.toJson(Map.of(
                    "success", false,
                    "error", message
            )));
        }
    }
}
