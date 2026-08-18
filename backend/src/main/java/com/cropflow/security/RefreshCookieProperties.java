package com.cropflow.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cropflow.security.refresh-cookie")
public record RefreshCookieProperties(
        boolean secure
) {
}