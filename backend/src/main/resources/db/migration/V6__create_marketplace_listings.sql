CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY,
    seller_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_marketplace_listings_seller
        FOREIGN KEY (seller_id)
        REFERENCES users (id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_marketplace_listings_status
        CHECK (
            status IN (
                'DRAFT',
                'ACTIVE',
                'SOLD',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_marketplace_listings_seller_id
    ON marketplace_listings (seller_id);

CREATE INDEX idx_marketplace_listings_status
    ON marketplace_listings (status);