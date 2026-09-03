package com.cropflow.marketplace.repository;

import com.cropflow.marketplace.domain.Listing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ListingRepository
        extends JpaRepository<Listing, UUID> {

}