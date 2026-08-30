package com.cropflow.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
public class CsrfConfig {

    /**
     * Stores the CSRF token in a browser-readable cookie so the React
     * and Angular clients can read it and send it back in the request
     * header.
     *
     * This cookie is intentionally NOT HttpOnly.
     *
     * The refresh-token cookie remains HttpOnly and is completely
     * separate from this CSRF cookie.
     */
    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository() {
        return CookieCsrfTokenRepository.withHttpOnlyFalse();
    }
}