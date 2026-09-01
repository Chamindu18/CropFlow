package com.cropflow.marketplace.dto;

import com.cropflow.marketplace.domain.ListingStatus;

import java.time.Instant;
import java.util.UUID;

public record ListingResponse(
        UUID id,
        UUID sellerId,
        String title,
        String description,
        ListingStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}