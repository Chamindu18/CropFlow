package com.cropflow.auth.refresh;

import com.cropflow.security.jwt.JwtProperties;
import com.cropflow.user.domain.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class RefreshTokenService {

    private static final int TOKEN_BYTES = 32;

    private final SecureRandom secureRandom = new SecureRandom();
    private final RefreshTokenRepository repository;
    private final JwtProperties jwtProperties;

    public RefreshTokenService(
            RefreshTokenRepository repository,
            JwtProperties jwtProperties
    ) {
        this.repository = repository;
        this.jwtProperties = jwtProperties;
    }

    /**
     * Creates and persists a new refresh token.
     *
     * The raw token is returned only to the application layer so it can
     * be delivered to the browser as an HttpOnly cookie. Only its SHA-256
     * hash is persisted in PostgreSQL.
     */
    @Transactional
    public IssuedRefreshToken create(User user) {
        String rawToken = generateToken();

        RefreshToken entity = new RefreshToken(
                user,
                hash(rawToken),
                Instant.now().plus(
                        jwtProperties.refreshTokenTtl()
                )
        );

        RefreshToken savedToken = repository.save(entity);

        return new IssuedRefreshToken(
                savedToken,
                rawToken
        );
    }

    /**
     * Atomically validates and rotates a refresh token.
     *
     * The repository lookup uses PESSIMISTIC_WRITE, preventing two
     * concurrent requests from successfully rotating the same token.
     */
    @Transactional
    public RotationResult rotate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw invalidToken();
        }

        RefreshToken currentToken = repository
                .findByTokenHash(hash(rawToken))
                .orElseThrow(this::invalidToken);

        if (currentToken.isRevoked()) {
            throw new RefreshTokenException(
                    "REFRESH_TOKEN_REVOKED",
                    "Refresh token is no longer valid."
            );
        }

        if (currentToken.isExpired()) {
            throw new RefreshTokenException(
                    "REFRESH_TOKEN_EXPIRED",
                    "Refresh token has expired."
            );
        }

        String replacementRawToken = generateToken();

        RefreshToken replacementToken = new RefreshToken(
                currentToken.getUser(),
                hash(replacementRawToken),
                Instant.now().plus(
                        jwtProperties.refreshTokenTtl()
                )
        );

        RefreshToken savedReplacement =
                repository.save(replacementToken);

        currentToken.replaceWith(savedReplacement);

        /*
         * Because the current token row is locked by the repository
         * query, another concurrent rotation cannot pass the revoked
         * check before this transaction commits.
         */
        repository.save(currentToken);

        return new RotationResult(
                currentToken.getUser(),
                replacementRawToken
        );
    }

    /**
     * Revokes a refresh token if it exists.
     *
     * This operation is intentionally idempotent.
     */
    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        repository.findByTokenHash(hash(rawToken))
                .ifPresent(token -> {
                    if (!token.isRevoked()) {
                        token.revoke();
                        repository.save(token);
                    }
                });
    }

    private RefreshTokenException invalidToken() {
        return new RefreshTokenException(
                "INVALID_REFRESH_TOKEN",
                "Refresh token is invalid."
        );
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];

        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    /**
     * Hashes the opaque refresh token before persistence/lookup.
     */
    private String hash(String token) {
        try {
            byte[] digest = MessageDigest
                    .getInstance("SHA-256")
                    .digest(
                            token.getBytes(StandardCharsets.UTF_8)
                    );

            StringBuilder builder = new StringBuilder(64);

            for (byte value : digest) {
                builder.append(
                        String.format("%02x", value)
                );
            }

            return builder.toString();

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable.",
                    exception
            );
        }
    }

    public record IssuedRefreshToken(
            RefreshToken entity,
            String rawToken
    ) {
    }

    public record RotationResult(
            User user,
            String refreshToken
    ) {
    }

    public static class RefreshTokenException
            extends RuntimeException {

        private final String code;

        public RefreshTokenException(
                String code,
                String message
        ) {
            super(message);
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }
}