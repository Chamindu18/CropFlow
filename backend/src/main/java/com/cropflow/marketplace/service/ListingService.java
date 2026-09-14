package com.cropflow.marketplace.service;

import com.cropflow.marketplace.domain.InvalidListingStateTransitionException;
import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.domain.ListingStatus;
import com.cropflow.marketplace.repository.ListingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Transactional
    public Listing activateListing(UUID listingId, UUID farmerId) {
        Listing listing = getOwnedListing(listingId, farmerId);
        listing.activate();
        return listingRepository.save(listing);
    }

    @Transactional
    public Listing cancelListing(UUID listingId, UUID farmerId) {
        Listing listing = getOwnedListing(listingId, farmerId);
        listing.cancel();
        return listingRepository.save(listing);
    }

    @Transactional
    public Listing markListingSold(UUID listingId, UUID farmerId) {
        Listing listing = getOwnedListing(listingId, farmerId);
        listing.markSold();
        return listingRepository.save(listing);
    }

    @Transactional
    public Listing updateListing(UUID listingId, UUID farmerId, String title, String description) {
        boolean titleProvided = title != null && !title.isBlank();
        boolean descriptionProvided = description != null && !description.isBlank();

        if (!titleProvided && !descriptionProvided) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one field (title or description) must be provided."
            );
        }
        Listing listing = getOwnedListing(listingId, farmerId);
        listing.updateDetails(titleProvided ? title : null, descriptionProvided ? description : null);
        return listingRepository.save(listing);
    }

    @Transactional
    public void deleteListing(UUID listingId, UUID farmerId) {
        Listing listing = getOwnedListing(listingId, farmerId);
        if (listing.getStatus() != ListingStatus.DRAFT) {
            throw new InvalidListingStateTransitionException(listing.getStatus(), ListingStatus.DRAFT);
        }
        listingRepository.delete(listing);
    }

    @Transactional(readOnly = true)
    public Page<Listing> browseActiveListings(Pageable pageable) {
        return listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Listing> searchActiveListings(String search, Pageable pageable) {
        String normalizedSearch = (search != null) ? search.trim() : "";
        if (normalizedSearch.isBlank()) {
            return browseActiveListings(pageable);
        }
        return listingRepository.searchByStatusAndSearchTerm(ListingStatus.ACTIVE, normalizedSearch, pageable);
    }
}