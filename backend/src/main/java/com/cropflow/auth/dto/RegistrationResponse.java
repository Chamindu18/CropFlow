package com.cropflow.auth.dto;

import com.cropflow.user.domain.UserStatus;

import java.util.UUID;

public record RegistrationResponse(
        String message,
        UUID userId,
        String email,
        UserStatus status
) {
}