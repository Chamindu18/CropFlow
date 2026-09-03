package com.cropflow.marketplace.service;

import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.repository.ListingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.cropflow.user.domain.User;
import com.cropflow.user.repository.UserRepository;

import java.util.UUID;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public ListingService(
            ListingRepository listingRepository,
            UserRepository userRepository
    ) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Listing getOwnedListing(
            UUID listingId,
            UUID authenticatedUserId
    ) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Listing not found."
                        )
                );

        if (!listing.isOwnedBy(authenticatedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Listing not found."
            );
        }

        return listing;
    }

    @Transactional
        public Listing createListing(UUID sellerId, String title, String description) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Seller not found."
                ));

        Listing listing = new Listing(seller, title, description);
        return listingRepository.save(listing);
        }
}