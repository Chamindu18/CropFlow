package com.cropflow.marketplace.service;

import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.repository.ListingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ListingService {

    private final ListingRepository listingRepository;

    public ListingService(
            ListingRepository listingRepository
    ) {
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public Listing getOwnedListing(
            UUID listingId,
            UUID authenticatedUserId
    ) {
        return listingRepository
                .findByIdAndSellerId(
                        listingId,
                        authenticatedUserId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Listing not found."
                        )
                );
    }
}