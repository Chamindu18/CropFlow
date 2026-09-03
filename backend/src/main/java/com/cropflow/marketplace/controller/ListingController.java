package com.cropflow.marketplace.controller;

import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.dto.ListingRequest;
import com.cropflow.marketplace.dto.ListingResponse;
import com.cropflow.marketplace.service.ListingService;
import com.cropflow.security.principal.CropFlowUserPrincipal;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping
        @PreAuthorize("hasRole('FARMER')")
        public ResponseEntity<ListingResponse> createListing(
                @Valid @RequestBody ListingRequest request,
                Authentication authentication
        ) {
        CropFlowUserPrincipal principal =
                (CropFlowUserPrincipal) authentication.getPrincipal();

        Listing listing = listingService.createListing(
                principal.getUserId(),
                request.title(),
                request.description()
        );

        ListingResponse response = new ListingResponse(
                listing.getId(),
                listing.getSeller().getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getStatus(),
                listing.getCreatedAt(),
                listing.getUpdatedAt()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
        }
}