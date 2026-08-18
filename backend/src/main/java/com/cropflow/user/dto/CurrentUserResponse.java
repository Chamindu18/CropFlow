package com.cropflow.user.dto;

import com.cropflow.user.domain.UserRole;
import com.cropflow.user.domain.UserStatus;

import java.util.UUID;

public record CurrentUserResponse(
        UUID userId,
        String email,
        String firstName,
        String lastName,
        String phone,
        UserRole role,
        UserStatus status,
        boolean emailVerified
) {
}