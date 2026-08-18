package com.cropflow.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record LoginResponse(
        String accessToken,
        String tokenType,
        Instant expiresAt,
        UUID userId,
        String email,
        String role
) {
}