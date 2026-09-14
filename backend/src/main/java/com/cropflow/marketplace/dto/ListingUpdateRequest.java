package com.cropflow.marketplace.dto;

import jakarta.validation.constraints.Size;

public record ListingUpdateRequest(

        @Size(min = 1, max = 150, message = "Title must be between 1 and 150 characters")
        String title,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description

) {
    public boolean hasTitle() {
        return title != null && !title.isBlank();
    }

    public boolean hasDescription() {
        return description != null;
    }
}