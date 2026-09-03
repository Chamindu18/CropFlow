package com.cropflow.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ListingRequest(

        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must not exceed 150 characters")
        String title,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description
) {
}