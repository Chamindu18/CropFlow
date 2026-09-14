package com.cropflow.marketplace.controller;

import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.domain.ListingStatus;
import com.cropflow.marketplace.dto.ListingRequest;
import com.cropflow.marketplace.dto.ListingResponse;
import com.cropflow.marketplace.dto.ListingUpdateRequest;
import com.cropflow.marketplace.service.ListingService;
import com.cropflow.security.principal.CropFlowUserPrincipal;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @PostMapping("/{listingId}/activate")
    @PreAuthorize("hasRole('FARMER')")
    public ListingResponse activateListing(
            @PathVariable UUID listingId,
            Authentication authentication
    ) {
        CropFlowUserPrincipal principal =
                (CropFlowUserPrincipal) authentication.getPrincipal();

        Listing listing = listingService.activateListing(
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

    @PostMapping("/{listingId}/cancel")
    @PreAuthorize("hasRole('FARMER')")
    public ListingResponse cancelListing(
            @PathVariable UUID listingId,
            Authentication authentication
    ) {
        CropFlowUserPrincipal principal =
                (CropFlowUserPrincipal) authentication.getPrincipal();

        Listing listing = listingService.cancelListing(
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

    @PostMapping("/{listingId}/mark-sold")
    @PreAuthorize("hasRole('FARMER')")
    public ListingResponse markListingSold(
            @PathVariable UUID listingId,
            Authentication authentication
    ) {
        CropFlowUserPrincipal principal =
                (CropFlowUserPrincipal) authentication.getPrincipal();

        Listing listing = listingService.markListingSold(
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

    @PatchMapping("/{listingId}")
    @PreAuthorize("hasRole('FARMER')")
    public ListingResponse updateListing(
            @PathVariable UUID listingId,
            @Valid @RequestBody ListingUpdateRequest request,
            Authentication authentication
    ) {
        CropFlowUserPrincipal principal =
                (CropFlowUserPrincipal) authentication.getPrincipal();

        Listing listing = listingService.updateListing(
                listingId,
                principal.getUserId(),
                request.title(),
                request.description()
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

    @DeleteMapping("/{listingId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Void> deleteListing(
            @PathVariable UUID listingId,
            Authentication authentication
    ) {
        CropFlowUserPrincipal principal =
                (CropFlowUserPrincipal) authentication.getPrincipal();

        listingService.deleteListing(listingId, principal.getUserId());

        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<ListingResponse>> browseListings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false) String sort
    ) {
        int maxSize = 50;

        if (page < 0) {
            return ResponseEntity.badRequest().build();
        }
        if (size <= 0 || size > maxSize) {
            return ResponseEntity.badRequest().build();
        }

        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.trim().isBlank()) {
            try {
                sortObj = Sort.by(Sort.Direction.DESC, sort);
            } catch (Exception ignored) {
            }
        }

        Pageable pageable = PageRequest.of(page, Math.min(size, maxSize), sortObj);

        Page<Listing> listingPage;
        if (search != null && !search.trim().isBlank()) {
            listingPage = listingService.searchActiveListings(search.trim(), pageable);
        } else {
            listingPage = listingService.browseActiveListings(pageable);
        }

        Page<ListingResponse> responsePage = listingPage.map(listing ->
                new ListingResponse(
                        listing.getId(),
                        listing.getSeller().getId(),
                        listing.getTitle(),
                        listing.getDescription(),
                        listing.getStatus(),
                        listing.getCreatedAt(),
                        listing.getUpdatedAt()
                )
        );

        return ResponseEntity.ok(responsePage);
    }
}