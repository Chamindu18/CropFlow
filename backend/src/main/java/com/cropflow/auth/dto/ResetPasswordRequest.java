package com.cropflow.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(

        @NotBlank(message = "Reset token is required")
        String token,

        @NotBlank(message = "New password is required")
        @Size(
                min = 12,
                max = 128,
                message = "Password must be between 12 and 128 characters"
        )
        String newPassword
) {
}