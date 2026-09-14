package com.cropflow.marketplace.domain;

import com.cropflow.user.domain.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "marketplace_listings")
public class Listing {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "seller_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_marketplace_listings_seller"
            )
    )
    private User seller;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ListingStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Listing() {
        // Required by JPA.
    }

    public Listing(
            User seller,
            String title,
            String description
    ) {
        this.seller = seller;
        this.title = title;
        this.description = description;
        this.status = ListingStatus.DRAFT;
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public User getSeller() {
        return seller;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public ListingStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public boolean isOwnedBy(UUID userId) {
        return seller.getId().equals(userId);
    }

    public void activate() {
        if (status != ListingStatus.DRAFT) {
            throw new InvalidListingStateTransitionException(status, ListingStatus.ACTIVE);
        }
        this.status = ListingStatus.ACTIVE;
    }

    public void cancel() {
        if (status != ListingStatus.DRAFT && status != ListingStatus.ACTIVE) {
            throw new InvalidListingStateTransitionException(status, ListingStatus.CANCELLED);
        }
        this.status = ListingStatus.CANCELLED;
    }

    public void markSold() {
        if (status != ListingStatus.ACTIVE) {
            throw new InvalidListingStateTransitionException(status, ListingStatus.SOLD);
        }
        this.status = ListingStatus.SOLD;
    }

    public void updateDetails(String title, String description) {
        if (status != ListingStatus.DRAFT) {
            throw new InvalidListingStateTransitionException(status, ListingStatus.DRAFT);
        }
        if (title != null) {
            this.title = title;
        }
        if (description != null) {
            this.description = description;
        }
    }
}