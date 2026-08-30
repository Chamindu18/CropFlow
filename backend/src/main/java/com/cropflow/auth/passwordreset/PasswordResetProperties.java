package com.cropflow.auth.passwordreset;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "cropflow.auth")
public record PasswordResetProperties(
        Duration passwordResetTokenTtl
) {
}