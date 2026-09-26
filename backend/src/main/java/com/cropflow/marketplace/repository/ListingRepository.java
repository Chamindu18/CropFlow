package com.cropflow.marketplace.repository;

import com.cropflow.marketplace.domain.Listing;
import com.cropflow.marketplace.domain.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ListingRepository
        extends JpaRepository<Listing, UUID> {

    Page<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status, Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.status = :status AND " +
           "(LOWER(l.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(l.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY l.createdAt DESC")
    Page<Listing> searchByStatusAndSearchTerm(
            @Param("status") ListingStatus status,
            @Param("search") String search,
            Pageable pageable);

    Page<Listing> findBySellerIdOrderByCreatedAtDesc(UUID sellerId, Pageable pageable);
}