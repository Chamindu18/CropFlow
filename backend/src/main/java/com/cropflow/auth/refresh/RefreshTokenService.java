package com.cropflow.auth.refresh;

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

    private final SecureRandom secureRandom = new SecureRandom();
    private final RefreshTokenRepository repository;
    private final com.cropflow.security.jwt.JwtProperties jwtProperties;

    public RefreshTokenService(
            RefreshTokenRepository repository,
            com.cropflow.security.jwt.JwtProperties jwtProperties
    ) {
        this.repository = repository;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public String create(User user) {
        String rawToken = generateToken();

        RefreshToken entity = new RefreshToken(
                user,
                hash(rawToken),
                Instant.now().plus(jwtProperties.refreshTokenTtl())
        );

        repository.save(entity);

        return rawToken;
    }

    @Transactional
    public RotationResult rotate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new RefreshTokenException(
                    "INVALID_REFRESH_TOKEN",
                    "Refresh token is invalid."
            );
        }

        RefreshToken current = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(() ->
                        new RefreshTokenException(
                                "INVALID_REFRESH_TOKEN",
                                "Refresh token is invalid."
                        )
                );

        if (current.isRevoked()) {
            throw new RefreshTokenException(
                    "REFRESH_TOKEN_REVOKED",
                    "Refresh token is no longer valid."
            );
        }

        if (current.isExpired()) {
            throw new RefreshTokenException(
                    "REFRESH_TOKEN_EXPIRED",
                    "Refresh token has expired."
            );
        }

        RefreshToken replacement = new RefreshToken(
                current.getUser(),
                hash(generateToken()),
                Instant.now().plus(jwtProperties.refreshTokenTtl())
        );

        // Generate the raw replacement separately so it can be returned.
        String replacementRawToken = generateToken();

        replacement = new RefreshToken(
                current.getUser(),
                hash(replacementRawToken),
                Instant.now().plus(jwtProperties.refreshTokenTtl())
        );

        RefreshToken savedReplacement = repository.save(replacement);

        current.replaceWith(savedReplacement);
        repository.save(current);

        return new RotationResult(
                current.getUser(),
                replacementRawToken
        );
    }

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

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest
                    .getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));

            StringBuilder builder = new StringBuilder(64);

            for (byte value : digest) {
                builder.append(String.format("%02x", value));
            }

            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable.",
                    exception
            );
        }
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