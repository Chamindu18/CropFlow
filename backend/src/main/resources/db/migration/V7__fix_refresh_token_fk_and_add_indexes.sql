-- Fix refresh_tokens.replaced_by_token_id FK to ON DELETE SET NULL
-- Add performance indexes for current access patterns

ALTER TABLE refresh_tokens
    DROP CONSTRAINT fk_refresh_tokens_replaced_by,
    ADD CONSTRAINT fk_refresh_tokens_replaced_by
        FOREIGN KEY (replaced_by_token_id)
        REFERENCES refresh_tokens (id)
        ON DELETE SET NULL;

-- Composite index for refresh token cleanup by user + revocation status
CREATE INDEX idx_refresh_tokens_user_revoked
    ON refresh_tokens (user_id, revoked_at);

-- Composite index for marketplace listing feeds (status + creation time ordering)
CREATE INDEX idx_marketplace_listings_status_created
    ON marketplace_listings (status, created_at);