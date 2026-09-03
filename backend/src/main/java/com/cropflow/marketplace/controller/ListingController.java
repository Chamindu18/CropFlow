package com.cropflow.marketplace.controller;

import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.dto.ListingResponse;
import com.cropflow.marketplace.service.ListingService;
import com.cropflow.security.principal.CropFlowUserPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(
            ListingService listingService
    ) {
        this.listingService = listingService;
    }

    @PreAuthorize("hasRole('FARMER')")
    @GetMapping("/{listingId}")
    public ListingResponse getListing(
            @PathVariable UUID listingId,
            Authentication authentication
    ) {
        CropFlowUserPrincipal principal =
                (CropFlowUserPrincipal) authentication.getPrincipal();

        Listing listing = listingService.getOwnedListing(
                listingId,
                principal.getUserId()
        );

        return new ListingResponse(
                listing.getId(),
                listing.getSeller().getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getStatus(),
                listing.getCreatedAt(),
                listing.getUpdatedAt()
        );
    }
}