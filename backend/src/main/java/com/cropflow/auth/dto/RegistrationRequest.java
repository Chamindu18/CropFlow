package com.cropflow.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 254, message = "Email must not exceed 254 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(
                min = 12,
                max = 128,
                message = "Password must be between 12 and 128 characters"
        )
        String password,

        @NotBlank(message = "First name is required")
        @Size(
                min = 2,
                max = 100,
                message = "First name must be between 2 and 100 characters"
        )
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(
                min = 2,
                max = 100,
                message = "Last name must be between 2 and 100 characters"
        )
        String lastName,

        @Size(max = 20, message = "Phone must not exceed 20 characters")
        String phone,

        @NotNull(message = "Role is required")
        RegistrationRole role
) {
}