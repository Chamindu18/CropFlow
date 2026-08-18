package com.cropflow.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.Optional;

public final class RefreshTokenCookie {

    public static final String NAME = "cropflow_refresh";

    private RefreshTokenCookie() {
    }

    public static void add(
            HttpServletResponse response,
            String token,
            int maxAge
    ) {
        Cookie cookie = new Cookie(NAME, token);

        cookie.setHttpOnly(true);
        cookie.setSecure(false); // true in production
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(maxAge);

        response.addCookie(cookie);
    }

    public static Optional<String> extract(
            HttpServletRequest request
    ) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    public static void clear(
            HttpServletResponse response
    ) {
        Cookie cookie = new Cookie(NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
    }
}